import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaTasks,
  FaClipboardList,
  FaLifeRing,
  FaHeadset,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const MenuItem = ({ to, children, icon: Icon, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-md transition-colors duration-200 font-medium ${
        isActive
          ? "bg-blue-600 text-white shadow-lg"
          : "text-gray-200 hover:bg-gray-800 hover:text-white"
      }`
    }
  >
    {Icon && <Icon className="w-5 h-5" />}
    <span>{children}</span>
  </NavLink>
);

export default function Sidebar({ mobile }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  // MOBILE SIDEBAR
  if (mobile) {
    return (
      <>
        {/* Hamburger Icon */}
        <button
          className="md:hidden fixed top-4 left-4 z-[100] bg-gray-900 text-white p-2 rounded-md shadow-lg"
          onClick={toggleSidebar}
        >
          {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>

        {/* Mobile Drawer */}
<aside
  className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-[90] transform transition-transform duration-300 ${
    isOpen ? "translate-x-0" : "-translate-x-full"
  }`}
>
  {/* HEADER */}
  <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">

    {/* LEFT SIDE → Only Close Button */}
    <button
      onClick={closeSidebar}
      className="text-gray-400 hover:text-white text-2xl"
    >
      ✕
    </button>

    {/* RIGHT SIDE → Title + Subtitle */}
    <div className="text-right">
      <div className="text-lg font-semibold leading-none">
        Admin Portal
      </div>
      <div className="text-[11px] text-gray-400 mt-1 leading-none">
        Task Management
      </div>
    </div>
  </div>

  {/* NAVIGATION MENU */}
  <nav className="p-6 space-y-2">
    <MenuItem to="/delegation" icon={FaTasks} onClick={closeSidebar}>
      Delegation
    </MenuItem>

    <MenuItem to="/checklist" icon={FaClipboardList} onClick={closeSidebar}>
      Checklist
    </MenuItem>
     <MenuItem to="/support-ticket" icon={FaHeadset} onClick={closeSidebar}>
      Support Ticket
    </MenuItem>
    <MenuItem to="/help-ticket" icon={FaLifeRing} onClick={closeSidebar}>
      Help Ticket
    </MenuItem>
  </nav>
</aside>
        {/* Background overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-[80]"
            onClick={closeSidebar}
          />
        )}
      </>
    );
  }

  // DESKTOP SIDEBAR
  return (
    <aside className="h-screen w-64 bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-800">
        <div className="text-2xl font-bold">Admin Portal</div>
        {/* <div className="text-xs text-gray-400">Task Management</div> */}
      </div>

      <nav className="p-6 space-y-2">
        <MenuItem to="/delegation" icon={FaTasks}>
          Delegation
        </MenuItem>
        <MenuItem to="/checklist" icon={FaClipboardList}>
          Checklist
        </MenuItem>
           <MenuItem to="/support-ticket" icon={FaHeadset}>
          Support Ticket
        </MenuItem>
        <MenuItem to="/help-ticket" icon={FaLifeRing}>
          Help Ticket
        </MenuItem>
     
      </nav>
    </aside>
  );
}
