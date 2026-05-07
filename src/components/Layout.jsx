import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { supabase } from "@/supabaseClient";
import { Home, Sparkles, Users, Gamepad2, User, LogOut, Menu, X, Bell, MessageCircle } from "lucide-react";
import { api } from "@/api";

const NAV_ITEMS = [
  { name: "Dashboard", icon: Home, path: "/dashboard" },
  { name: "Nova", icon: Sparkles, path: "/nova" },
  { name: "Social", icon: Users, path: "/social" },
  { name: "Gaming", icon: Gamepad2, path: "/gaming" },
  { name: "Mensajes", icon: MessageCircle, path: "/dm" },
  { name: "Perfil", icon: User, path: "/profile" },
];

const Layout = ({ children }) => {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [dmBadge, setDmBadge] = useState(0);

  const initial = user?.email?.[0]?.toUpperCase() || "U";

  useEffect(() => {
    const accent = localStorage.getItem("fc-accent");
    const accent2 = localStorage.getItem("fc-accent2");
    const theme = localStorage.getItem("fc-theme");
    if (accent) document.documentElement.style.setProperty("--accent", accent);
    if (accent2) document.documentElement.style.setProperty("--accent2", accent2);
    if (theme) document.documentElement.setAttribute("data-theme", theme);
  }, []);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("avatar_url").eq("id", user.id).single()
        .then(({ data }) => { if (data?.avatar_url) setAvatar(data.avatar_url); });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchDmBadge = async () => {
      try {
        const data = await api.dm.getRequests();
        setDmBadge(data.requests?.length || 0);
      } catch {}
    };
    fetchDmBadge();
    const interval = setInterval(fetchDmBadge, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#080c14] bg-grid">
      <nav className="sticky top-0 z-50 border-b border-white/5" style={{ background: "rgba(8,12,20,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div onClick={() => navigate("/dashboard")} className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Fusion Core</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <item.icon className="w-4 h-4" />
                {item.name}
                {item.path === "/dm" && dmBadge > 0 && (
                  <span className="ml-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {dmBadge > 9 ? "9+" : dmBadge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Bell con badge de notificaciones reales */}
            <button
              onClick={() => navigate("/notifications")}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <div onClick={() => navigate("/profile")}
              className="w-8 h-8 rounded-full overflow-hidden cursor-pointer hover:scale-105 transition-transform ring-2 ring-indigo-500/30">
              {avatar
                ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">{initial}</div>
              }
            </div>
            <button onClick={handleSignOut}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-gray-400 hover:text-white">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1" style={{ background: "rgba(8,12,20,0.98)" }}>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `nav-link w-full ${isActive ? "active" : ""}`}>
                <item.icon className="w-4 h-4" />
                {item.name}
                {item.path === "/dm" && dmBadge > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {dmBadge > 9 ? "9+" : dmBadge}
                  </span>
                )}
              </NavLink>
            ))}
            <NavLink
              to="/notifications"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-link w-full ${isActive ? "active" : ""}`}>
              <Bell className="w-4 h-4" />
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
