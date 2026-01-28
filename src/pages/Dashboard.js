import React, { useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState("all");

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [weekRange, setWeekRange] = useState({ start: "", end: "" });
  const [allDashboardData, setAllDashboardData] = useState([]);

  // ================= LOAD EMPLOYEES =================
  const loadEmployees = async () => {
    try {
      const res = await axios.get("/employee/all", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= ALL EMPLOYEES DASHBOARD =================
  const loadAllDashboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/allDashboard/all-dashboard", {
        params: {
          month: selectedMonth,
          week: selectedWeek,
          selectedName: selectedEmployee === "all" ? "" : selectedEmployee,
        },
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setAllDashboardData(res.data.data || []);
      setWeekRange({
        start: res.data.weekStart,
        end: res.data.weekEnd,
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // ================= PDF DOWNLOAD LOGIC =================
 const downloadPDF = (filterType = "all") => {
    const doc = new jsPDF("landscape", "mm", "a4");

    // Title Row
    doc.setFillColor(255, 235, 156); 
    doc.rect(10, 10, 277, 8, "F");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`WEEK NO.-0${selectedWeek} ( ${weekRange.start} TO ${weekRange.end} ) - ${filterType === 'em' ? 'EM ONLY' : 'ALL'}`, 148, 15.5, { align: "center" });

    const headers = [
      [
        { content: "DOER NO.", rowSpan: 2 },
        { content: "DOER NAME", rowSpan: 2 },
        { content: "WITH OUT DELIGATION", colSpan: 7 }, 
        { content: "ONLY DELIGATION", colSpan: 9 }, 
        { content: "EM DOER", rowSpan: 2 }
      ],
      [
        "TOTAL", "COMPLETED", "ON TIME", "PENDING", "PEND %", "DELAY %", "OVERALL SCORE",
        "TOTAL", "COMPLETED", "ON TIME", "PENDING", "PEND %", "DELAY %", "OVERALL SCORE", "EM REPETITION", "NEXT TARGET",
        "YES/NO"
      ]
    ];

    const body = allDashboardData
      .map((emp) => {
        // --- Without Delegation Logic ---
        const woTotal = (emp.checklist?.totalWork || 0) + (emp.helpTicket?.assigned?.totalWork || 0) + (emp.supportTicket?.assigned?.totalWork || 0);
        const woOnTime = (emp.checklist?.onTimeWork || 0) + (emp.helpTicket?.assigned?.onTimeWork || 0) + (emp.supportTicket?.assigned?.onTimeWork || 0);
        const woPending = (emp.checklist?.pendingWork || 0) + (emp.helpTicket?.assigned?.pendingWork || 0) + (emp.supportTicket?.assigned?.pendingWork || 0);
        const woCompleted = (emp.checklist?.completedWork || 0) + (emp.helpTicket?.assigned?.completedWork || 0) + (emp.supportTicket?.assigned?.completedWork || 0);
        
        const woPendP = woTotal > 0 ? (woPending / woTotal) * 100 : 0;
        const woDelayP = woTotal > 0 ? ((woTotal - woOnTime) / woTotal) * 100 : 0;
        // NEW FORMULA: (Pending% * 0.80) + (Delay% * 0.20)
        const woOverall = ((woPendP * 0.80) + (woDelayP * 0.20)).toFixed(2);

        // --- Only Delegation Logic ---
        const delTotal = emp.delegation?.totalWork || 0;
        const delOnTime = emp.delegation?.onTimeWork || 0;
        const delPending = emp.delegation?.pendingWork || 0;
        const delCompleted = emp.delegation?.completedWork || 0;
        
        const delPendP = delTotal > 0 ? (delPending / delTotal) * 100 : 0;
        const delDelayP = delTotal > 0 ? ((delTotal - delOnTime) / delTotal) * 100 : 0;
        // NEW FORMULA: (Pending% * 0.80) + (Delay% * 0.20)
        const delOverall = ((delPendP * 0.80) + (delDelayP * 0.20)).toFixed(2);

        // EM DOER Logic: Kisi ek mein bhi 10% se zyada score hai toh YES
        const isEMDoer = (parseFloat(woOverall) > 10 || parseFloat(delOverall) > 10) ? "YES" : "NO";

        return {
          row: [
            0, emp.name,
            woTotal, woCompleted, woOnTime, woPending, `${woPendP.toFixed(2)}%`, `${woDelayP.toFixed(2)}%`, woOverall,
            delTotal, delCompleted, delOnTime, delPending, `${delPendP.toFixed(2)}%`, `${delDelayP.toFixed(2)}%`, delOverall, 
            "", "", isEMDoer
          ],
          isEMDoer: isEMDoer
        };
      })
      .filter(item => filterType === "em" ? item.isEMDoer === "YES" : true)
      .map((item, idx) => {
        item.row[0] = idx + 1;
        return item.row;
      });

    doc.autoTable({
      head: headers,
      body: body,
      startY: 18,
      theme: 'grid',
      styles: { fontSize: 5, halign: 'center', lineWidth: 0.1, lineColor: [0, 0, 0] },
      headStyles: { fillColor: [198, 224, 180], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 1: { cellWidth: 22 }, 14: { cellWidth: 12 }, 15: { cellWidth: 12 } }
    });

    doc.save(`${filterType === "em" ? "EM_Report" : "Full_Report"}_W${selectedWeek}.pdf`);
};

  // ================= USE EFFECTS =================
  useEffect(() => {
    loadEmployees().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAllDashboard();
  }, [selectedEmployee, selectedMonth, selectedWeek]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-slate-100">
  <header className="sticky top-0 z-40 bg-slate-800 text-white px-4 py-3 md:px-6">
  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
    
    {/* Left Side: Title and Date Range */}
    <div className="flex flex-col">
      <h1 className="font-black uppercase text-base md:text-lg leading-tight">
        Management Dashboard
      </h1>
      <p className="text-[10px] md:text-xs text-blue-400 font-bold">
        {weekRange.start} — {weekRange.end}
      </p>
    </div>

    {/* Right Side: Filters and Buttons */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
      
      {/* Select Box Container */}
      <div className="grid grid-cols-2 sm:flex items-center bg-slate-900 rounded-xl p-2 gap-2 w-full sm:w-auto">
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer"
        >
          <option value="all" className="text-black font-bold">All Employees</option>
          {employees.map((emp) => (
            <option key={emp.key} value={emp.key} className="text-black">{emp.name}</option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i + 1} className="text-black">
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        <select
          value={selectedWeek}
          onChange={(e) =>
            setSelectedWeek(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer sm:border-l sm:border-slate-700 sm:pl-2"
        >
          <option value="all" className="text-black">All Weeks</option>
          {[1, 2, 3, 4, 5].map((w) => (
            <option key={w} value={w} className="text-black">Week {w}</option>
          ))}
        </select>
      </div>

      {/* Buttons Container */}
      {selectedEmployee === "all" && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => downloadPDF("all")}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black px-3 py-2 rounded shadow-lg transition-all active:scale-95"
          >
            ALL REPORT
          </button>
          <button 
            onClick={() => downloadPDF("em")}
            className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black px-3 py-2 rounded shadow-lg transition-all active:scale-95"
          >
            EM REPORT
          </button>
        </div>
      )}

    </div>
  </div>
</header>

      <main className="flex-1 overflow-y-auto p-6 relative">
        {isUpdating && (
          <div className="absolute inset-0 bg-white/40 flex items-center justify-center z-50">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {selectedEmployee === "all" && (
          <div className="space-y-6">
            {allDashboardData.map((emp, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow border">
                <div className="px-6 py-3 border-b bg-slate-50 flex justify-between">
                  <h2 className="font-black uppercase">{emp.name}</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 p-6">
                  <Card title="Total Work" value={emp.overall.totalWork} theme="slate" />
                  <Card title="Completed" value={emp.overall.totalCompleted} theme="emerald" />
                  <Card title="On Time" value={emp.overall.totalOnTime} theme="emerald" />
                  <Card title="Pending" value={emp.overall.totalPending} theme="amber" />
                  <Card title="Pending %" value={`${emp.overall.pendingPercent}%`} theme="indigo" />
                  <Card title="Delay %" value={`${emp.overall.delayPercent}%`} theme="rose" />
                  <Card title="Overall Score" value={`${emp.overall.overallScore}%`} theme="blue" />
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedEmployee !== "all" && (
          <div className="space-y-6">
            <SingleSection title="Delegation" data={allDashboardData[0]?.delegation} />
            <SingleSection title="Checklist" data={allDashboardData[0]?.checklist} />
            <SingleSection title="Help Tickets Assigned" data={allDashboardData[0]?.helpTicket?.assigned} />
            <SingleSection title="Help Tickets Created" data={allDashboardData[0]?.helpTicket?.created} />
            <SingleSection title="Support Tickets Assigned" data={allDashboardData[0]?.supportTicket?.assigned} />
            <SingleSection title="Support Tickets Created" data={allDashboardData[0]?.supportTicket?.created} />
          </div>
        )}
      </main>
    </div>
  );
}

const THEMES = {
  blue: "bg-blue-600 text-white",
  amber: "bg-amber-500 text-white",
  emerald: "bg-emerald-600 text-white",
  indigo: "bg-indigo-600 text-white",
  rose: "bg-rose-600 text-white",
  slate: "bg-slate-700 text-white",
};

function Card({ title, value, theme }) {
  return (
    <div className={`${THEMES[theme]} p-4 rounded-xl text-center shadow`}>
      <h3 className="text-[10px] uppercase font-black opacity-80">{title}</h3>
      <p className="text-xl font-black">{value || 0}</p>
    </div>
  );
}

function SingleSection({ title, data }) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div className="bg-white rounded-xl shadow border">
      <div className="px-6 py-3 border-b bg-slate-50 flex justify-between">
        <h2 className="font-black uppercase">{title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6">
        <Card title="Total Work" value={data.totalWork} theme="slate" />
        <Card title="Completed" value={data.completedWork} theme="emerald" />
        <Card title="On Time" value={data.onTimeWork} theme="emerald" />
        <Card title="Pending" value={data.pendingWork} theme="amber" />
        <Card title="Pending %" value={`${data.pendingPercent || 0}%`} theme="indigo" />
        <Card title="Delay %" value={`${data.delayPercent || 0}%`} theme="rose" />
      </div>
    </div>
  );
}