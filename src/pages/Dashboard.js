import React, { useState, useEffect, useContext, useCallback, useMemo } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axiosLib from "axios";

// ============================================================
// MEMOIZED SUB-COMPONENTS
// ============================================================

const THEMES = {
  blue: "bg-blue-600 text-white",
  amber: "bg-amber-500 text-white",
  emerald: "bg-emerald-600 text-white",
  indigo: "bg-indigo-600 text-white",
  rose: "bg-rose-600 text-white",
  slate: "bg-slate-700 text-white",
};

const MiniCard = React.memo(({ title, value, theme }) => (
  <div className={`${THEMES[theme]} p-3 rounded-lg text-center shadow transition-all duration-300 hover:scale-105`}>
    <h3 className="text-[9px] uppercase font-black opacity-90">{title}</h3>
    <p className="text-lg font-black mt-1">{value || 0}</p>
  </div>
));

const Card = React.memo(({ title, value, theme }) => (
  <div className={`${THEMES[theme]} p-4 rounded-xl text-center shadow transition-all duration-300 hover:scale-105 hover:rotate-1`}>
    <h3 className="text-[10px] uppercase font-black opacity-80">{title}</h3>
    <p className="text-xl font-black">{value || 0}</p>
  </div>
));

const SingleSection = React.memo(({ title, data, showScore = false, formatPercent = (val) => val }) => {
  const score = useMemo(() => {
    if (!showScore) return null;
    const pendingPercent = parseFloat(data?.pendingPercent || 0);
    const delayPercent = parseFloat(data?.delayPercent || 0);
    return `-${((pendingPercent * 0.80) + (delayPercent * 0.20)).toFixed(2)}`;
  }, [showScore, data?.pendingPercent, data?.delayPercent]);

  if (!data || Object.keys(data).length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all overflow-hidden group">
      <div className="px-6 py-3 border-b bg-slate-50 group-hover:bg-indigo-50 transition-colors">
        <h2 className="font-black uppercase text-slate-700 group-hover:text-indigo-700">{title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 p-6">
        <Card title="Total Work" value={data.totalWork || 0} theme="slate" />
        <Card title="Completed" value={data.completedWork || data.totalCompleted || 0} theme="emerald" />
        <Card title="On Time" value={data.onTimeWork || data.totalOnTime || 0} theme="emerald" />
        <Card title="Pending" value={data.pendingWork || data.totalPending || 0} theme="amber" />
        <Card title="Pending %" value={formatPercent(data.pendingPercent)} theme="indigo" />
        <Card title="Delay %" value={formatPercent(data.delayPercent)} theme="rose" />
        {showScore && <Card title="Overall Score" value={score || formatPercent(data.overallScore)} theme="blue" />}
      </div>
    </div>
  );
});

// ============================================================
// EM SHEET MODAL COMPONENT - WITH PERCENTAGE BASED TOGGLES (FIXED)
// ============================================================
const EMSheetModal = React.memo(({ 
  isOpen, 
  onClose, 
  data, 
  weekInfo, 
  footer, 
  onDownloadEM, 
  onDownloadAll,
  loading 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [withoutDelToggle, setWithoutDelToggle] = useState(false);
  const [delegationToggle, setDelegationToggle] = useState(false);
  const [activeSort, setActiveSort] = useState('without');
  const rowsPerPage = 30;

  const validData = useMemo(() => {
    if (!isOpen) return [];
    if (!data || !Array.isArray(data)) return [];
    return data.filter(emp => 
      emp.doerName && 
      emp.doerName !== "DOER NAME" && 
      emp.doerName !== "DOER NAME " &&
      !emp.doerName.includes("WEEK NO.")
    );
  }, [data, isOpen]);

  const extractPercentage = (percentStr) => {
    if (!percentStr) return 0;
    if (typeof percentStr === 'number') return percentStr;
    if (typeof percentStr === 'string') {
      const num = parseFloat(percentStr.replace('%', ''));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const sortedWithoutDelData = useMemo(() => {
    if (!isOpen) return [];
    return [...validData].sort((a, b) => {
      const aPercent = extractPercentage(a.withoutDelegation?.percent);
      const bPercent = extractPercentage(b.withoutDelegation?.percent);
      return withoutDelToggle ? bPercent - aPercent : aPercent - bPercent;
    });
  }, [validData, withoutDelToggle, isOpen]);

  const sortedDelegationData = useMemo(() => {
    if (!isOpen) return [];
    return [...validData].sort((a, b) => {
      const aPercent = extractPercentage(a.delegation?.percent);
      const bPercent = extractPercentage(b.delegation?.percent);
      return delegationToggle ? bPercent - aPercent : aPercent - bPercent;
    });
  }, [validData, delegationToggle, isOpen]);

  const displayData = useMemo(() => {
    if (activeSort === 'without') {
      return sortedWithoutDelData;
    }
    if (activeSort === 'delegation') {
      return sortedDelegationData;
    }
    return sortedWithoutDelData;
  }, [sortedWithoutDelData, sortedDelegationData, activeSort]);

  const emDoers = useMemo(() => {
    if (!isOpen) return [];
    return validData.filter(emp => emp.emDoer === "YES");
  }, [validData, isOpen]);

  const totalPages = useMemo(() => {
    if (!isOpen) return 1;
    return Math.ceil(displayData.length / rowsPerPage);
  }, [displayData, isOpen]);

  const paginatedData = useMemo(() => {
    if (!isOpen) return [];
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return displayData.slice(start, end);
  }, [displayData, currentPage, isOpen]);

  if (!isOpen) return null;

  const toggleWithoutDelegation = () => {
    const newState = !withoutDelToggle;
    setWithoutDelToggle(newState);
    setActiveSort('without');
    if (newState) {
      setDelegationToggle(false);
    }
    setCurrentPage(1);
    
    const tableElement = document.getElementById('em-sheet-table');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleDelegation = () => {
    const newState = !delegationToggle;
    setDelegationToggle(newState);
    setActiveSort('delegation');
    if (newState) {
      setWithoutDelToggle(false);
    }
    setCurrentPage(1);
    
    const tableElement = document.getElementById('em-sheet-table');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetSort = () => {
    setWithoutDelToggle(false);
    setDelegationToggle(false);
    setActiveSort('without');
    setCurrentPage(1);
    const tableElement = document.getElementById('em-sheet-table');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getSortInfo = () => {
    if (activeSort === 'without' && withoutDelToggle) return '⬇️ Without Del - High to Low %';
    if (activeSort === 'without' && !withoutDelToggle) return '⬆️ Without Del - Low to High %';
    if (activeSort === 'delegation' && delegationToggle) return '⬇️ Delegation - High to Low %';
    if (activeSort === 'delegation' && !delegationToggle) return '⬆️ Delegation - Low to High %';
    return '⬆️ Without Del - Low to High %';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col animate-fadeIn">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider">📊 EM Sheet</h2>
            <p className="text-xs text-blue-200 font-bold">{weekInfo || "Loading..."}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap gap-4 p-4 bg-slate-50 border-b">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Total Employees:</span>
            <span className="text-sm font-black text-indigo-600">{validData.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">EM Doers:</span>
            <span className="text-sm font-black text-rose-600">{emDoers.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Page:</span>
            <span className="text-sm font-black text-blue-600">{currentPage} / {totalPages || 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Sorting:</span>
            <span className="text-sm font-black text-indigo-600">
              {getSortInfo()}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 p-4 bg-white border-b">
          <button 
            onClick={toggleWithoutDelegation}
            className={`px-4 py-2 text-white text-xs font-black rounded-lg transition-all active:scale-95 flex items-center gap-2 ${
              activeSort === 'without' && withoutDelToggle ? 'bg-blue-600 hover:bg-blue-700' : 
              activeSort === 'without' && !withoutDelToggle ? 'bg-indigo-600 hover:bg-indigo-700' :
              'bg-slate-500 hover:bg-slate-600'
            }`}
          >
            {activeSort === 'without' && withoutDelToggle ? '⬇️ Without Del - High to Low %' : 
             activeSort === 'without' && !withoutDelToggle ? '⬆️ Without Del - Low to High %' :
             '📊 Without Del'}
          </button>

          <button 
            onClick={toggleDelegation}
            className={`px-4 py-2 text-white text-xs font-black rounded-lg transition-all active:scale-95 flex items-center gap-2 ${
              activeSort === 'delegation' && delegationToggle ? 'bg-blue-600 hover:bg-blue-700' : 
              activeSort === 'delegation' && !delegationToggle ? 'bg-indigo-600 hover:bg-indigo-700' :
              'bg-slate-500 hover:bg-slate-600'
            }`}
          >
            {activeSort === 'delegation' && delegationToggle ? '⬇️ Delegation - High to Low %' : 
             activeSort === 'delegation' && !delegationToggle ? '⬆️ Delegation - Low to High %' :
             '📊 Delegation'}
          </button>

          <button 
            onClick={resetSort}
            className="px-4 py-2 bg-slate-600 text-white text-xs font-black rounded-lg hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-2"
          >
            🔄 Reset Sort
          </button>

          <button 
            onClick={onDownloadEM}
            disabled={loading}
            className={`px-4 py-2 text-white text-xs font-black rounded-lg transition-all active:scale-95 flex items-center gap-2 ${
              loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            📥 Download EM Only
          </button>
          <button 
            onClick={onDownloadAll}
            disabled={loading}
            className={`px-4 py-2 text-white text-xs font-black rounded-lg transition-all active:scale-95 flex items-center gap-2 ${
              loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            📥 Download All
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4" id="em-sheet-table">
          {validData.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 font-bold">No data available</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-blue-700 text-white">
                      <th rowSpan="2" className="border border-black/20 p-1.5 text-center font-bold" style={{minWidth: '35px'}}>NO</th>
                      <th rowSpan="2" className="border border-black/20 p-1.5 text-center font-bold" style={{minWidth: '100px'}}>DOER NAME</th>
                      <th colSpan="4" className="border border-black/20 p-1.5 text-center font-bold">WITHOUT DELEGATION</th>
                      <th colSpan="5" className="border border-black/20 p-1.5 text-center font-bold">DELEGATION</th>
                      <th rowSpan="2" className="border border-black/20 p-1.5 text-center font-bold" style={{minWidth: '60px'}}>EM DOER</th>
                    </tr>
                    <tr className="bg-blue-600 text-white">
                      <th className="border border-black/20 p-1.5 text-center">TOTAL</th>
                      <th className="border border-black/20 p-1.5 text-center">PENDING</th>
                      <th className="border border-black/20 p-1.5 text-center">%</th>
                      <th className="border border-black/20 p-1.5 text-center">EM REP.</th>
                      <th className="border border-black/20 p-1.5 text-center">TOTAL</th>
                      <th className="border border-black/20 p-1.5 text-center">PENDING</th>
                      <th className="border border-black/20 p-1.5 text-center">%</th>
                      <th className="border border-black/20 p-1.5 text-center">EM REP.</th>
                      <th className="border border-black/20 p-1.5 text-center">NEXT TARGET</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((emp, idx) => {
                      const rowNum = (currentPage - 1) * rowsPerPage + idx + 1;
                      const isEMDoer = emp.emDoer === "YES";
                      const withoutDelegation = emp.withoutDelegation || {};
                      const delegation = emp.delegation || {};
                      
                      return (
                        <tr key={idx} className={`${isEMDoer ? 'bg-rose-50' : 'hover:bg-blue-50'} transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="border border-black/20 p-1.5 text-center font-bold">{rowNum}</td>
                          <td className="border border-black/20 p-1.5 text-left font-medium">{emp.doerName || ""}</td>
                          <td className="border border-black/20 p-1.5 text-center">{withoutDelegation.totalTask || 0}</td>
                          <td className="border border-black/20 p-1.5 text-center">{withoutDelegation.pendingTask || 0}</td>
                          <td className="border border-black/20 p-1.5 text-center font-bold text-blue-600">{withoutDelegation.percent || "0%"}</td>
                          <td className="border border-black/20 p-1.5 text-center">{withoutDelegation.emRepetition || ""}</td>
                          <td className="border border-black/20 p-1.5 text-center">{delegation.totalTask || 0}</td>
                          <td className="border border-black/20 p-1.5 text-center">{delegation.pendingTask || 0}</td>
                          <td className="border border-black/20 p-1.5 text-center font-bold text-indigo-600">{delegation.percent || "0%"}</td>
                          <td className="border border-black/20 p-1.5 text-center">{delegation.emRepetition || ""}</td>
                          <td className="border border-black/20 p-1.5 text-center">{delegation.nextTarget || ""}</td>
                          <td className={`border border-black/20 p-1.5 text-center font-bold ${isEMDoer ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {emp.emDoer || "NO"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded disabled:opacity-50 hover:bg-slate-300 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-bold text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded disabled:opacity-50 hover:bg-slate-300 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {footer && footer.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {footer.map((item, idx) => {
                  let label = "";
                  let value = "";
                  if (typeof item === 'string') {
                    label = item;
                  } else if (typeof item === 'object') {
                    label = item.label || "";
                    value = item.value || "";
                  }
                  return (
                    <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500">{label}</span>
                      <span className="text-xs font-black text-slate-700 ml-2">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-50 p-4 rounded-b-2xl border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white text-sm font-bold rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================
export default function Dashboard() {
  const { user, token } = useContext(AuthContext);

  const isEminentAdmin = useMemo(() => {
    const company = user?.company || user?.companyName || "";
    return company === "Eminent";
  }, [user]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [weekRange, setWeekRange] = useState({ start: "", end: "" });
  const [allDashboardData, setAllDashboardData] = useState([]);
  const [emSheetModalOpen, setEmSheetModalOpen] = useState(false);
  const [emSheetData, setEmSheetData] = useState({ employees: [], weekInfo: "", footer: [] });
  const [emSheetLoading, setEmSheetLoading] = useState(false);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await axios.get("/employee/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const loadAllDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/allDashboard/all-dashboard", {
        params: {
          month: selectedMonth,
          week: selectedWeek,
          selectedName: selectedEmployee === "all" ? "" : selectedEmployee,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllDashboardData(res.data.data || []);
      setWeekRange({ start: res.data.weekStart, end: res.data.weekEnd });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, selectedEmployee, selectedMonth, selectedWeek]);

  const loadEMSheetData = useCallback(async () => {
    try {
      setEmSheetLoading(true);
      const response = await axios.get("/em-sheet/em-sheet", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setEmSheetData({
          employees: response.data.data?.employees || [],
          weekInfo: response.data.data?.weekInfo || "",
          footer: response.data.data?.footer || []
        });
        setEmSheetModalOpen(true);
      } else {
        alert("Failed to fetch EM Sheet data: " + (response.data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error loading EM Sheet:", error);
      alert("Error loading EM Sheet: " + (error.response?.data?.error || error.message));
    } finally {
      setEmSheetLoading(false);
    }
  }, [token]);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);
  useEffect(() => { loadAllDashboard(); }, [loadAllDashboard]);

  const formatPercent = useCallback((value) => {
    if (!value && value !== 0) return "0.00%";
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00%";
    return num < 0 ? `${num.toFixed(2)}%` : `-${num.toFixed(2)}%`;
  }, []);

  const calculateWithoutDelegation = useCallback((emp) => {
    const checklist = emp.checklist || {};
    const helpAssigned = emp.helpTicket?.assigned || {};
    const supportAssigned = emp.supportTicket?.assigned || {};
    const totalWork = (checklist.totalWork || 0) + (helpAssigned.totalWork || 0) + (supportAssigned.totalWork || 0);
    const completedWork = (checklist.completedWork || 0) + (helpAssigned.completedWork || 0) + (supportAssigned.completedWork || 0);
    const pendingWork = (checklist.pendingWork || 0) + (helpAssigned.pendingWork || 0) + (supportAssigned.pendingWork || 0);
    const onTimeWork = (checklist.onTimeWork || 0) + (helpAssigned.onTimeWork || 0) + (supportAssigned.onTimeWork || 0);
    const pendingPercent = totalWork > 0 ? ((pendingWork / totalWork) * 100) : 0;
    const delayPercent = totalWork > 0 ? (((totalWork - onTimeWork) / totalWork) * 100) : 0;
    const overallScore = ((pendingPercent * 0.80) + (delayPercent * 0.20));
    return { 
      totalWork, 
      completedWork, 
      pendingWork, 
      onTimeWork, 
      pendingPercent: pendingPercent > 0 ? -pendingPercent : 0,
      delayPercent: delayPercent > 0 ? -delayPercent : 0,
      overallScore: overallScore > 0 ? -overallScore : 0 
    };
  }, []);

  const calculateDelegationOverall = useCallback((delegation) => {
    const del = delegation || {};
    const pendingPercent = parseFloat(del.pendingPercent) || 0;
    const delayPercent = parseFloat(del.delayPercent) || 0;
    const overall = ((pendingPercent * 0.80) + (delayPercent * 0.20));
    return overall > 0 ? -overall : 0;
  }, []);

  const downloadEMSheetPDF = useCallback(async (filterType = "all") => {
    try {
      setIsUpdating(true);
      
      const response = await axios.get("/em-sheet/em-sheet", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data.success) {
        alert("Failed to fetch EM Sheet data: " + (response.data.error || "Unknown error"));
        setIsUpdating(false);
        return;
      }

      let employeesData = response.data.data?.employees || [];
      const weekInfo = response.data.data?.weekInfo || "";
      const footer = response.data.data?.footer || [];
      
      let filteredData = employeesData.filter(emp => 
        emp.doerName && 
        emp.doerName !== "DOER NAME" && 
        emp.doerName !== "DOER NAME " &&
        !emp.doerName.includes("WEEK NO.")
      );

      if (filterType === "em") {
        filteredData = filteredData.filter(emp => emp.emDoer === "YES");
      }

      if (filteredData.length === 0) {
        alert("No data found to download!");
        setIsUpdating(false);
        return;
      }

      const doc = new jsPDF("landscape", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const addTitle = (docInstance) => {
        docInstance.setFillColor(255, 235, 156);
        docInstance.rect(10, 8, pageWidth - 20, 9, "F");
        docInstance.setFontSize(12);
        docInstance.setTextColor(0, 0, 0);
        docInstance.setFont("helvetica", "bold");
        const titleText = weekInfo || `WEEK NO.-${selectedWeek} ( ${weekRange.start} TO ${weekRange.end} )`;
        docInstance.text(titleText, pageWidth / 2, 14.5, { align: "center" });
      };

      const headers = [
        [
          { content: "NO", rowSpan: 2 },
          { content: "DOER NAME", rowSpan: 2 },
          { content: "WITHOUT DELEGATION", colSpan: 4 },
          { content: "DELEGATION", colSpan: 5 },
          { content: "EM DOER", rowSpan: 2 }
        ],
        [
          "TOTAL",
          "PENDING",
          "%",
          "EM REP.",
          "TOTAL",
          "PENDING",
          "%",
          "EM REP.",
          "NEXT TARGET",
          ""
        ]
      ];

      const fontSize = 6;
      const pageSize = 30;
      const pages = [];
      for (let i = 0; i < filteredData.length; i += pageSize) {
        pages.push(filteredData.slice(i, i + pageSize));
      }

      pages.forEach((pageData, pageIndex) => {
        if (pageIndex > 0) {
          doc.addPage();
        }
        addTitle(doc);

        const bodyData = pageData.map((emp, index) => {
          const startIndex = pageIndex * pageSize;
          const rowNum = startIndex + index + 1;
          const withoutDelegation = emp.withoutDelegation || {};
          const delegation = emp.delegation || {};
          
          return [
            rowNum,
            emp.doerName || "",
            withoutDelegation.totalTask || 0,
            withoutDelegation.pendingTask || 0,
            withoutDelegation.percent || "0%",
            withoutDelegation.emRepetition || "",
            delegation.totalTask || 0,
            delegation.pendingTask || 0,
            delegation.percent || "0%",
            delegation.emRepetition || "",
            delegation.nextTarget || "",
            emp.emDoer || "NO"
          ];
        });

        autoTable(doc, {
          head: headers,
          body: bodyData,
          startY: 22,
          theme: 'grid',
          styles: {
            fontSize: fontSize,
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            cellPadding: 0.8,
            minCellHeight: 4.5,
          },
          headStyles: {
            fillColor: [0, 102, 204],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: fontSize + 0.5,
            halign: 'center',
            valign: 'middle',
          },
          columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 28 },
            2: { cellWidth: 14 },
            3: { cellWidth: 14 },
            4: { cellWidth: 14 },
            5: { cellWidth: 18 },
            6: { cellWidth: 14 },
            7: { cellWidth: 14 },
            8: { cellWidth: 14 },
            9: { cellWidth: 18 },
            10: { cellWidth: 16 },
            11: { cellWidth: 10 },
          },
          tableWidth: 'auto',
          margin: { left: 6, right: 6 },
          pageBreak: 'avoid',
        });
      });

      if (footer && footer.length > 0) {
        const footerStartY = pageHeight - 25;
        const footerData = footer.map(f => {
          if (typeof f === 'object') {
            return [f.label || "", f.value || ""];
          }
          return [f, ""];
        });
        
        autoTable(doc, {
          body: footerData,
          startY: footerStartY,
          theme: 'grid',
          styles: {
            fontSize: 5.5,
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            cellPadding: 1,
          },
          headStyles: {
            fillColor: [198, 224, 180],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 5.5,
          },
          columnStyles: {
            0: { cellWidth: 85 },
            1: { cellWidth: 40 },
          },
          tableWidth: 125,
          margin: { left: pageWidth - 135 },
          pageBreak: 'avoid',
        });
      }

      const fileName = filterType === "em" ? `EM_ONLY_${selectedWeek}.pdf` : `EM_SHEET_${selectedWeek}.pdf`;
      doc.save(fileName);
      setIsUpdating(false);
      
    } catch (error) {
      console.error("Error:", error);
      alert("Error generating PDF: " + (error.response?.data?.error || error.message));
      setIsUpdating(false);
    }
  }, [selectedWeek, weekRange, token]);

  const sendBulkWhatsApp = useCallback(async () => {
    if (allDashboardData.length === 0) return alert("No data to send!");
    if (!window.confirm(`Send WhatsApp report to ${allDashboardData.length} employees?`)) return;
    setIsUpdating(true);
    const PHONE_ID = process.env.REACT_APP_META_WA_PHONE_ID;
    const TOKEN = process.env.REACT_APP_META_WA_TOKEN;
    const isMonday = new Date().getDay() === 1;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < allDashboardData.length; i++) {
      const emp = allDashboardData[i];
      const empInfo = employees.find(e => e.name === emp.name);
      const phone = empInfo?.number;
      if (!phone) continue;

      const cleanPhone = phone.toString().replace(/\D/g, "");
      const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const withoutDelData = calculateWithoutDelegation(emp);
      const woOverall = Math.abs(withoutDelData.overallScore || 0);
      const delOverall = Math.abs(calculateDelegationOverall(emp.delegation) || 0);
      const isHighScorer = woOverall > 10 || delOverall > 10;
      const var5 = isMonday ? (isHighScorer ? "⚠️ EM MEETING ALERT: Score > 10%" : "🌟 EXCELLENT") : "🚀 PERFORMANCE REMINDER";
      const var6 = isMonday ? (isHighScorer ? "Prepared with reasons." : "Proud of you!") : "Maintain your score.";

      try {
        await axiosLib.post(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
          messaging_product: "whatsapp",
          to: finalPhone,
          type: "template",
          template: {
            name: "workreport",
            language: { code: "en" },
            components: [{ type: "body", parameters: [
              { type: "text", text: String(emp.name) },
              { type: "text", text: `${weekRange.start} to ${weekRange.end}` },
              { type: "text", text: String(Math.round(delOverall * 100) / 100) },
              { type: "text", text: String(Math.round(woOverall * 100) / 100) },
              { type: "text", text: String(var5) },
              { type: "text", text: String(var6) }
            ]}]
          }
        }, { headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } });
        await delay(2000);
      } catch (err) {
        console.error(`Error for ${emp.name}:`, err.response?.data || err.message);
      }
    }
    setIsUpdating(false);
    alert("Bulk Process completed!");
  }, [allDashboardData, employees, weekRange, calculateWithoutDelegation, calculateDelegationOverall]);

  const downloadPDF = useCallback((filterType = "all") => {
    if (!allDashboardData.length) return alert("Please wait, data is still loading!");
    const doc = new jsPDF("landscape", "mm", "a4");
    doc.setFillColor(255, 235, 156);
    doc.rect(10, 10, 277, 8, "F");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`WEEK NO.-0${selectedWeek} ( ${weekRange.start} TO ${weekRange.end} ) - ${filterType === 'em' ? 'EM ONLY' : 'ALL'}`, 148, 15.5, { align: "center" });

    const headers = [
      [{ content: "DOER NO.", rowSpan: 2 }, { content: "DOER NAME", rowSpan: 2 }, { content: "WITHOUT DELEGATION", colSpan: 7 }, { content: "DELEGATION", colSpan: 7 }, { content: "OVERALL", colSpan: 7 }, { content: "EM DOER", rowSpan: 2 }],
      ["TOTAL", "COMPLETED", "ON TIME", "PENDING", "PEND %", "DELAY %", "SCORE", "TOTAL", "COMPLETED", "ON TIME", "PENDING", "PEND %", "DELAY %", "SCORE", "TOTAL", "COMPLETED", "ON TIME", "PENDING", "PEND %", "DELAY %", "SCORE", ""]
    ];

    const body = allDashboardData.map((emp, idx) => {
      const withoutDelData = calculateWithoutDelegation(emp);
      const delOverall = Math.abs(calculateDelegationOverall(emp.delegation) || 0);
      const overall = emp.overall || {};
      const woOverallNum = Math.abs(withoutDelData.overallScore || 0);
      const isEMDoer = (woOverallNum > 10 || delOverall > 10) ? "YES" : "NO";
      const del = emp.delegation || {};
      return [
        idx + 1, emp.name,
        withoutDelData.totalWork, withoutDelData.completedWork, withoutDelData.onTimeWork, withoutDelData.pendingWork,
        formatPercent(withoutDelData.pendingPercent), formatPercent(withoutDelData.delayPercent), formatPercent(withoutDelData.overallScore),
        del.totalWork || 0, del.completedWork || 0, del.onTimeWork || 0, del.pendingWork || 0,
        formatPercent(del.pendingPercent), formatPercent(del.delayPercent), formatPercent(delOverall),
        overall.totalWork || 0, overall.totalCompleted || 0, overall.totalOnTime || 0, overall.totalPending || 0,
        formatPercent(overall.pendingPercent), formatPercent(overall.delayPercent), formatPercent(overall.overallScore),
        isEMDoer
      ];
    }).filter((row) => filterType !== "em" || row[row.length - 1] === "YES");

    autoTable(doc, {
      head: headers, body, startY: 18, theme: 'grid',
      styles: { fontSize: 5, halign: 'center', lineWidth: 0.1, lineColor: [0, 0, 0] },
      headStyles: { fillColor: [198, 224, 180], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 1: { cellWidth: 20 }, 7: { cellWidth: 8 }, 14: { cellWidth: 8 }, 21: { cellWidth: 8 }, 22: { cellWidth: 8 } }
    });
    doc.save(`${filterType === "em" ? "EM_Report" : "Full_Report"}_W${selectedWeek}.pdf`);
  }, [allDashboardData, selectedWeek, weekRange, calculateWithoutDelegation, calculateDelegationOverall, formatPercent]);

  const employeeDataRendered = useMemo(() => {
    return allDashboardData.map((emp, idx) => {
      const withoutDelData = calculateWithoutDelegation(emp);
      const delOverall = Math.abs(calculateDelegationOverall(emp.delegation) || 0);
      const overallData = emp.overall || {};
      const woOverallNum = Math.abs(withoutDelData.overallScore || 0);
      const combinedOverall = ((woOverallNum + delOverall) / 2);
      return { emp, idx, withoutDelData, delOverall, overallData, combinedOverall, woOverallNum };
    });
  }, [allDashboardData, calculateWithoutDelegation, calculateDelegationOverall]);

  return (
    <div className="h-screen flex flex-col bg-slate-100 font-sans">
      <header className="sticky top-0 z-40 bg-slate-800 text-white px-4 py-3 md:px-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="font-black uppercase text-base md:text-lg leading-tight tracking-wider">Management Dashboard</h1>
            <p className="text-[10px] md:text-xs text-blue-400 font-bold">{weekRange.start || "Loading..."} — {weekRange.end || "Loading..."}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="grid grid-cols-2 sm:flex items-center bg-slate-900 rounded-xl p-2 gap-2 w-full sm:w-auto border border-slate-700">
              <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer p-1">
                <option value="all" className="text-black font-bold">All Employees</option>
                {employees.map((emp) => <option key={emp.key || emp.name} value={emp.key || emp.name} className="text-black">{emp.name}</option>)}
              </select>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer p-1">
                {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1} className="text-black">{new Date(0, i).toLocaleString("default", { month: "long" })}</option>)}
              </select>
              <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value === "all" ? "all" : Number(e.target.value))} className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer p-1 sm:border-l sm:border-slate-700 sm:pl-2">
                <option value="all" className="text-black">All Weeks</option>
                {[1, 2, 3, 4, 5].map((w) => <option key={w} value={w} className="text-black">Week {w}</option>)}
              </select>
            </div>
            {selectedEmployee === "all" && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button onClick={() => downloadPDF("all")} disabled={loading} className={`flex-1 sm:flex-none text-white text-[9px] font-black px-4 py-2 rounded shadow-lg transition-all active:scale-95 ${loading ? 'bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'}`}>ALL REPORT</button>
                <button onClick={() => downloadPDF("em")} disabled={loading} className={`flex-1 sm:flex-none text-white text-[9px] font-black px-4 py-2 rounded shadow-lg transition-all active:scale-95 ${loading ? 'bg-slate-600' : 'bg-rose-600 hover:bg-rose-700'}`}>EM REPORT</button>
                <button onClick={sendBulkWhatsApp} disabled={true} className="flex-1 sm:flex-none text-white text-[9px] font-black px-4 py-2 rounded shadow-lg bg-slate-600">WHATSAPP</button>
                
                {isEminentAdmin && (
                  <button 
                    onClick={loadEMSheetData}
                    disabled={loading || emSheetLoading} 
                    className={`flex-1 sm:flex-none text-white text-[9px] font-black px-4 py-2 rounded shadow-lg transition-all active:scale-95 ${
                      loading || emSheetLoading ? 'bg-slate-600' : 'bg-emerald-600 hover:bg-emerald-700 animate-pulse'
                    }`}
                  >
                    {emSheetLoading ? '⏳ Loading...' : '📊 EM Sheet Ritesh Sir'}
                  </button>
                )}
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
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 font-bold text-[10px]">{isUpdating ? "PDF" : "DATA"}</div>
            </div>
            <p className="mt-4 text-slate-600 font-black text-xs animate-pulse uppercase tracking-widest">{isUpdating ? "Generating PDF..." : "Fetching Dashboard..."}</p>
          </div>
        )}

        {!loading && (
          <div className="animate-fadeIn">
            {selectedEmployee === "all" ? (
              <div className="space-y-6">
                {employeeDataRendered.map(({ emp, idx, withoutDelData, delOverall, overallData, combinedOverall }) => (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all duration-300 group">
                    <div className="px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-blue-50 group-hover:from-blue-50 group-hover:to-indigo-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <h2 className="font-black uppercase text-lg text-slate-700 group-hover:text-blue-700">{emp.name}</h2>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-700">Employee #{idx + 1}</span>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${combinedOverall > 10 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{combinedOverall > 10 ? '⚠️ EM Required' : '✅ Good'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 cursor-default">
                      <SectionBlock title="Delegation" data={emp.delegation} score={formatPercent(delOverall)} formatPercent={formatPercent} theme="slate" />
                      <SectionBlock title="Without Delegation" data={withoutDelData} formatPercent={formatPercent} theme="blue" score={formatPercent(withoutDelData.overallScore)} />
                      <SectionBlock title="Overall" data={overallData} formatPercent={formatPercent} theme="emerald" score={formatPercent(overallData.overallScore)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                <SingleSection title="Delegation" data={allDashboardData[0]?.delegation} showScore={true} formatPercent={formatPercent} />
                <SingleSection title="Checklist" data={allDashboardData[0]?.checklist} formatPercent={formatPercent} />
                <SingleSection title="Help Tickets Assigned" data={allDashboardData[0]?.helpTicket?.assigned} formatPercent={formatPercent} />
                <SingleSection title="Help Tickets Created" data={allDashboardData[0]?.helpTicket?.created} formatPercent={formatPercent} />
                <SingleSection title="Support Tickets Assigned" data={allDashboardData[0]?.supportTicket?.assigned} formatPercent={formatPercent} />
                <SingleSection title="Support Tickets Created" data={allDashboardData[0]?.supportTicket?.created} formatPercent={formatPercent} />
                <SingleSection title="Overall" data={allDashboardData[0]?.overall} showScore={true} formatPercent={formatPercent} />
              </div>
            )}

            {allDashboardData.length === 0 && !loading && (
              <div className="text-center py-20 bg-white rounded-3xl shadow-inner border-2 border-dashed border-slate-300">
                <p className="text-slate-400 font-bold uppercase tracking-widest">No Data Found</p>
              </div>
            )}
          </div>
        )}
      </main>

      <EMSheetModal
        isOpen={emSheetModalOpen}
        onClose={() => setEmSheetModalOpen(false)}
        data={emSheetData.employees}
        weekInfo={emSheetData.weekInfo}
        footer={emSheetData.footer}
        onDownloadEM={() => downloadEMSheetPDF("em")}
        onDownloadAll={() => downloadEMSheetPDF("all")}
        loading={isUpdating}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}

// ============================================================
// MEMOIZED SECTION BLOCK
// ============================================================
const SectionBlock = React.memo(({ title, data, score, formatPercent, theme }) => {
  const baseTheme = theme === "blue" ? "from-blue-50" : theme === "emerald" ? "from-emerald-50" : "from-slate-50";
  return (
    <div className={`border border-slate-200 rounded-xl p-5 bg-gradient-to-br ${baseTheme} to-white hover:shadow-md transition-all duration-300 hover:border-blue-300`}>
      <h3 className="font-black text-sm uppercase text-center mb-4 text-slate-600 border-b pb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        <MiniCard title="Total Work" value={data?.totalWork || 0} theme="slate" />
        <MiniCard title="Completed" value={data?.completedWork || data?.totalCompleted || 0} theme="emerald" />
        <MiniCard title="On Time" value={data?.onTimeWork || data?.totalOnTime || 0} theme="emerald" />
        <MiniCard title="Pending" value={data?.pendingWork || data?.totalPending || 0} theme="amber" />
        <MiniCard title="Pending %" value={formatPercent(data?.pendingPercent)} theme="indigo" />
        <MiniCard title="Delay %" value={formatPercent(data?.delayPercent)} theme="rose" />
      </div>
      {score !== undefined && (
        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="text-center">
            <span className="text-xs font-bold text-slate-500">{title} Score</span>
            <p className="text-xl font-black text-blue-600">{score}</p>
          </div>
        </div>
      )}
    </div>
  );
});