

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
        // if (activeTab === "pending") {
        //   if (isDone) return false;

        //   if (freq === "D" && plannedDate < today) return true;

        //   if (freq === "W") {
        //     const { end } = getWeekRange(plannedDate);
        //     return end < today;
        //   }

        //   if (freq === "M") {
        //     return (
        //       plannedDate.getFullYear() < today.getFullYear() ||
        //       (plannedDate.getFullYear() === today.getFullYear() &&
        //         plannedDate.getMonth() < today.getMonth())
        //     );
        //   }

        //   if (freq === "Y") {
        //     return plannedDate.getFullYear() < today.getFullYear();
        //   }

        //   return false;
        // }

          if (activeTab === "pending") {
          if (isDone) return false;

          if (freq === "D" && plannedDate < today) return true;

          if (freq === "W" && plannedDate < today) return true;

          if (freq === "M" && plannedDate < today) return true;

          if (freq === "Y" && plannedDate < today) return true;

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

// const sendPendingChecklistWhatsApp = async () => {
//   if (!selectedEmp) {
//     toast.warn("Select employee first");
//     return;
//   }

//   setLoadingDownload(true);

//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // 🔹 Helper: filter pending tasks
//     const getPendingTasks = (tasks) => {
//       return (tasks || []).filter((task) => {
//         if (!task.Planned) return false;
//         if (task.Actual) return false;

//         const [datePart, timePart] = task.Planned.split(" ");
//         const [day, month, year] = datePart.split("/");
//         const [hour, minute, second] = (timePart || "00:00:00").split(":");

//         const plannedDate = new Date(year, month - 1, day, hour, minute, second);
//         plannedDate.setHours(0, 0, 0, 0);

//         return plannedDate <= today;
//       });
//     };

//     // 🔹 CASE 1: ALL employees
//     if (selectedEmp === "all") {
//       for (const emp of employees) {
//         if (!emp.number) continue;

//         const res = await axios.get(`/checklist/search/by-name`, {
//           headers: { Authorization: `Bearer ${user.token}` },
//           params: { name: emp.name },
//         });

//         const pendingTasks = getPendingTasks(res.data);

//         if (pendingTasks.length === 0) continue;

//         const taskList = pendingTasks.map((t) => t.Task);

//         await axios.post(
//           "/whatsapp/send-checklist",
//           {
//             number: `91${emp.number}`,
//             employeeName: emp.name,
//             tasks: taskList,
//           },
//           {
//             headers: { Authorization: `Bearer ${user.token}` },
//           }
//         );
//       }

//       toast.success("All employees ko unka pending checklist bhej diya ✅");
//       return;
//     }

//     // 🔹 CASE 2: Single employee
//     const res = await axios.get(`/checklist/search/by-name`, {
//       headers: { Authorization: `Bearer ${user.token}` },
//       params: { name: selectedEmp },
//     });

//     const pendingTasks = getPendingTasks(res.data);

//     if (pendingTasks.length === 0) {
//       toast.info("No pending checklist tasks to send");
//       return;
//     }

//     const taskList = pendingTasks.map((t) => t.Task);

//     const empObj = employees.find((emp) => emp.name === selectedEmp);
//     if (!empObj?.number) {
//       toast.warn("Employee WhatsApp number missing");
//       return;
//     }

//     await axios.post(
//       "/whatsapp/send-checklist",
//       {
//         number: `91${empObj.number}`,
//         employeeName: selectedEmp,
//         tasks: taskList,
//       },
//       {
//         headers: { Authorization: `Bearer ${user.token}` },
//       }
//     );

//     toast.success("WhatsApp message sent automatically ✅");

//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     toast.error("WhatsApp send failed ❌");
//   } finally {
//     setLoadingDownload(false);
//   }
// };




const sendPendingChecklistWhatsApp = async () => {
  if (!selectedEmp) {
    toast.warn("Select employee first");
    return;
  }

  setLoadingDownload(true);

  try {
    // 🔹 TODAY DATE
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 🔹 API CALL → fetch checklist
    const res = await axios.get(`/checklist/search/by-name`, {
      headers: { Authorization: `Bearer ${user.token}` },
      params: { name: selectedEmp },
    });

    // 🔹 FILTER → only pending + planned today or earlier
    const data = (res.data || []).filter((t) => {
      if (!t.Planned) return false;
      if (t.Actual) return false; // only pending

      const [datePart, timePart] = t.Planned.split(" ");
      const [day, month, year] = datePart.split("/");
      const [hour, minute, second] = timePart.split(":");

      const plannedDate = new Date(year, month - 1, day, hour, minute, second);
      plannedDate.setHours(0, 0, 0, 0);

      return plannedDate <= today;
    });

    if (data.length === 0) {
      toast.info("No pending checklist tasks to send");
      return;
    }

    // 🔹 Prepare task list text
    const taskList = data.map((c, i) => `${i + 1}. ${c.Task}`).join("\n");

    // 🔹 Find employee WhatsApp number
    const empObj = employees.find(emp => emp.name === selectedEmp);
    if (!empObj || !empObj.number) {
      toast.warn("Employee WhatsApp number not found");
      return;
    }

    const whatsappNumber = empObj.number;
    const msg = encodeURIComponent(
      `Hi ${selectedEmp}, please complete your pending tasks:\n\n${taskList}`
    );

    // 🔹 Open WhatsApp
    window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, "_blank");

    toast.success("Pending tasks sent to WhatsApp");

  } catch (err) {
    toast.error("Failed to send pending tasks");
  } finally {
    setLoadingDownload(false);
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
{/* 
      <button
  className="bg-gray-700 text-white px-4 py-2 rounded mb-4"
  onClick={sendPendingChecklistWhatsApp}

   disabled={loadingDownload} // Disable while loading
>
  {loadingDownload ? "Loading..." : " Flow-Up Pending Checklist"}
</button> */}


      <button
  className="bg-gray-700 text-white px-4 py-2 rounded mb-4"
  onClick={sendPendingChecklistWhatsApp}

   disabled={loadingDownload} // Disable while loading
>
  {loadingDownload ? "Loading..." : " Flow-Up Pending Checklist"}
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
