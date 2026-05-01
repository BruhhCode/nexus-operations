import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Briefcase, 
  CreditCard, 
  Calendar, 
  MessageSquare,
  LogOut,
  Search,
  Bell
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';

export default function Layout() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/team', icon: Users, label: 'Team' },
    { to: '/projects', icon: Briefcase, label: 'Projects' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/finances', icon: CreditCard, label: 'Finances' },
    { to: '/calendar', icon: Calendar, label: 'Timeline' },
    { to: '/chat', icon: MessageSquare, label: 'Team Chat' },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
            <Briefcase className="w-5 h-5" />
          </div>
          <h1 className="font-bold tracking-tight text-xl text-slate-900">Nexus Ops</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-xl",
                isActive 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-indigo-900 rounded-2xl p-5 text-white mb-4">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1">Drive Synchronization</p>
            <p className="text-sm font-medium">Repository Connected</p>
            <button className="mt-4 w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-xs font-bold transition-colors">
              Access Assets
            </button>
          </div>
          
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
              {profile?.displayName?.slice(0, 2).toUpperCase() || '??'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate leading-none mb-1">{profile?.displayName}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase leading-none">{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="relative w-96 transform transition-all focus-within:w-[480px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input 
              type="text" 
              placeholder="Search for tasks, projects, clients..." 
              className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
