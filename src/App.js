import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Delegation from "./pages/Delegation";
import Checklist from "./pages/Checklist";
import HelpTicket from "./pages/HelpTickets";
import SupportTicket from "./pages/SupportTickets";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AuthContext } from "./context/AuthContext";

export default function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>

      {/* DEFAULT REDIRECT */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* PUBLIC ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* PROTECTED ROUTES */}
      <Route
        path="/*"
        element={ user ? <Layout /> : <Navigate to="/login" replace /> }
      >
        <Route index element={<Navigate to="delegation" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="delegation" element={<Delegation />} />
        <Route path="checklist" element={<Checklist />} />
        <Route path="help-ticket" element={<HelpTicket />} />
        <Route path="support-ticket" element={<SupportTicket />} />
        <Route path="*" element={<div>Page not found</div>} />
      </Route>

    </Routes>
  );
}
