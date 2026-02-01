import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Users, FileText, AlertTriangle, IndianRupee, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ userCount: 0, postCount: 0, reportCount: 0, totalRevenue: 0 });
  const [revenueStats, setRevenueStats] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, revenueRes, transactionsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/stats/revenue'),
          api.get('/admin/transactions')
        ]);

        setStats(statsRes.data);
        setRevenueStats(revenueRes.data);
        setRecentTransactions(transactionsRes.data.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
      <div className={`p-4 rounded-lg mr-4 ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : value}</h3>
        {subValue && <p className="text-xs text-green-600 font-medium mt-1">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.userCount}
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue || 0}`}
            icon={IndianRupee}
            color="bg-green-600"
            subValue="Lifetime Earnings"
          />
          <StatCard
            title="Total Posts"
            value={stats.postCount}
            icon={FileText}
            color="bg-purple-500"
          />
          <StatCard
            title="Pending Reports"
            value={stats.reportCount}
            icon={AlertTriangle}
            color="bg-orange-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Graph */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <TrendingUp size={20} className="mr-2 text-green-500" />
              Revenue (Last 7 Days)
            </h3>
          </div>
          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center text-gray-400">Loading chart...</div>
            ) : revenueStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueStats}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">No data available for the last 7 days</div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Coins</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-4">Loading...</td></tr>
                ) : recentTransactions.length > 0 ? (
                  recentTransactions.map((tx: any) => (
                    <tr key={tx._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {tx.user?.username || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-green-600 font-bold">₹{tx.price}</td>
                      <td className="px-4 py-3">{tx.amount}</td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="text-center py-4">No recent transactions</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
