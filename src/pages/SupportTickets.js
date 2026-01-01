import React, { useEffect, useState, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

export default function SupportTicket() {
  const { user } = useContext(AuthContext);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [modalImage, setModalImage] = useState(null);

  const authHeader = {
    headers: { Authorization: `Bearer ${user.token}` },
  };

  const loadTickets = async (status) => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;

      const res = await axios.get("/support-tickets/all", {
        ...authHeader,
        params,
      });

      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTickets("");
  }, []);

  const handleTabClick = (status) => {
    setActiveTab(status);
    loadTickets(status);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* HEADER */}
      <h2 className="text-2xl font-semibold mb-4">
        Support Tickets
      </h2>

      {/* TABS (STATIC) */}
      <div className="bg-white p-4 rounded shadow mb-4 flex gap-2 flex-wrap">
        {[
          { label: "All Tickets", value: "" },
          { label: "Pending", value: "Pending" },
          { label: "In Progress", value: "InProgress" },
          { label: "Completed", value: "Done" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabClick(tab.value)}
            className={`px-4 py-2 rounded font-medium ${
              activeTab === tab.value
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SCROLLABLE DATA AREA */}
      <div className="flex-1 overflow-y-auto pr-2">
        {loading && (
          <div className="text-center text-gray-500 py-6">
            Loading tickets...
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <div className="text-center text-gray-500 py-6">
            No tickets available
          </div>
        )}

        {!loading && (
          <div className="grid gap-4">
            {tickets.map((t) => {
              const createdDate = dayjs(
                t.CreatedDate,
                "DD/MM/YYYY HH:mm:ss"
              );

              return (
                <div
                  key={t.TicketID}
                  className="bg-white p-4 rounded shadow flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-lg">
                      {t.Issue}
                    </div>

                    <div className="text-sm text-gray-600">
                      Created By: <b>{t.CreatedBy}</b>
                    </div>

                    <div className="text-sm text-gray-600">
                      Assigned To: <b>{t.AssignedTo}</b>
                    </div>

                    <div className="text-sm text-gray-600">
                      {createdDate.format("DD MMM YYYY, HH:mm")}
                    </div>

                    <div className="text-sm text-gray-600">
                      {createdDate.fromNow()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {t.IssuePhoto && (
                      <button
                        type="button"
                        onClick={() =>
                          setModalImage(t.IssuePhoto)
                        }
                        className="bg-gray-700 text-white px-3 py-1 rounded"
                      >
                        View Image
                      </button>
                    )}

                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        t.Status === "Pending"
                          ? "bg-yellow-400 text-black"
                          : t.Status === "InProgress"
                          ? "bg-blue-600 text-white"
                          : "bg-green-600 text-white"
                      }`}
                    >
                      {t.Status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* IMAGE MODAL */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="relative">
            <button
              type="button"
              onClick={() => setModalImage(null)}
              className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full"
            >
              ×
            </button>
            <img
              src={modalImage}
              alt="Issue"
              className="max-w-[90vw] max-h-[90vh] rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
