import React, { useEffect, useState, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

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
  const normalizeDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d)) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
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
        CreatedDate: normalizeDate(t.CreatedDate),
        Deadline: normalizeDate(t.Deadline),
        Revision1: normalizeDate(t.Revision1),
        Revision2: normalizeDate(t.Revision2),
        FinalDate: normalizeDate(t.FinalDate),
      }));

      setTasks(formattedTasks);
    } catch (err) {
      console.error(err);
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
      const today = normalizeDate(new Date());
      setTasks(
        tasks.map((t) =>
          t.TaskID === taskID
            ? { ...t, Status: "Completed", FinalDate: today }
            : t
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTaskId(null);
    }
  };

  const openShiftPicker = (task) => {
    setShiftTask(task);
    setShiftDate("");
  };

  const confirmShift = async () => {
    if (!shiftDate) return;

    setLoadingShiftBtn(true);
    const revisionField = shiftTask.Revisions === 0 ? "Revision1" : "Revision2";

    try {
      await axios.patch(
        `/delegations/shift/${shiftTask.TaskID}`,
        { newDeadline: shiftDate, revisionField },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setTasks(
        tasks.map((t) =>
          t.TaskID === shiftTask.TaskID
            ? {
                ...t,
                [revisionField]: normalizeDate(shiftDate),
                Deadline: normalizeDate(shiftDate),
                Revisions: t.Revisions + 1,
                Status: "Shifted",
              }
            : t
        )
      );

      setShiftTask(null);
      setShiftDate("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingShiftBtn(false);
    }
  };

  const createTask = async () => {
    if (!selectedEmp) {
      alert("Select employee first");
      return;
    }
    if (!form.TaskName || !form.Deadline) {
      alert("Task Name & Deadline required");
      return;
    }

    setLoadingTaskId("create");
    try {
      const payload = {
        TaskName: form.TaskName,
        Deadline: form.Deadline,
        Priority: form.Priority,
        Notes: form.Notes,
        Name: selectedEmp,
      };
      const res = await axios.post("/delegations/", payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const today = normalizeDate(new Date());

      setTasks([
        {
          TaskID: res.data.TaskID,
          Name: selectedEmp,
          TaskName: form.TaskName,
          Deadline: normalizeDate(form.Deadline),
          CreatedDate: today,
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
    } catch (err) {
      console.error(err);
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
        tasks.map((t) =>{
          if(value="Pending") {
         return t.TaskID === taskID ? { ...t,FinalDate:"",Status:"Pending", Taskcompletedapproval: value } : t

          }else{
         return t.TaskID === taskID ? { ...t, Taskcompletedapproval: value } : t
          }
        }
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApprovalId(null);
    }
  };

  // Edit Task
  const editTaskDetails = (task) => {
    setEditTask(task);
    setForm({
      TaskName: task.TaskName,
      Deadline: task.Deadline,
      Priority: task.Priority,
      Notes: task.Followup,
    });
  };

  const updateTask = async () => {
    if (!form.TaskName || !form.Deadline) {
      alert("Task Name and Deadline are required.");
      return;
    }

    setLoadingTaskId("update");
    try {
      const payload = {
        TaskName: form.TaskName,
        Deadline: form.Deadline,
        Priority: form.Priority,
        Notes: form.Notes,
      };

      await axios.put(`/delegations/update/${editTask.TaskID}`, payload, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setTasks(
        tasks.map((t) =>
          t.TaskID === editTask.TaskID
            ? { ...t, ...payload }
            : t
        )
      );

      setEditTask(null);
      setForm({ TaskName: "", Deadline: "", Priority: "", Notes: "" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTaskId(null);
    }
  };

  // Delete Task
  const deleteTask = async (taskID) => {
    setLoadingTaskId(taskID);
    try {
      await axios.delete(`/delegations/delete/${taskID}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setTasks(tasks.filter((t) => t.TaskID !== taskID));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTaskId(null);
      setDeleteTaskId(null); // Close delete modal
    }
  };


  // -----------------------
  const filteredTasks = tasks.filter((t) => {
    if (activeTab === "pending") {
      return t.Status !== "Completed" &&
        (!t.Taskcompletedapproval || t.Taskcompletedapproval === "Pending" || t.Taskcompletedapproval === "NotApproved");
    } else if (activeTab === "completed") {
      return t.Status === "Completed" &&
        (!t.Taskcompletedapproval || t.Taskcompletedapproval === "Pending" || t.Taskcompletedapproval === "NotApproved");
    } else if (activeTab === "approved") {
      return t.Status === "Completed" && t.Taskcompletedapproval === "Approved";
    }
    return false;
  });

  // -----------------------
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
            <option key={"all"} value={"all"}>{"All Delegation"}</option>
          {employees.map((emp) => (
            <option key={emp.name} value={emp.name}>{emp.name}</option>
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
          <input
            type="text"
            placeholder="Task Name"
            className="w-full border p-2 rounded mb-2"
            value={form.TaskName}
            onChange={(e) => setForm({ ...form, TaskName: e.target.value })}
          />
          <input
            type="date"
            className="w-full border p-2 rounded mb-2"
            value={form.Deadline}
            onChange={(e) => setForm({ ...form, Deadline: e.target.value })}
          />
          <select
            className="w-full border p-2 rounded mb-2"
            value={form.Priority}
            onChange={(e) => setForm({ ...form, Priority: e.target.value })}
          >
            <option value="">Priority</option>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
            <option value="High">High</option>
          </select>
          <textarea
            placeholder="Notes"
            className="w-full border p-2 rounded mb-2"
            value={form.Notes}
            onChange={(e) => setForm({ ...form, Notes: e.target.value })}
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
              className={`px-3 py-2 rounded ${activeTab === "pending" ? "bg-blue-600 text-white" : "bg-gray-300"}`}
              onClick={() => setActiveTab("pending")}
            >
              Pending / Shifted
            </button>
            <button
              className={`px-3 py-2 rounded ${activeTab === "completed" ? "bg-green-600 text-white" : "bg-gray-300"}`}
              onClick={() => setActiveTab("completed")}
            >
              Completed
            </button>
            <button
              className={`px-3 py-2 rounded ${activeTab === "approved" ? "bg-purple-600 text-white" : "bg-gray-300"}`}
              onClick={() => setActiveTab("approved")}
            >
              Approved
            </button>
          </div>

          {/* Task List */}
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <div key={task.TaskID} className="p-4 bg-white rounded shadow border">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold text-lg">{task.TaskName}</div>
                    <div className="text-sm text-gray-600">
                      Created: {task.CreatedDate || "—"} <br />
                      Deadline: {task.Deadline || "—"} <br />
                      Completed: {task.FinalDate || "—"} <br />
                      Priority: {task.Priority || "Normal"}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    task.Status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : task.Status === "Shifted"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
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
                </div>


                {/* Pending Tab buttons */}
                {/* {activeTab === "pending" && !task.FinalDate && (
                  <div className="mt-3 flex gap-3">
                    <button
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
                    </button>
                  </div>
                )} */}

                {/* Completed Tab approval dropdown */}
                {activeTab === "completed" && task.Status === "Completed" && (
                  <div className="mt-3">
                    <label className="text-sm font-medium mr-2">Approval:</label>
                    <select
                      className="border p-1 rounded"
                      value={""} // Initially unselected
                      onChange={(e) => handleApprovalChange(task.TaskID, e.target.value)}
                      disabled={loadingApprovalId === task.TaskID}
                    >
                      <option value="" disabled>Select Approval</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                    </select>
                    {loadingApprovalId === task.TaskID && <span className="ml-2 text-sm text-gray-500">Updating...</span>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center text-gray-500 mt-10">No tasks found.</div>
          )}
        </>
      )}

      {/* Shift Modal */}
      {shiftTask && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded shadow w-full max-w-sm">
            <h3 className="font-bold mb-3">Shift Deadline for {shiftTask.TaskName}</h3>
            <input
              type="date"
              className="w-full border p-2 rounded mb-3"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={confirmShift}
                disabled={loadingShiftBtn}
              >
                {loadingShiftBtn ? "Processing..." : "Confirm"}
              </button>
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setShiftTask(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Edit Task Modal */}
      {editTask && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded shadow w-full max-w-sm">
            <h3 className="font-bold mb-3">Edit Task</h3>
            <input
              type="text"
              className="w-full border p-2 rounded mb-3"
              value={form.TaskName}
              onChange={(e) => setForm({ ...form, TaskName: e.target.value })}
            />

            <div className="flex justify-end gap-3">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={updateTask}
                disabled={loadingTaskId === "update"}
              >
                {loadingTaskId === "update" ? "Updating..." : "Save Changes"}
              </button>
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setEditTask(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Task Modal */}
      {deleteTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded shadow w-full max-w-sm">
            <h3 className="font-bold mb-3">Are you sure you want to delete this task?</h3>
            <div className="flex justify-end gap-3">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={() => deleteTask(deleteTaskId)}
                disabled={loadingTaskId === deleteTaskId}
              >
                {loadingTaskId === deleteTaskId ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setDeleteTaskId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
