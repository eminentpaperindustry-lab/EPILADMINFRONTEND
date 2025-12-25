import React, { useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Checklist() {
  const { user } = useContext(AuthContext);
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [processingTask, setProcessingTask] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false); // State for employee loading

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

  // ---------------- LOAD EMPLOYEES ----------------
  const loadEmployees = async () => {
    setEmployeeLoading(true); // Start loading employees
    try {
      const res = await axios.get("/employee/all", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Failed to load employees", err);
    } finally {
      setEmployeeLoading(false); // Stop loading employees
    }
  };

    const normalizeDate = (d) => {
    if (!d) return null;
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  // ---------------- LOAD CHECKLISTS FOR SELECTED EMPLOYEE ----------------
  const loadChecklists = async (employeeName) => {
    if (!employeeName) return;

    try {
      setLoading(true); // Start loading checklists
      const res = await axios.get(`/checklist/search/by-name`, {
        headers: { Authorization: `Bearer ${user.token}` },
        params: { name: employeeName }
      });
      setChecklists(res.data || []);
    } catch (err) {
      console.error("Failed to load checklists", err);
      setChecklists([]);
    } finally {
      setLoading(false); // Stop loading checklists
    }
  };

  // ---------------- MARK DONE ----------------
  const markDone = async (TaskID) => {
    try {
      setProcessingTask(TaskID);

      await axios.patch(
        `/checklist/done/${TaskID}`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Reload checklists after marking a task as done
      loadChecklists(selectedEmp); // Ensure we reload the checklist for the selected employee
    } catch (e) {
      console.error("Done Error:", e);
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
  // const filteredChecklists = () => {
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   const { start: weekStart, end: weekEnd } = getWeekRange(today);

  //   return checklists.filter((c) => {
  //     const planned = parseDate(c.Planned);
  //     const actual = parseDate(c.Actual);
  //     if (!planned) return false;

  //     planned.setHours(0, 0, 0, 0);
  //     const isDone = !!actual;
  //     const freq = c.Freq;

  //     if (activeTab === "pending") {
  //       if (isDone) return false;
  //       if (freq === "D" && planned < today) return true;
  //       if (freq === "W" && planned < weekStart) return true;
  //       if (
  //         freq === "M" &&
  //         (planned.getFullYear() < today.getFullYear() ||
  //           (planned.getFullYear() === today.getFullYear() &&
  //             planned.getMonth() < today.getMonth()))
  //       )
  //         return true;
  //       return false;
  //     }

  //     if (activeTab === "Daily") return freq === "D" && planned.getTime() === today.getTime() && !isDone;
  //     if (activeTab === "Weekly") return freq === "W" && !isDone && planned >= weekStart && planned <= weekEnd;
  //     if (activeTab === "Monthly") return freq === "M" && !isDone && planned.getMonth() === today.getMonth() && planned.getFullYear() === today.getFullYear();

  //     return false;
  //   });
  // };


    // ---------------- FILTER LOGIC ----------------
 const filteredChecklists = () => {
  if (!checklists || !Array.isArray(checklists)) return [];

  const today = normalizeDate(new Date());
  const { start: weekStart, end: weekEnd } = getWeekRange(today);

const sortedchecklists = checklists.sort((a, b) => {
  // Ensure no undefined or null values for employee names, and handle them gracefully
  const nameA = (a.Name || "").toLowerCase();  // Fallback to empty string if undefined or null
  const nameB = (b.Name || "").toLowerCase();  // Fallback to empty string if undefined or null

  return nameA.localeCompare(nameB); // Case-insensitive alphabetical sorting
});

console.log("sortedchecklists:",sortedchecklists);


  return sortedchecklists.filter((c) => {
    if (!c) return false;

    const planned = parseDate(c.Planned);
    if (!planned) return false;

    const plannedDate = normalizeDate(planned);
    const isDone = !!parseDate(c.Actual);
    const freq = c.Freq;

    // -------- PENDING --------
    if (activeTab === "pending") {
      // Pending = tasks that were supposed to be done in past and still not done
      if (isDone) return false;

      if (freq === "D" && plannedDate < today) return true;
      if (freq === "W") {
        const { start: taskWeekStart, end: taskWeekEnd } = getWeekRange(plannedDate);
        return taskWeekEnd < today; // task ka week already past
      }
      if (freq === "M") {
        return (
          plannedDate.getFullYear() < today.getFullYear() ||
          (plannedDate.getFullYear() === today.getFullYear() && plannedDate.getMonth() < today.getMonth())
        );
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

    return false;
  });
};

  useEffect(() => {
    if (user) loadEmployees(); // Load employees only once when the component mounts
  }, [user]);

  useEffect(() => {
    if (selectedEmp) {
      loadChecklists(selectedEmp); // Load checklists when an employee is selected
    }
  }, [selectedEmp]);

  // ---------------- UI ----------------
  return (
    <div className="p-4 sm:p-6 max-w-full overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4 text-center sm:text-left">
        Checklist
      </h1>

      {/* Employee Select */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Select Employee</label>
        <select
          className="w-full border p-2 rounded"
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
        >
          <option value="">-- Select Employee --</option>
            <option key={"all"} value={"all"}>{"All Checklist"}</option>

         {employees
  .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())) // Sorting employees by name in alphabetical order
  .map((emp) => (
    <option key={emp.name} value={emp.name}>
      {emp.name}
    </option>
  ))}
        </select>
      </div>

      {/* If no employee selected, show message */}
      {selectedEmp === "" && (
        <div className="p-4 text-center text-gray-600 text-base sm:text-lg">
          Please select an employee to view checklist tasks.
        </div>
      )}

      {/* Tabs */}
     {selectedEmp !== "" && ( <div className="flex flex-nowrap gap-2 mb-4 justify-center sm:justify-start overflow-x-auto scrollbar-hide">
        {["pending", "Daily", "Weekly", "Monthly"].map((tab) => (
          <button
            key={tab}
            className={`flex-shrink-0 px-3 sm:px-4 py-1 sm:py-2 rounded font-medium text-sm sm:text-base transition-colors duration-200 ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>)}

      {/* Show checklists only if employee is selected */}
      {selectedEmp && (
        <div>
          {/* Checklist Items */}
          {loading ? (
            <div className="p-6 text-center text-gray-600 text-base sm:text-lg">
              Loading Checklists...
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredChecklists().map((c) => (
                <div
                  key={c.TaskID}
                  className="p-3 sm:p-4 bg-white rounded shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center"
                >
                  <div className="mb-2 sm:mb-0 sm:max-w-[70%]">
                    <div className="font-semibold text-gray-800 text-base sm:text-lg">{c.Task}</div>
                    <div className="text-gray-600 text-sm mt-1">
                      Frequency: {c.Freq === "D" ? "Daily" : c.Freq === "W" ? "Weekly" : "Monthly"} <span>Planned: {c.Planned}</span> <span>Name: {c.Name}</span>
                    </div>
                    {/* <div className="text-gray-500 text-sm mt-1">Planned: {c.Planned}</div>
                    <div className="text-gray-500 text-sm mt-1">Name: {c.Name}</div> */}

                  </div>

                  {!c.Actual && (
                    <button
                      onClick={() => markDone(c.TaskID)}
                      disabled={processingTask === c.TaskID}
                      className={`mt-2 sm:mt-0 px-4 sm:px-5 py-1.5 sm:py-2 rounded font-medium text-white transition-colors duration-200 ${
                        processingTask === c.TaskID ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {processingTask === c.TaskID ? "Processing..." : "Mark Done"}
                    </button>
                  )}
                </div>
              ))}

              {filteredChecklists().length === 0 && (
                <p className="text-gray-500 text-center mt-6 text-sm sm:text-base">No data found.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
