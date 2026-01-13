// import React, { useState, useEffect, useContext } from "react";
// import axios from "../api/axios";
// import { AuthContext } from "../context/AuthContext";
// import { ToastContainer, toast } from "react-toastify";
// import 'react-toastify/dist/ReactToastify.css';

// export default function Checklist() {
//   const { user } = useContext(AuthContext);
//   const [checklists, setChecklists] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("pending");
//   const [processingTask, setProcessingTask] = useState(null);
//   const [selectedEmp, setSelectedEmp] = useState("");
//   const [employees, setEmployees] = useState([]);
//   const [employeeLoading, setEmployeeLoading] = useState(false);

//   // ---------------- DATE PARSER ----------------
//   const parseDate = (d) => {
//     if (!d) return null;
//     if (/^\d{2}\/\d{2}\/\d{4}/.test(d)) {
//       const [date, time] = d.split(" ");
//       const [day, mon, yr] = date.split("/");
//       return new Date(`${yr}-${mon}-${day}T${time || "00:00:00"}`);
//     }
//     if (/^\d{4}-\d{2}-\d{2}/.test(d)) return new Date(d);
//     const fallback = new Date(d);
//     return isNaN(fallback) ? null : fallback;
//   };

//   const normalizeDate = (d) => {
//     if (!d) return null;
//     const x = new Date(d);
//     x.setHours(0, 0, 0, 0);
//     return x;
//   };

//   // ---------------- LOAD EMPLOYEES ----------------
//   const loadEmployees = async () => {
//     setEmployeeLoading(true);
//     try {
//       const res = await axios.get("/employee/all", {
//         headers: { Authorization: `Bearer ${user.token}` },
//       });
//       setEmployees(res.data || []);
//     } catch (err) {
//       toast.error("Failed to load employees");
//     } finally {
//       setEmployeeLoading(false);
//     }
//   };

//   // ---------------- LOAD CHECKLISTS ----------------
//   const loadChecklists = async (employeeName) => {
//     if (!employeeName) return;
//     try {
//       setLoading(true);
//       const res = await axios.get(`/checklist/search/by-name`, {
//         headers: { Authorization: `Bearer ${user.token}` },
//         params: { name: employeeName },
//       });
//       setChecklists(res.data || []);
//     } catch (err) {
//       setChecklists([]);
//       toast.error("Failed to load checklists");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------------- MARK DONE ----------------
//   const markDone = async (TaskID) => {
//     try {
//       setProcessingTask(TaskID);
//       await axios.patch(`/checklist/done/${TaskID}`, {}, {
//         headers: { Authorization: `Bearer ${user.token}` },
//       });
//       toast.success("Task marked done successfully");
//       loadChecklists(selectedEmp);
//     } catch (e) {
//       toast.error("Failed to mark task done");
//     } finally {
//       setProcessingTask(null);
//     }
//   };

//   // ---------------- WEEK RANGE ----------------
//   const getWeekRange = (date) => {
//     const d = new Date(date);
//     const day = d.getDay();
//     const start = new Date(d);
//     start.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
//     start.setHours(0, 0, 0, 0);
//     const end = new Date(start);
//     end.setDate(start.getDate() + 6);
//     end.setHours(23, 59, 59, 999);
//     return { start, end };
//   };

//   // ---------------- FILTER LOGIC ----------------
//   const filteredChecklists = () => {
//     if (!checklists || !Array.isArray(checklists)) return [];

//     const today = normalizeDate(new Date());
//     const { start: weekStart, end: weekEnd } = getWeekRange(today);

//     return checklists
//       .sort((a, b) => (a.Name || "").localeCompare(b.Name || ""))
//       .filter((c) => {
//         const planned = parseDate(c.Planned);
//         if (!planned) return false;

//         const plannedDate = normalizeDate(planned);
//         const isDone = !!parseDate(c.Actual);
//         const freq = c.Freq;

//         // -------- PENDING --------
//         if (activeTab === "pending") {
//           if (isDone) return false;

//           if (freq === "D" && plannedDate < today) return true;

//           if (freq === "W") {
//             const { end } = getWeekRange(plannedDate);
//             return end < today;
//           }

//           if (freq === "M") {
//             return (
//               plannedDate.getFullYear() < today.getFullYear() ||
//               (plannedDate.getFullYear() === today.getFullYear() &&
//                 plannedDate.getMonth() < today.getMonth())
//             );
//           }

//           if (freq === "Y") {
//             return plannedDate.getFullYear() < today.getFullYear();
//           }

//           return false;
//         }

//         // -------- DAILY --------
//         if (activeTab === "Daily") {
//           return freq === "D" && !isDone && plannedDate.getTime() === today.getTime();
//         }

//         // -------- WEEKLY --------
//         if (activeTab === "Weekly") {
//           return freq === "W" && !isDone && plannedDate >= weekStart && plannedDate <= weekEnd;
//         }

//         // -------- MONTHLY --------
//         if (activeTab === "Monthly") {
//           return (
//             freq === "M" &&
//             !isDone &&
//             plannedDate.getMonth() === today.getMonth() &&
//             plannedDate.getFullYear() === today.getFullYear()
//           );
//         }

//         // -------- YEARLY --------
//         if (activeTab === "Yearly") {
//           return (
//             freq === "Y" &&
//             !isDone &&
//             plannedDate.getFullYear() === today.getFullYear()
//           );
//         }

//         return false;
//       });
//   };

//   useEffect(() => {
//     if (user) loadEmployees();
//   }, [user]);

//   useEffect(() => {
//     if (selectedEmp) loadChecklists(selectedEmp);
//   }, [selectedEmp]);

//   // ---------------- UI ----------------
//   return (
//     <div className="p-4 sm:p-6">
//       <h1 className="text-xl sm:text-2xl font-semibold mb-4">Checklist</h1>

//       {/* Employee Select */}
//       <select
//         className="w-full border p-2 rounded mb-4"
//         value={selectedEmp}
//         onChange={(e) => setSelectedEmp(e.target.value)}
//       >
//         <option value="">-- Select Employee --</option>
//         <option value="all">All Checklist</option>
//         {employees.map((emp) => (
//           <option key={emp.name} value={emp.name}>{emp.name}</option>
//         ))}
//       </select>

//       {/* Tabs */}
//       {selectedEmp && (
//         <div className="flex gap-2 mb-4 overflow-x-auto">
//           {["pending", "Daily", "Weekly", "Monthly", "Yearly"].map((tab) => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className={`px-4 py-2 rounded ${
//                 activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200"
//               }`}
//             >
//               {tab.charAt(0).toUpperCase() + tab.slice(1)}
//             </button>
//           ))}
//         </div>
//       )}

//       {/* Checklist */}
//       {filteredChecklists().map((c) => (
//         <div key={c.TaskID} className="p-3 bg-white rounded shadow mb-2 flex justify-between">
//           <div>
//             <div className="font-semibold">{c.Task}</div>
//             <div className="text-sm text-gray-600">
//               Frequency: {c.Freq === "D" ? "Daily" : c.Freq === "W" ? "Weekly" : c.Freq === "M" ? "Monthly" : "Yearly"} |
//               Planned: {c.Planned} | Name: {c.Name}
//             </div>
//           </div>

//           {!c.Actual && (
//             <button
//               onClick={() => markDone(c.TaskID)}
//               disabled={processingTask === c.TaskID}
//               className="bg-green-600 text-white px-4 py-2 rounded"
//             >
//               {processingTask === c.TaskID ? "Processing..." : "Mark Done"}
//             </button>
//           )}
//         </div>
//       ))}

//       {filteredChecklists().length === 0 && (
//         <p className="text-center text-gray-500 mt-4">No data found.</p>
//       )}

//       <ToastContainer position="top-right" autoClose={3000} />
//     </div>
//   );
// }



import React, { useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Checklist() {
  const { user } = useContext(AuthContext);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);  // Loading state for checklist data
  const [activeTab, setActiveTab] = useState("pending");
  const [processingTask, setProcessingTask] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);  // Loading state for employee data
const [loadingDownload, setLoadingDownload] = useState(false);
  
  // ---------------- DATE PARSER ----------------
  const parseDate = (d) => {
    if (!d) return null;
    if (/^\d{2}\/\d{2}\/\d{4}/.test(d)) {
      const [date, time] = d.split(" ");
      const [day, mon, yr] = date.split("/");
      return new Date(`${yr}-${mon}-${day}T${time || "00:00:00"}`);
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return new Date(d);
    const fallback = new Date(d);
    return isNaN(fallback) ? null : fallback;
  };

  const normalizeDate = (d) => {
    if (!d) return null;
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  // ---------------- LOAD EMPLOYEES ----------------
  const loadEmployees = async () => {
    setEmployeeLoading(true);  // Start loading
    try {
      const res = await axios.get("/employee/all", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setEmployees(res.data || []);
    } catch (err) {
      toast.error("Failed to load employees");
    } finally {
      setEmployeeLoading(false);  // End loading
    }
  };

  // ---------------- LOAD CHECKLISTS ----------------
  const loadChecklists = async (employeeName) => {
    if (!employeeName) return;
    setLoading(true);  // Start loading
    try {
      const res = await axios.get(`/checklist/search/by-name`, {
        headers: { Authorization: `Bearer ${user.token}` },
        params: { name: employeeName },
      });
      setChecklists(res.data || []);
    } catch (err) {
      setChecklists([]);
      toast.error("Failed to load checklists");
    } finally {
      setLoading(false);  // End loading
    }
  };

  // ---------------- MARK DONE ----------------
  const markDone = async (TaskID) => {
    try {
      setProcessingTask(TaskID);
      await axios.patch(`/checklist/done/${TaskID}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      toast.success("Task marked done successfully");
      loadChecklists(selectedEmp);
    } catch (e) {
      toast.error("Failed to mark task done");
    } finally {
      setProcessingTask(null);
    }
  };

  // ---------------- WEEK RANGE ----------------
  const getWeekRange = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  // ---------------- FILTER LOGIC ----------------
  const filteredChecklists = () => {
    if (!checklists || !Array.isArray(checklists)) return [];

    const today = normalizeDate(new Date());
    const { start: weekStart, end: weekEnd } = getWeekRange(today);

    return checklists
      .sort((a, b) => (a.Name || "").localeCompare(b.Name || ""))
      .filter((c) => {
        const planned = parseDate(c.Planned);
        if (!planned) return false;

        const plannedDate = normalizeDate(planned);
        const isDone = !!parseDate(c.Actual);
        const freq = c.Freq;

        // -------- PENDING --------
        if (activeTab === "pending") {
          if (isDone) return false;

          if (freq === "D" && plannedDate < today) return true;

          if (freq === "W") {
            const { end } = getWeekRange(plannedDate);
            return end < today;
          }

          if (freq === "M") {
            return (
              plannedDate.getFullYear() < today.getFullYear() ||
              (plannedDate.getFullYear() === today.getFullYear() &&
                plannedDate.getMonth() < today.getMonth())
            );
          }

          if (freq === "Y") {
            return plannedDate.getFullYear() < today.getFullYear();
          }

          return false;
        }

        // -------- DAILY --------
        if (activeTab === "Daily") {
          return freq === "D" && !isDone && plannedDate.getTime() === today.getTime();
        }

        // -------- WEEKLY --------
        if (activeTab === "Weekly") {
          return freq === "W" && !isDone && plannedDate >= weekStart && plannedDate <= weekEnd;
        }

        // -------- MONTHLY --------
        if (activeTab === "Monthly") {
          return (
            freq === "M" &&
            !isDone &&
            plannedDate.getMonth() === today.getMonth() &&
            plannedDate.getFullYear() === today.getFullYear()
          );
        }

        // -------- YEARLY --------
        if (activeTab === "Yearly") {
          return (
            freq === "Y" &&
            !isDone &&
            plannedDate.getFullYear() === today.getFullYear()
          );
        }

        return false;
      });
  };

  useEffect(() => {
    if (user) loadEmployees();
  }, [user]);

  useEffect(() => {
    if (selectedEmp) loadChecklists(selectedEmp);
  }, [selectedEmp]);

const downloadChecklistReport = async () => {
  if (!selectedEmp) {
    toast.warn("Select employee first");
    return;
  }

    setLoadingDownload(true);
  try {
    // 🔹 TODAY DATE
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 🔹 API CALL
    const res = await axios.get(`/checklist/search/by-name`, {
      headers: { Authorization: `Bearer ${user.token}` },
      params: { name: selectedEmp },
    });

    // 🔹 FILTER → pending + aaj/past planned
    const data = (res.data || [])
      .filter((t) => {
        if (!t.Planned) return false;

        // Only pending tasks
        if (t.Actual) return false;

        const [datePart, timePart] = t.Planned.split(" ");
        const [day, month, year] = datePart.split("/");
        const [hour, minute, second] = timePart.split(":");

        const plannedDate = new Date(
          year,
          month - 1,
          day,
          hour,
          minute,
          second
        );

        plannedDate.setHours(0, 0, 0, 0);

        return plannedDate <= today;
      })

      // 🔹 SORT → Name first, then Planned date
      .sort((a, b) => {
        const nameCompare = (a.Name || "").localeCompare(b.Name || "");
        if (nameCompare !== 0) return nameCompare;

        const d1 = new Date(a.Planned.split(" ")[0].split("/").reverse().join("-"));
        const d2 = new Date(b.Planned.split(" ")[0].split("/").reverse().join("-"));
        return d1 - d2;
      });

    if (data.length === 0) {
      toast.info("No pending checklist data to download");
      return;
    }

    // 🔹 PDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(14);
    doc.text(
      `Pending Checklist Report - ${selectedEmp}`,
      14,
      15
    );

    autoTable(doc, {
      head: [[
        "Name",
        "Task",
        "Frequency",
        "Planned",
        "Status"
      ]],
      body: data.map((c) => [
        c.Name || "",
        c.Task || "",
        c.Freq === "D"
          ? "Daily"
          : c.Freq === "W"
          ? "Weekly"
          : c.Freq === "M"
          ? "Monthly"
          : "Yearly",
        c.Planned || "--",
        "Pending"
      ]),
      startY: 22,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 55 },
      },
    });

    doc.save(
      `pending_checklist_${selectedEmp}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`
    );

    toast.success("Pending checklist downloaded successfully");
    const fileName = `pending_checklist_${selectedEmp}_${new Date().toISOString().slice(0, 10)}.pdf`;

        // ---------------- WhatsApp Send ----------------
    // Convert PDF to Base64 or host file somewhere first
    // Quick option: Send simple text message with file name
 // Find employee object by name
const empObj = employees.find(emp => emp.name === selectedEmp);

if (empObj && empObj.number) {
  const whatsappNumber = empObj.number;
  const msg = encodeURIComponent(`Hi ${selectedEmp}, kindly complete your pending checklist on time to keep your score perfect 😊.`);
  window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, "_blank");
} else {
  toast.warn("Employee WhatsApp number not found");
}


  } catch (err) {
    toast.error("Failed to download pending checklist");
  }
  finally {
    setLoadingDownload(false); // End loading
  }
};


  // ---------------- UI ----------------
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">Checklist</h1>

      {/* Employee Select */}
      <select
        className="w-full border p-2 rounded mb-4"
        value={selectedEmp}
        onChange={(e) => setSelectedEmp(e.target.value)}
      >
        <option value="">-- Select Employee --</option>
        <option value="all">All Checklist</option>
        {employeeLoading ? (
          <option>Loading Employees...</option>
        ) : (
          employees.map((emp) => (
            <option key={emp.name} value={emp.name}>{emp.name}</option>
          ))
        )}
      </select>

      <button
  className="bg-gray-700 text-white px-4 py-2 rounded mb-4"
  onClick={downloadChecklistReport}

   disabled={loadingDownload} // Disable while loading
>
  {loadingDownload ? "Loading..." : "Download Pending Checklist"}
</button>


      {/* Tabs */}
      {selectedEmp && !employeeLoading && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {["pending", "Daily", "Weekly", "Monthly", "Yearly"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${
                activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Checklist */}
      {loading ? (
        <div className="text-center">Loading Checklists...</div>
      ) : (
        filteredChecklists().map((c) => (
          <div key={c.TaskID} className="p-3 bg-white rounded shadow mb-2 flex justify-between">
            <div>
              <div className="font-semibold">{c.Task}</div>
              <div className="text-sm text-gray-600">
                Frequency: {c.Freq === "D" ? "Daily" : c.Freq === "W" ? "Weekly" : c.Freq === "M" ? "Monthly" : "Yearly"} |
                Planned: {c.Planned} | Name: {c.Name}
              </div>
            </div>

            {!c.Actual && (
              <button
                onClick={() => markDone(c.TaskID)}
                disabled={processingTask === c.TaskID}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                {processingTask === c.TaskID ? "Processing..." : "Mark Done"}
              </button>
            )}
          </div>
        ))
      )}

      {filteredChecklists().length === 0 && !loading && (
        <p className="text-center text-gray-500 mt-4">No data found.</p>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
