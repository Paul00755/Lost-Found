// SettingsPage.jsx
import React, { useEffect, useState } from "react";
import { Trash2, RefreshCcw } from "lucide-react";

/**
 * SettingsPage.jsx
 * - Full page management of items reported by the logged-in user.
 * - Supports delete (DELETE /items/{id}) with fallback.
 * - Updates localStorage and dispatches foundItems:refresh on success.
 *
 * Place this component at route "/settings".
 */

const API_BASE = process.env.REACT_APP_API_URL || "https://xq7a7biw3b.execute-api.ap-south-1.amazonaws.com/dev";

const SettingsPage = () => {
  const [userItems, setUserItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const userEmail = (() => {
    const r = localStorage.getItem("userRole");
    const e = r === "admin"
      ? (localStorage.getItem("adminEmail") || localStorage.getItem("userEmail"))
      : (localStorage.getItem("userEmail") || localStorage.getItem("adminEmail"));
    return (e || "").toLowerCase();
  })();

  const fetchUserItems = async () => {
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

      let items = [];
      if (res.ok) {
        items = await res.json();
      } else {
        items = JSON.parse(localStorage.getItem("foundItems")) || [];
      }

      if (!Array.isArray(items) && items && typeof items.body === "string") {
        try {
          const parsed = JSON.parse(items.body);
          if (Array.isArray(parsed)) items = parsed;
        } catch (e) {}
      }

      const filtered = (items || []).filter(it => (it.email || "").toLowerCase() === userEmail);
      filtered.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
      setUserItems(filtered);
      // update localStorage canonical copy
      try { localStorage.setItem("foundItems", JSON.stringify(items)); } catch(e){}
    } catch (err) {
      console.error("fetchUserItems error:", err);
      setError("Unable to fetch items from server. Showing local data.");
      const items = JSON.parse(localStorage.getItem("foundItems")) || [];
      const filtered = items.filter(it => (it.email || "").toLowerCase() === userEmail);
      setUserItems(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserItems();
    const onRefresh = () => fetchUserItems();
    window.addEventListener("foundItems:refresh", onRefresh);
    return () => window.removeEventListener("foundItems:refresh", onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteItem = async (id) => {
    if (!id) return;
    const confirm = window.confirm("Delete this item permanently?");
    if (!confirm) return;

    try {
      setDeletingId(id);
      setError("");

      const idToken = localStorage.getItem("idToken");
      const res = await fetch(`${API_BASE}/items/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });

      if (!res.ok) {
        // fallback to body delete
        if (res.status === 400 || res.status === 404) {
          const fallback = await fetch(`${API_BASE}/items`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({ id }),
          });
          if (!fallback.ok) throw new Error(`Delete failed (fallback): ${fallback.status}`);
        } else {
          const text = await res.text().catch(() => "");
          throw new Error(`Delete failed: ${res.status} ${text}`);
        }
      }

      // On success re-fetch user items
      await fetchUserItems();

      // Update localStorage canonical copy to remove deleted item
      try {
        const stored = JSON.parse(localStorage.getItem("foundItems")) || [];
        const newStored = stored.filter(it => (it.id || it.itemId || it.itemID) !== id);
        localStorage.setItem("foundItems", JSON.stringify(newStored));
      } catch (e) {
        console.warn("Could not update localStorage after delete:", e);
      }

      // notify other components
      try { window.dispatchEvent(new Event("foundItems:refresh")); } catch (e) {}

    } catch (err) {
      console.error("deleteItem error:", err);
      setError("Failed to delete item. Check server logs or your permissions.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings / Manage Items</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Delete or manage items you reported</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchUserItems} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4">
          {loading ? (
            <div className="text-center py-6 text-gray-500">Loading your reported items…</div>
          ) : userItems.length === 0 ? (
            <div className="text-center py-6 text-gray-500">You haven't reported any items yet.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {userItems.map(it => (
                <div key={it.id || it.itemId || it.timestamp} className="flex items-center gap-3 p-4">
                  <div className="w-20 h-16 bg-gray-100 dark:bg-gray-900 rounded overflow-hidden flex items-center justify-center">
                    {it.images?.[0] ? <img src={it.images[0]} alt={it.itemName} className="w-full h-full object-cover" /> : <div className="text-gray-400">No image</div>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{it.itemName || "Unnamed item"}</div>
                      <div className="text-xs text-gray-400">{it.timestamp ? new Date(it.timestamp).toLocaleDateString() : ""}</div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{it.location || ""}</div>
                    <div className="text-xs text-gray-400 mt-1">{it.description ? (it.description.length > 120 ? it.description.slice(0,120) + "…" : it.description) : ""}</div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => deleteItem(it.id || it.itemId)}
                      disabled={deletingId === (it.id || it.itemId)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition"
                    >
                      <Trash2 size={14} /> {deletingId === (it.id || it.itemId) ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
