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
  // const normalizeDate = (date) => {
  //   if (!date) return "";
  //   const d = new Date(date);
  //   if (isNaN(d)) return "";
  //   const yyyy = d.getFullYear();
  //   const mm = String(d.getMonth() + 1).padStart(2, "0");
  //   const dd = String(d.getDate()).padStart(2, "0");
  //   return `${dd}-${mm}-${yyyy}`;
  // };


  function formatDateDDMMYYYYHHMMSS(date = new Date()) {
  // Convert to IST (UTC + 5:30)
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

  // Convert to Date object (current date if date is empty)
  const d = new Date(date || Date.now()); // If no date is passed, use current date/time.
  if (isNaN(d)) return ""; // Invalid date

  // Adjust time to IST (UTC +5:30)
  const IST_OFFSET = 5.5 * 60; // IST is UTC+5:30, so offset in minutes is 330 minutes
  
  // Get the UTC time and convert it to IST
  const utcMinutes = d.getMinutes() + d.getHours() * 60 + d.getUTCMinutes() - d.getMinutes();
  const adjustedMinutes = utcMinutes + IST_OFFSET; // Apply IST offset
  const adjustedDate = new Date(d.setMinutes(adjustedMinutes));

  const yyyy = adjustedDate.getFullYear();
  const mm = String(adjustedDate.getMonth() + 1).padStart(2, "0");
  const dd = String(adjustedDate.getDate()).padStart(2, "0");
  const hours = String(adjustedDate.getHours()).padStart(2, "0");
  const minutes = String(adjustedDate.getMinutes()).padStart(2, "0");
  const seconds = String(adjustedDate.getSeconds()).padStart(2, "0");

  // return `${dd}/${mm}/${yyyy} ${hours}:${minutes}:${seconds}`;

  return `${dd}/${mm}/${yyyy}`
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
        CreatedDate: t.CreatedDate,
        Deadline:t.Deadline,
        FinalDate: t.FinalDate,
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
            ? { ...t, Status: "Completed", FinalDate: formatDateDDMMYYYYHHMMSS() }
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
        { newDeadline: normalizeDate(form.Deadline), revisionField },
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
        Deadline: normalizeDate(form.Deadline),
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
          if(value=="Pending") {
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
      Deadline: normalizeDate(form.Deadline),

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
        Deadline: normalizeDate(form.Deadline),

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
  // const filteredTasks = tasks.filter((t) => {

  //   if (activeTab === "pending") {
  //     return t.Status !== "Completed" &&
  //       (!t.Taskcompletedapproval || t.Taskcompletedapproval === "Pending" || t.Taskcompletedapproval === "NotApproved");
  //   } else if (activeTab === "completed") {
  //     return t.Status === "Completed" &&
  //       (!t.Taskcompletedapproval || t.Taskcompletedapproval === "Pending" || t.Taskcompletedapproval === "NotApproved");
  //   } else if (activeTab === "approved") {
  //     return t.Status === "Completed" && t.Taskcompletedapproval === "Approved";
  //   }else if (activeTab === "Today_Followup") {
  //     return t.Deadline <= formatDateDDMMYYYYHHMMSS();
  //   }
  //   return false;
  // });

// Step 1: Sort tasks alphabetically by employee name
const sortedTasks = tasks.sort((a, b) => {
  // Ensure no undefined or null values for employee names, and handle them gracefully
  const nameA = (a.Name || "").toLowerCase();  // Fallback to empty string if undefined or null
  const nameB = (b.Name || "").toLowerCase();  // Fallback to empty string if undefined or null

  return nameA.localeCompare(nameB); // Case-insensitive alphabetical sorting
});

// Step 2: Apply the filtering based on activeTab
const filteredTasks = sortedTasks.filter((t) => {
  if (activeTab === "pending") {
    return t.Status !== "Completed" &&
      (!t.Taskcompletedapproval || t.Taskcompletedapproval === "Pending" || t.Taskcompletedapproval === "NotApproved");
  } else if (activeTab === "completed") {
    return t.Status === "Completed" &&
      (!t.Taskcompletedapproval || t.Taskcompletedapproval === "Pending" || t.Taskcompletedapproval === "NotApproved");
  } else if (activeTab === "approved") {
    return t.Status === "Completed" && t.Taskcompletedapproval === "Approved";
  } else if (activeTab === "Today_Followup") {
    return t.Deadline <= formatDateDDMMYYYYHHMMSS();
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
         {employees
  .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())) // Sorting employees by name in alphabetical order
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
         <button
              className={`px-3 py-2 rounded ${activeTab === "Today_Followup" ? "bg-purple-600 text-white" : "bg-gray-300"}`}
              onClick={() => setActiveTab("Today_Followup")}
            >
              Today Followup
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
                      Revision: {task.Revisions || "0"}<br />
                      Name:{task.Name||"_"}
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
        // <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        //   <div className="bg-white p-6 rounded shadow w-full max-w-sm">
        //     <h3 className="font-bold mb-3">Shift Deadline for {shiftTask.TaskName}</h3>
        //     <input
        //       type="date"
        //       className="w-full border p-2 rounded mb-3"
        //       value={shiftDate}
        //       onChange={(e) => setShiftDate(e.target.value)}
        //     />
        //     <div className="flex justify-end gap-3">
        //       <button
        //         className="bg-blue-600 text-white px-4 py-2 rounded"
        //         onClick={confirmShift}
        //         disabled={loadingShiftBtn}
        //       >
        //         {loadingShiftBtn ? "Processing..." : "Confirm"}
        //       </button>
        //       <button
        //         className="px-4 py-2 border rounded"
        //         onClick={() => setShiftTask(null)}
        //       >
        //         Cancel
        //       </button>
        //     </div>
        //   </div>
        // </div>


         <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded shadow w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-3">
              Shift Deadline for {shiftTask.TaskName}
            </h3>
            <input
              type="date"
              className="w-full border p-2 rounded mb-3"
              value={form.Deadline}
              // onChange={(e) => setShiftDate(e.target.value)}
              onChange={(e) => setForm({ ...form, Deadline: e.target.value })}


            />
            <div className="flex gap-3 justify-end">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={confirmShift}
                disabled={loadingShiftBtn}
              >
                {loadingShiftBtn ? "Processing..." : "Confirm"}
              </button>
              <button
                className="px-4 py-2 rounded border"
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
