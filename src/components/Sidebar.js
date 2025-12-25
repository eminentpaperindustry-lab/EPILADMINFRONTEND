import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaTasks, FaClipboardList, FaLifeRing, FaHeadset, FaBars, FaTimes } from "react-icons/fa";
import axios from "axios";

// MenuItem Component for displaying the count with the badge
const MenuItem = ({ to, children, icon: Icon, onClick, count }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `relative flex items-center gap-3 px-4 py-3 rounded-md transition-colors duration-200 font-medium ${
        isActive
          ? "bg-blue-600 text-white shadow-lg"
          : "text-gray-200 hover:bg-gray-800 hover:text-white"
      }`
    }
  >
    {Icon && <Icon className="w-5 h-5" />}
    <span className="flex-1">{children}</span>
    {count > 0 && (
      <span className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 rounded-full text-xs">
        {count}
      </span>
    )}
  </NavLink>
);

export default function Sidebar({ mobile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [helpTicketCount, setHelpTicketCount] = useState(0);
  const [supportTicketCount, setSupportTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  // Function to fetch tickets and update the counts
  const loadTickets = async () => {
    try {
      setLoading(true);  // Start loading state
      const token = localStorage.getItem("token");
      if (!token) return;

      const authHeader = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const [supportRes, helpRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BASE_URL}/api/support-tickets/all`, authHeader),
        axios.get(`${process.env.REACT_APP_BASE_URL}/api/helpTickets/all`, authHeader),
      ]);

      const activeSupport = (supportRes.data.tickets || []).filter((t) => t.Status !== "Done");
      const activeHelp = (helpRes.data.tickets || []).filter((t) => t.Status !== "Done");

      setSupportTicketCount(activeSupport.length);
      setHelpTicketCount(activeHelp.length);
    } catch (err) {
      console.error("Failed to load tickets:", err.response ? err.response.data : err);
    } finally {
      setLoading(false); // Stop loading state after API call
    }
  };

  // Call loadTickets on mount and every 15 minutes
  useEffect(() => {
    loadTickets(); // initial load

    const interval = setInterval(() => {
      loadTickets();
    }, 900000); // 15 minutes in ms

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // Mobile Sidebar
  if (mobile) {
    return (
      <>
        <button
          className="md:hidden fixed top-4 left-4 z-[100] bg-gray-900 text-white p-2 rounded-md shadow-lg"
          onClick={toggleSidebar}
        >
          {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>

        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-[90] transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
            <button onClick={closeSidebar} className="text-gray-400 hover:text-white text-2xl">
              ✕
            </button>
            <div className="text-right">
              <div className="text-lg font-semibold leading-none">Admin Portal</div>
              <div className="text-[11px] text-gray-400 mt-1 leading-none">Tracked Performance Overview</div>
            </div>
          </div>

          <nav className="p-6 space-y-2">
            <MenuItem to="/delegation" icon={FaTasks} onClick={closeSidebar}>Delegation</MenuItem>
            <MenuItem to="/checklist" icon={FaClipboardList} onClick={closeSidebar}>Checklist</MenuItem>
            <MenuItem to="/support-ticket" icon={FaHeadset} onClick={closeSidebar} count={supportTicketCount}>
              Support Ticket
            </MenuItem>
            <MenuItem to="/help-ticket" icon={FaLifeRing} onClick={closeSidebar} count={helpTicketCount}>
              Help Ticket
            </MenuItem>
          </nav>
        </aside>

        {isOpen && <div className="fixed inset-0 bg-black bg-opacity-40 z-[80]" onClick={closeSidebar} />}
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside className="h-screen w-64 bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="text-2xl font-bold">Admin Portal</div>
        <div className="text-xs text-gray-400">Tracked Performance Overview</div>
      </div>

      <nav className="p-6 space-y-2">
        <MenuItem to="/delegation" icon={FaTasks} count={0}>Delegation</MenuItem>
        <MenuItem to="/checklist" icon={FaClipboardList} count={0}>Checklist</MenuItem>
        <MenuItem to="/support-ticket" icon={FaHeadset} count={supportTicketCount}>
          Support Ticket
        </MenuItem>
        <MenuItem to="/help-ticket" icon={FaLifeRing} count={helpTicketCount}>
          Help Ticket
        </MenuItem>
      </nav>
    </aside>
  );
}
