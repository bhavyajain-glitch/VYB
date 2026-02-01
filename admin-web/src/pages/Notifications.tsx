import React, { useState } from 'react';
import api from '../api/axios';

const Notifications: React.FC = () => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [target, setTarget] = useState('all'); // all, verified, specific
    const [specificUserId, setSpecificUserId] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const res = await api.post('/admin/notifications/broadcast', {
                title,
                body,
                target,
                targetUserId: target === 'specific' ? specificUserId : undefined
            });

            setStatus({ type: 'success', message: res.data.message });
            setTitle('');
            setBody('');
        } catch (error: any) {
            setStatus({
                type: 'error',
                message: error.response?.data?.message || 'Failed to send notification'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
                Push Notifications
            </h1>

            <div className="bg-gray-800 rounded-xl p-6 shadow-xl max-w-2xl border border-gray-700">
                <form onSubmit={handleSend} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 mb-2 font-medium">Notification Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                            placeholder="e.g., Special Offer!"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2 font-medium">Message Body</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none h-32"
                            placeholder="e.g., Get 50% off coins today only..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 mb-2 font-medium">Target Audience</label>
                        <select
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                            <option value="all">All Users</option>
                            <option value="verified">Verified Students Only</option>
                            <option value="specific">Specific User ID</option>
                        </select>
                    </div>

                    {target === 'specific' && (
                        <div>
                            <label className="block text-gray-300 mb-2 font-medium">User ID</label>
                            <input
                                type="text"
                                value={specificUserId}
                                onChange={(e) => setSpecificUserId(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
                                placeholder="Mongo User ID"
                                required
                            />
                        </div>
                    )}

                    {status && (
                        <div className={`p-4 rounded-lg ${status.type === 'success' ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
                            {status.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-lg font-bold text-white transition-all 
                            ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg'}`}
                    >
                        {loading ? 'Sending...' : 'Send Broadcast'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Notifications;
