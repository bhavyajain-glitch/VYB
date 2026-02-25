import { useEffect, useState } from 'react';
import api from '../api/axios';
import { MessageCircle } from 'lucide-react';

interface ChatPair {
    user1: { _id: string; username: string; fullName: string; profileImage?: string };
    user2: { _id: string; username: string; fullName: string; profileImage?: string };
    lastMessage: string;
    lastMessageAt: string;
    messageCount: number;
}

export default function Chats() {
    const [chats, setChats] = useState<ChatPair[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChats();
    }, []);

    const fetchChats = async () => {
        try {
            const res = await api.get('/admin/chats');
            setChats(res.data);
        } catch (error) {
            console.error('Failed to fetch chats', error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name?.charAt(0).toUpperCase() || 'U';
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MessageCircle size={24} /> Active Chats Monitoring
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Users</th>
                                <th className="p-4 font-semibold text-gray-600">Last Message</th>
                                <th className="p-4 font-semibold text-gray-600">Messages</th>
                                <th className="p-4 font-semibold text-gray-600">Last Activity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading chats...</td></tr>
                            ) : chats.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No active chats found.</td></tr>
                            ) : (
                                chats.map((chat, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs border-2 border-white">
                                                        {getInitials(chat.user1?.fullName || chat.user1?.username)}
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs border-2 border-white">
                                                        {getInitials(chat.user2?.fullName || chat.user2?.username)}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-700 text-sm">
                                                        @{chat.user1?.username || 'Unknown'}
                                                    </span>
                                                    <span className="font-medium text-gray-700 text-sm">
                                                        @{chat.user2?.username || 'Unknown'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-gray-600 text-sm truncate max-w-xs">{chat.lastMessage || 'No messages'}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                                {chat.messageCount}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-gray-500 text-sm">
                                                {new Date(chat.lastMessageAt).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
