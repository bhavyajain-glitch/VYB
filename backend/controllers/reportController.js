const ReportPost = require('../models/ReportPost');
const Post = require('../models/Post');

// @desc    Report a post
// @route   POST /api/posts/:id/report
exports.reportPost = async (req, res) => {
    try {
        const { reason, description } = req.body;
        const postId = req.params.id;
        const userId = req.user.id;

        // Validate reason
        const validReasons = ['spam', 'nudity', 'violence', 'harassment', 'hate_speech', 'misinformation', 'other'];
        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).json({ message: 'Invalid report reason' });
        }

        // Check post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Can't report own post
        if (post.user.toString() === userId) {
            return res.status(400).json({ message: 'Cannot report your own post' });
        }

        // Check for existing report
        const existingReport = await ReportPost.findOne({ postId, reportedBy: userId });
        if (existingReport) {
            return res.status(400).json({ message: 'You have already reported this post' });
        }

        // Create report
        const report = await ReportPost.create({
            postId,
            reportedBy: userId,
            reason,
            description: description?.substring(0, 500)
        });

        // Check auto-flag threshold
        const wasAutoFlagged = await ReportPost.checkAutoFlag(postId);

        res.json({
            message: 'Report submitted',
            reportId: report._id,
            autoFlagged: wasAutoFlagged
        });
    } catch (error) {
        console.error('Report Post Error:', error);

        // Duplicate key = already reported
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already reported this post' });
        }

        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get pending reports (Admin)
// @route   GET /api/posts/admin/reports
exports.getReports = async (req, res) => {
    try {
        const status = req.query.status || 'pending';
        const limit = parseInt(req.query.limit) || 50;

        const reports = await ReportPost.find({ status })
            .populate('postId', 'media caption user thumbnail')
            .populate('reportedBy', 'username email')
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json(reports);
    } catch (error) {
        console.error('Get Reports Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Review a report (Admin)
// @route   PUT /api/posts/admin/reports/:reportId
exports.reviewReport = async (req, res) => {
    try {
        const { status, actionTaken, reviewNotes } = req.body;
        const { reportId } = req.params;

        const report = await ReportPost.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        report.status = status || report.status;
        report.actionTaken = actionTaken || report.actionTaken;
        report.reviewNotes = reviewNotes;
        report.reviewedBy = req.user.id;
        report.reviewedAt = new Date();

        // If action is 'removed', soft delete the post
        if (actionTaken === 'removed') {
            await Post.findByIdAndUpdate(report.postId, { isDeleted: true });
        }

        await report.save();

        res.json({ message: 'Report reviewed', report });
    } catch (error) {
        console.error('Review Report Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
