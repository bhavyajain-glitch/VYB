import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Users, FileText, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ userCount: 0, postCount: 0, reportCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
      <div className={`p-4 rounded-lg mr-4 ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{loading ? '...' : value}</h3>
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats.userCount} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Total Posts" 
          value={stats.postCount} 
          icon={FileText} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Pending Reports" 
          value={stats.reportCount} 
          icon={AlertTriangle} 
          color="bg-orange-500" 
        />
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Welcome back, Admin</h3>
        <p className="text-gray-600">
          Use the navigation menu to review reports and manage users. 
          Keeping the platform safe is our top priority.
        </p>
      </div>
    </div>
  );
}
