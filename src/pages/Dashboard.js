import React, { useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axiosLib from "axios";

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ================= CALCULATE WITHOUT DELEGATION DATA =================
  const calculateWithoutDelegation = (emp) => {
    // Combine checklist, helpTicket, and supportTicket
    const checklist = emp.checklist || {};
    const helpAssigned = emp.helpTicket?.assigned || {};
    const supportAssigned = emp.supportTicket?.assigned || {};

    const totalWork = (checklist.totalWork || 0) + 
                     (helpAssigned.totalWork || 0) + 
                     (supportAssigned.totalWork || 0);
    
    const completedWork = (checklist.completedWork || 0) + 
                         (helpAssigned.completedWork || 0) + 
                         (supportAssigned.completedWork || 0);
    
    const pendingWork = (checklist.pendingWork || 0) + 
                       (helpAssigned.pendingWork || 0) + 
                       (supportAssigned.pendingWork || 0);
    
    const onTimeWork = (checklist.onTimeWork || 0) + 
                      (helpAssigned.onTimeWork || 0) + 
                      (supportAssigned.onTimeWork || 0);

    // Calculate percentages with minus sign
    const pendingPercent = totalWork > 0 ? ((pendingWork / totalWork) * 100).toFixed(2) : "0.00";
    const delayPercent = totalWork > 0 ? (((totalWork - onTimeWork) / totalWork) * 100).toFixed(2) : "0.00";
    
    // Calculate overall score with minus sign
    const overallScore = ((parseFloat(pendingPercent) * 0.80) + (parseFloat(delayPercent) * 0.20)).toFixed(2);

    return {
      totalWork,
      completedWork,
      pendingWork,
      onTimeWork,
      pendingPercent: `-${pendingPercent}`,
      delayPercent: `-${delayPercent}`,
      overallScore: `-${overallScore}`
    };
  };

  // ================= FORMAT PERCENTAGES WITH MINUS SIGN =================
  const formatPercent = (value) => {
    if (!value) return "-0.00%";
    const num = parseFloat(value);
    if (isNaN(num)) return "-0.00%";
    return `-${num.toFixed(2)}%`;
  };

  // ================= CALCULATE DELEGATION OVERALL SCORE =================
  const calculateDelegationOverall = (delegation) => {
    const del = delegation || {};
    const pendingPercent = parseFloat(del.pendingPercent || 0);
    const delayPercent = parseFloat(del.delayPercent || 0);
    const score = ((pendingPercent * 0.80) + (delayPercent * 0.20)).toFixed(2);
    return `-${score}`;
  };

  // ================= WHATSAPP LOGIC =================
  const sendBulkWhatsApp = async () => {
    if (allDashboardData.length === 0) return alert("No data to send!");
    
    const confirmSend = window.confirm(`Send WhatsApp report to ${allDashboardData.length} employees?`);
    if (!confirmSend) return;

    setIsUpdating(true); 
    const PHONE_ID = process.env.REACT_APP_META_WA_PHONE_ID
    const TOKEN = process.env.REACT_APP_META_WA_TOKEN;
    const isMonday = new Date().getDay() === 1;

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < allDashboardData.length; i++) {
      const emp = allDashboardData[i];
      const empInfo = employees.find(e => e.name === emp.name || e.key === emp.name);
      let phone = empInfo?.number || empInfo?.mobile || empInfo?.phone;

      if (!phone) continue;

      const cleanPhone = phone.toString().replace(/\D/g, "");
      const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

      // Calculate scores
      const withoutDelData = calculateWithoutDelegation(emp);
      const woOverall = withoutDelData.overallScore.replace("-", ""); // Remove minus for WhatsApp
      
      const delOverall = calculateDelegationOverall(emp.delegation).replace("-", ""); // Remove minus
      
      const isHighScorer = parseFloat(woOverall) > 10 || parseFloat(delOverall) > 10;

      let var5 = isMonday ? (isHighScorer ? "⚠️ EM MEETING ALERT: Score > 10%, attend meeting." : "🌟 EXCELLENT: Score < 10%, no meeting.") : "🚀 PERFORMANCE REMINDER: Keep it up!";
      let var6 = isMonday ? (isHighScorer ? "Prepared with reasons." : "Proud of you!") : "Maintain your score.";

      const payload = {
        messaging_product: "whatsapp",
        to: finalPhone,
        type: "template",
        template: {
          name: "workreport",
          language: { code: "en" },
          components: [{
            type: "body",
            parameters: [
              { type: "text", text: String(emp.name) },
              { type: "text", text: `${weekRange.start} to ${weekRange.end}` },
              { type: "text", text: String(delOverall) },
              { type: "text", text: String(woOverall) },
              { type: "text", text: String(var5) },
              { type: "text", text: String(var6) }
            ]
          }]
        }
      };

      try {
        await axiosLib.post(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, payload, {
          headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });
        console.log(`✅ ${i+1}/${allDashboardData.length} Sent to ${emp.name}`);
        await delay(2000);
      } catch (err) {
        console.error(`❌ Error for ${emp.name}:`, err.response?.data || err.message);
      }
    }

    setIsUpdating(false);
    alert("Bulk Process completed!");
  };

  // ================= PDF DOWNLOAD LOGIC =================
  const downloadPDF = (filterType = "all") => {
    if (allDashboardData.length === 0) {
      alert("Please wait, data is still loading or not available!");
      return;
    }
    
    const doc = new jsPDF("landscape", "mm", "a4");
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
        { content: "WITHOUT DELEGATION", colSpan: 7 },
        { content: "DELEGATION", colSpan: 7 },
        { content: "OVERALL", colSpan: 7 },
        { content: "EM DOER", rowSpan: 2 }
      ],
      [
        // Without Delegation
        "TOTAL", "COMPLETED", "ON TIME", "PENDING", "PEND %", "DELAY %", "SCORE",
        // Delegation
        "TOTAL", "COMPLETED", "ON TIME", "PENDING", "PEND %", "DELAY %", "SCORE",
        // Overall
        "TOTAL", "COMPLETED", "ON TIME", "PENDING", "PEND %", "DELAY %", "SCORE",
        // EM Doer
        ""
      ]
    ];

    const body = allDashboardData
      .map((emp, idx) => {
        // Without Delegation data
        const withoutDelData = calculateWithoutDelegation(emp);
        
        // Delegation data
        const del = emp.delegation || {};
        const delOverall = calculateDelegationOverall(emp.delegation);
        
        // Overall data from API
        const overall = emp.overall || {};
        
        // EM Doer calculation
        const woOverallNum = parseFloat(withoutDelData.overallScore.replace("-", "") || 0);
        const delOverallNum = parseFloat(delOverall.replace("-", "") || 0);
        const isEMDoer = (woOverallNum > 10 || delOverallNum > 10) ? "YES" : "NO";

        return [
          idx + 1, 
          emp.name,
          // Without Delegation columns
          withoutDelData.totalWork,
          withoutDelData.completedWork,
          withoutDelData.onTimeWork,
          withoutDelData.pendingWork,
          withoutDelData.pendingPercent + "%",
          withoutDelData.delayPercent + "%",
          withoutDelData.overallScore,
          // Delegation columns
          del.totalWork || 0,
          del.completedWork || 0,
          del.onTimeWork || 0,
          del.pendingWork || 0,
          formatPercent(del.pendingPercent),
          formatPercent(del.delayPercent),
          delOverall,
          // Overall columns
          overall.totalWork || 0,
          overall.totalCompleted || 0,
          overall.totalOnTime || 0,
          overall.totalPending || 0,
          formatPercent(overall.pendingPercent),
          formatPercent(overall.delayPercent),
          formatPercent(overall.overallScore),
          // EM Doer
          isEMDoer
        ];
      })
      .filter((row, idx) => {
        if (filterType !== "em") return true;
        const isEMDoer = row[row.length - 1] === "YES";
        return isEMDoer;
      });

    doc.autoTable({
      head: headers,
      body: body,
      startY: 18,
      theme: 'grid',
      styles: { fontSize: 5, halign: 'center', lineWidth: 0.1, lineColor: [0, 0, 0] },
      headStyles: { fillColor: [198, 224, 180], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 
        1: { cellWidth: 20 }, // Name column
        7: { cellWidth: 8 }, // Without Delegation Score
        14: { cellWidth: 8 }, // Delegation Score
        21: { cellWidth: 8 }, // Overall Score
        22: { cellWidth: 8 }  // EM Doer
      }
    });

    doc.save(`${filterType === "em" ? "EM_Report" : "Full_Report"}_W${selectedWeek}.pdf`);
  };

  // ================= USE EFFECTS =================
  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadAllDashboard();
  }, [selectedEmployee, selectedMonth, selectedWeek]);

  // ================= RENDER SECTION FOR ALL EMPLOYEES =================
  const renderAllEmployeesView = () => {
    return (
      <div className="space-y-6">
        {allDashboardData.map((emp, idx) => {
          const withoutDelData = calculateWithoutDelegation(emp);
          const delOverall = calculateDelegationOverall(emp.delegation);
          const overallData = emp.overall || {};
          
          // Remove minus signs for calculation
          const woOverallNum = parseFloat(withoutDelData.overallScore.replace("-", "") || 0);
          const delOverallNum = parseFloat(delOverall.replace("-", "") || 0);
          const combinedOverall = ((woOverallNum + delOverallNum) / 2).toFixed(2);
          
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 group">
              {/* Employee Header */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-blue-50 group-hover:from-blue-50 group-hover:to-indigo-50 transition-colors">
                <div className="flex justify-between items-center">
                  <h2 className="font-black uppercase text-lg text-slate-700 group-hover:text-blue-700">
                    {emp.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                      Employee #{idx + 1}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${parseFloat(combinedOverall) > 10 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {parseFloat(combinedOverall) > 10 ? '⚠️ EM Required' : '✅ Good'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Three Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 cursor-default">
                {/* Delegation Section */}
                <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-br from-slate-50 to-white hover:shadow-md transition-all duration-300 hover:border-blue-300">
                  <h3 className="font-black text-sm uppercase text-center mb-4 text-slate-600 border-b pb-3">
                    Delegation
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniCard title="Total Work" value={emp.delegation?.totalWork || 0} theme="slate" />
                    <MiniCard title="Completed" value={emp.delegation?.completedWork || 0} theme="emerald" />
                    <MiniCard title="On Time" value={emp.delegation?.onTimeWork || 0} theme="emerald" />
                    <MiniCard title="Pending" value={emp.delegation?.pendingWork || 0} theme="amber" />
                    <MiniCard title="Pending %" value={formatPercent(emp.delegation?.pendingPercent)} theme="indigo" />
                    <MiniCard title="Delay %" value={formatPercent(emp.delegation?.delayPercent)} theme="rose" />
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-200">
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-500">Delegation Score</span>
                      <p className="text-xl font-black text-blue-600">{delOverall}</p>
                    </div>
                  </div>
                </div>

                {/* Without Delegation Section */}
                <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-all duration-300 hover:border-blue-300">
                  <h3 className="font-black text-sm uppercase text-center mb-4 text-blue-600 border-b pb-3">
                    Without Delegation
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniCard title="Total Work" value={withoutDelData.totalWork} theme="slate" />
                    <MiniCard title="Completed" value={withoutDelData.completedWork} theme="emerald" />
                    <MiniCard title="On Time" value={withoutDelData.onTimeWork} theme="emerald" />
                    <MiniCard title="Pending" value={withoutDelData.pendingWork} theme="amber" />
                    <MiniCard title="Pending %" value={withoutDelData.pendingPercent + "%"} theme="indigo" />
                    <MiniCard title="Delay %" value={withoutDelData.delayPercent + "%"} theme="rose" />
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-200">
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-500">Without Delegation Score</span>
                      <p className="text-xl font-black text-blue-600">{withoutDelData.overallScore}</p>
                    </div>
                  </div>
                </div>

                {/* Overall Section (from API) */}
                <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-br from-emerald-50 to-white hover:shadow-md transition-all duration-300 hover:border-emerald-300">
                  <h3 className="font-black text-sm uppercase text-center mb-4 text-emerald-600 border-b pb-3">
                    Overall 
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <MiniCard title="Total Work" value={overallData.totalWork || 0} theme="slate" />
                    <MiniCard title="Completed" value={overallData.totalCompleted || 0} theme="emerald" />
                    <MiniCard title="On Time" value={overallData.totalOnTime || 0} theme="emerald" />
                    <MiniCard title="Pending" value={overallData.totalPending || 0} theme="amber" />
                    <MiniCard title="Pending %" value={formatPercent(overallData.pendingPercent)} theme="indigo" />
                    <MiniCard title="Delay %" value={formatPercent(overallData.delayPercent)} theme="rose" />
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-200">
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-500">Overall Score</span>
                      <p className="text-xl font-black text-emerald-600">{formatPercent(overallData.overallScore)}</p>
                    </div>
              
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ================= RENDER SECTION FOR SINGLE EMPLOYEE =================
  const renderSingleEmployeeView = () => {
    if (allDashboardData.length === 0) return null;
    const emp = allDashboardData[0];
    
    return (
      <div className="space-y-6 animate-fadeIn">
        <SingleSection title="Delegation" data={emp?.delegation} showScore={true} formatPercent={formatPercent} />
        <SingleSection title="Checklist" data={emp?.checklist} formatPercent={formatPercent} />
        <SingleSection title="Help Tickets Assigned" data={emp?.helpTicket?.assigned} formatPercent={formatPercent} />
        <SingleSection title="Help Tickets Created" data={emp?.helpTicket?.created} formatPercent={formatPercent} />
        <SingleSection title="Support Tickets Assigned" data={emp?.supportTicket?.assigned} formatPercent={formatPercent} />
        <SingleSection title="Support Tickets Created" data={emp?.supportTicket?.created} formatPercent={formatPercent} />
        <SingleSection title="Overall" data={emp?.overall} showScore={true} formatPercent={formatPercent} />
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 font-sans">
      <header className="sticky top-0 z-40 bg-slate-800 text-white px-4 py-3 md:px-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="font-black uppercase text-base md:text-lg leading-tight tracking-wider">
              Management Dashboard
            </h1>
            <p className="text-[10px] md:text-xs text-blue-400 font-bold">
              {weekRange.start || "Loading..."} — {weekRange.end || "Loading..."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-2 sm:flex items-center bg-slate-900 rounded-xl p-2 gap-2 w-full sm:w-auto border border-slate-700">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer p-1"
              >
                <option value="all" className="text-black font-bold">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.key} value={emp.key} className="text-black">{emp.name}</option>
                ))}
              </select>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer p-1"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1} className="text-black">
                    {new Date(0, i).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>

              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer p-1 sm:border-l sm:border-slate-700 sm:pl-2"
              >
                <option value="all" className="text-black">All Weeks</option>
                {[1, 2, 3, 4, 5].map((w) => (
                  <option key={w} value={w} className="text-black">Week {w}</option>
                ))}
              </select>
            </div>

            {selectedEmployee === "all" && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => downloadPDF("all")}
                  disabled={loading}
                  className={`flex-1 sm:flex-none text-white text-[9px] font-black px-4 py-2 rounded shadow-lg transition-all active:scale-95 ${loading ? 'bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  ALL REPORT
                </button>
                <button 
                  onClick={() => downloadPDF("em")}
                  disabled={loading}
                  className={`flex-1 sm:flex-none text-white text-[9px] font-black px-4 py-2 rounded shadow-lg transition-all active:scale-95 ${loading ? 'bg-slate-600' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  EM REPORT
                </button>
                <button 
                  onClick={sendBulkWhatsApp}
                  // disabled={loading || isUpdating}
                  disabled={true}

                  className={`flex-1 sm:flex-none text-white text-[9px] font-black px-4 py-2 rounded shadow-lg transition-all active:scale-95 ${loading || isUpdating ? 'bg-slate-600' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isUpdating ? "SENDING..." : "WHATSAPP REPORT"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
        {(loading || isUpdating) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 backdrop-blur-sm z-50">
            <div className="relative">
               <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 font-bold text-[10px]">{isUpdating ? "WA" : "DATA"}</div>
            </div>
            <p className="mt-4 text-slate-600 font-black text-xs animate-pulse uppercase tracking-widest">
              {isUpdating ? "Sending WhatsApp Messages..." : "Fetching Dashboard Data..."}
            </p>
          </div>
        )}

        {!loading && (
          <div className="animate-fadeIn">
            {selectedEmployee === "all" 
              ? renderAllEmployeesView()
              : renderSingleEmployeeView()
            }
            
            {allDashboardData.length === 0 && !loading && (
              <div className="text-center py-20 bg-white rounded-3xl shadow-inner border-2 border-dashed border-slate-300">
                <p className="text-slate-400 font-bold uppercase tracking-widest">No Data Found for this selection</p>
              </div>
            )}
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ================= COMPONENTS =================

const THEMES = {
  blue: "bg-blue-600 text-white",
  amber: "bg-amber-500 text-white",
  emerald: "bg-emerald-600 text-white",
  indigo: "bg-indigo-600 text-white",
  rose: "bg-rose-600 text-white",
  slate: "bg-slate-700 text-white",
};

// Mini Card for grid layout
function MiniCard({ title, value, theme }) {
  return (
    <div className={`${THEMES[theme]} p-3 rounded-lg text-center shadow transition-all duration-300 hover:scale-105`}>
      <h3 className="text-[9px] uppercase font-black opacity-90">{title}</h3>
      <p className="text-lg font-black mt-1">{value || 0}</p>
    </div>
  );
}

// Regular Card component (for single employee view)
function Card({ title, value, theme }) {
  return (
    <div className={`${THEMES[theme]} p-4 rounded-xl text-center shadow transition-all duration-300 hover:scale-105 hover:rotate-1`}>
      <h3 className="text-[10px] uppercase font-black opacity-80">{title}</h3>
      <p className="text-xl font-black">{value || 0}</p>
    </div>
  );
}

// Single Section for individual employee view
function SingleSection({ title, data, showScore = false, formatPercent = (val) => val }) {
  if (!data || Object.keys(data).length === 0) return null;
  
  const calculateScore = (data) => {
    const pendingPercent = parseFloat(data.pendingPercent || 0);
    const delayPercent = parseFloat(data.delayPercent || 0);
    const score = ((pendingPercent * 0.80) + (delayPercent * 0.20)).toFixed(2);
    return `-${score}`;
  };

  const score = showScore ? calculateScore(data) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all overflow-hidden group">
      <div className="px-6 py-3 border-b bg-slate-50 group-hover:bg-indigo-50 transition-colors">
        <h2 className="font-black uppercase text-slate-700 group-hover:text-indigo-700">{title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 p-6">
        <Card title="Total Work" value={data.totalWork || data.totalWork || 0} theme="slate" />
        <Card title="Completed" value={data.completedWork || data.totalCompleted || 0} theme="emerald" />
        <Card title="On Time" value={data.onTimeWork || data.totalOnTime || 0} theme="emerald" />
        <Card title="Pending" value={data.pendingWork || data.totalPending || 0} theme="amber" />
        <Card title="Pending %" value={formatPercent(data.pendingPercent)} theme="indigo" />
        <Card title="Delay %" value={formatPercent(data.delayPercent)} theme="rose" />
        {showScore && (
          <Card title="Overall Score" value={score || formatPercent(data.overallScore)} theme="blue" />
        )}
      </div>
    </div>
  );
}