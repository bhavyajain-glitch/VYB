import { useState } from 'react';
import api from '../api/axios';
import { Send, Users, Filter, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';

export default function Broadcaster() {
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        target: 'all',
    });
    const [filters, setFilters] = useState({
        gender: '',
        college: '',
        isVip: false
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSend = async () => {
        if (!formData.title || !formData.body) {
            alert('Please fill in title and body');
            return;
        }

        if (!confirm('Are you sure you want to send this broadcast to all targeted users? This cannot be undone.')) {
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            const res = await api.post('/admin/notifications/broadcast', {
                ...formData,
                filters
            });
            setResult({ success: true, message: res.data.message });
            setFormData({ title: '', body: '', target: 'all' });
            setFilters({ gender: '', college: '', isVip: false });
        } catch (error: any) {
            setResult({ success: false, message: error.response?.data?.message || 'Failed to send broadcast' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-gray-900">Push Broadcaster</h2>
                <p className="text-gray-500 font-medium">Send real-time updates to the Vyb community</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Composer */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Smartphone size={20} />
                            </div>
                            <h3 className="font-black text-gray-900 uppercase tracking-wider text-sm">Message Composer</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. 🎉 New Event Alert!"
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-2xl font-bold transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Body Content</label>
                                <textarea
                                    rows={4}
                                    value={formData.body}
                                    onChange={e => setFormData({ ...formData, body: e.target.value })}
                                    placeholder="Tell your users something exciting..."
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-2xl font-medium transition-all"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className={`w-full mt-8 py-4 ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100'} text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all`}
                        >
                            {loading ? 'SENDING BLAST...' : <><Send size={18} /> LAUNCH BROADCAST</>}
                        </button>

                        {result && (
                            <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 ${result.success ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {result.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <p className="font-bold text-sm">{result.message}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Targeting Filters */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <Filter size={20} />
                            </div>
                            <h3 className="font-black text-gray-900 uppercase tracking-wider text-sm">Targeting</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Recipient Base</label>
                                <select
                                    value={formData.target}
                                    onChange={e => setFormData({ ...formData, target: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-purple-500 rounded-2xl font-bold transition-all text-sm"
                                >
                                    <option value="all">Everyone</option>
                                    <option value="verified">Verified Students</option>
                                    <option value="admins">Admin Team Only</option>
                                </select>
                            </div>

                            <div className="pt-6 border-t border-gray-50">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Demographic Filters</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Gender</label>
                                        <div className="flex gap-2">
                                            {['Male', 'Female', 'Other'].map(g => (
                                                <button
                                                    key={g}
                                                    onClick={() => setFilters({ ...filters, gender: filters.gender === g ? '' : g })}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${filters.gender === g ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Campus/College</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Harvard"
                                            value={filters.college}
                                            onChange={e => setFilters({ ...filters, college: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-xl font-bold text-sm transition-all"
                                        />
                                    </div>

                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div
                                            onClick={() => setFilters({ ...filters, isVip: !filters.isVip })}
                                            className={`w-10 h-6 rounded-full transition-all relative ${filters.isVip ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${filters.isVip ? 'left-5' : 'left-1'}`} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700">VIP Users Only</span>
                                    </label>
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-2xl mt-4">
                                <div className="flex items-center gap-2 text-blue-700 mb-1">
                                    <Users size={14} />
                                    <span className="text-xs font-black uppercase">Reach Estimator</span>
                                </div>
                                <p className="text-[10px] text-blue-600 font-medium">Broadcasts are sent via Firebase/Expo. Delivery rate depends on user device state.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
