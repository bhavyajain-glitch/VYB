import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import { Search, Trash2, CheckCircle2, Circle, Heart, MessageSquare, FileText } from 'lucide-react';

interface Post {
    _id: string;
    caption: string;
    media?: { url: string; type: string }[];
    image?: string;
    user: { _id: string; username: string; fullName: string };
    likeCount?: number;
    commentCount?: number;
    createdAt: string;
}

export default function Posts() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchPosts = async () => {
        try {
            const res = await api.get('/admin/posts');
            setPosts(res.data);
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredPosts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredPosts.map(p => p._id));
        }
    };

    const handleBulkAction = async (action: string) => {
        if (selectedIds.length === 0) return;

        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} posts? This action is permanent.`)) return;

        setActionLoading(true);
        try {
            await api.post('/admin/power/bulk-action', {
                action,
                ids: selectedIds,
                note: `Bulk ${action} performed on ${selectedIds.length} posts`
            });

            setSelectedIds([]);
            fetchPosts();
            alert('Bulk deletion successful');
        } catch (error) {
            console.error('Bulk deletion failed', error);
            alert('Failed to delete posts');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredPosts = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return posts.filter(p =>
            (p.caption?.toLowerCase() || '').includes(term) ||
            (p.user?.username?.toLowerCase() || '').includes(term) ||
            (p.user?.fullName?.toLowerCase() || '').includes(term)
        );
    }, [posts, searchTerm]);

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Content Archive</h2>
                    <p className="text-gray-500 text-sm font-medium">Monitor and moderate all community uploads</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSelectAll}
                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                        {selectedIds.length === filteredPosts.length && filteredPosts.length > 0 ? "Deselect All" : "Select All Visible"}
                    </button>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Find content..."
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-2 border-r border-gray-700 pr-6">
                        <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black">
                            {selectedIds.length}
                        </div>
                        <span className="text-sm font-bold">In Queue</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            disabled={actionLoading}
                            onClick={() => handleBulkAction('delete_posts')}
                            className="flex items-center gap-1.5 text-xs font-black hover:text-rose-400 transition-colors uppercase tracking-widest disabled:opacity-50"
                        >
                            <Trash2 size={14} /> Purge Content
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-sm font-bold text-gray-400">Loading archives...</p>
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="col-span-full text-center py-20">
                        <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-bold">No content matches your surveillance</p>
                    </div>
                ) : (
                    filteredPosts.map((post) => (
                        <div
                            key={post._id}
                            onClick={(e) => toggleSelect(post._id, e)}
                            className={`group bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all duration-200 cursor-pointer ${selectedIds.includes(post._id) ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg scale-[0.98]' : 'border-gray-100 hover:border-gray-300'}`}
                        >
                            <div className="relative aspect-square bg-gray-50">
                                {selectedIds.includes(post._id) ? (
                                    <div className="absolute top-3 right-3 z-10 bg-blue-500 text-white p-1 rounded-full shadow-lg">
                                        <CheckCircle2 size={16} />
                                    </div>
                                ) : (
                                    <div className="absolute top-3 right-3 z-10 bg-black/20 text-white p-1 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Circle size={16} />
                                    </div>
                                )}

                                <img
                                    src={post.media?.[0]?.url || post.image || ''}
                                    alt="Content"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs uppercase">
                                        {post.user?.username?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-gray-900 leading-none">@{post.user?.username || 'unknown'}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">
                                            {new Date(post.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[11px] font-bold text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                                    {post.caption || <span className="italic text-gray-300">Undocumented capture</span>}
                                </p>
                                <div className="mt-auto flex justify-between items-center pt-3 border-t border-gray-50">
                                    <div className="flex gap-4 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                        <span className="flex items-center gap-1"><Heart size={12} className="text-rose-500" /> {post.likeCount || 0}</span>
                                        <span className="flex items-center gap-1"><MessageSquare size={12} className="text-blue-500" /> {post.commentCount || 0}</span>
                                    </div>
                                    <div className="text-[9px] font-black text-blue-500 uppercase">Archive ›</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
