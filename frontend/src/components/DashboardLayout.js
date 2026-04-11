import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  House, 
  FolderOpen, 
  Lightbulb, 
  CreditCard, 
  GearSix,
  SignOut,
  Plus,
  List
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const SIDEBAR_LINKS = [
  { path: '/dashboard', icon: House, label: 'Resumen' },
  { path: '/dashboard/projects', icon: FolderOpen, label: 'Proyectos' },
  { path: '/dashboard/opportunities', icon: Lightbulb, label: 'Oportunidades' },
  { path: '/dashboard/billing', icon: CreditCard, label: 'Facturación' },
  { path: '/dashboard/settings', icon: GearSix, label: 'Ajustes' },
];

const DashboardLayout = ({ children, title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getPlanBadge = (plan) => {
    const badges = {
      free: { label: 'Gratis', color: 'bg-[#262626] text-[#A3A3A3]' },
      blueprint: { label: 'Blueprint', color: 'bg-blue-500/20 text-blue-400' },
      sistema: { label: 'Sistema', color: 'bg-[#0F5257]/30 text-[#0F5257]' },
      premium: { label: 'Premium', color: 'bg-yellow-500/20 text-yellow-400' }
    };
    return badges[plan] || badges.free;
  };

  const planBadge = getPlanBadge(user?.plan);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#171717] border-r border-[#262626]">
        {/* Logo */}
        <div className="p-6 border-b border-[#262626]">
          <Logo size="default" />
        </div>

        {/* New Project Button */}
        <div className="p-4">
          <Link
            to="/flow"
            className="w-full btn-primary flex items-center justify-center gap-2"
            data-testid="new-project-btn"
          >
            <Plus size={18} weight="bold" />
            Nuevo proyecto
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2">
          {SIDEBAR_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
              data-testid={`nav-${link.label.toLowerCase()}`}
            >
              <link.icon size={20} weight={location.pathname === link.path ? 'fill' : 'regular'} />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[#262626]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#0F5257]/30 flex items-center justify-center text-[#0F5257] font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs ${planBadge.color}`}>
                {planBadge.label}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded-lg transition-colors"
            data-testid="logout-btn"
          >
            <SignOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#171717] border-r border-[#262626] z-50 transform transition-transform lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-[#262626] flex items-center justify-between">
          <Logo size="small" />
          <button onClick={() => setSidebarOpen(false)} className="text-[#A3A3A3]">
            ✕
          </button>
        </div>
        <div className="p-4">
          <Link to="/flow" className="w-full btn-primary flex items-center justify-center gap-2">
            <Plus size={18} weight="bold" />
            Nuevo proyecto
          </Link>
        </div>
        <nav className="px-3 py-2">
          {SIDEBAR_LINKS.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              <link.icon size={20} weight={location.pathname === link.path ? 'fill' : 'regular'} />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#262626]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-[#A3A3A3] hover:text-white hover:bg-[#262626] rounded-lg transition-colors"
          >
            <SignOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-[#262626] flex items-center justify-between px-6 bg-[#0A0A0A]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[#A3A3A3] hover:text-white"
            >
              <List size={24} />
            </button>
            <h1 className="text-lg font-medium text-white" data-testid="page-title">{title}</h1>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs ${planBadge.color}`}>
              {planBadge.label}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
