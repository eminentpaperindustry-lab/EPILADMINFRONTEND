// import React, { useEffect, useState, useContext } from "react";
// import axios from "../api/axios";
// import { AuthContext } from "../context/AuthContext";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// dayjs.extend(relativeTime);

// export default function HelpTickets() {
//   const { user } = useContext(AuthContext);
//   const [tickets, setTickets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filters, setFilters] = useState({ assignedTo: "", createdBy: "", status: "" });
//   const [modalImage, setModalImage] = useState(null);

//   const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

//   const loadTickets = async () => {
//     setLoading(true);
//     try {
//       // Only send filters if they are not empty
//       const params = {};
//       if (filters.assignedTo) params.assignedTo = filters.assignedTo;
//       if (filters.createdBy) params.createdBy = filters.createdBy;
//       if (filters.status) params.status = filters.status;

//       const res = await axios.get("/helpTickets/all", { ...authHeader, params });
//       setTickets(res.data.tickets || []);
//     } catch (err) {
//       console.error("Failed to fetch tickets:", err);
//       alert("Failed to fetch tickets");
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     loadTickets();
//   }, [filters]); // Reload when filters change

//   const handleFilterChange = (e) => {
//     setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
//   };

//   const resetFilters = () => {
//     setFilters({ assignedTo: "", createdBy: "", status: "" });
//   };

//   if (loading) return <div className="p-6 text-center">Loading tickets...</div>;

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-semibold mb-4">Help Tickets</h2>

//       {/* Filters */}
//       <div className="bg-white p-4 rounded shadow mb-6 flex gap-4 flex-wrap">
//         {/* <input
//           type="text"
//           name="assignedTo"
//           value={filters.assignedTo}
//           onChange={handleFilterChange}
//           placeholder="Filter by Assigned To"
//           className="border p-2 rounded flex-1 min-w-[150px]"
//         />
//         <input
//           type="text"
//           name="createdBy"
//           value={filters.createdBy}
//           onChange={handleFilterChange}
//           placeholder="Filter by Created By"
//           className="border p-2 rounded flex-1 min-w-[150px]"
//         /> */}
//         <select
//           name="status"
//           value={filters.status}
//           onChange={handleFilterChange}
//           className="border p-2 rounded flex-1 min-w-[150px]"
//         >
//           <option value="">All Status</option>
//           <option value="Pending">Pending</option>
//           <option value="InProgress">InProgress</option>
//           <option value="Done">Done</option>
//         </select>
//         <button
//           onClick={resetFilters}
//           className="bg-red-600 text-white px-4 py-2 rounded"
//         >
//           Reset Filters
//         </button>
//       </div>

//       {/* Tickets List */}
//       <div className="grid gap-4">
//         {tickets.length === 0 && (
//           <div className="text-gray-500 text-center">No tickets available</div>
//         )}
//         {tickets.map((t) => (
//           <div
//             key={t.TicketID}
//             className="bg-white p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
//           >
//             <div className="flex-1">
//               <div className="font-semibold text-lg">{t.Issue}</div>
//               <div className="text-sm text-gray-600 mt-1">
//                 Created By: <span className="font-medium">{t.CreatedBy}</span>
//               </div>
//               <div className="text-sm text-gray-600">
//                 Assigned To: <span className="font-medium">{t.AssignedTo}</span>
//               </div>
//               <div className="text-sm text-gray-600">
//                 Created Date: {dayjs(t.CreatedDate).format("DD MMM YYYY, HH:mm")}
//               </div>
//               <div className="text-sm text-gray-600">
//                 Elapsed: {dayjs(t.CreatedDate).fromNow()}
//               </div>
//             </div>

//             <div className="flex gap-2 mt-2 md:mt-0">
//               {t.IssuePhoto && (
//                 <button
//                   onClick={() => setModalImage(t.IssuePhoto)}
//                   className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800"
//                 >
//                   View Image
//                 </button>
//               )}
//               <span className={`px-3 py-1 rounded ${
//                 t.Status === "Pending"
//                   ? "bg-yellow-400 text-black"
//                   : t.Status === "InProgress"
//                   ? "bg-blue-600 text-white"
//                   : "bg-green-600 text-white"
//               }`}>
//                 {t.Status}
//               </span>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Image Modal */}
//       {modalImage && (
//         <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
//           <div className="relative">
//             <button
//               onClick={() => setModalImage(null)}
//               className="absolute top-2 right-2 text-white bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-red-700"
//             >
//               &times;
//             </button>
//             <img
//               src={modalImage}
//               alt="Issue"
//               className="max-w-[90vw] max-h-[90vh] rounded shadow-lg object-contain"
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useEffect, useState, useContext, useRef } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function HelpTickets() {
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef();

  // State hooks
  const [tickets, setTickets] = useState([]); // All tickets
  const [createdTickets, setCreatedTickets] = useState([]); // Created tickets for admin
  const [employees, setEmployees] = useState([]); // List of employees for dropdown
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ assignedTo: "", createdBy: "", status: "" });
  const [form, setForm] = useState({ AssignedTo: "", Issue: "", IssuePhoto: null });
  const [activeTab, setActiveTab] = useState("all"); // Tab state
  const [creating, setCreating] = useState(false); // Ticket creation state
  const [markingDone, setMarkingDone] = useState(null); // Marking done state (for loading)
  const [modalImage, setModalImage] = useState(null); // Modal image state

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

  // Load all help tickets (both assigned and created)
  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/helpTickets/all", { ...authHeader, params: filters });
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
      alert("Failed to fetch tickets");
    }
    setLoading(false);
  };

  // Load created tickets (for admin to mark as done and manage)
  const loadCreatedTickets = async () => {
    try {
      const res = await axios.get("/helpTickets/created", authHeader);
      setCreatedTickets(res.data || []);
    } catch (err) {
      console.error("Failed to fetch created tickets:", err);
    }
  };

  // Fetch employee list from the API for the dropdown
  const loadEmployees = async () => {
    try {
      const res = await axios.get("/employee/all", authHeader);
      setEmployees((res.data || []).filter((e) => e.name !== user.name)); // Exclude the current user
    } catch (err) {
      console.error("Failed to load employees:", err);
      alert("Failed to load employees");
    }
  };

  useEffect(() => {
    loadTickets();
    loadCreatedTickets();
    loadEmployees(); // Load employees when the component mounts
  }, [filters]);

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({ assignedTo: "", createdBy: "", status: "" });
  };

  // Handle ticket creation (Form submission)
  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, IssuePhoto: e.target.files[0] }));
  };

  const createTicket = async () => {
    if (!form.AssignedTo || !form.Issue) return alert("All fields are required");

    setCreating(true);

    try {
      const formData = new FormData();
      formData.append("AssignedTo", form.AssignedTo);
      formData.append("Issue", form.Issue);
      if (form.IssuePhoto) formData.append("IssuePhoto", form.IssuePhoto);

      await axios.post("/helpTickets/create", formData, {
        headers: { ...authHeader.headers, "Content-Type": "multipart/form-data" },
      });

      setForm({ AssignedTo: "", Issue: "", IssuePhoto: null });
      await loadCreatedTickets(); // Reload created tickets after ticket is created
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create ticket");
    }

    setCreating(false); // Reset creating state after the ticket is created
  };

  // Mark a ticket as "Done"
  const markDone = async (id) => {
    setMarkingDone(id); // Set the ID of the ticket being marked as "Done"
    try {
      await axios.patch(`/helpTickets/status/${id}`, { Status: "Done" }, authHeader);
      // Remove the marked ticket from the list without reloading all created tickets
      setCreatedTickets((prev) => prev.filter((ticket) => ticket.TicketID !== id));
    } catch (err) {
      alert("Failed to mark as done");
    }
    setMarkingDone(null); // Reset marking done state
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Help Tickets</h2>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded ${activeTab === "all" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          All Help Tickets
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 rounded ${activeTab === "create" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Create Help Ticket
        </button>
      </div>
   
      {/* Tab Content for All Tickets */}
      {activeTab === "all" && (
        <>
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
              <option value="InProgress">In Progress</option>
              <option value="Done">Done</option>
            </select>
            <button onClick={resetFilters} className="bg-red-600 text-white px-4 py-2 rounded">
              Reset Filters
            </button>
          </div>

          {/* Tickets List */}
          <h3 className="text-2xl font-semibold mb-4">All Help Tickets</h3>
          {loading ? (
  <div className="p-6 text-center">Loading tickets...</div>
) : (<div className="grid gap-4">
            {tickets.length === 0 && <div className="text-gray-500 text-center">No tickets available</div>}
            {tickets.map((t) => (
              <div key={t.TicketID} className="bg-white p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{t.Issue}</div>
                  <div className="text-sm text-gray-600 mt-1">Created By: <span className="font-medium">{t.CreatedBy}</span></div>
                  <div className="text-sm text-gray-600">Assigned To: <span className="font-medium">{t.AssignedTo}</span></div>
                  <div className="text-sm text-gray-600">Created Date: {dayjs(t.CreatedDate).format("DD MMM YYYY, HH:mm")}</div>
                  <div className="text-sm text-gray-600">Elapsed: {dayjs(t.CreatedDate).fromNow()}</div>
                </div>

                <div className="flex gap-2 mt-2 md:mt-0">
                  {t.IssuePhoto && (
                    <button onClick={() => setModalImage(t.IssuePhoto)} className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800">
                      View Image
                    </button>
                  )}
                  <span className={`px-3 py-1 rounded ${t.Status === "Pending" ? "bg-yellow-400 text-black" : t.Status === "InProgress" ? "bg-blue-600 text-white" : "bg-green-600 text-white"}`}>
                    {t.Status}
                  </span>
                </div>
              </div>
            ))}
          </div>)}
        </>
      )}

      {/* Tab Content for Create Ticket */}
      {activeTab === "create" && (
        <>
          {/* Create Help Ticket Form */}
          <h3 className="text-2xl font-semibold mb-4">Create Help Ticket</h3>
          <div className="bg-white p-6 rounded shadow mb-6">
            <select
              className="w-full border p-2 rounded mb-4"
              value={form.AssignedTo}
              onChange={(e) => setForm({ ...form, AssignedTo: e.target.value })}
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.name} value={e.name}>{e.name}</option>
              ))}
            </select>

            <textarea
              className="w-full border p-2 rounded mb-4"
              placeholder="Describe the issue"
              value={form.Issue}
              onChange={(e) => setForm({ ...form, Issue: e.target.value })}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-4"
            />

            {form.IssuePhoto && (
              <img src={URL.createObjectURL(form.IssuePhoto)} alt="preview" className="w-32 h-32 object-cover mb-4 border rounded" />
            )}

            <button
              disabled={creating}
              onClick={createTicket}
              className={`px-6 py-3 rounded text-white ${creating ? "bg-gray-400" : "bg-green-600"}`}
            >
              {creating ? "Creating Ticket..." : "Create Ticket"}
            </button>
          </div>

          {/* Created Tickets List */}
          <h3 className="text-2xl font-semibold mb-4">Created Help Tickets</h3>
       <div className="grid gap-4">
  {/* Check if all tickets are marked as "Done" */}
  {createdTickets.filter(ticket => ticket.Status !== 'Done').length === 0 && (
    <div className="text-gray-500 text-center">No created tickets pending available</div>
  )}
  
  {/* Render tickets that are not marked as "Done" */}
  {createdTickets
    .filter(ticket => ticket.Status !== 'Done')  // Filter out "Done" tickets
    .map((t) => (
      <div key={t.TicketID} className="bg-white p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <div className="font-semibold text-lg">{t.Issue}</div>
          <div className="text-sm text-gray-600 mt-1">Created By: <span className="font-medium">{t.CreatedBy}</span></div>
          <div className="text-sm text-gray-600">Assigned To: <span className="font-medium">{t.AssignedTo}</span></div>
          <div className="text-sm text-gray-600">Created Date: {dayjs(t.CreatedDate).format("DD MMM YYYY, HH:mm")}</div>
          <div className="text-sm text-gray-600">Elapsed: {dayjs(t.CreatedDate).fromNow()}</div>
          <div className="text-sm text-gray-600">Status: <span className="font-medium">{t.Status}</span></div>
        
        </div>

        <div className="flex gap-2 mt-2 md:mt-0">
          <button
            onClick={() => markDone(t.TicketID)}
            className={`bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 ${markingDone === t.TicketID ? "bg-gray-400" : ""}`}
            disabled={markingDone === t.TicketID}
          >
            {markingDone === t.TicketID ? "Marking as Done..." : "Mark as Done"}
          </button>
        </div>
      </div>
    ))}
</div>

        </>
      )}

      {/* Image Modal */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="relative">
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2 text-white bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-red-700"
            >
              ×
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

