// app/admin/page.js
"use client";

import { useEffect, useState } from "react";
import ReportsTab from "./ReportsTab";
import UsersTab from "./UsersTab";

export default function AdminPage() {
  const [tab, setTab] = useState("reports");

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 py-8 px-4 md:px-8 font-sans transition-all duration-500">
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-6 transition-transform duration-500 hover:scale-[1.01]">
      <h1 className="text-3xl font-extrabold text-[#00274D] text-center mb-4">
        Admin Dashboard
      </h1>

      <div className="flex flex-wrap justify-center gap-4 mb-4">
        <button
          onClick={() => setTab("reports")}
          className={`px-5 py-2 rounded-lg font-medium transition shadow-sm ${
            tab === "reports"
              ? "bg-yellow-400 text-[#00274D] hover:bg-yellow-500"
              : "bg-slate-100 text-gray-800 hover:bg-slate-200"
          }`}
        >
          Reports
        </button>
        <button
          onClick={() => setTab("users")}
          className={`px-5 py-2 rounded-lg font-medium transition shadow-sm ${
            tab === "users"
              ? "bg-yellow-400 text-[#00274D] hover:bg-yellow-500"
              : "bg-slate-100 text-gray-800 hover:bg-slate-200"
          }`}
        >
          Users
        </button>
      </div>

      {tab === "reports" && <ReportsTab />}
      {tab === "users" && <UsersTab />}
    </div>
  </div>
);

}
