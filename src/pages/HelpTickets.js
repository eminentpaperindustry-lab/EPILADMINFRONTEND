import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function HelpTickets() {
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef();

  const [tickets, setTickets] = useState([]);
  const [createdTickets, setCreatedTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    assignedTo: "",
    createdBy: "",
    status: "",
  });

  const [form, setForm] = useState({
    AssignedTo: "",
    Issue: "",
    IssuePhoto: null,
  });

  const [activeTab, setActiveTab] = useState("all");
  const [creating, setCreating] = useState(false);
  const [markingDone, setMarkingDone] = useState(null);
  const [modalImage, setModalImage] = useState(null);

  const authHeader = {
    headers: { Authorization: `Bearer ${user.token}` },
  };

  // ================= API CALLS =================
  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/helpTickets/all", {
        ...authHeader,
        params: filters,
      });
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch tickets");
    }
    setLoading(false);
  };

  const loadCreatedTickets = async () => {
    try {
      const res = await axios.get("/helpTickets/created", authHeader);
      setCreatedTickets(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load created tickets");
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await axios.get("/employee/all", authHeader);
      setEmployees(res.data.filter(e => e.name !== user.name));
    } catch (err) {
      console.error(err);
      alert("Failed to load employees");
    }
  };

  // ================= TAB SWITCH HANDLER =================
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);

    if (tab === "all") {
      loadTickets();
    } else if (tab === "create") {
      loadEmployees();
      loadCreatedTickets();
    }
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    handleTabSwitch("all"); // First tab active
  }, []);

  // ================= ACTIONS =================
  const handleFileChange = (e) => {
    setForm(prev => ({ ...prev, IssuePhoto: e.target.files[0] }));
  };

  const createTicket = async () => {
    if (!form.AssignedTo || !form.Issue.trim()) {
      alert("All fields are required");
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("AssignedTo", form.AssignedTo);
      formData.append("Issue", form.Issue.trim());
      if (form.IssuePhoto) formData.append("IssuePhoto", form.IssuePhoto);

      await axios.post("/helpTickets/create", formData, {
        headers: {
          ...authHeader.headers,
          "Content-Type": "multipart/form-data",
        },
      });

      await loadCreatedTickets();

      setForm({ AssignedTo: "", Issue: "", IssuePhoto: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Failed to create ticket");
    }
    setCreating(false);
  };

  const markDone = async (id) => {
    setMarkingDone(id);
          const cleanId = encodeURIComponent(id.trim());

    try {
      await axios.patch(`/helpTickets/status/${cleanId}`, { Status: "Done" }, authHeader);
      setCreatedTickets(prev => prev.filter(t => t.TicketID !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to mark as done");
    }
    setMarkingDone(null);
  };

  // ================= TICKET CARD COMPONENT =================
  const TicketCard = ({ ticket, showMarkDone }) => {
    const createdDate = dayjs(ticket.CreatedDate, "DD/MM/YYYY HH:mm:ss");
    return (
      <div key={ticket.TicketID} className="bg-white p-4 rounded shadow mb-4 flex justify-between">
        <div>
          <div className="font-semibold">#{ticket.TicketID} — {ticket.Issue}</div>
          <div className="text-sm text-gray-600">Created By: {ticket.CreatedBy}</div>
          <div className="text-sm text-gray-600">Assigned To: {ticket.AssignedTo}</div>
          <div className="text-sm text-gray-600">{createdDate.fromNow()}</div>
        </div>
        <div className="flex items-center gap-2">
          {ticket.IssuePhoto && (
            <button
              onClick={() => setModalImage(ticket.IssuePhoto)}
              className="bg-gray-700 text-white px-3 py-1 rounded"
            >
              View Image
            </button>
          )}
          {showMarkDone ? (
            <button
              disabled={markingDone === ticket.TicketID}
              onClick={() => markDone(ticket.TicketID)}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              {markingDone === ticket.TicketID ? "Marking..." : "Mark Done"}
            </button>
          ) : (
            <span className="bg-blue-600 text-white px-3 py-1 rounded">{ticket.Status}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
      <h2 className="text-3xl font-bold mb-6">Help Tickets</h2>

      {/* MAIN TABS */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => handleTabSwitch("all")}
          className={`px-4 py-2 rounded ${activeTab === "all" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          All Help Tickets
        </button>
        <button
          onClick={() => handleTabSwitch("create")}
          className={`px-4 py-2 rounded ${activeTab === "create" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Create Help Ticket
        </button>
      </div>

      {/* ================= ALL TICKETS ================= */}
      {activeTab === "all" && (
        <div className="flex-1 overflow-y-auto pr-2">
          {loading && <div className="text-center py-6 text-gray-500">Loading tickets...</div>}
          {!loading && tickets.length === 0 && <div className="text-center py-6 text-gray-500">No tickets available</div>}
          {!loading && tickets.map(t => <TicketCard key={t.TicketID} ticket={t} showMarkDone={false} />)}
        </div>
      )}

      {/* ================= CREATE TAB ================= */}
      {activeTab === "create" && (
        <>
          {/* Create Form */}
          <div className="bg-white p-6 rounded shadow mb-6">
            <select
              className="w-full border p-2 rounded mb-4"
              value={form.AssignedTo}
              onChange={e => setForm({ ...form, AssignedTo: e.target.value })}
            >
              <option value="">Select Employee</option>
              {employees.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
            </select>

            <textarea
              className="w-full border p-2 rounded mb-4"
              placeholder="Describe the issue"
              value={form.Issue}
              onChange={e => setForm({ ...form, Issue: e.target.value })}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-4"
            />

            {form.IssuePhoto && (
              <img
                src={URL.createObjectURL(form.IssuePhoto)}
                alt="preview"
                className="w-32 h-32 object-cover mb-4 border rounded"
              />
            )}

            <button
              disabled={creating || !form.AssignedTo || !form.Issue.trim()}
              onClick={createTicket}
              className={`px-6 py-3 rounded text-white ${creating || !form.AssignedTo || !form.Issue.trim() ? "bg-gray-400" : "bg-green-600"}`}
            >
              {creating ? "Creating Ticket..." : "Create Ticket"}
            </button>
          </div>

          {/* Created Tickets */}
          <div className="grid gap-4">
            {createdTickets.filter(t => !t.DoneDate).length === 0 && (
              <div className="text-center text-gray-500">No created tickets pending</div>
            )}

            {createdTickets
              .filter(t => !t.DoneDate)
              .map(t => <TicketCard key={t.TicketID} ticket={t} showMarkDone={true} />)}
          </div>
        </>
      )}

      {/* ================= IMAGE MODAL ================= */}
 {/* ================= IMAGE MODAL ================= */}
{modalImage && (
  <div
    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    onClick={() => setModalImage(null)}
  >
    <div className="relative">
      {/* Close Button */}
      <button
        className="absolute top-2 right-2 text-white text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80"
        onClick={() => setModalImage(null)}
      >
        ×
      </button>

      <img
        src={modalImage}
        alt="Issue"
        className="max-w-[90vw] max-h-[90vh] rounded shadow-lg"
        onClick={e => e.stopPropagation()} // Prevent modal close when clicking image
      />
    </div>
  </div>
)}

    </div>
  );
}
