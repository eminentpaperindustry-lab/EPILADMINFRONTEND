import React, { useEffect, useState, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Delegation() {
  const { user } = useContext(AuthContext);

  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("pending"); // pending / completed / approved
  const [shiftTask, setShiftTask] = useState(null);
  const [shiftDate, setShiftDate] = useState("");
  const [loadingShiftBtn, setLoadingShiftBtn] = useState(false);
  const [loadingTaskId, setLoadingTaskId] = useState(null);
  const [loadingApprovalId, setLoadingApprovalId] = useState(null);

  const [editTask, setEditTask] = useState(null);  // For editing task
  const [deleteTaskId, setDeleteTaskId] = useState(null); // For delete task confirmation

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    TaskName: "",
    Deadline: "",
    Priority: "",
    Notes: "",
  });

  // -----------------------
  function formatDateDDMMYYYYHHMMSS(date = new Date()) {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(utc + istOffset);

    const dd = String(istDate.getDate()).padStart(2, "0");
    const mm = String(istDate.getMonth() + 1).padStart(2, "0");
    const yyyy = istDate.getFullYear();
    const hh = String(istDate.getHours()).padStart(2, "0");
    const min = String(istDate.getMinutes()).padStart(2, "0");
    const ss = String(istDate.getSeconds()).padStart(2, "0");

    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  }

  const normalizeDate = (date) => {
    if (!date) return "";
    const d = new Date(date || Date.now());
    if (isNaN(d)) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy}`;
  };

  // -----------------------
  const loadEmployees = async () => {
    try {
      const res = await axios.get("/employee/all", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Failed to load employees", err);
      toast.error("Failed to load employees");
    }
  };

  const loadUserTasks = async (name) => {
    if (!name) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/delegations/search/by-name?name=${encodeURIComponent(name)}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const formattedTasks = res.data.map((t) => ({
        ...t,
        CreatedDate: t.CreatedDate,
        Deadline: t.Deadline,
        FinalDate: t.FinalDate,
      }));

      setTasks(formattedTasks);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadEmployees();
  }, [user]);

  useEffect(() => {
    if (selectedEmp) loadUserTasks(selectedEmp);
  }, [selectedEmp]);

  // -----------------------
  const handleDone = async (taskID) => {
    setLoadingTaskId(taskID);
    try {
      await axios.patch(`/delegations/done/${taskID}`, null, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setTasks(
        tasks.map((t) =>
          t.TaskID === taskID
            ? { ...t, Status: "Completed", FinalDate: formatDateDDMMYYYYHHMMSS() }
            : t
        )
      );
      toast.success("Task marked as done");
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark task as done");
    } finally {
      setLoadingTaskId(null);
    }
  };

  const openShiftPicker = (task) => {
    setShiftTask(task);
    setShiftDate("");
    setForm({ ...form, Deadline: task.Deadline });
  };

  const confirmShift = async () => {
    if (!form.Deadline) {
      toast.warn("Select new deadline");
      return;
    }
    setLoadingShiftBtn(true);
    const revisionField = shiftTask.Revisions === 0 ? "Revision1" : "Revision2";

    try {
      await axios.patch(
        `/delegations/shift/${shiftTask.TaskID}`,
        { newDeadline: normalizeDate(form.Deadline), revisionField },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setTasks(
        tasks.map((t) =>
          t.TaskID === shiftTask.TaskID
            ? {
                ...t,
                [revisionField]: normalizeDate(form.Deadline),
                Deadline: normalizeDate(form.Deadline),
                Revisions: t.Revisions + 1,
                Status: "Shifted",
              }
            : t
        )
      );

      setShiftTask(null);
      setForm({ ...form, Deadline: "" });
      toast.success("Task deadline shifted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to shift deadline");
    } finally {
      setLoadingShiftBtn(false);
    }
  };

  const createTask = async () => {
    if (!selectedEmp) {
      toast.warn("Select employee first");
      return;
    }
    if (!form.TaskName || !form.Deadline) {
      toast.warn("Task Name & Deadline required");
      return;
    }

    setLoadingTaskId("create");
    try {
      const payload = {
        TaskName: form.TaskName,
        Deadline: normalizeDate(form.Deadline),
        Name: selectedEmp,
      };
      const res = await axios.post("/delegations/", payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      console.log("tsting: ", res);
      if(res.data.ok === true){
     
  loadUserTasks();
      setTasks([
        {
          TaskID: res.data.TaskID,
          Name: selectedEmp,
          TaskName: form.TaskName,
          Deadline: normalizeDate(form.Deadline),
          CreatedDate: formatDateDDMMYYYYHHMMSS(),
          Revision1: "",
          Revision2: "",
          FinalDate: "",
          Revisions: 0,
          Priority: form.Priority,
          Status: "Pending",
          Followup: form.Notes,
          Taskcompletedapproval: "Pending",
        },
        ...tasks,
      ]);

      setForm({ TaskName: "", Deadline: "", Priority: "", Notes: "" });
      setShowCreate(false);
      toast.success("Task created successfully");
}else{
   toast.error("Failed to create task Technical Issue Please Re Create");
}

  
    } catch (err) {
      console.error(err);
      toast.error("Failed to create task");
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleApprovalChange = async (taskID, value) => {
    setLoadingApprovalId(taskID);
    try {
      await axios.patch(
        `/delegations/approve/${taskID}`,
        { approvalStatus: value },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setTasks(
        tasks.map((t) => {
          if (value === "Pending") {
            return t.TaskID === taskID
              ? { ...t, FinalDate: "", Status: "Pending", Taskcompletedapproval: value }
              : t;
          } else {
            return t.TaskID === taskID ? { ...t, Taskcompletedapproval: value } : t;
          }
        })
      );
      toast.success("Approval status updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update approval");
    } finally {
      setLoadingApprovalId(null);
    }
  };

  const editTaskDetails = (task) => {
    setEditTask(task);
    setForm({
      TaskName: task.TaskName,
      Deadline: task.Deadline,
    });
  };

  const updateTask = async () => {
    if (!form.TaskName || !form.Deadline) {
      toast.warn("Task Name and Deadline are required");
      return;
    }

    setLoadingTaskId("update");
    try {
      const payload = {
        TaskName: form.TaskName,
        Deadline: normalizeDate(form.Deadline),
      };

      await axios.put(`/delegations/update/${editTask.TaskID}`, payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setTasks(
        tasks.map((t) => (t.TaskID === editTask.TaskID ? { ...t, ...payload } : t))
      );

      setEditTask(null);
      setForm({ TaskName: "", Deadline: "", Priority: "", Notes: "" });
      toast.success("Task updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update task");
    } finally {
      setLoadingTaskId(null);
    }
  };

  const deleteTask = async (taskID) => {
    setLoadingTaskId(taskID);
    try {
      await axios.delete(`/delegations/delete/${taskID}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setTasks(tasks.filter((t) => t.TaskID !== taskID));
      toast.success("Task deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete task");
    } finally {
      setLoadingTaskId(null);
      setDeleteTaskId(null);
    }
  };

  // -----------------------
  const sortedTasks = tasks.sort((a, b) => {
    const nameA = (a.Name || "").toLowerCase();
    const nameB = (b.Name || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const filteredTasks = sortedTasks.filter((t) => {
    if (activeTab === "pending") {
      return (
        t.Status !== "Completed" &&
        (!t.Taskcompletedapproval ||
          t.Taskcompletedapproval === "Pending" ||
          t.Taskcompletedapproval === "NotApproved")
      );
    } else if (activeTab === "completed") {
      return (
        t.Status === "Completed" &&
        (!t.Taskcompletedapproval ||
          t.Taskcompletedapproval === "Pending" ||
          t.Taskcompletedapproval === "NotApproved")
      );
    } else if (activeTab === "approved") {
      return t.Status === "Completed" && t.Taskcompletedapproval === "Approved";
    } else if (activeTab === "Today_Followup") {
      return t.Deadline <= formatDateDDMMYYYYHHMMSS() && t.Status !== "Completed";
    }
    return false;
  });

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Employee Select */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Select Employee</label>
        <select
          className="w-full border p-2 rounded"
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
        >
          <option value="">-- Select Employee --</option>
          <option key={"all"} value={"all"}>
            All Delegation
          </option>
          {employees
            .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
            .map((emp) => (
              <option key={emp.name} value={emp.name}>
                {emp.name}
              </option>
            ))}
        </select>
      </div>

      {/* Create Task Button */}
      {selectedEmp && (
        <div className="mb-6">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "Cancel" : "Create Task"}
          </button>
        </div>
      )}

      {/* Create Task Form */}
      {showCreate && (
        <div className="bg-white p-4 rounded shadow border mb-6">
          <label htmlFor="taskName" className="block text-sm font-semibold mb-2">
            Task Name
          </label>
          <input
            type="text"
            placeholder="Task Name"
            className="w-full border p-2 rounded mb-2"
            value={form.TaskName}
            onChange={(e) => setForm({ ...form, TaskName: e.target.value })}
          />
          <label htmlFor="planDate" className="block text-sm font-semibold mb-2">
            Plan Date
          </label>
          <input
            type="date"
            className="w-full border p-2 rounded mb-2"
            value={form.Deadline}
            onChange={(e) => setForm({ ...form, Deadline: e.target.value })}
          />

          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={createTask}
            disabled={loadingTaskId === "create"}
          >
            {loadingTaskId === "create" ? "Creating..." : "Save Task"}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && selectedEmp && (
        <div className="text-center text-lg p-6">Loading tasks...</div>
      )}

      {!selectedEmp && (
        <div className="text-center text-gray-500 mt-10">
          Please select an employee to view delegation tasks.
        </div>
      )}

      {!loading && selectedEmp && (
        <>
          {/* Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              className={`px-3 py-2 rounded ${
                activeTab === "pending" ? "bg-blue-600 text-white" : "bg-gray-300"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              Pending / Shifted
            </button>
            <button
              className={`px-3 py-2 rounded ${
                activeTab === "completed" ? "bg-green-600 text-white" : "bg-gray-300"
              }`}
              onClick={() => setActiveTab("completed")}
            >
              Completed
            </button>
            <button
              className={`px-3 py-2 rounded ${
                activeTab === "approved" ? "bg-purple-600 text-white" : "bg-gray-300"
              }`}
              onClick={() => setActiveTab("approved")}
            >
              Approved
            </button>
            <button
              className={`px-3 py-2 rounded ${
                activeTab === "Today_Followup" ? "bg-purple-600 text-white" : "bg-gray-300"
              }`}
              onClick={() => setActiveTab("Today_Followup")}
            >
              Today Followup
            </button>
          </div>

          {/* Task List */}
          <div className="grid gap-4 max-h-[500px] overflow-y-auto">
            {filteredTasks.map((task) => (
              <div key={task.TaskID} className="p-4 bg-white rounded shadow border">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold text-lg">{task.TaskName}</div>
                    <div className="text-sm text-gray-600">
                      Created: {task.CreatedDate || "—"}, <span/>
                      Deadline: {task.Deadline || "—"}, <span />
                      Completed: {task.FinalDate || "—"}, <span />
                      Revision: {task.Revisions || "0"},<span />
                      Name: {task.Name || "_"}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      task.Status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : task.Status === "Shifted"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {task.Status}
                  </span>
                </div>

                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => editTaskDetails(task)}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTaskId(task.TaskID)}
                    className="bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </button>
                  {activeTab === "pending" && task.Status !== "Completed" && (
                    <>
                      {/* <button
                        onClick={() => handleDone(task.TaskID)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        disabled={loadingTaskId === task.TaskID}
                      >
                        {loadingTaskId === task.TaskID ? "Processing..." : "Mark Done"}
                      </button>
                      <button
                        onClick={() => openShiftPicker(task)}
                        className="bg-yellow-600 text-white px-3 py-1 rounded"
                        disabled={task.Revisions >= 2}
                      >
                        {task.Revisions >= 2 ? "Max Shifts Reached" : "Shift Deadline"}
                      </button> */}
                    </>
                  )}
                </div>

                {activeTab === "completed" && task.Status === "Completed" && (
                  <div className="mt-3">
                    <label className="text-sm font-medium mr-2">Approval:</label>
                    <select
                      className="border p-1 rounded"
                      value={""}
                      onChange={(e) =>
                        handleApprovalChange(task.TaskID, e.target.value)
                      }
                      disabled={loadingApprovalId === task.TaskID}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      <option value="Approved">Approved</option>
                      {/* <option value="NotApproved">NotApproved</option> */}
                      <option value="Pending">Pending</option>
                    </select>
                    {loadingApprovalId === task.TaskID ? "Processing..." : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}
