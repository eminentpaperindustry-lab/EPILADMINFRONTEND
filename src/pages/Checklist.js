import React, { useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRef } from "react";


export default function Checklist() {
  const { user } = useContext(AuthContext);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [processingTask, setProcessingTask] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);
  const whatsappRef = useRef(null);
  
  // ========== CREATE TASK MODAL STATES ==========
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTaskLoading, setCreateTaskLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    task: "",
    freq: "D",
    dayOrDate: ""
  });

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
    setEmployeeLoading(true);
    try {
      const res = await axios.get("/employee/all", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setEmployees(res.data || []);
    } catch (err) {
      toast.error("Failed to load employees");
    } finally {
      setEmployeeLoading(false);
    }
  };

  // ---------------- LOAD CHECKLISTS ----------------
  const loadChecklists = async (employeeName) => {
    if (!employeeName) return;
    setLoading(true);
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
      setLoading(false);
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

  // ========== CREATE TASK FUNCTION ==========
  const handleCreateTask = async (e) => {
    e.preventDefault();
    
    if (!selectedEmp) {
      toast.warn("Please select an employee first");
      return;
    }
    
    if (selectedEmp === "all") {
      toast.warn("Cannot create task for 'All Checklist'. Please select specific employee.");
      return;
    }
    
    if (!createForm.task) {
      toast.warn("Task description is required");
      return;
    }
    
    if (createForm.freq !== 'D' && !createForm.dayOrDate) {
      toast.warn(`Please enter ${createForm.freq === 'W' ? 'day (e.g., Monday)' : 'date (e.g., 15)'}`);
      return;
    }
    
    setCreateTaskLoading(true);
    
    try {
      // API call with all required data
      const response = await axios.post("/checklist/create-template", {
        task: createForm.task,
        freq: createForm.freq,
        dayOrDate: createForm.freq !== 'D' ? createForm.dayOrDate : "",
        employeeName: selectedEmp
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      // Success message
      toast.success(`✅ Task created successfully!`);
      
      // Show how many tasks created for current month
      if (response.data?.currentMonthTasks?.length > 0) {
        toast.info(`📅 ${response.data.currentMonthTasks.length} tasks created for this month`);
      }
      
      // Close modal and reset form
      setShowCreateModal(false);
      setCreateForm({
        task: "",
        freq: "D",
        dayOrDate: ""
      });
      
      // Reload checklists
      loadChecklists(selectedEmp);
      
    } catch (err) {
      console.error("Create task error:", err);
      toast.error(err.response?.data?.error || "Failed to create task");
    } finally {
      setCreateTaskLoading(false);
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

        if (activeTab === "pending") {
          if (isDone) return false;

          if (freq === "D" && plannedDate < today) return true;
          if (freq === "W" && plannedDate < today) return true;
          if (freq === "M" && plannedDate < today) return true;
          if (freq === "Y" && plannedDate < today) return true;

          return false;
        }

        if (activeTab === "Daily") {
          return freq === "D" && !isDone && plannedDate.getTime() === today.getTime();
        }

        if (activeTab === "Weekly") {
          return freq === "W" && !isDone && plannedDate >= weekStart && plannedDate <= weekEnd;
        }

        if (activeTab === "Monthly") {
          return (
            freq === "M" &&
            !isDone &&
            plannedDate.getMonth() === today.getMonth() &&
            plannedDate.getFullYear() === today.getFullYear()
          );
        }

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

  const sendPendingChecklistWhatsApp = async () => {
    if (!selectedEmp) {
      toast.warn("Select employee first");
      return;
    }

    whatsappRef.current = window.open("", "_blank");

    if (!whatsappRef.current) {
      toast.error("Popup blocked. Allow popups for this site.");
      return;
    }

    whatsappRef.current.document.write("Preparing WhatsApp message...");

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const res = await axios.get(`/checklist/search/by-name`, {
        headers: { Authorization: `Bearer ${user.token}` },
        params: { name: selectedEmp },
      });

      const data = (res.data || []).filter((t) => {
        if (!t.Planned || t.Actual) return false;
        const [d, m, y] = t.Planned.split(" ")[0].split("/");
        const plannedDate = new Date(y, m - 1, d);
        plannedDate.setHours(0, 0, 0, 0);
        return plannedDate <= today;
      });

      if (!data.length) {
        whatsappRef.current.close();
        toast.info("No pending tasks");
        return;
      }

      const taskList = data.map((c, i) => `${i + 1}. ${c.Task}`).join("\n");

      const emp = employees.find(e => e.name === selectedEmp);
      if (!emp?.number) {
        whatsappRef.current.close();
        toast.warn("WhatsApp number not found");
        return;
      }

      const msg = encodeURIComponent(
        `Hi ${selectedEmp}, please complete your pending tasks:\n\n${taskList}`
      );

      whatsappRef.current.location.replace(
        `https://wa.me/${emp.number}?text=${msg}`
      );

      toast.info("WhatsApp opened. Please send the message");

    } catch (err) {
      whatsappRef.current?.close();
      toast.error("Something went wrong");
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">Checklist</h1>

      {/* Employee Select and Create Task Button */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <select
          className="w-full sm:flex-1 border p-2 rounded"
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
        
        {/* Create Task Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedEmp || selectedEmp === "all"}
          className={`px-4 py-2 rounded whitespace-nowrap ${
            !selectedEmp || selectedEmp === "all"
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          + Create Task
        </button>
      </div>

      <button
        className="bg-gray-700 text-white px-4 py-2 rounded mb-4"
        onClick={sendPendingChecklistWhatsApp}
        disabled={loadingDownload}
      >
        {loadingDownload ? "Loading..." : "Flow-Up Pending Checklist"}
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

      {/* ========== CREATE TASK MODAL ========== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              Create New Task for <span className="text-blue-600">{selectedEmp}</span>
            </h2>
            
            <form onSubmit={handleCreateTask}>
              {/* Task Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Task Description *</label>
                <input
                  type="text"
                  value={createForm.task}
                  onChange={(e) => setCreateForm({...createForm, task: e.target.value})}
                  className="w-full border rounded p-2"
                  placeholder="Enter task description"
                  required
                />
              </div>
              
              {/* Frequency Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Frequency *</label>
                <select
                  value={createForm.freq}
                  onChange={(e) => {
                    setCreateForm({
                      ...createForm, 
                      freq: e.target.value,
                      dayOrDate: ""
                    });
                  }}
                  className="w-full border rounded p-2"
                >
                  <option value="D">Daily</option>
                  <option value="W">Weekly</option>
                  <option value="M">Monthly</option>
                  <option value="Y">Yearly</option>
                </select>
              </div>
              
              {/* Day/Date Input */}
              {createForm.freq !== 'D' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    {createForm.freq === 'W' ? 'Select Day *' : 'Enter Date *'}
                  </label>
                  
                  {createForm.freq === 'W' ? (
                    <select
                      value={createForm.dayOrDate}
                      onChange={(e) => setCreateForm({...createForm, dayOrDate: e.target.value})}
                      className="w-full border rounded p-2"
                      required
                    >
                      <option value="">-- Select Day --</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={createForm.dayOrDate}
                      onChange={(e) => setCreateForm({...createForm, dayOrDate: e.target.value})}
                      className="w-full border rounded p-2"
                      placeholder="Enter date (1-31)"
                      min="1"
                      max="31"
                      required
                    />
                  )}
                </div>
              )}
              
              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({task: "", freq: "D", dayOrDate: ""});
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {createTaskLoading ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}