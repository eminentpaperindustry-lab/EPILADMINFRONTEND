// Ultimate Responsive Dark Topbar.js (Mobile + Tablet + Desktop Responsive)

import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { FaUserCircle, FaChevronDown, FaSignOutAlt, FaBars } from "react-icons/fa";

export default function Topbar() {
  const { user, logout } = useContext(AuthContext);
  console.log("AuthContext:", user);
  

  const [profileOpen, setProfileOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [status, setStatus] = useState("Idle");

  const [workingTime, setWorkingTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [lunchTime, setLunchTime] = useState(0);
  const [idleTime, setIdleTime] = useState(0);

  // ===== COMPLETE INDIAN FESTIVAL DATA 2026 WITH EXACT DATES =====
 const festivals = [
    // January 2026
    { 
      name: "Guru Gobind Singh Jayanti", 
      month: 0, // January
      startDay: 5, // 2 days before 5 Jan
      endDay: 5,
      message: "⚔️ Guru Gobind Singh Jayanti - Warrior Saint! ⚔️",
      bgColor: "#f97316", // Orange
      textColor: "#ffffff",
      icon: "⚔️"
    },
    { 
      name: "Lohri", 
      month: 0,
      startDay: 13, // 2 days before 13 Jan
      endDay: 13,
      message: "🔥 Happy Lohri! Harvest Festival Celebration! 🔥",
      bgColor: "#f97316", // Orange
      textColor: "#ffffff",
      icon: "🔥"
    },
    { 
      name: "Makar Sankranti", 
      month: 0,
      startDay: 15, // 2 days before 14 Jan
      endDay: 14,
      message: "🪁 Happy Makar Sankranti! Kite Flying Festival! 🪁",
      bgColor: "#fbbf24", // Golden
      textColor: "#1e293b",
      icon: "🪁"
    },
    { 
      name: "Vasant Panchmi", 
      month: 0,
      startDay: 23, // 2 days before 23 Jan
      endDay: 23,
      message: "📚 Happy Vasant Panchmi! Goddess Saraswati Puja! 📚",
      bgColor: "#fde68a", // Light Yellow
      textColor: "#1e293b",
      icon: "📚"
    },
    { 
      name: "Republic Day", 
      month: 0,
      startDay: 26, // 2 days before 26 Jan
      endDay: 26,
      message: "🇮🇳 Happy Republic Day 2026! Jai Hind! 🇮🇳",
      bgColor: "#f97316", // Orange
      textColor: "#ffffff",
      icon: "https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg"
    },

    // February 2026
    { 
      name: "Mahashivratri", 
      month: 1, // February
      startDay: 15, // 2 days before 15 Feb
      endDay: 15,
      message: "🕉️ Happy Mahashivratri! Har Har Mahadev! 🕉️",
      bgColor: "#a855f7", // Purple
      textColor: "#ffffff",
      icon: "🕉️"
    },

    // March 2026
    { 
      name: "Holi", 
      month: 2, // March
      startDay: 4, // 2 days before 4 March
      endDay: 4,
      message: "🌈 Happy Holi! Festival of Colors! 🌈",
      bgColor: "#f43f5e", // Pink/Rose
      textColor: "#ffffff",
      icon: "🌈"
    },
    { 
      name: "Gudi Padwa", 
      month: 2,
      startDay: 19, // 2 days before 19 March
      endDay: 19,
      message: "🏵️ Happy Gudi Padwa! Marathi New Year! 🏵️",
      bgColor: "#f59e0b", // Amber
      textColor: "#ffffff",
      icon: "🏵️"
    },
    { 
      name: "Eid", 
      month: 2,
      startDay: 20, // 2 days before 20 March
      endDay: 20,
      message: "🌙 Eid Mubarak! Peace & Prosperity! 🌙",
      bgColor: "#059669", // Green
      textColor: "#ffffff",
      icon: "🌙"
    },
    { 
      name: "World Packaging Day", 
      month: 2,
      startDay: 24, // 2 days before 24 March
      endDay: 24,
      message: "📦 World Packaging Day - Sustainable Packaging! 📦",
      bgColor: "#10b981", // Green
      textColor: "#ffffff",
      icon: "📦"
    },
    { 
      name: "Ram Navmi", 
      month: 2,
      startDay: 26, // 2 days before 26 March
      endDay: 26,
      message: "🕊️ Happy Ram Navmi! Jai Shri Ram! 🕊️",
      bgColor: "#d97706", // Orange
      textColor: "#ffffff",
      icon: "🕊️"
    },
    { 
      name: "Mahavir Jayanti", 
      month: 2,
      startDay: 31, // 2 days before 31 March
      endDay: 31,
      message: "🕉️ Mahavir Jayanti - Jain Festival! 🕉️",
      bgColor: "#fbbf24", // Golden
      textColor: "#1e293b",
      icon: "🕉️"
    },

    // April 2026
    { 
      name: "Hanuman Jayanti", 
      month: 3, // April
      startDay: 2, // 2 days before 2 April (March 31)
      endDay: 2,
      message: "🙏 Happy Hanuman Jayanti! Jai Bajrang Bali! 🙏",
      bgColor: "#ea580c", // Orange
      textColor: "#ffffff",
      icon: "🙏"
    },
    { 
      name: "Baisakhi", 
      month: 3,
      startDay: 14, // 2 days before 14 April
      endDay: 14,
      message: "🌾 Happy Baisakhi! Punjabi New Year! 🌾",
      bgColor: "#fbbf24", // Golden
      textColor: "#1e293b",
      icon: "🌾"
    },
    { 
      name: "Ambedkar Jayanti", 
      month: 3,
      startDay: 14, // 2 days before 14 April
      endDay: 14,
      message: "📚 Dr. B.R. Ambedkar Jayanti - Equality & Justice! 📚",
      bgColor: "#3b82f6", // Blue
      textColor: "#ffffff",
      icon: "📚"
    },
    { 
      name: "Akshay Tritya", 
      month: 3,
      startDay: 19, // 2 days before 19 April
      endDay: 19,
      message: "💰 Happy Akshay Tritya - Auspicious Day! 💰",
      bgColor: "#f59e0b", // Amber
      textColor: "#ffffff",
      icon: "💰"
    },

    // May 2026
    { 
      name: "Buddha Purnima", 
      month: 4, // May
      startDay: 1, // 2 days before 1 May (April 29)
      endDay: 1,
      message: "🪷 Buddha Purnima - Peace & Enlightenment! 🪷",
      bgColor: "#fbbf24", // Golden
      textColor: "#1e293b",
      icon: "🪷"
    },

    // June 2026
    { 
      name: "World Environment Day", 
      month: 5, // June
      startDay: 5, // 2 days before 5 June
      endDay: 5,
      message: "🌍 World Environment Day - Save Our Planet! 🌍",
      bgColor: "#16a34a", // Green
      textColor: "#ffffff",
      icon: "🌍"
    },

    // July 2026
    { 
      name: "Guru Purnima", 
      month: 6, // July
      startDay: 29, // 2 days before 29 July
      endDay: 29,
      message: "🙏 Guru Purnima - Honor Your Teachers! 🙏",
      bgColor: "#a855f7", // Purple
      textColor: "#ffffff",
      icon: "🙏"
    },

    // August 2026
    { 
      name: "Independence Day", 
      month: 7, // August
      startDay: 15, // 2 days before 15 Aug
      endDay: 15,
      message: "🇮🇳 Happy Independence Day! Celebrate Freedom! 🇮🇳",
      bgColor: "#16a34a", // Green
      textColor: "#ffffff",
      icon: "https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg"
    },
    { 
      name: "Raksha Bandhan", 
      month: 7,
      startDay: 28, // 2 days before 28 Aug
      endDay: 28,
      message: "🎀 Happy Raksha Bandhan! Bond of Love! 🎀",
      bgColor: "#db2777", // Pink
      textColor: "#ffffff",
      icon: "🎀"
    },

    // September 2026
    { 
      name: "Janmashtami", 
      month: 8, // September
      startDay: 4, // 2 days before 4 Sept
      endDay: 4,
      message: "🎶 Happy Janmashtami! Jai Shri Krishna! 🎶",
      bgColor: "#3b82f6", // Blue
      textColor: "#ffffff",
      icon: "🎶"
    },
    { 
      name: "Teacher's Day", 
      month: 8,
      startDay: 5, // 2 days before 5 Sept
      endDay: 5,
      message: "📚 Happy Teacher's Day! Thank You Teachers! 📚",
      bgColor: "#f43f5e", // Pink
      textColor: "#ffffff",
      icon: "📚"
    },
    { 
      name: "Ganesh Chaturthi", 
      month: 8,
      startDay: 14, // 2 days before 14 Sept
      endDay: 14,
      message: "🐘 Ganpati Bappa Morya! Happy Ganesh Chaturthi! 🐘",
      bgColor: "#f97316", // Orange
      textColor: "#ffffff",
      icon: "🐘"
    },

    // October 2026
    { 
      name: "Gandhi Jayanti", 
      month: 9, // October
      startDay: 2, // 2 days before 2 Oct (Sept 30)
      endDay: 2,
      message: "🕊️ Gandhi Jayanti - Peace & Non-violence! 🕊️",
      bgColor: "#64748b", // Slate
      textColor: "#ffffff",
      icon: "🕊️"
    },
    { 
      name: "Navratri", 
      month: 9,
      startDay: 11, // 2 days before 11 Oct
      endDay: 11,
      message: "💃 Happy Navratri! Nine Nights of Dance! 💃",
      bgColor: "#f97316", // Orange
      textColor: "#ffffff",
      icon: "💃"
    },
    { 
      name: "Durga Ashtami", 
      month: 9,
      startDay: 19, // 2 days before 19 Oct
      endDay: 19,
      message: "🌺 Durga Ashtami - Maa Durga Puja! 🌺",
      bgColor: "#ea580c", // Orange
      textColor: "#ffffff",
      icon: "🌺"
    },
    { 
      name: "Maha Navami", 
      month: 9,
      startDay: 20, // 2 days before 20 Oct
      endDay: 20,
      message: "🪔 Maha Navami - Victory of Good! 🪔",
      bgColor: "#f97316", // Orange
      textColor: "#ffffff",
      icon: "🪔"
    },
    { 
      name: "Dussehra", 
      month: 9,
      startDay: 18, // 2 days before 20 Oct
      endDay: 20,
      message: "🏹 Happy Dussehra! Victory of Good over Evil! 🏹",
      bgColor: "#fbbf24", // Golden
      textColor: "#1e293b",
      icon: "🏹"
    },

    // November 2026
    { 
      name: "Dhanteras", 
      month: 10, // November
      startDay: 6, // 2 days before 6 Nov
      endDay: 6,
      message: "💰 Happy Dhanteras! Wealth & Prosperity! 💰",
      bgColor: "#f59e0b", // Amber
      textColor: "#ffffff",
      icon: "💰"
    },
    { 
      name: "Lakshmi Puja", 
      month: 10,
      startDay: 8, // 2 days before 8 Nov
      endDay: 8,
      message: "🪔 Lakshmi Puja - Welcome Goddess Lakshmi! 🪔",
      bgColor: "#fbbf24", // Golden
      textColor: "#1e293b",
      icon: "🪔"
    },
    { 
      name: "Diwali", 
      month: 10,
      startDay: 8, // 2 days before 8 Nov
      endDay: 8,
      message: "🪔 Happy Diwali! Festival of Lights! 🪔",
      bgColor: "#fbbf24", // Golden
      textColor: "#1e293b",
      icon: "🪔"
    },
    { 
      name: "Govardhan Puja", 
      month: 10,
      startDay: 9, // 2 days before 9 Nov
      endDay: 9,
      message: "⛰️ Govardhan Puja - Annakut Festival! ⛰️",
      bgColor: "#22c55e", // Green
      textColor: "#ffffff",
      icon: "⛰️"
    },
    { 
      name: "Bhaiya Dooj", 
      month: 10,
      startDay: 11, // 2 days before 11 Nov
      endDay: 11,
      message: "🤝 Happy Bhaiya Dooj! Sibling Bond! 🤝",
      bgColor: "#ec4899", // Pink
      textColor: "#ffffff",
      icon: "🤝"
    },
    { 
      name: "Labh Pancham", 
      month: 10,
      startDay: 14, // 2 days before 14 Nov
      endDay: 14,
      message: "💰 Labh Pancham - Auspicious Beginnings! 💰",
      bgColor: "#f59e0b", // Amber
      textColor: "#ffffff",
      icon: "💰"
    },
    { 
      name: "Guru Nanak Jayanti", 
      month: 10,
      startDay: 14, // 2 days before 14 Nov
      endDay: 14,
      message: "🙏 Guru Nanak Jayanti - Waheguru! 🙏",
      bgColor: "#fbbf24", // Golden
      textColor: "#1e293b",
      icon: "🙏"
    },
    { 
      name: "Children's Day", 
      month: 10,
      startDay: 14, // 2 days before 14 Nov
      endDay: 14,
      message: "🧒 Happy Children's Day! Future of India! 🧒",
      bgColor: "#3b82f6", // Blue
      textColor: "#ffffff",
      icon: "🧒"
    },
    { 
      name: "Chhath Puja", 
      month: 10,
      startDay: 21, // 2 days before 21 Nov
      endDay: 21,
      message: "🌅 Happy Chhath Puja! Sun God Worship! 🌅",
      bgColor: "#f97316", // Orange
      textColor: "#ffffff",
      icon: "🌅"
    },

    // December 2026
    { 
      name: "Merry Christmas", 
      month: 11, // December
      startDay: 25, // 2 days before 25 Dec
      endDay: 25,
      message: "🎄 Merry Christmas! Joy to the World! 🎄",
      bgColor: "#dc2626", // Red
      textColor: "#ffffff",
      icon: "🎅"
    },

    // January 2027
    { 
      name: "New Year", 
      month: 0, // January 2027
      startDay: 1, // 2 days before (Dec 30, 2026)
      endDay: 1,
      message: "🎉 Happy New Year 2027! Welcome 2027! 🎉",
      bgColor: "#2563eb", // Blue
      textColor: "#ffffff",
      icon: "🎊"
    }
  ];

  // Get current festival if any
  const getCurrentFestival = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();
    const currentYear = today.getFullYear();

    for (let festival of festivals) {
      // Handle New Year (cross-year)
      if (festival.name === "New Year" && currentYear === 2027) {
        if ((currentMonth === 11 && currentDate >= festival.startDay) || 
            (currentMonth === 0 && currentDate <= festival.endDay)) {
          return festival;
        }
      } 
      // Handle month-end festivals (like Hanuman Jayanti starting March 31)
      else if (festival.startDay > 28 && festival.month === currentMonth) {
        if (currentDate >= festival.startDay && currentDate <= 31) {
          return festival;
        }
      }
      // Handle festivals that end in next month
      else if (festival.endDay < festival.startDay && festival.month === currentMonth) {
        if (currentDate >= festival.startDay && currentDate <= 31) {
          return festival;
        }
      }
      else if (festival.endDay < festival.startDay && festival.month + 1 === currentMonth) {
        if (currentDate >= 1 && currentDate <= festival.endDay) {
          return festival;
        }
      }
      // Normal festivals (within same month)
      else if (currentMonth === festival.month && 
          currentDate >= festival.startDay && 
          currentDate <= festival.endDay) {
        return festival;
      }
    }
    return null;
  };

  const currentFestival = getCurrentFestival();

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
            {/* Commented out status button and timer as in original */}
          </div>

          {/* === ACTIVE STATUS === */}
          <div className="flex items-center gap-3 justify-end">
            {/* Green Circle */}
            <span className="w-3.5 h-3.5 rounded-full bg-green-500 animate-pulse" />

            {/* Active Text */}
            <span className="text-green-600 text-sm sm:text-base font-bold tracking-wide">
              Active
            </span>
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
              {user?.department}
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

      {/* ===== DYNAMIC FESTIVAL / ALERT BANNER ===== */}
      <div
        className="w-full overflow-hidden border-t"
        style={{
          background: currentFestival ? currentFestival.bgColor : "#f1f5f9",
          borderColor: theme.border,
        }}
      >
        <div
          className="flex w-max whitespace-nowrap py-1 text-sm font-bold items-center"
          style={{
            color: currentFestival ? currentFestival.textColor : "#0f172a",
            animation: "scroll-left 10s linear infinite",
            gap: "25px",
          }}
        >
          {(() => {
            if (currentFestival) {
              // Festival message with icon
              const messages = [
                currentFestival.message,
                `✨ ${currentFestival.name} ✨`,
                currentFestival.message,
              ];
              // Duplicate content for seamless scroll
              return [...messages, ...messages].map((msg, i) => (
                <React.Fragment key={i}>
                  <span className="flex items-center gap-2">
                    {typeof currentFestival.icon === 'string' && currentFestival.icon.startsWith('http') ? (
                      <img
                        src={currentFestival.icon}
                        alt={currentFestival.name}
                        style={{ width: "20px", height: "12px", display: "inline-block" }}
                      />
                    ) : (
                      <span style={{ fontSize: "1.2rem" }}>{currentFestival.icon}</span>
                    )}
                    <span>{msg}</span>
                    {typeof currentFestival.icon === 'string' && currentFestival.icon.startsWith('http') ? (
                      <img
                        src={currentFestival.icon}
                        alt={currentFestival.name}
                        style={{ width: "20px", height: "12px", display: "inline-block" }}
                      />
                    ) : (
                      <span style={{ fontSize: "1.2rem" }}>{currentFestival.icon}</span>
                    )}
                  </span>
                </React.Fragment>
              ));
            } else {
              // Default system alert - yeh tab dikhega jab koi festival nahi hai
              const alertMessages = [
                "🔄 Refresh the portal before adding a task",
                "⚠️ If issues continue, log out/in or raise a support ticket",
                "📢 System Update: Regular maintenance",
                "🔄 Refresh the portal before adding a task",
              ];
              // Duplicate content for seamless scroll
              return [...alertMessages, ...alertMessages].map((msg, i) => (
                <span key={i} className="px-4">{msg}</span>
              ));
            }
          })()}
        </div>

        <style>
          {`
            @keyframes scroll-left {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}
        </style>
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
          }
        `}
      </style>

    </header>
  );
}