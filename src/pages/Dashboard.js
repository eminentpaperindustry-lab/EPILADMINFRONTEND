import React, { useState, useEffect, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axiosLib from "axios"; // Standard library import karein
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

  // ================= WHATSAPP LOGIC =================
// const sendBulkWhatsApp = async () => {
//     if (allDashboardData.length === 0) return alert("No data to send!");
    
//     const confirmSend = window.confirm(`Send WhatsApp report to ${allDashboardData.length} employees?`);
//     if (!confirmSend) return;

//     setIsUpdating(true); 

//     // 1. Token aur Phone ID (REACT_APP_ lagana zaroori hai .env me)
//     // Testing ke liye yahan direct string daal kar check karein
//     const PHONE_ID = process.env.REACT_APP_META_WA_PHONE_ID || "781492791715017";
//     const TOKEN = process.env.REACT_APP_META_WA_TOKEN || "EAAcLV3bwZBZCMBPe2uYxqgVFZCZBx9EzrZAQz8u9EjvkC71lruMkVP32ilTiMeENDGNyyqQqzJfhf69EwFoMJhQ18Fe9JO3ZBj26YRNZCSh2FDcovrJuhZB3XtPRkjWQtFKeNrr9YAWZCSEzlRBZBSq2lCeZC2ZAEvKZAifGafEaUahZAnYNHEVpkGpghLIYRKj4AEIWxIzAZDZD";

//     const isMonday = new Date().getDay() === 1;

//     for (const emp of allDashboardData) {
//         // Employee matching logic
//         const empInfo = employees.find(e => e.name === emp.name || e.key === emp.name);
//         let phone = empInfo?.number || empInfo?.mobile || empInfo?.phone;

//         if (!phone) {
//           console.warn(`❌ No phone for: ${emp.name}`);
//           continue;
//         }

//         const cleanPhone = phone.toString().replace(/\D/g, "");
//         const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

//         // Score Calculation logic
//         const woPendP = parseFloat(emp.overall?.pendingPercent || 0);
//         const woDelayP = parseFloat(emp.overall?.delayPercent || 0);
//         const woOverall = ((woPendP * 0.80) + (woDelayP * 0.20)).toFixed(2);
        
//         const delPendP = parseFloat(emp.delegation?.pendingPercent || 0);
//         const delDelayP = parseFloat(emp.delegation?.delayPercent || 0);
//         const delOverall = ((delPendP * 0.80) + (delDelayP * 0.20)).toFixed(2);

//         const isHighScorer = parseFloat(woOverall) > 10 || parseFloat(delOverall) > 10;

//         let var5 = ""; 
//         let var6 = "";

//         if (isMonday) {
//             if (isHighScorer) {
//               var5 = "⚠️ EM MEETING ALERT: Since your score is above 10%, you are required to attend the EM Meeting today.";
//               var6 = "Please be prepared with the reasons for pending tasks.";
//             } else {
//               var5 = "🌟 EXCELLENT WORK: Your score is below 10%, so you are NOT required to attend today's EM Meeting.";
//               var6 = "We are proud of your discipline! Keep up the great work. 🚀";
//             }
//         } else {
//             var5 = "🚀 PERFORMANCE REMINDER: Please ensure all tasks are completed on time to maintain your score.";
//             var6 = "Failure to improve may result in a mandatory invitation to the upcoming EM Meeting.";
//         }

//         const payload = {
//             messaging_product: "whatsapp",
//             to: finalPhone,
//             type: "template",
//            // Payload ke andar template section ko aise check karein
// template: {
//   name: "workreport", // 1. Check spelling exactly from Meta Dashboard
//   language: { 
//     code: "en" // 2. Agar "en_US" nahi chal raha, toh sirf "en" try karein
//   },
//   components: [
//     {
//       type: "body",
//       parameters: [
//         { type: "text", text: String(emp.name) },
//         { type: "text", text: `${weekRange.start} to ${weekRange.end}` },
//         { type: "text", text: String(delOverall) },
//         { type: "text", text: String(woOverall) },
//         { type: "text", text: String(var5) },
//         { type: "text", text: String(var6) }
//       ]
//     }
//   ]
// }
//         };

//         try {
//             // Hum yahan headers ko ekdum clean bhej rahe hain
//             const response = await axiosLib({
//                 method: 'post',
//                 url: `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
//                 data: payload,
//                 headers: { 
//                     'Authorization': `Bearer ${TOKEN.trim()}`, // trim() space hata dega
//                     'Content-Type': 'application/json'
//                 }
//             });
//             console.log(`✅ Success for ${emp.name}:`, response.data);
//         } catch (err) {
//             console.error(`❌ Meta API Error for ${emp.name}:`, err.response?.data || err.message);
//         }
//     }

//     setIsUpdating(false);
//     alert("Process completed!");
// };


const sendBulkWhatsApp = async () => {
    if (allDashboardData.length === 0) return alert("No data to send!");
    
    const confirmSend = window.confirm(`Send WhatsApp report to ${allDashboardData.length} employees?`);
    if (!confirmSend) return;

    setIsUpdating(true); 
    const PHONE_ID = process.env.REACT_APP_META_WA_PHONE_ID
    const TOKEN = process.env.REACT_APP_META_WA_TOKEN;
    const isMonday = new Date().getDay() === 1;

    // Helper function for delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < allDashboardData.length; i++) {
        const emp = allDashboardData[i];
        const empInfo = employees.find(e => e.name === emp.name || e.key === emp.name);
        let phone = empInfo?.number || empInfo?.mobile || empInfo?.phone;

        if (!phone) continue;

        const cleanPhone = phone.toString().replace(/\D/g, "");
        const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        // Score logic (same as before)
        const woPendP = parseFloat(emp.overall?.pendingPercent || 0);
        const woDelayP = parseFloat(emp.overall?.delayPercent || 0);
        const woOverall = ((woPendP * 0.80) + (woDelayP * 0.20)).toFixed(2);
        const delOverall = ((parseFloat(emp.delegation?.pendingPercent || 0) * 0.80) + (parseFloat(emp.delegation?.delayPercent || 0) * 0.20)).toFixed(2);
        const isHighScorer = parseFloat(woOverall) > 10 || parseFloat(delOverall) > 10;

        let var5 = isMonday ? (isHighScorer ? "⚠️ EM MEETING ALERT: Score > 10%, attend meeting." : "🌟 EXCELLENT: Score < 10%, no meeting.") : "🚀 PERFORMANCE REMINDER: Keep it up!";
        let var6 = isMonday ? (isHighScorer ? "Prepared with reasons." : "Proud of you!") : "Maintain your score.";

        const payload = {
            messaging_product: "workreporttemplaterfg", //wrong
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
            
            // 🔥 HAR MESSAGE KE BAAD 2 SECOND KA WAIT
            await delay(2000); 

        } catch (err) {
            console.error(`❌ Error for ${emp.name}:`, err.response?.data || err.message);
        }
    }

    setIsUpdating(false);
    alert("Bulk Process completed! Check your Meta Dashboard after 5 mins for final delivery status.");
};
  // ================= PDF DOWNLOAD LOGIC (No changes) =================
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
        const woTotal = (emp.checklist?.totalWork || 0) + (emp.helpTicket?.assigned?.totalWork || 0) + (emp.supportTicket?.assigned?.totalWork || 0);
        const woOnTime = (emp.checklist?.onTimeWork || 0) + (emp.helpTicket?.assigned?.onTimeWork || 0) + (emp.supportTicket?.assigned?.onTimeWork || 0);
        const woPending = (emp.checklist?.pendingWork || 0) + (emp.helpTicket?.assigned?.pendingWork || 0) + (emp.supportTicket?.assigned?.pendingWork || 0);
        const woCompleted = (emp.checklist?.completedWork || 0) + (emp.helpTicket?.assigned?.completedWork || 0) + (emp.supportTicket?.assigned?.completedWork || 0);
        
        const woPendP = woTotal > 0 ? (woPending / woTotal) * 100 : 0;
        const woDelayP = woTotal > 0 ? ((woTotal - woOnTime) / woTotal) * 100 : 0;
        const woOverall = ((woPendP * 0.80) + (woDelayP * 0.20)).toFixed(2);

        const delTotal = emp.delegation?.totalWork || 0;
        const delOnTime = emp.delegation?.onTimeWork || 0;
        const delPending = emp.delegation?.pendingWork || 0;
        const delCompleted = emp.delegation?.completedWork || 0;
        
        const delPendP = delTotal > 0 ? (delPending / delTotal) * 100 : 0;
        const delDelayP = delTotal > 0 ? ((delTotal - delOnTime) / delTotal) * 100 : 0;
        const delOverall = ((delPendP * 0.80) + (delDelayP * 0.20)).toFixed(2);

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
    loadEmployees();
  }, []);

  useEffect(() => {
    loadAllDashboard();
  }, [selectedEmployee, selectedMonth, selectedWeek]);

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
                {/* WHATSAPP BUTTON ADDED HERE */}
                <button 
                  onClick={sendBulkWhatsApp}
                  disabled={loading || isUpdating}
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
            {selectedEmployee === "all" && (
              <div className="space-y-6">
                {allDashboardData.map((emp, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 group">
                    <div className="px-6 py-3 border-b bg-slate-50 flex justify-between group-hover:bg-blue-50 transition-colors">
                      <h2 className="font-black uppercase text-slate-700 group-hover:text-blue-700">{emp.name}</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 p-6 cursor-default">
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

            {selectedEmployee !== "all" && allDashboardData.length > 0 && (
              <div className="space-y-6 animate-fadeIn">
                <SingleSection title="Delegation" data={allDashboardData[0]?.delegation} />
                <SingleSection title="Checklist" data={allDashboardData[0]?.checklist} />
                <SingleSection title="Help Tickets Assigned" data={allDashboardData[0]?.helpTicket?.assigned} />
                <SingleSection title="Help Tickets Created" data={allDashboardData[0]?.helpTicket?.created} />
                <SingleSection title="Support Tickets Assigned" data={allDashboardData[0]?.supportTicket?.assigned} />
                <SingleSection title="Support Tickets Created" data={allDashboardData[0]?.supportTicket?.created} />
              </div>
            )}
            
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

// ... THEMES, Card, and SingleSection components remain exactly same ...
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
    <div className={`${THEMES[theme]} p-4 rounded-xl text-center shadow transition-all duration-300 hover:scale-105 hover:rotate-1`}>
      <h3 className="text-[10px] uppercase font-black opacity-80">{title}</h3>
      <p className="text-xl font-black">{value || 0}</p>
    </div>
  );
}

function SingleSection({ title, data }) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all overflow-hidden group">
      <div className="px-6 py-3 border-b bg-slate-50 group-hover:bg-indigo-50 transition-colors">
        <h2 className="font-black uppercase text-slate-700 group-hover:text-indigo-700">{title}</h2>
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