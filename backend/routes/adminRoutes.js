const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');
const Story = require('../models/Story');
const Report = require('../models/Report');
const ActivityLog = require('../models/ActivityLog');
const { protect } = require('../middleware/authMiddleware');
const { logActivity } = require('../utils/activityLogger');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized as admin' });
    }
    req.adminUser = user;
    next();
};

// @desc    Admin Login (Username only for dev/demo)
// @route   POST /api/admin/login
router.post('/login', async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Not an admin.' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Log admin login
        await logActivity({
            userId: user._id,
            action: 'ADMIN_LOGIN',
            details: { username },
            req,
        });

        res.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
router.get('/stats', protect, isAdmin, async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const postCount = await Post.countDocuments();
        const reportCount = await Report.countDocuments({ status: 'Pending' });

        // Calculate total revenue
        const Transaction = require('../models/Transaction');
        const transactions = await Transaction.find({ status: 'completed' });
        const totalRevenue = transactions.reduce((acc, curr) => acc + (curr.price || 0), 0);

        res.json({ userCount, postCount, reportCount, totalRevenue });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get User Growth Stats for Graph
// @route   GET /api/admin/stats/user-growth
router.get('/stats/user-growth', protect, isAdmin, async (req, res) => {
    try {
        // Get registrations from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const stats = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json(stats);
    } catch (error) {
        console.error('User growth stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get Revenue Stats for Graph
// @route   GET /api/admin/stats/revenue
router.get('/stats/revenue', protect, isAdmin, async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');

        // Get transactions from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const stats = await Transaction.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$price" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json(stats);
    } catch (error) {
        console.error('Revenue stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get All Transactions
// @route   GET /api/admin/transactions
router.get('/transactions', protect, isAdmin, async (req, res) => {
    try {
        const Transaction = require('../models/Transaction');
        const transactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('user', 'username fullName email');

        res.json(transactions);
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get User Activity Logs
// @route   GET /api/admin/users/:id/logs
router.get('/users/:id/logs', protect, isAdmin, async (req, res) => {
    try {
        const logs = await ActivityLog.find({ user: req.params.id })
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('performedBy', 'username fullName');

        res.json(logs);
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get Single User Details (Admin)
// @route   GET /api/admin/users/:id
router.get('/users/:id', protect, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update User (Admin) - Modify coins, ban, etc.
// @route   PATCH /api/admin/users/:id
router.patch('/users/:id', protect, isAdmin, async (req, res) => {
    try {
        const { coins, isAdmin: makeAdmin, isBanned, isVerified, note } = req.body;
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const changes = {};
        const previousValues = {};

        // Handle coin modifications
        if (coins !== undefined) {
            previousValues.coins = targetUser.coins;
            targetUser.coins = coins;
            changes.coins = coins;
        }

        // Handle admin status
        if (makeAdmin !== undefined) {
            previousValues.isAdmin = targetUser.isAdmin;
            targetUser.isAdmin = makeAdmin;
            changes.isAdmin = makeAdmin;
        }

        // Handle ban status
        if (isBanned !== undefined) {
            previousValues.isBanned = targetUser.isBanned;
            targetUser.isBanned = isBanned;
            changes.isBanned = isBanned;
        }

        // Handle verification status
        if (isVerified !== undefined) {
            previousValues.isVerified = targetUser.isVerified;
            targetUser.isVerified = isVerified;
            changes.isVerified = isVerified;
        }

        await targetUser.save();

        // Log the admin action
        await logActivity({
            userId: targetUser._id,
            action: 'ADMIN_MODIFIED_USER',
            details: {
                changes,
                previousValues,
                note: note || 'No note provided',
            },
            req,
            performedBy: req.user.id,
        });

        res.json({ message: 'User updated successfully', user: targetUser });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Reset User Dating Profile (Admin)
// @route   POST /api/admin/users/:id/reset-dating
router.post('/users/:id/reset-dating', protect, isAdmin, require('../controllers/userController').adminResetDatingProfile);

// @desc    Add Coins to User
// @route   POST /api/admin/users/:id/add-coins
router.post('/users/:id/add-coins', protect, isAdmin, async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const previousCoins = targetUser.coins;
        targetUser.coins += parseInt(amount) || 0;
        await targetUser.save();

        await logActivity({
            userId: targetUser._id,
            action: 'COINS_ADDED',
            details: {
                previousCoins,
                newCoins: targetUser.coins,
                amount,
                reason: reason || 'Admin added coins',
            },
            req,
            performedBy: req.user.id,
        });

        res.json({ message: `Added ${amount} coins`, user: targetUser });
    } catch (error) {
        console.error('Add coins error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Deduct Coins from User
// @route   POST /api/admin/users/:id/deduct-coins
router.post('/users/:id/deduct-coins', protect, isAdmin, async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const previousCoins = targetUser.coins;
        targetUser.coins = Math.max(0, targetUser.coins - (parseInt(amount) || 0));
        await targetUser.save();

        await logActivity({
            userId: targetUser._id,
            action: 'COINS_DEDUCTED',
            details: {
                previousCoins,
                newCoins: targetUser.coins,
                amount,
                reason: reason || 'Admin deducted coins',
            },
            req,
            performedBy: req.user.id,
        });

        res.json({ message: `Deducted ${amount} coins`, user: targetUser });
    } catch (error) {
        console.error('Deduct coins error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get All Posts (Admin)
// @route   GET /api/admin/posts
router.get('/posts', protect, isAdmin, async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('user', 'username fullName profileImage');
        res.json(posts);
    } catch (error) {
        console.error('Get all posts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Delete Post (Admin)
// @route   DELETE /api/admin/posts/:id
router.delete('/posts/:id', protect, isAdmin, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        await Post.findByIdAndDelete(req.params.id);

        await logActivity({
            userId: req.user.id,
            action: 'ADMIN_DELETED_POST',
            details: {
                postId: post._id,
                postCaption: post.caption,
                postOwner: post.user
            },
            req,
            performedBy: req.user.id,
        });

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get All Stories (Admin)
// @route   GET /api/admin/stories
router.get('/stories', protect, isAdmin, async (req, res) => {
    try {
        const stories = await Story.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('user', 'username fullName profileImage');
        res.json(stories);
    } catch (error) {
        console.error('Get all stories error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Delete Story (Admin)
// @route   DELETE /api/admin/stories/:id
router.delete('/stories/:id', protect, isAdmin, async (req, res) => {
    try {
        await Story.findByIdAndDelete(req.params.id);
        res.json({ message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Delete story error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get All Reports (Admin)
// @route   GET /api/admin/reports
router.get('/reports', protect, isAdmin, async (req, res) => {
    try {
        const reports = await Report.find()
            .sort({ createdAt: -1 })
            .populate('reporter', 'username profileImage')
            .populate('comments.admin', 'username')
            .limit(100);
        res.json(reports);
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Handle Report (Admin)
// @route   PATCH /api/admin/reports/:id
router.patch('/reports/:id', protect, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.json(report);
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Add Comment to Report (Admin)
// @route   POST /api/admin/reports/:id/comments
router.post('/reports/:id/comments', protect, isAdmin, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: 'Comment text is required' });

        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        report.comments.push({
            admin: req.user.id,
            text,
            createdAt: new Date()
        });

        await report.save();
        const populatedReport = await report.populate('comments.admin', 'username');

        res.json(populatedReport.comments[populatedReport.comments.length - 1]);
    } catch (error) {
        console.error('Add report comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Sync AI Classification (Admin Mock)
// @route   POST /api/admin/reports/:id/classify
router.post('/reports/:id/classify', protect, isAdmin, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        // MOCK AI CLASSIFICATION LOGIC
        // In a real app, this would call a Vision API or NLP service
        const labels = ['Safe', 'Spam', 'Harassment', 'Nudity', 'Violence'];
        const randomLabel = labels[Math.floor(Math.random() * labels.length)];
        const confidence = 0.7 + Math.random() * 0.25;

        report.aiClassification = {
            label: randomLabel,
            confidence: parseFloat(confidence.toFixed(2)),
            details: `AI suggests this content might be ${randomLabel.toLowerCase()}.`
        };

        if (confidence > 0.9 && randomLabel !== 'Safe') {
            report.status = 'Pending'; // Flag for priority
        }

        await report.save();
        res.json(report.aiClassification);
    } catch (error) {
        console.error('Classify report error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', protect, isAdmin, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent self-deletion
        if (targetUser._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        await User.findByIdAndDelete(req.params.id);

        // Delete associated posts
        await Post.deleteMany({ user: req.params.id });

        await logActivity({
            userId: req.user.id,
            action: 'ADMIN_DELETED_USER',
            details: {
                deletedUserId: targetUser._id,
                username: targetUser.username,
                email: targetUser.email
            },
            req,
            performedBy: req.user.id,
        });

        res.json({ message: 'User and associated content deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Send broadcast notification
// @route   POST /api/admin/notifications/broadcast
const { sendBroadcast } = require('../controllers/notificationController');
router.post('/notifications/broadcast', protect, isAdmin, sendBroadcast);

// ============ SETTINGS MANAGEMENT ============

const Settings = require('../models/Settings');

// @desc    Get All Settings
// @route   GET /api/admin/settings
router.get('/settings', protect, isAdmin, async (req, res) => {
    try {
        const settings = await Settings.find();
        // Convert to key-value object for easier frontend use
        const settingsObj = {};
        settings.forEach(s => { settingsObj[s.key] = s.value; });
        res.json(settingsObj);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update Settings
// @route   PATCH /api/admin/settings
router.patch('/settings', protect, isAdmin, async (req, res) => {
    try {
        const updates = req.body; // { key: value, key2: value2, ... }
        const results = [];

        for (const [key, value] of Object.entries(updates)) {
            const updated = await Settings.set(key, value);
            results.push(updated);
        }

        await logActivity({
            action: 'ADMIN_UPDATED_SETTINGS',
            details: updates,
            req,
            performedBy: req.user.id,
        });

        res.json({ message: 'Settings updated', settings: results });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ ACTIVE CHATS MONITORING ============

const Message = require('../models/Message');

// @desc    Get All Active Chats (for monitoring)
// @route   GET /api/admin/chats
router.get('/chats', protect, isAdmin, async (req, res) => {
    try {
        // Aggregate to get unique chat pairs with last message
        const chats = await Message.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $lt: ['$sender', '$receiver'] },
                            then: { user1: '$sender', user2: '$receiver' },
                            else: { user1: '$receiver', user2: '$sender' }
                        }
                    },
                    lastMessage: { $first: '$text' },
                    lastMessageAt: { $first: '$createdAt' },
                    messageCount: { $sum: 1 }
                }
            },
            { $sort: { lastMessageAt: -1 } },
            { $limit: 100 }
        ]);

        // Populate user info
        const populatedChats = await Promise.all(chats.map(async (chat) => {
            const user1 = await User.findById(chat._id.user1).select('username fullName profileImage');
            const user2 = await User.findById(chat._id.user2).select('username fullName profileImage');
            return {
                user1,
                user2,
                lastMessage: chat.lastMessage?.substring(0, 50) + (chat.lastMessage?.length > 50 ? '...' : ''),
                lastMessageAt: chat.lastMessageAt,
                messageCount: chat.messageCount
            };
        }));

        res.json(populatedChats);
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ ADVANCED ANALYTICS & POWER CONTROLS ============

// @desc    Get Extended Dashboard Stats
// @route   GET /api/admin/stats/extended
router.get('/stats/extended', protect, isAdmin, async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [newUsersToday, activeUsers24h, trendingPosts, revenueBySource] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: startOfDay } }),
            ActivityLog.distinct('user', { createdAt: { $gte: past24h } }).then(users => users.length),
            Post.find({ isDeleted: false, status: 'ready' })
                .sort({ engagementScore: -1, createdAt: -1 })
                .limit(5)
                .populate('user', 'username fullName profileImage'),
            require('../models/Transaction').aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: "$type", total: { $sum: "$price" }, count: { $sum: 1 } } }
            ])
        ]);

        // Get Gender Distribution
        const genderStats = await User.aggregate([
            { $group: { _id: "$gender", count: { $sum: 1 } } }
        ]);

        res.json({
            newUsersToday,
            activeUsers24h,
            trendingPosts,
            revenueBySource,
            genderStats
        });
    } catch (error) {
        console.error('Extended stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get Activity Feed (Global)
// @route   GET /api/admin/activity-feed
router.get('/activity-feed', protect, isAdmin, async (req, res) => {
    try {
        const activities = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('user', 'username profileImage')
            .populate('performedBy', 'username');
        res.json(activities);
    } catch (error) {
        console.error('Activity feed error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get System Health
// @route   GET /api/admin/system/health
router.get('/system/health', protect, isAdmin, async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'Healthy' : 'Disconnected';
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();

        res.json({
            status: 'Online',
            database: dbStatus,
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
            memory: {
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Health check failed' });
    }
});

// @desc    Toggle Maintenance Mode
// @route   POST /api/admin/power/maintenance
router.post('/power/maintenance', protect, isAdmin, async (req, res) => {
    try {
        const { enabled } = req.body;
        const Settings = require('../models/Settings');
        await Settings.set('maintenance_mode', enabled, 'Global maintenance mode toggle');

        await logActivity({
            action: 'ADMIN_TOGGLE_MAINTENANCE',
            details: { enabled },
            req,
            performedBy: req.user.id,
        });

        res.json({ message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`, enabled });
    } catch (error) {
        console.error('Maintenance toggle error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Perform Bulk Action
// @route   POST /api/admin/power/bulk-action
router.post('/power/bulk-action', protect, isAdmin, async (req, res) => {
    try {
        const { action, ids, note } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        let result;
        let auditAction;
        switch (action) {
            case 'ban_users':
                result = await User.updateMany({ _id: { $in: ids } }, { $set: { isBanned: true } });
                auditAction = 'ADMIN_BULK_BAN_USERS';
                break;
            case 'unban_users':
                result = await User.updateMany({ _id: { $in: ids } }, { $set: { isBanned: false } });
                auditAction = 'ADMIN_BULK_UNBAN_USERS';
                break;
            case 'verify_users':
                result = await User.updateMany({ _id: { $in: ids } }, { $set: { isVerified: true } });
                auditAction = 'ADMIN_BULK_VERIFY_USERS';
                break;
            case 'unverify_users':
                result = await User.updateMany({ _id: { $in: ids } }, { $set: { isVerified: false } });
                auditAction = 'ADMIN_BULK_UNVERIFY_USERS';
                break;
            case 'reset_dating_profiles':
                const userController = require('../controllers/userController');
                // We have to loop or use a custom method since resetDating is complex
                const usersToReset = await User.find({ _id: { $in: ids } });
                for (const user of usersToReset) {
                    await userController.adminResetDatingProfile({ params: { id: user._id } }, { status: () => ({ json: () => { } }) });
                }
                result = { modifiedCount: ids.length };
                auditAction = 'ADMIN_BULK_RESET_DATING';
                break;
            case 'delete_posts':
                result = await Post.deleteMany({ _id: { $in: ids } });
                auditAction = 'ADMIN_BULK_DELETE_POSTS';
                break;
            case 'dismiss_reports':
                result = await Report.updateMany({ _id: { $in: ids } }, { $set: { status: 'Dismissed' } });
                auditAction = 'ADMIN_BULK_DISMISS_REPORTS';
                break;
            default:
                return res.status(400).json({ message: 'Invalid bulk action' });
        }

        await logActivity({
            action: auditAction,
            details: { count: ids.length, ids, note: note || 'Bulk action performed' },
            req,
            performedBy: req.user.id,
        });

        res.json({ message: 'Bulk action completed successfully', result });
    } catch (error) {
        console.error('Bulk action error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

const mongoose = require('mongoose');
module.exports = router;
