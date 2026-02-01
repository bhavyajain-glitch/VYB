import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Plus, Minus, History } from 'lucide-react';

type UserData = {
    _id: string;
    fullName: string;
    username: string;
    phoneNumber: string;
    coins: number;
    isAdmin: boolean;
    isBanned?: boolean;
    isVerified?: boolean;
    createdAt: string;
};

type LogEntry = {
    _id: string;
    action: string;
    details: any;
    createdAt: string;
    performedBy?: { username: string; fullName: string };
};

export default function UserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [coinAmount, setCoinAmount] = useState('');
    const [coinReason, setCoinReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, [id]);

    const fetchUserData = async () => {
        try {
            const [userRes, logsRes] = await Promise.all([
                api.get(`/admin/users/${id}`),
                api.get(`/admin/users/${id}/logs`),
            ]);
            setUser(userRes.data);
            setLogs(logsRes.data);
        } catch (error) {
            console.error('Failed to fetch user data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCoins = async () => {
        if (!coinAmount) return;
        setActionLoading(true);
        try {
            await api.post(`/admin/users/${id}/add-coins`, { amount: coinAmount, reason: coinReason });
            setCoinAmount('');
            setCoinReason('');
            fetchUserData();
        } catch (error) {
            console.error('Failed to add coins', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeductCoins = async () => {
        if (!coinAmount) return;
        setActionLoading(true);
        try {
            await api.post(`/admin/users/${id}/deduct-coins`, { amount: coinAmount, reason: coinReason });
            setCoinAmount('');
            setCoinReason('');
            fetchUserData();
        } catch (error) {
            console.error('Failed to deduct coins', error);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleAdmin = async () => {
        if (!user) return;
        setActionLoading(true);
        try {
            await api.patch(`/admin/users/${id}`, { isAdmin: !user.isAdmin, note: 'Toggled admin status' });
            fetchUserData();
        } catch (error) {
            console.error('Failed to update admin status', error);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleBan = async () => {
        if (!user) return;
        if (!window.confirm(`Are you sure you want to ${user.isBanned ? 'unban' : 'ban'} this user?`)) return;
        setActionLoading(true);
        try {
            await api.patch(`/admin/users/${id}`, { isBanned: !user.isBanned, note: 'Toggled ban status' });
            fetchUserData();
        } catch (error) {
            console.error('Failed to update ban status', error);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleVerify = async () => {
        if (!user) return;
        setActionLoading(true);
        try {
            await api.patch(`/admin/users/${id}`, { isVerified: !user.isVerified, note: 'Toggled verification status' });
            fetchUserData();
        } catch (error) {
            console.error('Failed to update verification status', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!user) return;
        if (!window.confirm('CRITICAL: Are you sure you want to permanently delete this user and all their posts? This cannot be undone.')) return;

        setActionLoading(true);
        try {
            await api.delete(`/admin/users/${id}`);
            navigate('/users');
        } catch (error) {
            console.error('Failed to delete user', error);
            alert('Failed to delete user');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetDatingProfile = async () => {
        if (!user) return;
        if (!window.confirm('Are you sure you want to reset this user\'s dating profile? They will lose all dating data and matches.')) return;

        setActionLoading(true);
        try {
            await api.post(`/admin/users/${id}/reset-dating`);
            alert('Dating profile reset successfully');
            fetchUserData();
        } catch (error) {
            console.error('Failed to reset dating profile', error);
            alert('Failed to reset dating profile');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (!user) {
        return <div className="text-center text-red-500">User not found</div>;
    }

    return (
        <div>
            <button onClick={() => navigate('/users')} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
                <ArrowLeft size={20} className="mr-2" /> Back to Users
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">User Information</h3>
                    <div className="space-y-3">
                        <div><span className="text-gray-500 text-sm">Name:</span> <span className="font-medium">{user.fullName || 'N/A'}</span></div>
                        <div><span className="text-gray-500 text-sm">Username:</span> <span className="font-medium">@{user.username}</span></div>
                        <div><span className="text-gray-500 text-sm">Phone:</span> <span className="font-mono">{user.phoneNumber}</span></div>
                        <div><span className="text-gray-500 text-sm">Coins:</span> <span className="font-bold text-amber-600">{user.coins} 🪙</span></div>
                        <div><span className="text-gray-500 text-sm">Joined:</span> <span>{new Date(user.createdAt).toLocaleDateString()}</span></div>
                        <div className="flex flex-wrap gap-2 mt-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${user.isAdmin ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}>
                                {user.isAdmin ? 'Admin' : 'User'}
                            </span>
                            {user.isVerified && <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Verified</span>}
                            {user.isBanned && <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">Banned</span>}
                        </div>
                    </div>
                </div>

                {/* Actions Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modify Coins</label>
                            <input
                                type="number"
                                placeholder="Amount"
                                value={coinAmount}
                                onChange={(e) => setCoinAmount(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                            />
                            <input
                                type="text"
                                placeholder="Reason (optional)"
                                value={coinReason}
                                onChange={(e) => setCoinReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddCoins}
                                    disabled={actionLoading || !coinAmount}
                                    className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                                >
                                    <Plus size={16} /> Add
                                </button>
                                <button
                                    onClick={handleDeductCoins}
                                    disabled={actionLoading || !coinAmount}
                                    className="flex-1 flex items-center justify-center gap-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
                                >
                                    <Minus size={16} /> Deduct
                                </button>
                            </div>
                        </div>

                        <hr />

                        <div className="flex gap-2">
                            <button
                                onClick={toggleAdmin}
                                disabled={actionLoading}
                                className={`flex-1 py-2 rounded-lg font-medium ${user.isAdmin ? 'bg-gray-200 text-gray-700' : 'bg-indigo-500 text-white'}`}
                            >
                                {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            <button
                                onClick={toggleBan}
                                disabled={actionLoading}
                                className={`flex-1 py-2 rounded-lg font-medium ${user.isBanned ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}
                            >
                                {user.isBanned ? 'Unban' : 'Ban User'}
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={toggleVerify}
                                disabled={actionLoading}
                                className={`flex-1 py-2 rounded-lg font-medium ${user.isVerified ? 'bg-gray-200 text-gray-700' : 'bg-green-500 text-white'}`}
                            >
                                {user.isVerified ? 'Unverify' : 'Verify User'}
                            </button>
                            <button
                                onClick={handleResetDatingProfile}
                                disabled={actionLoading}
                                className="flex-1 py-2 rounded-lg font-medium bg-rose-500 text-white"
                            >
                                Reset Dating
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={actionLoading}
                                className="flex-1 py-2 rounded-lg font-medium bg-red-600 text-white"
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>

                {/* Activity Logs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <History size={20} /> Activity History
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {logs.length === 0 ? (
                            <p className="text-gray-500 text-sm">No activity logs yet.</p>
                        ) : (
                            logs.map((log) => (
                                <div key={log._id} className={`border-l-2 pl-3 py-2 ${log.action.includes('ADDED') ? 'border-green-400' :
                                    log.action.includes('DEDUCTED') ? 'border-red-400' : 'border-blue-300'
                                    }`}>
                                    <div className="text-sm font-bold text-gray-800 flex justify-between">
                                        <span>{log.action.replace(/_/g, ' ')}</span>
                                        {log.details?.amount && (
                                            <span className={log.action.includes('ADDED') ? 'text-green-600' : 'text-red-600'}>
                                                {log.action.includes('ADDED') ? '+' : '-'}{log.details.amount} 🪙
                                            </span>
                                        )}
                                    </div>
                                    {log.details && (
                                        <div className="text-xs text-gray-600 mt-1">
                                            {log.details.reason && <p className="font-medium italic">"{log.details.reason}"</p>}
                                            {log.details.price && <p>Price: ₹{log.details.price}</p>}
                                            {(!log.details.reason && !log.details.price) && (
                                                <p className="truncate">{JSON.stringify(log.details)}</p>
                                            )}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(log.createdAt).toLocaleString()}
                                        {log.performedBy && ` • by @${log.performedBy.username}`}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
