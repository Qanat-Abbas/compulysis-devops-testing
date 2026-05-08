// frontend/src/components/layout/MainLayout.jsx
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  FlaskConical, 
  BarChart3, 
  FileText,
  Menu,
  X,
  LogOut,
  Brain
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/patients', icon: Users, label: 'Patient Management' },
    { path: '/assessment', icon: ClipboardList, label: 'OCD Assessment' },
    { path: '/model-lab', icon: FlaskConical, label: 'Model Laboratory' },
    { path: '/data-explorer', icon: BarChart3, label: 'Data Explorer' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-gradient-to-b from-primary-600 to-secondary-600 shadow-2xl`}
        style={{ width: '280px' }}
      >
        <div className="h-full px-4 py-6 overflow-y-auto">
          {/* Logo & Title */}
          <div className="flex items-center mb-8 px-2">
            <Brain className="w-10 h-10 text-white mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-white">Compulysis</h1>
              <p className="text-xs text-primary-100">OCD Risk Analyzer</p>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.charAt(0) || 'P'}
              </div>
              <div className="ml-3">
                <p className="text-white font-semibold">{user?.name || 'Psychologist'}</p>
                <p className="text-xs text-primary-100">{user?.email || 'user@compulysis.com'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  data-testid={`nav-${item.path === '/' ? 'dashboard' : item.path.replace('/', '')}`}
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-primary-600 shadow-lg'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            data-testid="logout-button"
            onClick={logout}
            className="flex items-center px-4 py-3 mt-8 w-full text-white hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
        {/* Top Navbar */}
        <header className="bg-white shadow-md sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              data-testid="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-500">Clinical Psychologist</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || 'P'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;