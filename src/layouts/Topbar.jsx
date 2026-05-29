// components/Topbar.jsx
import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';

const Topbar = ({ onMenuToggle }) => {
  const { user } = useSelector((state) => state.auth);
  const [darkMode, setDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (date) =>
    date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 12px",
      height: "64px",
      background: darkMode ? "#1e1e2e" : "#ffffff",
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      transition: "background 0.3s",
      flexShrink: 0,
    }}>

      {/* LEFT - Hamburger + School Name */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <button
          onClick={onMenuToggle}
          style={{
            display: "flex", flexDirection: "column", gap: "5px",
            background: "none", border: "none", cursor: "pointer", padding: "4px",
            flexShrink: 0,
          }}
        >
          {[0,1,2].map(i => (
            <span key={i} style={{
              display: "block", width: "22px", height: "2px",
              background: darkMode ? "#ccc" : "#333", borderRadius: "2px",
            }} />
          ))}
        </button>

        {/* School Icon + Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "10px",
            background: "linear-gradient(135deg, #6c63ff, #48cae4)",
            flexShrink: 0,
          }} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontWeight: "700", fontSize: isMobile ? "13px" : "15px",
              color: darkMode ? "#fff" : "#1a1a2e",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{user?.schoolName || 'School'}</div>
            {!isMobile && (
              <div style={{ fontSize: "11px", color: "#6c63ff" }}>School Management system</div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER - Live Date & Time (hidden on mobile) */}
      {!isMobile && (
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{
            fontWeight: "600", fontSize: "15px",
            color: darkMode ? "#fff" : "#1a1a2e",
          }}>{formatTime(currentTime)}</div>
          <div style={{ fontSize: "11px", color: darkMode ? "#aaa" : "#888" }}>
            {formatDate(currentTime)}
          </div>
        </div>
      )}

      {/* RIGHT - Dark Mode Toggle + User */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "16px", flexShrink: 0 }}>

        {/* Dark Mode Toggle */}
        <div
          onClick={toggleDark}
          style={{
            width: "44px", height: "24px",
            background: darkMode ? "#6c63ff" : "#e0e0e0",
            borderRadius: "999px", position: "relative",
            cursor: "pointer", transition: "background 0.3s",
            flexShrink: 0,
          }}
        >
          <div style={{
            position: "absolute",
            top: "3px",
            left: darkMode ? "23px" : "3px",
            width: "18px", height: "18px",
            background: "#fff",
            borderRadius: "50%",
            transition: "left 0.3s",
          }} />
        </div>

        {/* User Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%",
            background: "linear-gradient(135deg, #6c63ff, #48cae4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: "700", fontSize: "15px",
            flexShrink: 0,
          }}>{user?.username?.charAt(0).toUpperCase() || 'A'}</div>
          {!isMobile && (
            <div>
              <div style={{
                fontWeight: "600", fontSize: "14px",
                color: darkMode ? "#fff" : "#1a1a2e",
              }}>{user?.username || 'Admin'}</div>
              <div style={{ fontSize: "11px", color: "#6c63ff" }}>{user?.role || 'Principal'}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;