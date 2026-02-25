import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Search, Trash2 } from 'lucide-react';

interface Post {
    _id: string;
    caption: string;
    image: string;
    user: { _id: string; username: string; fullName: string };
    likes: string[];
    comments: any[];
    createdAt: string;
}

export default function Posts() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const handleDeletePost = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            await api.delete(`/admin/posts/${id}`);
            setPosts(prev => prev.filter(p => p._id !== id));
        } catch (error) {
            console.error('Failed to delete post', error);
            alert('Failed to delete post');
        }
    };

    const filteredPosts = posts.filter(p =>
        p.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Post Management</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search caption or user..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-gray-500">Loading posts...</div>
                ) : filteredPosts.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500">No posts found</div>
                ) : (
                    filteredPosts.map((post) => (
                        <div key={post._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div className="relative aspect-square bg-gray-100">
                                <img
                                    src={post.image.startsWith('http') ? post.image : `http://localhost:5000${post.image}`}
                                    alt="Post content"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs capitalize">
                                        {post.user?.username?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">@{post.user?.username || 'unknown'}</p>
                                        <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                    {post.caption || <span className="italic text-gray-400">No caption</span>}
                                </p>
                                <div className="mt-auto flex justify-between items-center pt-2 border-t border-gray-50">
                                    <div className="flex gap-3 text-xs text-gray-500">
                                        <span>❤️ {post.likes?.length || 0}</span>
                                        <span>💬 {post.comments?.length || 0}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeletePost(post._id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Post"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
