import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
    ShieldAlert, Zap, Radio,
    Cpu,
    Server, Lock, AlertTriangle, RefreshCw
} from 'lucide-react';

interface FeatureFlag {
    key: string;
    label: string;
    description: string;
    enabled: boolean;
}

export default function PowerCenter() {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [health, setHealth] = useState<any>(null);
    const [flags, setFlags] = useState<FeatureFlag[]>([
        { key: 'dating_enabled', label: 'Dating Flow', description: 'Toggle Vyb Dating matching and profile features', enabled: true },
        { key: 'pro_filters_enabled', label: 'Pro Image Filters', description: 'Enable Skia-powered image adjustment tools', enabled: true },
        { key: 'ads_enabled', label: 'Sponsored Content', description: 'Enable global ad-insertion in the main feed', enabled: false },
        { key: 'collab_posts_enabled', label: 'Co-Authoring', description: 'Allow multiple users to tag as authors', enabled: false },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSystemStatus();
    }, []);

    const fetchSystemStatus = async () => {
        try {
            const [healthRes] = await Promise.all([
                api.get('/admin/system/health'),
            ]);
            setHealth(healthRes.data);
            // In a real app, flags would come from /admin/settings/flags
        } catch (error) {
            console.error('Failed to fetch status', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFlag = (key: string) => {
        setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
    };

    const toggleMaintenance = async () => {
        const newState = !maintenanceMode;
        try {
            await api.post('/admin/power/maintenance', { enabled: newState });
            setMaintenanceMode(newState);
        } catch (error) {
            alert('Maintenance toggle failed');
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Zap className="text-amber-500 fill-amber-500" size={32} />
                        Power Center
                    </h2>
                    <p className="text-gray-500 font-medium">Global system overrides and structural controls</p>
                </div>
                <button
                    onClick={fetchSystemStatus}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors bg-white rounded-xl border border-gray-100 shadow-sm"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* System Overrides */}
                <div className="xl:col-span-2 space-y-8">
                    <section>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Strategic Overrides</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Maintenance Card */}
                            <div className={`p-6 rounded-2xl border-2 transition-all ${maintenanceMode ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${maintenanceMode ? 'bg-rose-500' : 'bg-gray-100'}`}>
                                        <Lock size={20} className={maintenanceMode ? 'text-white' : 'text-gray-400'} />
                                    </div>
                                    <button
                                        onClick={toggleMaintenance}
                                        className={`w-14 h-7 rounded-full p-1 transition-colors ${maintenanceMode ? 'bg-rose-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${maintenanceMode ? 'translate-x-7' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                <h4 className="text-lg font-black text-gray-900">Maintenance Seal</h4>
                                <p className="text-sm text-gray-500 font-medium mt-1">Locks the entire ecosystem for updates. Users will see a blackout screen.</p>
                            </div>

                            {/* Read Only Card */}
                            <div className="p-6 rounded-2xl bg-white border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-xl bg-gray-100">
                                        <ShieldAlert size={20} className="text-gray-400" />
                                    </div>
                                    <button className="w-14 h-7 rounded-full p-1 bg-gray-300">
                                        <div className="bg-white w-5 h-5 rounded-full shadow-md" />
                                    </button>
                                </div>
                                <h4 className="text-lg font-black text-gray-900">Read-Only Mode</h4>
                                <p className="text-sm text-gray-500 font-medium mt-1">Disables all writes (likes, posts, comments) while keeping content visible.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Feature Flags</h3>
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                            {flags.map(flag => (
                                <div key={flag.key} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <div className="flex gap-4">
                                        <div className={`p-2 h-fit rounded-lg ${flag.enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Radio size={18} />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black text-gray-900">{flag.label}</h5>
                                            <p className="text-xs text-gray-500 font-medium">{flag.description}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleFlag(flag.key)}
                                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${flag.enabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-100 text-gray-400'}`}
                                    >
                                        {flag.enabled ? 'Live' : 'Off'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* System Health Sidebar */}
                <div className="space-y-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Pulse Status</h3>
                    <div className="bg-gray-900 rounded-3xl p-6 text-white shadow-2xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                            <span className="text-xs font-black uppercase tracking-widest">Core Status: {health?.status || 'Online'}</span>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Server Load</span>
                                    <span className="text-[10px] font-black text-emerald-400">12%</span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[12%]" />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Database Health</span>
                                    <span className="text-[10px] font-black text-blue-400">99.9%</span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[99%]" />
                                </div>
                            </div>

                            <div className="pt-6 grid grid-cols-2 gap-4 border-t border-gray-800">
                                <div className="bg-gray-800/50 p-4 rounded-2xl">
                                    <Cpu className="text-blue-400 mb-2" size={16} />
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Memory</p>
                                    <p className="text-sm font-black">{health?.memoryUsed || '--'}</p>
                                </div>
                                <div className="bg-gray-800/50 p-4 rounded-2xl">
                                    <Server className="text-indigo-400 mb-2" size={16} />
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Uptime</p>
                                    <p className="text-sm font-black">{health?.uptime || '--'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4">
                        <AlertTriangle className="text-amber-500 shrink-0" />
                        <div>
                            <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Warning Zone</p>
                            <p className="text-[11px] font-bold text-amber-700 mt-1 leading-relaxed">Changes here affect all users in real-time. Proceed with tactical awareness.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
