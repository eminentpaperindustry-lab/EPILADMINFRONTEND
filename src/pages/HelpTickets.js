import React, { useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function HelpTickets() {
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [createdTickets, setCreatedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assigned");
  const [form, setForm] = useState({ AssignedTo: "", Issue: "" });
  const [updatingStatus, setUpdatingStatus] = useState({});

  // Load Employees
  const loadEmployees = async () => {
    try {
      const res = await axios.get("/employee/all", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  // Load Tickets
  const loadTickets = async () => {
    try {
      const [assignedRes, createdRes] = await Promise.all([
        axios.get("/helpTickets/assigned", {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get("/helpTickets/created", {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      ]);

      // Assigned tab: only tickets assigned to me & not done
      setAssignedTickets(
        (assignedRes.data || []).filter(
          (t) => t.AssignedTo === user.name && t.Status !== "Done"
        )
      );

      // Created tab: only tickets created by me & not done
      setCreatedTickets(
        (createdRes.data || []).filter(
          (t) => t.CreatedBy === user.name && t.Status !== "Done"
        )
      );
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadEmployees();
      loadTickets();
    }
  }, [user]);

  // Create Ticket
  const createTicket = async () => {
    if (!form.AssignedTo || !form.Issue) {
      alert("Please select employee and describe the issue");
      return;
    }
    try {
      await axios.post("/helpTickets/create", form, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setForm({ AssignedTo: "", Issue: "" });
      await loadTickets();
    } catch (err) {
      console.error("Failed to create ticket", err.response?.data || err);
    }
  };

  // Update Ticket Status
  const updateStatus = async (TicketID, Status) => {
    setUpdatingStatus((prev) => ({ ...prev, [TicketID]: true }));
    try {
      await axios.patch(`/helpTickets/status/${TicketID}`, { Status }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      await loadTickets();
    } catch (err) {
      console.error("Failed to update ticket status", err.response?.data || err);
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [TicketID]: false }));
    }
  };

  if (loading) return <div>Loading...</div>;

  // Decide which tickets to show
  const ticketsToShow =
    activeTab === "assigned" ? assignedTickets : createdTickets;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Help Tickets</h2>

      {/* CREATE TICKET FORM */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="text-lg font-semibold mb-2">Create New Ticket</h3>
        <select
          className="w-full border p-2 rounded mb-2"
          value={form.AssignedTo}
          onChange={(e) => setForm({ ...form, AssignedTo: e.target.value })}
        >
          <option value="">-- Select Employee --</option>
          {employees.map((emp) => (
            <option key={emp.name} value={emp.name}>{emp.name}</option>
          ))}
        </select>
        <textarea
          className="w-full border p-2 rounded mb-2"
          placeholder="Describe the issue"
          value={form.Issue}
          onChange={(e) => setForm({ ...form, Issue: e.target.value })}
        />
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={createTicket}>
          Create Ticket
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-2 rounded ${activeTab === "assigned" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("assigned")}
        >
          Tickets Assigned to Me
        </button>
        <button
          className={`px-3 py-2 rounded ${activeTab === "created" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("created")}
        >
          Tickets Created by Me
        </button>
      </div>

      {/* TICKET LIST */}
      <div className="grid gap-4">
        {ticketsToShow.length === 0 && <div className="text-gray-500">No tickets available.</div>}
        {ticketsToShow.map((ticket) => {
          let statusOptions = [];

          // Assigned tab: only Open → InProgress
          if (
            activeTab === "assigned" &&
            ticket.AssignedTo === user.name &&
            ticket.Status !== "Done"
          ) {
            statusOptions = ["Open", "InProgress"];
          }

          // Created tab: only InProgress → Done
          if (
            activeTab === "created" &&
            ticket.CreatedBy === user.name &&
            ticket.Status === "InProgress"
          ) {
            statusOptions = ["InProgress", "Done"];
          }

          return (
            <div key={ticket.TicketID} className="p-4 bg-white rounded shadow flex justify-between items-center">
              <div>
                <div className="font-semibold">{ticket.Issue}</div>
                <div className="text-sm text-gray-600">Created By: {ticket.CreatedBy}</div>
                <div className="text-sm text-gray-600">Assigned To: {ticket.AssignedTo}</div>
                <div className="text-sm text-gray-600">Status: {ticket.Status}</div>
                <div className="text-sm text-gray-600">Created: {ticket.CreatedDate}</div>
              </div>
              {statusOptions.length > 0 && (
                <select
                  className="border p-1 rounded"
                  disabled={updatingStatus[ticket.TicketID] || ticket.Status === "Done"}
                  value={ticket.Status}
                  onChange={(e) => updateStatus(ticket.TicketID, e.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
