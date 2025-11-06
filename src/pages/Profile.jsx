// Profile.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCcw, Search, CheckCircle, Package } from "lucide-react";
console.log("PROFILE module loaded");

/**
 * Profile (Dashboard) page.
 * - Shows KPI: total reported, returned count, last reported items.
 * - Fetches items from API /items or falls back to localStorage.
 * - Assumes items have fields: id (or itemId), email, timestamp, images[], itemName, returned (boolean) or status === 'returned'
 *
 * Place this component at route "/profile".
 */

const API_BASE = process.env.REACT_APP_API_URL || "https://xq7a7biw3b.execute-api.ap-south-1.amazonaws.com/dev";

const Profile = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // read user's email similarly to your Navbar logic
  const userEmail = (() => {
    const r = localStorage.getItem("userRole");
    const e = r === "admin"
      ? (localStorage.getItem("adminEmail") || localStorage.getItem("userEmail"))
      : (localStorage.getItem("userEmail") || localStorage.getItem("adminEmail"));
    // fallback to idToken payload if you decode it elsewhere; we keep simple
    return (e || "").toLowerCase();
  })();

  const fetchItems = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/items`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("idToken") ? { Authorization: `Bearer ${localStorage.getItem("idToken")}` } : {}),
        },
      });

      let data = [];
      if (res.ok) {
        data = await res.json();
      } else {
        // fallback to localStorage copy
        console.warn("GET /items failed with", res.status, "- falling back to localStorage");
        data = JSON.parse(localStorage.getItem("foundItems")) || [];
      }

      // normalize if body wrapped
      if (data && typeof data.body === "string") {
        try {
          const parsed = JSON.parse(data.body);
          if (Array.isArray(parsed)) data = parsed;
        } catch (e) { /* ignore */ }
      }

      setItems(Array.isArray(data) ? data : []);
      setLastRefreshed(new Date().toLocaleString());
      // also update localStorage canonical copy to keep single source locally
      try { localStorage.setItem("foundItems", JSON.stringify(Array.isArray(data) ? data : [])); } catch(e){}
    } catch (err) {
      console.error("fetchItems error:", err);
      setError("Unable to fetch items from server. Showing local data.");
      const local = JSON.parse(localStorage.getItem("foundItems")) || [];
      setItems(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // listen for external refresh events (e.g. when delete elsewhere)
    const onRefresh = () => fetchItems();
    window.addEventListener("foundItems:refresh", onRefresh);
    return () => window.removeEventListener("foundItems:refresh", onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter only items reported by this user
  const myItems = items.filter(it => (it.email || "").toLowerCase() === userEmail);
  const totalReported = myItems.length;
  const totalReturned = myItems.filter(it => it.returned === true || (it.status && it.status.toLowerCase() === "returned")).length;

  const recent = myItems.slice(0, 6);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Overview of items you reported</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchItems} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <RefreshCcw size={16} /> Refresh
          </button>
          <Link to="/settings" className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Manage (Settings)
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500">Total reported</p>
          <div className="mt-2 text-2xl font-semibold">{loading ? "..." : totalReported}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500">Total returned</p>
          <div className="mt-2 text-2xl font-semibold text-green-600">{loading ? "..." : totalReturned}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500">Last refreshed</p>
          <div className="mt-2 text-sm">{lastRefreshed || "—"}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-white">Recent items you reported</h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">{loading ? "loading…" : `${totalReported} total`}</div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading items…</div>
        ) : recent.length === 0 ? (
          <div className="py-8 text-center text-gray-500">You haven't reported any items yet.</div>
        ) : (
          <div className="grid gap-3">
            {recent.map(it => (
              <div key={it.id || it.itemId || it.timestamp} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                <div className="w-20 h-14 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                  {it.images?.[0] ? <img src={it.images[0]} alt={it.itemName} className="w-full h-full object-cover" /> : <div className="text-gray-400">No image</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{it.itemName || "Unnamed item"}</div>
                    <div className="text-xs text-gray-400">{it.timestamp ? new Date(it.timestamp).toLocaleDateString() : ""}</div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{it.location || ""}</div>
                  <div className="text-xs text-gray-400 mt-1">{it.description ? (it.description.length > 100 ? it.description.slice(0, 100) + "…" : it.description) : ""}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
