import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Check, X, ExternalLink } from 'lucide-react';

interface Report {
  _id: string;
  reporter: { username: string; profileImage?: string };
  entityType: string;
  reason: string;
  description: string;
  status: 'Pending' | 'Resolved' | 'Dismissed';
  createdAt: string;
}

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await api.get('/admin/reports');
      setReports(res.data);
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/reports/${id}`, { status });
      // Optimistic update
      setReports(prev => prev.map(r => r._id === id ? { ...r, status: status as any } : r));
    } catch (error) {
      console.error('Failed to update report', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Dismissed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Content Reports</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Reporter</th>
                <th className="p-4 font-semibold text-gray-600">Type</th>
                <th className="p-4 font-semibold text-gray-600">Reason</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading reports...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No reports found.</td></tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar placeholder */}
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {report.reporter?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="font-medium text-gray-700">{report.reporter?.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">{report.entityType}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800">{report.reason}</p>
                        {(report.entityType === 'User') && (
                          <button
                            onClick={() => navigate(`/users/${(report as any).entityId}`)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                            title="View User"
                          >
                            <ExternalLink size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{report.description}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {report.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(report._id, 'Resolved')}
                            title="Resolve"
                            className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleAction(report._id, 'Dismissed')}
                            title="Dismiss"
                            className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
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
