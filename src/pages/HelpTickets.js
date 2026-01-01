import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function HelpTickets() {
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef();

  // ================= STATES (UNCHANGED) =================
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
    } catch {
      alert("Failed to fetch tickets");
    }
    setLoading(false);
  };

  const loadCreatedTickets = async () => {
    try {
      const res = await axios.get("/helpTickets/created", authHeader);
      setCreatedTickets(res.data || []);
      loadTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await axios.get("/employee/all", authHeader);
      setEmployees(res.data.filter(e => e.name !== user.name));
    } catch {
      alert("Failed to load employees");
    }
  };

  useEffect(() => {
    loadTickets();
    loadCreatedTickets();
    loadEmployees();
  }, [filters]);

  // ================= ACTIONS =================
  const handleFileChange = (e) => {
    setForm(prev => ({ ...prev, IssuePhoto: e.target.files[0] }));
  };

  const createTicket = async () => {
    if (!form.AssignedTo || !form.Issue) {
      return alert("All fields are required");
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("AssignedTo", form.AssignedTo);
      formData.append("Issue", form.Issue);
      if (form.IssuePhoto) formData.append("IssuePhoto", form.IssuePhoto);

      await axios.post("/helpTickets/create", formData, {
        headers: {
          ...authHeader.headers,
          "Content-Type": "multipart/form-data",
        },
      });

      setForm({ AssignedTo: "", Issue: "", IssuePhoto: null });
      loadCreatedTickets();
    } catch {
      alert("Failed to create ticket");
    }
    setCreating(false);
  };

  const markDone = async (id) => {
    setMarkingDone(id);
    try {
      await axios.patch(
        `/helpTickets/status/${id}`,
        { Status: "Done" },
        authHeader
      );
      setCreatedTickets(prev =>
        prev.filter(t => t.TicketID !== id)
      );
    } catch {
      alert("Failed to mark as done");
    }
    setMarkingDone(null);
  };

  // ================= UI =================
  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col">
      <h2 className="text-3xl font-bold mb-6">Help Tickets</h2>

      {/* MAIN TABS */}
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded ${
            activeTab === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          All Help Tickets
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 rounded ${
            activeTab === "create"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Create Help Ticket
        </button>
      </div>

      {/* ================= ALL TICKETS ================= */}
      {activeTab === "all" && (
        <>
          {/* STATUS TABS */}
          <div className="bg-white p-4 rounded shadow mb-4 flex gap-2">
            {[
              { label: "All", value: "" },
              { label: "Pending", value: "Pending" },
              { label: "In Progress", value: "InProgress" },
              { label: "Done", value: "Done" },
            ].map(tab => (
              <button
                key={tab.value}
                type="button"
                onClick={() =>
                  setFilters(prev => ({
                    ...prev,
                    status: tab.value,
                  }))
                }
                className={`px-4 py-2 rounded ${
                  filters.status === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SCROLLABLE DATA AREA */}
          <div className="flex-1 overflow-y-auto pr-2">
            {loading && (
              <div className="text-center py-6 text-gray-500">
                Loading tickets...
              </div>
            )}

            {!loading && tickets.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                No tickets available
              </div>
            )}

            {!loading &&
              tickets.map(t => {
                const createdDate = dayjs(
                  t.CreatedDate,
                  "DD/MM/YYYY HH:mm:ss"
                );

                return (
                  <div
                    key={t.TicketID}
                    className="bg-white p-4 rounded shadow mb-4 flex justify-between gap-4"
                  >
                    <div>
                      <div className="font-semibold text-lg">
                        {t.Issue}
                      </div>
                      <div className="text-sm text-gray-600">
                        Created By: {t.CreatedBy}
                      </div>
                      <div className="text-sm text-gray-600">
                        Assigned To: {t.AssignedTo}
                      </div>
                      <div className="text-sm text-gray-600">
                        {createdDate.fromNow()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {t.IssuePhoto && (
                        <button
                          onClick={() => setModalImage(t.IssuePhoto)}
                          className="bg-gray-700 text-white px-3 py-1 rounded"
                        >
                          View Image
                        </button>
                      )}
                      <span className="px-3 py-1 rounded bg-blue-600 text-white">
                        {t.Status}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      {/* ================= CREATE TAB (FULLY INTACT) ================= */}
      {activeTab === "create" && (
        <>
          {/* Create Ticket Form */}
          <h3 className="text-2xl font-semibold mb-4">
            Create Help Ticket
          </h3>

          <div className="bg-white p-6 rounded shadow mb-6">
            <select
              className="w-full border p-2 rounded mb-4"
              value={form.AssignedTo}
              onChange={e =>
                setForm({ ...form, AssignedTo: e.target.value })
              }
            >
              <option value="">Select Employee</option>
              {employees.map(e => (
                <option key={e.name} value={e.name}>
                  {e.name}
                </option>
              ))}
            </select>

            <textarea
              className="w-full border p-2 rounded mb-4"
              placeholder="Describe the issue"
              value={form.Issue}
              onChange={e =>
                setForm({ ...form, Issue: e.target.value })
              }
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
              disabled={creating}
              onClick={createTicket}
              className={`px-6 py-3 rounded text-white ${
                creating ? "bg-gray-400" : "bg-green-600"
              }`}
            >
              {creating ? "Creating Ticket..." : "Create Ticket"}
            </button>
          </div>

          {/* Created Tickets */}
          <h3 className="text-2xl font-semibold mb-4">
            Created Help Tickets
          </h3>

          <div className="grid gap-4">
            {createdTickets.length === 0 && (
              <div className="text-center text-gray-500">
                No created tickets pending
              </div>
            )}

            {createdTickets.map(t => {
              const createdDate = dayjs(
                t.CreatedDate,
                "DD/MM/YYYY HH:mm:ss"
              );

              return (
                <div
                  key={t.TicketID}
                  className="bg-white p-4 rounded shadow flex justify-between"
                >
                  <div>
                    <div className="font-semibold">{t.Issue}</div>
                    <div className="text-sm text-gray-600">
                      {createdDate.fromNow()}
                    </div>
                  </div>

                  <button
                    disabled={markingDone === t.TicketID}
                    onClick={() => markDone(t.TicketID)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    {markingDone === t.TicketID
                      ? "Marking..."
                      : "Mark Done"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* IMAGE MODAL */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <img
            src={modalImage}
            alt="Issue"
            className="max-w-[90vw] max-h-[90vh] rounded"
            onClick={() => setModalImage(null)}
          />
        </div>
      )}
    </div>
  );
}
