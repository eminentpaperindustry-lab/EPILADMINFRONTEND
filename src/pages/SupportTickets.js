// import React, { useEffect, useState, useContext, useRef } from "react";
// import axios from "../api/axios";
// import { AuthContext } from "../context/AuthContext";
// import dayjs from "dayjs";
// import relativeTime from "dayjs/plugin/relativeTime";
// import customParseFormat from "dayjs/plugin/customParseFormat";

// dayjs.extend(relativeTime);
// dayjs.extend(customParseFormat);

// const DATE_FORMAT = "DD/MM/YYYY HH:mm:ss";

// export default function SupportTicket() {
//   const { user } = useContext(AuthContext);
//   const fileInputRef = useRef();

//   /* ================= STATES ================= */
//   const [activeMainTab, setActiveMainTab] = useState("all");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [tickets, setTickets] = useState([]);
//   const [createdTickets, setCreatedTickets] = useState([]);
//   const [employees, setEmployees] = useState([]);

//   const [loading, setLoading] = useState(false);
//   const [creating, setCreating] = useState(false);
//   const [updating, setUpdating] = useState(null);
//   const [modalImage, setModalImage] = useState(null);

//   const [form, setForm] = useState({
//     AssignedTo: "",
//     Issue: "",
//     IssuePhoto: null,
//   });

//   const authHeader = {
//     headers: { Authorization: `Bearer ${user.token}` },
//   };

//   /* ================= LOADERS ================= */
//   const loadAllTickets = async (status = "") => {
//     setLoading(true);
//     try {
//       const res = await axios.get("/support-tickets/all", {
//         ...authHeader,
//         params: status ? { status } : {},
//       });
//       setTickets(res.data.tickets || []);
//     } catch (err) {
//       console.error(err);
//     }
//     setLoading(false);
//   };

//   const loadCreatedTickets = async () => {
//     try {
//       const res = await axios.get("/support-tickets/created", authHeader);
//       setCreatedTickets((res.data || []).filter((t) => t.Status !== "Done"));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const loadEmployees = async () => {
//     try {
//       const res = await axios.get("/employee/all", authHeader);
//       setEmployees((res.data || []).filter((e) => e.name !== user.name));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     loadAllTickets("");
//     loadEmployees();
//   }, []);

//   useEffect(() => {
//     loadAllTickets(statusFilter);
//   }, [statusFilter]);

//   useEffect(() => {
//     if (activeMainTab === "create") {
//       loadCreatedTickets();
//     }
//   }, [activeMainTab]);

//   /* ================= ACTIONS ================= */
//   const handleFileChange = (e) => {
//     setForm((prev) => ({ ...prev, IssuePhoto: e.target.files[0] }));
//   };

//   const createTicket = async () => {
//     if (!form.AssignedTo || !form.Issue) {
//       return alert("All fields required");
//     }

//     setCreating(true);
//     try {
//       const formData = new FormData();
//       formData.append("AssignedTo", form.AssignedTo);
//       formData.append("Issue", form.Issue);
//       if (form.IssuePhoto) formData.append("IssuePhoto", form.IssuePhoto);

//       // ✅ Create ticket
//       await axios.post("/support-tickets/create", formData, {
//         headers: {
//           ...authHeader.headers,
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       // Reset form
    

//       // ✅ Refresh created tickets
//       await loadCreatedTickets();
//         setForm({ AssignedTo: "", Issue: "", IssuePhoto: null });
//       if (fileInputRef.current) fileInputRef.current.value = null;

//     } catch (err) {
//       console.error(err);
//       alert("Failed to create ticket");
//     }
//     setCreating(false);
//   };

//   const markDone = async (id) => {
//     setUpdating(id);
//     try {
//       await axios.patch(
//         `/support-tickets/status/${id}`,
//         { Status: "Done" },
//         authHeader
//       );
//       // ✅ Refresh after marking done
//       await loadCreatedTickets();
//     } catch {
//       alert("Failed to update");
//     }
//     setUpdating(null);
//   };

//   /* ================= UI ================= */
//   return (
//     <div className="p-6 h-full flex flex-col">
//       <h2 className="text-2xl font-semibold mb-4">Support Tickets</h2>

//       {/* MAIN TABS */}
//       <div className="flex gap-4 mb-6">
//         <button
//           onClick={() => setActiveMainTab("all")}
//           className={`px-4 py-2 rounded ${
//             activeMainTab === "all" ? "bg-blue-600 text-white" : "bg-gray-200"
//           }`}
//         >
//           All Support Tickets
//         </button>

//         <button
//           onClick={() => setActiveMainTab("create")}
//           className={`px-4 py-2 rounded ${
//             activeMainTab === "create"
//               ? "bg-blue-600 text-white"
//               : "bg-gray-200"
//           }`}
//         >
//           Create Support Ticket
//         </button>
//       </div>

//       {/* ================= ALL TICKETS ================= */}
//       {activeMainTab === "all" && (
//         <>
//           <div className="bg-white p-4 rounded shadow mb-4 flex gap-2">
//             {[
//               { label: "All", value: "" },
//               { label: "Pending", value: "Pending" },
//               { label: "In Progress", value: "InProgress" },
//               { label: "Done", value: "Done" },
//             ].map((tab) => (
//               <button
//                 key={tab.value}
//                 onClick={() => setStatusFilter(tab.value)}
//                 className={`px-4 py-2 rounded ${
//                   statusFilter === tab.value
//                     ? "bg-blue-600 text-white"
//                     : "bg-gray-200"
//                 }`}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>

//           <div className="flex-1 overflow-y-auto pr-2">
//             {loading && <div className="text-center py-6">Loading...</div>}

//             {!loading &&
//               tickets.map((t) => {
//                 const date = dayjs(t.CreatedDate, DATE_FORMAT);
//                 return (
//                   <div
//                     key={t.TicketID}
//                     className="bg-white p-4 rounded shadow mb-4 flex justify-between"
//                   >
//                     <div>
//                       <div className="font-semibold">{t.Issue}</div>
//                       <div className="text-sm">Created By: {t.CreatedBy}</div>
//                       <div className="text-sm">Assigned To: {t.AssignedTo}</div>
//                       <div className="text-sm text-gray-500">
//                         {date.fromNow()}
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-2">
//                       {t.IssuePhoto && (
//                         <button
//                           onClick={() => setModalImage(t.IssuePhoto)}
//                           className="bg-gray-700 text-white px-3 py-1 rounded"
//                         >
//                           View Image
//                         </button>
//                       )}
//                       <span className="px-3 py-1 rounded bg-blue-600 text-white">
//                         {t.Status}
//                       </span>
//                     </div>
//                   </div>
//                 );
//               })}
//           </div>
//         </>
//       )}

//       {/* ================= CREATE TAB ================= */}
//       {activeMainTab === "create" && (
//         <>
//           <div className="bg-white p-6 rounded shadow mb-6">
//             <h3 className="text-xl font-semibold mb-4">Create Ticket</h3>

//             <select
//               className="w-full border p-2 rounded mb-3"
//               value={form.AssignedTo}
//               onChange={(e) =>
//                 setForm({ ...form, AssignedTo: e.target.value })
//               }
//             >
//               <option value="">Select Employee</option>
//               <option value={"Sagar Soni"}>{"SAGAR SONI"}</option>
//               <option value={"Devyani Bhatt"}>{"Devyani Bhatt"}</option>
//               <option value={"Govind Vora"}>{"Govind Vora"}</option>
//               <option value={"Mohammad Sami "}>{"Mohammad Sami "}</option>
//             </select>

//             <textarea
//               className="w-full border p-2 rounded mb-3"
//               placeholder="Issue"
//               value={form.Issue}
//               onChange={(e) => setForm({ ...form, Issue: e.target.value })}
//             />

//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               onChange={handleFileChange}
//               className="mb-3"
//             />

//             {form.IssuePhoto && (
//               <img
//                 src={URL.createObjectURL(form.IssuePhoto)}
//                 alt="preview"
//                 className="w-32 h-32 object-cover mb-3 border rounded"
//               />
//             )}

//             <button
//               disabled={creating}
//               onClick={createTicket}
//               className="bg-green-600 text-white px-6 py-2 rounded"
//             >
//               {creating ? "Creating..." : "Create Ticket"}
//             </button>
//           </div>

//           <h3 className="text-xl font-semibold mb-3">Created Tickets</h3>

//           {createdTickets.length === 0 && (
//             <div className="text-gray-500">No pending tickets</div>
//           )}

//           {createdTickets.map((t) => (
//             <div
//               key={t.TicketID}
//               className="bg-white p-4 rounded shadow mb-3 flex justify-between items-center"
//             >
//               <div>
//                 <div className="font-medium">{t.Issue}</div>
//                 <div className="text-sm text-gray-500">
//                   {dayjs(t.CreatedDate, DATE_FORMAT).fromNow()}
//                 </div>
//               </div>

//               <div className="flex items-center gap-2">
//                 {t.IssuePhoto && (
//                   <button
//                     onClick={() => setModalImage(t.IssuePhoto)}
//                     className="bg-gray-700 text-white px-3 py-1 rounded"
//                   >
//                     View Image
//                   </button>
//                 )}

//                 <button
//                   disabled={updating === t.TicketID}
//                   onClick={() => markDone(t.TicketID)}
//                   className="bg-green-600 text-white px-3 py-1 rounded"
//                 >
//                   {updating === t.TicketID ? "Updating..." : "Mark Done"}
//                 </button>
//               </div>
//             </div>
//           ))}
//         </>
//       )}

//       {/* IMAGE MODAL */}
//       {modalImage && (
//         <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
//           <div className="relative">
//             <button
//               onClick={() => setModalImage(null)}
//               className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold hover:bg-red-700"
//             >
//               ×
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
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

const DATE_FORMAT = "DD/MM/YYYY HH:mm:ss";

export default function SupportTicket() {
  const { user } = useContext(AuthContext);
  const fileInputRef = useRef();

  /* ================= STATES ================= */
  const [activeMainTab, setActiveMainTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [tickets, setTickets] = useState([]);
  const [createdTickets, setCreatedTickets] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [allTicketsLoading, setAllTicketsLoading] = useState(false);
  const [createdTicketsLoading, setCreatedTicketsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [modalImage, setModalImage] = useState(null);

  const [form, setForm] = useState({
    AssignedTo: "",
    Issue: "",
    IssuePhoto: null,
  });

  const authHeader = {
    headers: { Authorization: `Bearer ${user.token}` },
  };

  /* ================= LOADERS ================= */
  const loadAllTickets = async (status = "") => {
    setAllTicketsLoading(true);
    try {
      const res = await axios.get("/support-tickets/all", {
        ...authHeader,
        params: status ? { status } : {},
      });
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error(err);
    }
    setAllTicketsLoading(false);
  };

  const loadCreatedTickets = async () => {
    setCreatedTicketsLoading(true);
    try {
      const res = await axios.get("/support-tickets/created", authHeader);
      setCreatedTickets((res.data || []).filter((t) => t.Status !== "Done"));
    } catch (err) {
      console.error(err);
    }
    setCreatedTicketsLoading(false);
  };

  const loadEmployees = async () => {
    try {
      const res = await axios.get("/employee/all", authHeader);
      setEmployees((res.data || []).filter((e) => e.name !== user.name));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAllTickets("");
    loadEmployees();
  }, []);

  useEffect(() => {
    loadAllTickets(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    if (activeMainTab === "create") {
      loadCreatedTickets();
    }
  }, [activeMainTab]);

  /* ================= ACTIONS ================= */
  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, IssuePhoto: e.target.files[0] }));
  };

  const createTicket = async () => {
    if (!form.AssignedTo || !form.Issue) return alert("All fields required");

    setCreating(true);

    const tempTicket = {
      TicketID: "temp-" + Date.now(),
      Issue: form.Issue,
      CreatedDate: dayjs().format(DATE_FORMAT),
      IssuePhoto: form.IssuePhoto ? URL.createObjectURL(form.IssuePhoto) : null,
      Status: "Pending",
    };
    setCreatedTickets((prev) => [tempTicket, ...prev]);

    try {
      const formData = new FormData();
      formData.append("AssignedTo", form.AssignedTo);
      formData.append("Issue", form.Issue);
      if (form.IssuePhoto) formData.append("IssuePhoto", form.IssuePhoto);

      // Clear form
      setForm({ AssignedTo: "", Issue: "", IssuePhoto: null });
      if (fileInputRef.current) fileInputRef.current.value = null;

      await axios.post("/support-tickets/create", formData, {
        headers: {
          ...authHeader.headers,
          "Content-Type": "multipart/form-data",
        },
      });

      await loadCreatedTickets();
    } catch (err) {
      alert("Failed to create ticket");
      console.error(err);
      setCreatedTickets((prev) => prev.filter((t) => !t.TicketID.startsWith("temp-")));
    }

    setCreating(false);
  };

  const markDone = async (id) => {
    setUpdating(id);
    setCreatedTickets((prev) => prev.filter((t) => t.TicketID !== id));

    try {
      await axios.patch(`/support-tickets/status/${id}`, { Status: "Done" }, authHeader);
    } catch {
      alert("Failed to update");
      await loadCreatedTickets();
    }

    setUpdating(null);
  };

  /* ================= UI ================= */
  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-2xl font-semibold mb-4">Support Tickets</h2>

      {/* MAIN TABS */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveMainTab("all")}
          className={`px-4 py-2 rounded ${activeMainTab === "all" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          All Support Tickets
        </button>

        <button
          onClick={() => setActiveMainTab("create")}
          className={`px-4 py-2 rounded ${activeMainTab === "create" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Create Support Ticket
        </button>
      </div>

      {/* ================= ALL TICKETS ================= */}
      {activeMainTab === "all" && (
        <>
          {/* STATUS FILTER */}
          <div className="bg-white p-4 rounded shadow mb-4 flex gap-2">
            {[
              { label: "All", value: "" },
              { label: "Pending", value: "Pending" },
              { label: "In Progress", value: "InProgress" },
              { label: "Done", value: "Done" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-2 rounded ${statusFilter === tab.value ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {allTicketsLoading && <div className="text-center py-6">Loading tickets...</div>}

            {!allTicketsLoading &&
              tickets.map((t) => {
                const date = dayjs(t.CreatedDate, DATE_FORMAT);
                return (
                  <div
                    key={t.TicketID}
                    className="bg-white p-4 rounded shadow mb-4 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-semibold">Ticket ID : {t.TicketID}</div>

                      <div className="font-semibold">Problem : {t.Issue}</div>
                      <div className="text-sm">Created By: {t.CreatedBy}</div>
                      <div className="text-sm">Assigned To: {t.AssignedTo}</div>
                      <div className="text-sm text-gray-500">{date.fromNow()}</div>
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
                      <span className="px-3 py-1 rounded bg-blue-600 text-white">{t.Status}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      {/* ================= CREATE TAB ================= */}
      {activeMainTab === "create" && (
        <>
          {/* CREATE FORM */}
          <div className="bg-white p-6 rounded shadow mb-6">
            <h3 className="text-xl font-semibold mb-4">Create Ticket</h3>

            <select
              className="w-full border p-2 rounded mb-3"
              value={form.AssignedTo}
              onChange={(e) => setForm({ ...form, AssignedTo: e.target.value })}
            >
              <option value="">Select Employee</option>
 <option value={"Sagar Soni"}>{"SAGAR SONI"}</option>
              <option value={"Devyani Bhatt"}>{"Devyani Bhatt"}</option>
              <option value={"Govind Vora"}>{"Govind Vora"}</option>         
                    <option value={"Mohammad Sami "}>{"Mohammad Sami "}</option>

              {/* {employees.map((e) => (
                <option key={e.name} value={e.name}>
                  {e.name.toUpperCase()}
                </option>
              ))} */}
            </select>

            <textarea
              className="w-full border p-2 rounded mb-3"
              placeholder="Issue"
              value={form.Issue}
              onChange={(e) => setForm({ ...form, Issue: e.target.value })}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mb-3"
            />

            {form.IssuePhoto && (
              <img
                src={URL.createObjectURL(form.IssuePhoto)}
                alt="preview"
                className="w-32 h-32 object-cover mb-3 border rounded"
                loading="lazy"
              />
            )}

            <button
              disabled={creating}
              onClick={createTicket}
              className="bg-green-600 text-white px-6 py-2 rounded"
            >
              {creating ? "Creating..." : "Create Ticket"}
            </button>
          </div>

          {/* CREATED TICKETS */}
          <h3 className="text-xl font-semibold mb-3">Created Tickets</h3>

          {createdTicketsLoading && <div className="text-center py-6">Loading created tickets...</div>}

          {!createdTicketsLoading && createdTickets.length === 0 && (
            <div className="text-gray-500">No pending tickets</div>
          )}

          {!createdTicketsLoading &&
            createdTickets.map((t) => (
              <div
                key={t.TicketID}
                className="bg-white p-4 rounded shadow mb-3 flex justify-between items-center"
              >
                <div>
                     <div className="font-semibold">Ticket ID : {t.TicketID}</div>

                      <div className="font-semibold">Problem : {t.Issue}</div>
                  <div className="text-sm text-gray-500">{dayjs(t.CreatedDate, DATE_FORMAT).fromNow()}</div>
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

                  <button
                    disabled={updating === t.TicketID}
                    onClick={() => markDone(t.TicketID)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    {updating === t.TicketID ? "Updating..." : "Mark Done"}
                  </button>
                </div>
              </div>
            ))}
        </>
      )}

      {/* IMAGE MODAL */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="relative">
            <button
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold hover:bg-red-700"
            >
              ×
            </button>

            <img
              src={modalImage}
              alt="Issue"
              className="max-w-[90vw] max-h-[90vh] rounded shadow-lg object-contain"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}
