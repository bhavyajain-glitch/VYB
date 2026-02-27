import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Users, FileText, IndianRupee, TrendingUp,
  Activity, ShieldAlert, Cpu, HardDrive, Clock,
  ArrowUpRight, UserCheck, UserPlus, Heart, MessageSquare, Share2
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b'];

export default function Dashboard() {
  const [stats, setStats] = useState({ userCount: 0, postCount: 0, reportCount: 0, totalRevenue: 0 });
  const [extendedStats, setExtendedStats] = useState({
    newUsersToday: 0,
    activeUsers24h: 0,
    trendingPosts: [],
    revenueBySource: [],
    genderStats: []
  });
  const [revenueStats, setRevenueStats] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, revenueRes, transactionsRes, extendedRes, healthRes, activityRes, growthRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/stats/revenue'),
          api.get('/admin/transactions'),
          api.get('/admin/stats/extended'),
          api.get('/admin/system/health'),
          api.get('/admin/activity-feed'),
          api.get('/admin/stats/user-growth'),
        ]);

        setStats(statsRes.data);
        setRevenueStats(revenueRes.data);
        setExtendedStats(extendedRes.data);
        setHealth(healthRes.data);
        setActivityFeed(activityRes.data);
        setUserGrowth(growthRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const toggleMaintenance = async () => {
    const newState = !maintenanceMode;
    try {
      await api.post('/admin/power/maintenance', { enabled: newState });
      setMaintenanceMode(newState);
      alert(`Maintenance mode ${newState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      alert('Failed to toggle maintenance mode');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <span className="flex items-center text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full">
            <ArrowUpRight size={12} className="mr-1" /> {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 mt-1">{loading ? '...' : value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Maintenance Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Professional Insights</h2>
          <p className="text-gray-500 text-sm font-medium">Real-time status of the Vyb ecosystem</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
            <ShieldAlert size={18} className={`${maintenanceMode ? 'text-red-500' : 'text-gray-400'} mr-2`} />
            <span className="text-sm font-bold text-gray-700 mr-4">Maintenance</span>
            <button
              onClick={toggleMaintenance}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${maintenanceMode ? 'bg-red-500' : 'bg-gray-300'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Residents"
          value={stats.userCount}
          icon={Users}
          color="bg-blue-600"
          trend="+12%"
        />
        <StatCard
          title="Total Treasury"
          value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
          icon={IndianRupee}
          color="bg-emerald-600"
        />
        <StatCard
          title="Daily Arrivals"
          value={extendedStats.newUsersToday}
          icon={UserPlus}
          color="bg-indigo-600"
        />
        <StatCard
          title="Active (24h)"
          value={extendedStats.activeUsers24h}
          icon={UserCheck}
          color="bg-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Graph */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 flex items-center">
                  <TrendingUp size={20} className="mr-2 text-emerald-500" />
                  Revenue Growth
                </h3>
              </div>
              <div className="h-64 w-full">
                {loading ? (
                  <div className="h-full w-full animate-pulse bg-gray-50 rounded-xl"></div>
                ) : revenueStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueStats}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 font-medium">No sales data found</div>
                )}
              </div>
            </div>

            {/* Revenue Source Distribution */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center">
                <IndianRupee size={20} className="mr-2 text-blue-500" />
                Revenue Channels
              </h3>
              <div className="h-64 w-full flex items-center justify-center relative">
                {loading ? (
                  <div className="h-full w-full animate-pulse bg-gray-50 rounded-xl"></div>
                ) : extendedStats.revenueBySource.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={extendedStats.revenueBySource}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="total"
                        nameKey="_id"
                      >
                        {extendedStats.revenueBySource.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `₹${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-400 font-medium font-sm">No transaction sources</div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Growth</p>
                  <p className="text-xl font-black text-gray-900">PRO</p>
                </div>
              </div>
            </div>

            {/* User Growth Graph */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-900 flex items-center">
                  <UserPlus size={20} className="mr-2 text-indigo-500" />
                  Growth Trend
                </h3>
              </div>
              <div className="h-64 w-full">
                {loading ? (
                  <div className="h-full w-full animate-pulse bg-gray-50 rounded-xl"></div>
                ) : userGrowth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowth}>
                      <defs>
                        <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorGrowth)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400 font-medium font-sm">Awaiting new arrivals...</div>
                )}
              </div>
            </div>
          </div>

          {/* Trending Posts */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center">
              <Activity size={20} className="mr-2 text-rose-500" />
              Trending Content
            </h3>
            <div className="space-y-4">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse bg-gray-50 rounded-xl"></div>)
              ) : extendedStats.trendingPosts.length > 0 ? (
                extendedStats.trendingPosts.map((post: any) => (
                  <div key={post._id} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                        {post.media?.[0]?.url ? (
                          <img src={post.media[0].url} className="w-full h-full object-cover" alt="Post" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            <FileText size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 truncate w-48 md:w-64">
                          {post.caption || "No caption"}
                        </p>
                        <p className="text-xs font-bold text-gray-500">by @{post.user?.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center px-3">
                        <Heart size={14} className="text-rose-500 mb-1" />
                        <span className="text-[10px] font-black text-gray-900">{post.likeCount || 0}</span>
                      </div>
                      <div className="flex flex-col items-center px-3">
                        <MessageSquare size={14} className="text-blue-500 mb-1" />
                        <span className="text-[10px] font-black text-gray-900">{post.commentCount || 0}</span>
                      </div>
                      <div className="flex flex-col items-center px-3">
                        <Share2 size={14} className="text-emerald-500 mb-1" />
                        <span className="text-[10px] font-black text-gray-900">{post.shareCount || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-10 font-bold">No trending content yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Health & Activity */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center">
              <Cpu size={20} className="mr-2 text-indigo-500" />
              Pulse Monitor
            </h3>
            {health ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping mr-3" />
                    <span className="text-xs font-black text-green-700 uppercase tracking-tighter">System Health</span>
                  </div>
                  <span className="text-xs font-black text-green-700">{health.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <Clock size={14} className="text-indigo-500 mb-2" />
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Uptime</p>
                    <p className="text-sm font-black text-gray-900">{health.uptime}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <HardDrive size={14} className="text-blue-500 mb-2" />
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Database</p>
                    <p className="text-sm font-black text-gray-900">{health.database}</p>
                  </div>
                </div>
              </div>
            ) : <div className="h-24 animate-pulse bg-gray-50 rounded-xl"></div>}
          </div>

          {/* Activity Feed */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center">
              <Activity size={20} className="mr-2 text-amber-500" />
              Live Feed
            </h3>
            <div className="space-y-5">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 animate-pulse bg-gray-50 rounded-xl"></div>)
              ) : activityFeed.length > 0 ? (
                activityFeed.map((activity: any) => (
                  <div key={activity._id} className="flex gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <Activity size={14} className="text-indigo-600" />
                      </div>
                      <div className="w-0.5 flex-1 bg-gray-100 my-1" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900">
                        {activity.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[10px] font-bold text-gray-500">
                        {activity.user?.username ? `@${activity.user.username}` : 'System'} • {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 text-xs font-bold py-10">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
