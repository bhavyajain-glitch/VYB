import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Search, Shield, User as UserIcon, ChevronRight, CheckSquare, Square, Ban, Unlock, CheckCircle, RotateCcw } from 'lucide-react';

type UserData = {
    _id: string;
    fullName: string;
    username: string;
    email: string;
    phoneNumber: string;
    coins: number;
    isAdmin: boolean;
    isBanned?: boolean;
    isVerified?: boolean;
    createdAt: string;
};

export default function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/admin/all');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredUsers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredUsers.map(u => u._id));
        }
    };

    const handleBulkAction = async (action: string) => {
        if (selectedIds.length === 0) return;

        const confirmMsg = action === 'delete_users'
            ? `CRITICAL: Are you sure you want to PERMANENTLY delete ${selectedIds.length} users? This cannot be undone.`
            : `Are you sure you want to ${action.replace('_', ' ')} ${selectedIds.length} users?`;

        if (!window.confirm(confirmMsg)) return;

        setActionLoading(true);
        try {
            // For users, delete is handled individually in backend currently or we can add it to bulk-action
            // I'll use the 'ban_users' and 'unban_users' which I added to bulk-action
            await api.post('/admin/power/bulk-action', {
                action,
                ids: selectedIds,
                note: `Bulk ${action} performed on ${selectedIds.length} users`
            });

            setSelectedIds([]);
            fetchUsers();
            alert('Bulk action completed successfully');
        } catch (error) {
            console.error('Bulk action failed', error);
            alert('Failed to perform bulk action');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter(
        u =>
            u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.phoneNumber?.includes(searchTerm) ||
            u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">User HQ</h2>
                    <p className="text-gray-500 text-sm font-medium">Manage and moderate the Vyb community</p>
                </div>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search name, phone, email..."
                        className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-72 shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2 border-r border-gray-700 pr-6">
                        <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                            {selectedIds.length}
                        </div>
                        <span className="text-sm font-bold">Selected</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            disabled={actionLoading}
                            onClick={() => handleBulkAction('ban_users')}
                            className="flex items-center gap-1.5 text-xs font-black hover:text-orange-400 transition-colors uppercase tracking-widest disabled:opacity-50"
                        >
                            <Ban size={14} /> Ban
                        </button>
                        <button
                            disabled={actionLoading}
                            onClick={() => handleBulkAction('unban_users')}
                            className="flex items-center gap-1.5 text-xs font-black hover:text-emerald-400 transition-colors uppercase tracking-widest disabled:opacity-50"
                        >
                            <Unlock size={14} /> Unban
                        </button>
                        <button
                            disabled={actionLoading}
                            onClick={() => handleBulkAction('verify_users')}
                            className="flex items-center gap-1.5 text-xs font-black hover:text-blue-400 transition-colors uppercase tracking-widest disabled:opacity-50"
                        >
                            <CheckCircle size={14} /> Verify
                        </button>
                        <button
                            disabled={actionLoading}
                            onClick={() => handleBulkAction('reset_dating_profiles')}
                            className="flex items-center gap-1.5 text-xs font-black hover:text-rose-400 transition-colors uppercase tracking-widest disabled:opacity-50"
                        >
                            <RotateCcw size={14} /> Reset Dating
                        </button>
                        <button
                            disabled={actionLoading}
                            onClick={() => setSelectedIds([])}
                            className="text-xs font-black text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="text-gray-400 hover:text-blue-500 transition-colors"
                                    >
                                        {selectedIds.length === filteredUsers.length && filteredUsers.length > 0
                                            ? <CheckSquare size={20} className="text-blue-500" />
                                            : <Square size={20} />
                                        }
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Resident</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Identity</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Wealth</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Privileges</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Arrival Date</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                        <span className="text-sm font-bold text-gray-400">Loading residents...</span>
                                    </div>
                                </td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold">No citizens found matching your criteria</td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr
                                        key={user._id}
                                        className={`hover:bg-gray-50/80 transition-all cursor-pointer ${selectedIds.includes(user._id) ? 'bg-blue-50/50' : ''}`}
                                        onClick={() => navigate(`/users/${user._id}`)}
                                    >
                                        <td className="px-6 py-4" onClick={(e) => toggleSelect(user._id, e)}>
                                            {selectedIds.includes(user._id)
                                                ? <CheckSquare size={20} className="text-blue-500" />
                                                : <Square size={20} className="text-gray-300 hover:text-gray-400" />
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 shadow-sm border ${user.isAdmin ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                    {user.isAdmin ? <Shield size={18} /> : <UserIcon size={18} />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-gray-900">{user.fullName || 'Nameless'}</div>
                                                    <div className="text-[11px] font-bold text-gray-500 uppercase">@{user.username || 'unknown'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-gray-700">{user.email || 'No Email'}</div>
                                            <div className="text-[10px] font-medium text-gray-500 font-mono mt-0.5">{user.phoneNumber || 'No Phone'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-tighter">
                                                {user.coins.toLocaleString()} 🪙
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${user.isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {user.isAdmin ? 'Admin' : 'Citizen'}
                                                </span>
                                                {user.isVerified && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-widest">
                                                        Verified
                                                    </span>
                                                )}
                                                {user.isBanned && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-100 text-rose-700 uppercase tracking-widest">
                                                        Banned
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-900 transition-colors inline" />
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
