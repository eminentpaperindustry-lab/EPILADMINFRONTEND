// Ultimate Responsive Dark Topbar.js (Mobile + Tablet + Desktop Responsive)

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaUserCircle, FaChevronDown, FaSignOutAlt, FaBars } from "react-icons/fa";

export default function Topbar() {
  const { user, logout } = useContext(AuthContext);

  const [profileOpen, setProfileOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [status, setStatus] = useState("Idle");

  const [workingTime, setWorkingTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [lunchTime, setLunchTime] = useState(0);
  const [idleTime, setIdleTime] = useState(0);

  const formatTime = (sec) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, "0");
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      switch (status) {
        case "Working":
          setWorkingTime((t) => t + 1);
          break;
        case "Break":
          setBreakTime((t) => t + 1);
          break;
        case "Lunch":
          setLunchTime((t) => t + 1);
          break;
        case "Idle":
          setIdleTime((t) => t + 1);
          break;
        default:
          break;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    setStatusOpen(false);
  };

  const getCurrentTime = () => {
    switch (status) {
      case "Working":
        return workingTime;
      case "Break":
        return breakTime;
      case "Lunch":
        return lunchTime;
      default:
        return idleTime;
    }
  };

  // Premium responsive theme
  const theme = {
    primary: "#0EA5E9",
    primarySoft: "#1E293B",
    border: "#334155",
    text: "#F1F5F9",
    subtext: "#94A3B8",
    bg: "#2d3548ff",
  };

  return (
    <header
      className="w-full border-b sticky top-0 z-50"
      style={{
        background: theme.bg,
        borderColor: theme.border,
      }}
    >
      {/* ===== TOPBAR MAIN ===== */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          {/* MOBILE MENU BUTTON */}
          <button
            className="lg:hidden text-xl text-white mr-2"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <FaBars />
          </button>

          <div className="flex flex-col leading-tight">
            <h1
              className="text-base font-semibold"
       style={{ 
  color: theme.text, 
  paddingTop: "10px", 
  paddingRight: "15px", 
  // paddingBottom: "10px", 
  paddingLeft: "15px",
  fontSize: "16px" 
}}
            >
              Admin Dashboard
            </h1>
            <span
              className="text-[11px] hidden sm:block"
              style={{ color: theme.subtext }}
            >
              Overview of system performance and employee activities
            </span>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-4 sm:gap-7">

          {/* === STATUS + TIMER === */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">

            {/* STATUS BUTTON */}
            {/* <button
              onClick={() => {
                setStatusOpen(!statusOpen);
                setProfileOpen(false);
              }}
              className="px-3 py-1 rounded-md border flex items-center gap-2 text-xs sm:text-sm transition"
              style={{
                background: theme.primarySoft,
                borderColor: theme.border,
                color: theme.text,
              }}
            >
              <span>{status}</span>
              <FaChevronDown className="w-3 h-3 opacity-70" />
            </button> */}

            {/* TIMER */}
            {/* <span
              className="font-mono text-[10px] sm:text-xs px-3 py-[6px] rounded border tracking-wide"
              style={{
                background: "#F8FAFC",
                borderColor: theme.border,
                color: "#0F172A",
              }}
            >
              {formatTime(getCurrentTime())}
            </span> */}
          </div>

          {/* PROFILE BUTTON */}
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setStatusOpen(false);
            }}
            className="flex items-center gap-2 text-xs sm:text-sm hover:opacity-80"
            style={{ color: theme.text }}
          >
            <FaUserCircle className="w-6 h-6" />
            <span className="font-medium hidden sm:block">{user?.name}</span>
            <FaChevronDown className="w-3 h-3 opacity-70" />
          </button>
        </div>
      </div>

      {/* =============== RESPONSIVE STATUS DROPDOWN =============== */}
      {statusOpen && (
        <div
          className="absolute right-4 sm:right-20 top-16 w-48 sm:w-64 rounded-xl shadow-lg border"
          style={{
            background: theme.primarySoft,
            borderColor: theme.border,
          }}
        >
          <div className="py-1">
            {["Working", "Break", "Lunch", "Idle", "Leave"].map((item) => (
              <button
                key={item}
                onClick={() => handleStatusChange(item)}
                className="w-full text-left px-4 py-2 text-sm rounded transition hover:bg-slate-600"
                style={{
                  background: status === item ? theme.primary : "transparent",
                  color: theme.text,
                }}
              >
                {item}
              </button>
            ))}
          </div>

          {/* LINE */}
          <div
            className="w-full"
            style={{ borderTop: `1px solid ${theme.border}` }}
          ></div>

          {/* SUMMARY */}
          <div
            className="px-4 py-3 text-xs sm:text-sm"
            style={{ color: theme.text }}
          >
            {[
              { label: "🟢 Working", value: workingTime },
              { label: "🟡 Break", value: breakTime },
              { label: "🟠 Lunch", value: lunchTime },
              { label: "⚪ Idle", value: idleTime },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between py-[3px] text-xs"
              >
                <span>{row.label}</span>
                <span>{formatTime(row.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =============== RESPONSIVE PROFILE DROPDOWN =============== */}
      {profileOpen && (
        <div
          className="absolute right-4 top-16 w-48 sm:w-56 rounded-xl shadow-lg border"
          style={{
            background: theme.primarySoft,
            borderColor: theme.border,
          }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: theme.border }}
          >
            <p className="text-sm font-semibold" style={{ color: theme.text }}>
              {user?.name}
            </p>
            <p className="text-xs mt-[2px]" style={{ color: theme.subtext }}>
              {user?.email}
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-600"
            style={{ color: "#F87171" }}
          >
            <FaSignOutAlt className="text-red-400" /> Logout
          </button>
        </div>
      )}

      {/* ====== MOBILE MENU (SIDEBAR) ====== */}
      {mobileMenu && (
        <div
          className="lg:hidden w-full border-t p-4 flex flex-col gap-3"
          style={{ background: theme.primarySoft, borderColor: theme.border }}
        >
          <button
            className="text-left text-white"
            onClick={() => setMobileMenu(false)}
          >
            Dashboard
          </button>
          <button className="text-left text-white">Tasks</button>
          <button className="text-left text-white">Support</button>
        </div>
      )}
    </header>
  );
}
