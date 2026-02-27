import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Check, X, ExternalLink, MessageSquare, ShieldAlert, Cpu, ChevronDown, ChevronUp, Send } from 'lucide-react';

interface Comment {
  _id: string;
  admin: { username: string };
  text: string;
  createdAt: string;
}

interface Report {
  _id: string;
  reporter: { username: string; profileImage?: string };
  entityType: string;
  entityId: string;
  reason: string;
  description: string;
  status: 'Pending' | 'Resolved' | 'Dismissed';
  createdAt: string;
  aiClassification?: {
    label: string;
    confidence: number;
    details: string;
  };
  comments: Comment[];
}

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

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
      setReports(prev => prev.map(r => r._id === id ? { ...r, status: status as any } : r));
    } catch (error) {
      console.error('Failed to update report', error);
    }
  };

  const handleAddComment = async (reportId: string) => {
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/admin/reports/${reportId}/comments`, { text: commentText });
      setReports(prev => prev.map(r =>
        r._id === reportId ? { ...r, comments: [...r.comments, res.data] } : r
      ));
      setCommentText('');
    } catch (error) {
      console.error('Failed to add comment', error);
    }
  };

  const syncAI = async (reportId: string) => {
    try {
      const res = await api.post(`/admin/reports/${reportId}/classify`);
      setReports(prev => prev.map(r =>
        r._id === reportId ? { ...r, aiClassification: res.data } : r
      ));
    } catch (error) {
      console.error('Failed to sync AI', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Dismissed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  const getAILabelColor = (label: string) => {
    switch (label) {
      case 'Safe': return 'text-green-600';
      case 'Spam': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Intelligence Hub</h2>
          <p className="text-gray-500 font-medium">Moderation Reports & AI Insights</p>
        </div>
        <div className="flex gap-4">
          {/* Filters could go here */}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-6 font-bold text-gray-500 text-xs uppercase tracking-wider">Entity</th>
                <th className="p-6 font-bold text-gray-500 text-xs uppercase tracking-wider">Reason</th>
                <th className="p-6 font-bold text-gray-500 text-xs uppercase tracking-wider">AI Insight</th>
                <th className="p-6 font-bold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="p-6 font-bold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center"><div className="animate-pulse text-gray-400 font-bold">SYSTING REPORTS...</div></td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-gray-400">No active reports found.</td></tr>
              ) : (
                reports.map((report) => (
                  <React.Fragment key={report._id}>
                    <tr
                      className={`hover:bg-blue-50/30 transition-all cursor-pointer ${expandedId === report._id ? 'bg-blue-50/50 shadow-inner' : ''}`}
                      onClick={() => setExpandedId(expandedId === report._id ? null : report._id)}
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <ShieldAlert size={20} />
                          </div>
                          <div>
                            <span className="block font-bold text-gray-900">{report.entityType}</span>
                            <span className="text-xs text-gray-400 font-medium">By @{report.reporter?.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="font-bold text-gray-800 line-clamp-1">{report.reason}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(report.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="p-6">
                        {report.aiClassification ? (
                          <div className="flex items-center gap-2">
                            <Cpu size={14} className={getAILabelColor(report.aiClassification.label)} />
                            <span className={`font-black text-sm ${getAILabelColor(report.aiClassification.label)}`}>
                              {report.aiClassification.label} ({(report.aiClassification.confidence * 100).toFixed(0)}%)
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); syncAI(report._id); }}
                            className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg"
                          >
                            <Cpu size={12} /> SCAN CONTENT
                          </button>
                        )}
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                          {report.status === 'Pending' && (
                            <>
                              <button onClick={() => handleAction(report._id, 'Resolved')} className="p-2 bg-green-500 text-white rounded-xl shadow-lg shadow-green-200 hover:scale-110 transition-transform"><Check size={16} /></button>
                              <button onClick={() => handleAction(report._id, 'Dismissed')} className="p-2 bg-red-500 text-white rounded-xl shadow-lg shadow-red-200 hover:scale-110 transition-transform"><X size={16} /></button>
                            </>
                          )}
                          <div className="text-gray-300">
                            {expandedId === report._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* EXPANDED SECTION */}
                    {expandedId === report._id && (
                      <tr className="bg-gray-50/30">
                        <td colSpan={5} className="p-8">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left: Metadata & AI */}
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                              <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Cpu size={16} className="text-indigo-500" /> AI Diagnostic
                              </h4>
                              {report.aiClassification ? (
                                <div className="space-y-4">
                                  <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-sm font-medium text-gray-700 leading-relaxed italic">"{report.aiClassification.details}"</p>
                                  </div>
                                  <div className="flex gap-4">
                                    <div className="flex-1 p-3 bg-indigo-50 rounded-xl">
                                      <span className="block text-[10px] font-bold text-indigo-400 uppercase">Confidence</span>
                                      <span className="font-black text-lg text-indigo-600">{(report.aiClassification.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="flex-1 p-3 bg-indigo-50 rounded-xl">
                                      <span className="block text-[10px] font-bold text-indigo-400 uppercase">Entity</span>
                                      <span className="font-black text-lg text-indigo-600">{report.entityType}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-400 text-sm font-medium">No AI diagnostic available for this report.</p>
                              )}

                              <div className="mt-8">
                                <h4 className="font-black text-gray-900 mb-2 text-sm uppercase tracking-wider">Description</h4>
                                <p className="text-gray-600 text-sm leading-relaxed">{report.description || 'No additional details provided by reporter.'}</p>
                              </div>

                              <div className="mt-8 flex gap-3">
                                <button
                                  onClick={() => navigate(`/users/${report.entityId}`)}
                                  className="flex-1 py-3 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-gray-800 transition-colors"
                                >
                                  <ExternalLink size={16} /> VIEW TARGET
                                </button>
                              </div>
                            </div>

                            {/* Right: Threaded Moderation */}
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[400px]">
                              <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <MessageSquare size={16} className="text-indigo-500" /> Admin Logs
                              </h4>

                              <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                                {report.comments.length === 0 ? (
                                  <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                    <MessageSquare size={48} opacity={0.5} />
                                    <p className="font-bold text-xs mt-2 uppercase">No logs yet</p>
                                  </div>
                                ) : (
                                  report.comments.map((comment, idx) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded-2xl">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-black text-[10px] text-indigo-600 uppercase">@{comment.admin?.username || 'admin'}</span>
                                        <span className="text-[10px] text-gray-400">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      <p className="text-sm text-gray-700">{comment.text}</p>
                                    </div>
                                  ))
                                )}
                              </div>

                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Log your findings..."
                                  value={commentText}
                                  onChange={e => setCommentText(e.target.value)}
                                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded-2xl text-sm font-medium transition-all"
                                  onKeyPress={e => e.key === 'Enter' && handleAddComment(report._id)}
                                />
                                <button
                                  onClick={() => handleAddComment(report._id)}
                                  className="absolute right-2 top-2 p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-200"
                                >
                                  <Send size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
