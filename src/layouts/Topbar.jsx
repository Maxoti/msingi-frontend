// components/Topbar.jsx
import { useState, useEffect } from "react";
import { useSelector } from 'react-redux';

const Topbar = ({ onMenuToggle }) => {
  const { user } = useSelector((state) => state.auth);
  const [darkMode, setDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
      padding: "0 24px",
      height: "64px",
      background: darkMode ? "#1e1e2e" : "#ffffff",
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      position: "sticky",
      top: 0,
      zIndex: 100,
      transition: "background 0.3s",
    }}>

      {/* LEFT - Hamburger + School Name */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          onClick={onMenuToggle}
          style={{
            display: "flex", flexDirection: "column", gap: "5px",
            background: "none", border: "none", cursor: "pointer", padding: "4px",
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "linear-gradient(135deg, #6c63ff, #48cae4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px",
          }}></div>
          <div>
            <div style={{
              fontWeight: "700", fontSize: "15px",
              color: darkMode ? "#fff" : "#1a1a2e",
            }}>{user?.schoolName || 'School'}</div>
            <div style={{ fontSize: "11px", color: "#6c63ff" }}>School Management system</div>
          </div>
        </div>
      </div>

      {/* CENTER - Live Date & Time */}
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontWeight: "600", fontSize: "15px",
          color: darkMode ? "#fff" : "#1a1a2e",
        }}>{formatTime(currentTime)}</div>
        <div style={{ fontSize: "11px", color: darkMode ? "#aaa" : "#888" }}>
          {formatDate(currentTime)}
        </div>
      </div>

      {/* RIGHT - Dark Mode Toggle + User */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

        {/* Dark Mode Toggle */}
        <div
          onClick={toggleDark}
          style={{
            width: "52px", height: "28px",
            background: darkMode ? "#6c63ff" : "#e0e0e0",
            borderRadius: "999px", position: "relative",
            cursor: "pointer", transition: "background 0.3s",
          }}
        >
          <div style={{
            position: "absolute",
            top: "4px",
            left: darkMode ? "28px" : "4px",
            width: "20px", height: "20px",
            background: "#fff",
            borderRadius: "50%",
            transition: "left 0.3s",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px",
          }}>
            {darkMode }
          </div>
        </div>

        {/* User Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "50%",
            background: "linear-gradient(135deg, #6c63ff, #48cae4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: "700", fontSize: "16px",
          }}>{user?.username?.charAt(0).toUpperCase() || 'A'}</div>
          <div>
            <div style={{
              fontWeight: "600", fontSize: "14px",
              color: darkMode ? "#fff" : "#1a1a2e",
            }}>{user?.username || 'Admin'}</div>
            <div style={{ fontSize: "11px", color: "#6c63ff" }}>{user?.role || 'Principal'}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;