import React, { useEffect, useState, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import customParseFormat from "dayjs/plugin/customParseFormat";  // Add this import

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);  // Add this extension

export default function SupportTicket() {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ assignedTo: "", createdBy: "", status: "" });
  const [modalImage, setModalImage] = useState(null);

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

  const loadTickets = async () => {
    setLoading(true);
    try {
      // Only send filters if they are not empty
      const params = {};
      if (filters.assignedTo) params.assignedTo = filters.assignedTo;
      if (filters.createdBy) params.createdBy = filters.createdBy;
      if (filters.status) params.status = filters.status;

      const res = await axios.get("/support-tickets/all", { ...authHeader, params });
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      alert("Failed to fetch tickets");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, [filters]); // Reload when filters change

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetFilters = () => {
    setFilters({ assignedTo: "", createdBy: "", status: "" });
  };

  if (loading) return <div className="p-6 text-center">Loading tickets...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Support Tickets</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6 flex gap-4 flex-wrap">
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="border p-2 rounded flex-1 min-w-[150px]"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="InProgress">InProgress</option>
          <option value="Done">Done</option>
        </select>
        <button
          onClick={resetFilters}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Reset Filters
        </button>
      </div>

      {/* Tickets List */}
      <div className="grid gap-4">
        {tickets.length === 0 && (
          <div className="text-gray-500 text-center">No tickets available</div>
        )}
        {tickets.map((t) => {
          // Parse the backend date format using dayjs and customParseFormat
          const createdDate = dayjs(t.CreatedDate, "DD/MM/YYYY HH:mm:ss");

          return (
            <div
              key={t.TicketID}
              className="bg-white p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className="flex-1">
                <div className="font-semibold text-lg">{t.Issue}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Created By: <span className="font-medium">{t.CreatedBy}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Assigned To: <span className="font-medium">{t.AssignedTo}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Created Date: {createdDate.format("DD MMM YYYY, HH:mm")}
                </div>
                <div className="text-sm text-gray-600">
                  Elapsed: {createdDate.fromNow()}
                </div>
              </div>

              <div className="flex gap-2 mt-2 md:mt-0">
                {t.IssuePhoto && (
                  <button
                    onClick={() => setModalImage(t.IssuePhoto)}
                    className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800"
                  >
                    View Image
                  </button>
                )}
                <span className={`px-3 py-1 rounded ${
                  t.Status === "Pending"
                    ? "bg-yellow-400 text-black"
                    : t.Status === "InProgress"
                    ? "bg-blue-600 text-white"
                    : "bg-green-600 text-white"
                }`}>
                  {t.Status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Viewing Image */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="relative">
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2 text-white bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-red-700"
            >
              &times;
            </button>
            <img
              src={modalImage}
              alt="Issue"
              className="max-w-[90vw] max-h-[90vh] rounded shadow-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
