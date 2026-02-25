import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Search, Trash2 } from 'lucide-react';

interface Story {
    _id: string;
    image: string;
    user: { _id: string; username: string; fullName: string };
    views: string[];
    createdAt: string;
}

export default function Stories() {
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchStories = async () => {
        try {
            const res = await api.get('/admin/stories');
            setStories(res.data);
        } catch (error) {
            console.error('Failed to fetch stories', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStories();
    }, []);

    const handleDeleteStory = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this story?')) return;

        try {
            await api.delete(`/admin/stories/${id}`);
            setStories(prev => prev.filter(s => s._id !== id));
        } catch (error) {
            console.error('Failed to delete story', error);
            alert('Failed to delete story');
        }
    };

    const filteredStories = stories.filter(s =>
        s.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Story Management</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search user..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-10 text-gray-500">Loading stories...</div>
                ) : filteredStories.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-500">No stories found</div>
                ) : (
                    filteredStories.map((story) => (
                        <div key={story._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group">
                            <div className="relative aspect-[9/16] bg-gray-100">
                                <img
                                    src={story.image.startsWith('http') ? story.image : `http://localhost:5000${story.image}`}
                                    alt="Story"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => handleDeleteStory(story._id)}
                                        className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-2 text-center">
                                <p className="text-xs font-bold text-gray-800 truncate">@{story.user?.username || 'unknown'}</p>
                                <p className="text-[10px] text-gray-500">{new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
