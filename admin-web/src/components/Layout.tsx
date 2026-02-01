import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileWarning, LogOut, Users, Image as ImageIcon, CircleDashed, CreditCard, Bell, MessageCircle, Settings } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: ImageIcon, label: 'Posts', path: '/posts' },
    { icon: CircleDashed, label: 'Stories', path: '/stories' },
    { icon: CreditCard, label: 'Transactions', path: '/transactions' },
    { icon: FileWarning, label: 'Reports', path: '/reports' },
    { icon: MessageCircle, label: 'Chats', path: '/chats' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">CC Admin</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center w-full p-3 rounded-lg transition-colors ${location.pathname === item.path
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <item.icon size={20} className="mr-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          {(() => {
            const userStr = localStorage.getItem('adminUser');
            if (userStr) {
              const user = JSON.parse(userStr);
              return (
                <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 uppercase font-semibold">Logged in as</p>
                  <p className="text-sm font-bold text-gray-700 truncate">{user.fullName || user.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email || 'No email'}</p>
                </div>
              );
            }
            return null;
          })()}
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
