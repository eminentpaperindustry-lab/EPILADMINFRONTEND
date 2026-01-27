import React, { useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState("all"); 
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [weekRange, setWeekRange] = useState({ start: "", end: "" });

  const [delData, setDelData] = useState({});
  const [checkData, setCheckData] = useState({});
  const [htAssigned, setHtAssigned] = useState({});
  const [htCreated, setHtCreated] = useState({});
  const [stAssigned, setStAssigned] = useState({});
  const [stCreated, setStCreated] = useState({});

  const loadEmployees = async () => {
    try {
      const res = await axios.get("/employee/all", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setEmployees(res.data || []);
    } catch (err) { console.error(err); }
  };

  const loadData = async (isInitial = false) => {
    if (selectedEmployee === "all") return;
    try {
      if (isInitial) setLoading(true);
      else setIsUpdating(true);

      const params = { month: selectedMonth, week: selectedWeek, selectedName: selectedEmployee };
      const [delRes, clRes, htRes, stRes] = await Promise.all([
        axios.get("/delegations/filter", { params }),
        axios.get("/checklist/filter", { params }),
        axios.get("/helpTickets/filter", { params }),
        axios.get("/support-tickets/filter", { params }) 
      ]);

      setDelData(delRes.data || {});
      setCheckData(clRes.data || {});
      setWeekRange({ start: delRes.data?.weekStart || "N/A", end: delRes.data?.weekEnd || "N/A" });
      setHtAssigned(htRes.data?.assigned || {});
      setHtCreated(htRes.data?.created || {});
      setStAssigned(stRes.data?.assigned || {});
      setStCreated(stRes.data?.created || {});

      setLoading(false);
      setIsUpdating(false);
    } catch (err) {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  useEffect(() => { loadEmployees().then(() => setLoading(false)); }, []);
  useEffect(() => { if (selectedEmployee !== "all") loadData(false); }, [selectedMonth, selectedWeek, selectedEmployee]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0f172a]">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="h-screen w-full flex flex-col bg-[#f1f5f9] overflow-hidden">
      
      {/* --- HEADER (FIXED OVERLAP) --- */}
      {/* Maine top-0 ki jagah margin/top adjust kiya hai taaki override na ho */}
      <header className="sticky top-0 w-full bg-[#1e293b] text-white px-6 py-3 flex-shrink-0 z-[40] shadow-lg border-b border-slate-700">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <div>
              <h1 className="text-lg font-black uppercase italic leading-none tracking-tight">Management Dashboard</h1>
              {selectedEmployee !== "all" && <p className="text-[10px] font-bold text-blue-400 mt-1 uppercase">{weekRange.start} — {weekRange.end}</p>}
            </div>
          </div>

          {/* FILTER ROW */}
          <div className="flex items-center bg-slate-900 border border-slate-700 p-1 rounded-xl shadow-inner overflow-x-auto max-w-full">
             <div className="flex items-center px-4 border-r border-slate-700 whitespace-nowrap">
                <span className="text-[9px] font-black text-slate-500 uppercase mr-3">Member</span>
                <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer">
                  <option value="all" className="text-black italic">Select Employee</option>
                  {employees.map((emp) => <option key={emp._id} value={emp.name} className="text-black">{emp.name}</option>)}
                </select>
             </div>
             <div className="flex items-center px-4 border-r border-slate-700 whitespace-nowrap">
                <span className="text-[9px] font-black text-slate-500 uppercase mr-3">Month</span>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer">
                  {Array.from({ length: 12 }, (_, i) => (<option key={i} value={i + 1} className="text-black">{new Date(0, i).toLocaleString("default", { month: "long" })}</option>))}
                </select>
             </div>
             <div className="flex items-center px-4 whitespace-nowrap">
                <span className="text-[9px] font-black text-slate-500 uppercase mr-3">Week</span>
                <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value === "all" ? "all" : Number(e.target.value))} className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer">
                  <option value="all" className="text-black">All Weeks</option>
                  {[1, 2, 3, 4, 5].map(w => <option key={w} value={w} className="text-black">Week {w}</option>)}
                </select>
             </div>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 overflow-y-auto w-full relative">
        {selectedEmployee === "all" ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-6 text-slate-200 animate-bounce">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-[0.2em]">Select Employee Name</h2>
            <p className="text-slate-400 italic mt-2">Data will be visible once an employee is selected from the dropdown above.</p>
          </div>
        ) : (
          <div className="w-full pb-10">
            {isUpdating && <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[1px] flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}

            <Section title="Delegation Performance" accent="bg-blue-600">
              <Card title="Total Work" value={delData.totalWork} theme="blue" />
              <Card title="Pending" value={delData.pendingTaskCount} theme="amber" />
              <Card title="Completed" value={delData.completedTaskCount} theme="emerald" />
              <Card title="On Time" value={delData.onTimeCount} theme="cyan" />
              <Card title="Pending %" value={`${delData.pendingTaskPercentage}%`} theme="indigo" />
              <Card title="Delayed %" value={`${delData.delayedWorkPercentage}%`} theme="rose" />
            </Section>

            <Section title="Checklist Summary" accent="bg-emerald-600">
              <Card title="Total Tasks" value={checkData.totalTasks} theme="blue" />
              <Card title="Pending" value={checkData.pendingTasks} theme="amber" />
              <Card title="Completed" value={checkData.completedTasks} theme="emerald" />
              <Card title="On Time" value={checkData.onTimeTasks} theme="cyan" />
              <Card title="Pending %" value={`${checkData.pendingPercentage}%`} theme="indigo" />
              <Card title="Delayed %" value={`${checkData.delayedPercentage}%`} theme="rose" />
            </Section>

            <Section title="Help Ticket Analytics" accent="bg-indigo-600">
              <div className="col-span-full mb-2"><SubLabel text="Assigned to Member" /></div>
              <div className="col-span-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <Card title="Total" value={htAssigned.assignedTotalTicket} theme="slate" />
                <Card title="Pending" value={htAssigned.assignedPendingTicket} theme="amber" />
                <Card title="Completed" value={htAssigned.assignedCompletedTicket} theme="emerald" />
                <Card title="On Time" value={htAssigned.assignedOnTime} theme="cyan" />
                <Card title="Pending %" value={`${htAssigned.assignedPendingPercentage}%`} theme="indigo" />
                <Card title="Delay %" value={`${htAssigned.assignedDelayPercentage}%`} theme="rose" />
              </div>
              <div className="col-span-full mb-2"><SubLabel text="Raised by Member" /></div>
              <div className="col-span-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card title="Total" value={htCreated.createdTotalTicket} theme="slate" />
                <Card title="Pending" value={htCreated.createdPendingTicket} theme="amber" />
                <Card title="Completed" value={htCreated.createdCompletedTicket} theme="emerald" />
                <Card title="On Time" value={htCreated.createdOnTime} theme="cyan" />
                <Card title="Pending %" value={`${htCreated.createdPendingPercentage}%`} theme="indigo" />
                <Card title="Delay %" value={`${htCreated.createdDelayPercentage}%`} theme="rose" />
              </div>
            </Section>

            <Section title="Support Ticket Analytics" accent="bg-rose-600">
              <div className="col-span-full mb-2"><SubLabel text="Technician Assignment" /></div>
              <div className="col-span-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <Card title="Total" value={stAssigned.assignedTotalTicket} theme="slate" />
                <Card title="Pending" value={stAssigned.assignedPendingTicket} theme="amber" />
                <Card title="Completed" value={stAssigned.assignedCompletedTicket} theme="emerald" />
                <Card title="On Time" value={stAssigned.assignedOnTime} theme="cyan" />
                <Card title="Pending %" value={`${stAssigned.assignedPendingPercentage}%`} theme="indigo" />
                <Card title="Delay %" value={`${stAssigned.assignedDelayPercentage}%`} theme="rose" />
              </div>
              <div className="col-span-full mb-2"><SubLabel text="User Requests" /></div>
              <div className="col-span-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card title="Total" value={stCreated.createdTotalTicket} theme="slate" />
                <Card title="Pending" value={stCreated.createdPendingTicket} theme="amber" />
                <Card title="Completed" value={stCreated.createdCompletedTicket} theme="emerald" />
                <Card title="On Time" value={stCreated.createdOnTime} theme="cyan" />
                <Card title="Pending %" value={`${stCreated.createdPendingPercentage}%`} theme="indigo" />
                <Card title="Delay %" value={`${stCreated.createdDelayPercentage}%`} theme="rose" />
              </div>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}

// --- REUSABLE COMPONENTS ---
function Section({ title, accent, children }) {
  return (
    <div className="w-full bg-white border-b border-slate-200 mb-2">
      <div className="px-8 py-2 bg-slate-50/80 flex items-center gap-3">
        <div className={`w-1 h-4 ${accent} rounded-full`}></div>
        <h2 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{title}</h2>
      </div>
      <div className="px-8 py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {children}
      </div>
    </div>
  );
}

function SubLabel({ text }) { 
  return <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-slate-200 pl-2">{text}</span>; 
}

const THEMES = {
  blue: "bg-blue-600 text-white shadow-blue-100", amber: "bg-amber-500 text-white shadow-amber-100", 
  emerald: "bg-emerald-600 text-white shadow-emerald-100", cyan: "bg-cyan-600 text-white shadow-cyan-100", 
  indigo: "bg-indigo-600 text-white shadow-indigo-100", rose: "bg-rose-600 text-white shadow-rose-100", 
  slate: "bg-slate-700 text-white shadow-slate-100"
};

function Card({ title, value, theme }) {
  return (
    <div className={`${THEMES[theme]} p-4 rounded-xl flex flex-col items-center justify-center shadow-md transition-transform hover:scale-[1.02]`}>
      <h3 className="text-[8px] font-black uppercase opacity-80 text-center leading-none mb-1">{title}</h3>
      <p className="text-xl font-black">{value || 0}</p>
    </div>
  );
}