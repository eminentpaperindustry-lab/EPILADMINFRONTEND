import React, { useState } from "react";

export default function SupportTicket() {
  const [tickets, setTickets] = useState([
    { id: "s1", name: "Amit", issue: "Server down", status: "Open" },
  ]);
  const [issue, setIssue] = useState("");

  function create() {
    const t = { id: "s" + (tickets.length + 1), name: "You", issue: issue || "No details", status: "Open" };
    setTickets([t, ...tickets]);
    setIssue("");
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Support Tickets</h2>

      <div className="mb-4 bg-white p-4 rounded shadow">
        <div className="flex gap-2">
          <input value={issue} onChange={(e)=>setIssue(e.target.value)} placeholder="Describe issue" className="border p-2 rounded flex-1" />
          <button onClick={create} className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
        </div>
      </div>

      <div className="space-y-3">
        {tickets.map(t => (
          <div key={t.id} className="bg-white p-3 rounded shadow flex items-center justify-between">
            <div>
              <div className="font-medium">{t.issue}</div>
              <div className="text-xs text-gray-500">By: {t.name}</div>
            </div>
            <div>
              <span className="text-sm px-2 py-1 rounded bg-red-100 text-red-800">{t.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
