// <type="write" filePath="src/components/Layout.jsx">
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Users, Gamepad2, Sparkles, Settings, LogOut, Menu, X, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Social', path: '/social' },
    { icon: Gamepad2, label: 'Gaming', path: '/gaming' },
    { icon: Sparkles, label: 'NOVA', path: '/nova' },
    { icon: Settings, label: 'Ajustes', path: '/settings' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isCurrentPath = (path) => {
    if (path === '/') return location.pathname === path;
    return location.pathname.startsWith(path);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <nav className="glass-effect border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img
                src="https://horizons-cdn.hostinger.com/8e1e982a-c308-4c75-8199-bde51fad9b5d/2b8d5ab21bab4158e49df68be53f44fc.jpg"
                alt="Fusion Core Logo"
                className="h-8 w-auto"
              />
            </div>

            <div className="hidden md:flex items-center gap-2">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  variant={isCurrentPath(item.path) ? 'default' : 'ghost'}
                  className={isCurrentPath(item.path) ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
              <Button onClick={signOut} variant="ghost" className="text-red-400 hover:text-red-300">
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden text-white">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-slate-700 bg-slate-900/95 backdrop-blur-lg"
          >
            <div className="px-4 py-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isCurrentPath(item.path) ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'text-gray-300 hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
              <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-800 transition-colors">
                <LogOut className="w-5 h-5" />
                <span>Salir</span>
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;