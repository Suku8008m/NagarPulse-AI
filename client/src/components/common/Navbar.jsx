import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  MapPin,
  FileText,
  Wrench,
  Building2,
  LogIn,
  LogOut,
  Activity,
  Menu,
  X
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'operator':
        return { label: 'Operator', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'citizen':
      default:
        return { label: 'Citizen', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  // Build role-specific navigation items
  let navItems = [];

  if (!isAuthenticated || !user) {
    // 1. Logged out (Public view): ONLY Live Map & Report Hazard
    navItems = [
      { to: '/', label: 'Live Map', icon: MapPin },
      { to: '/citizen', label: 'Report Hazard', icon: FileText }
    ];
  } else if (user.role === 'citizen') {
    // 2. Citizen: Live Map & My Citizen Portal
    navItems = [
      { to: '/', label: 'Live Map', icon: MapPin },
      { to: '/citizen', label: 'My Citizen Portal', icon: FileText }
    ];
  } else if (user.role === 'operator') {
    // 3. Field Operator: Operator Desk & Live Map
    navItems = [
      { to: '/operator', label: 'Operator Desk', icon: Wrench },
      { to: '/', label: 'Live Map', icon: MapPin }
    ];
  } else if (user.role === 'admin') {
    // 4. Municipal Admin: Admin Command, Operator Desk & Live Map
    navItems = [
      { to: '/admin', label: 'Admin Command', icon: Building2 },
      { to: '/operator', label: 'Operator Desk', icon: Wrench },
      { to: '/', label: 'Live Map', icon: MapPin }
    ];
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Civic Emblem + Branding */}
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-base shadow-xs group-hover:bg-blue-800 transition-colors">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight text-base">
                NagarPulse <span className="text-blue-700">AI</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                Nellore Municipal Corp
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono hidden md:block">
              Civic Triage &amp; Geospatial Deduplication
            </p>
          </div>
        </Link>

        {/* Center: Desktop Role-Specific Navigation Tabs (hidden on small mobile) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Right: Desktop User Status & Login/Portal Switcher + Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Desktop User Section */}
          <div className="hidden sm:flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <div className="hidden lg:flex flex-col items-end text-right">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {user.department && user.department !== 'All' ? `${user.department} Dept` : user.email}
                  </span>
                </div>

                {/* Role Pill */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    getRoleBadge(user.role).bg
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {getRoleBadge(user.role).label}
                </span>

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Portal Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Mobile User Profile / Auth Area */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      getRoleBadge(user.role).bg
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {getRoleBadge(user.role).label}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-900 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {user.email}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to NagarPulse Portal</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
