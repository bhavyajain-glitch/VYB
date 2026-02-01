import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';

interface CoinPack {
    coins: number;
    price: number;
}

export default function Settings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [coinPacks, setCoinPacks] = useState<CoinPack[]>([
        { coins: 50, price: 49 },
        { coins: 120, price: 99 },
        { coins: 300, price: 199 },
        { coins: 700, price: 399 },
    ]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            if (res.data.coinPacks) {
                setCoinPacks(res.data.coinPacks);
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
        } finally {
            setLoading(false);
        }
    };


    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch('/admin/settings', {
                coinPacks,
            });
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateCoinPack = (index: number, field: 'coins' | 'price', value: number) => {
        const updated = [...coinPacks];
        updated[index][field] = value;
        setCoinPacks(updated);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading settings...</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <SettingsIcon size={24} /> App Settings
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coin Packs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Coin Pack Pricing</h3>
                    <p className="text-sm text-gray-500 mb-4">Configure the coin packs available for purchase.</p>

                    <div className="space-y-4">
                        {coinPacks.map((pack, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">Coins</label>
                                    <input
                                        type="number"
                                        value={pack.coins}
                                        onChange={(e) => updateCoinPack(index, 'coins', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        value={pack.price}
                                        onChange={(e) => updateCoinPack(index, 'price', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Other Settings Placeholder */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Other Settings</h3>
                    <p className="text-sm text-gray-500">
                        Additional app settings can be configured here in the future.
                    </p>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center text-gray-400">
                        Coming soon...
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                    {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
