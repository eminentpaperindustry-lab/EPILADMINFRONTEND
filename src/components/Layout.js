import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  return (
    <div className="h-screen w-full flex overflow-hidden bg-gray-100">

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sidebar mobile />

      {/* Right Section */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Fixed Topbar */}
        <div className="fixed top-0 left-0 md:left-64 right-0 z-50">
          <Topbar />
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 mt-16 p-4 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
