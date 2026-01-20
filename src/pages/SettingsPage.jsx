// SettingsPage.jsx
import React, { useEffect, useState } from "react";
import { Trash2, RefreshCcw, CheckCircle } from "lucide-react";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://xq7a7biw3b.execute-api.ap-south-1.amazonaws.com/dev";

const SettingsPage = () => {
  const [userItems, setUserItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [markingId, setMarkingId] = useState(null);

  const userEmail = (() => {
    const r = localStorage.getItem("userRole");
    const e =
      r === "admin"
        ? localStorage.getItem("adminEmail") ||
          localStorage.getItem("userEmail")
        : localStorage.getItem("userEmail") ||
          localStorage.getItem("adminEmail");
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
          ...(localStorage.getItem("idToken")
            ? { Authorization: `Bearer ${localStorage.getItem("idToken")}` }
            : {}),
        },
      });

      let items = [];
      if (res.ok) {
        items = await res.json();
      } else {
        items = JSON.parse(localStorage.getItem("foundItems")) || [];
      }

      if (!Array.isArray(items) && items?.body) {
        try {
          items = JSON.parse(items.body);
        } catch {}
      }

      const filtered = (items || [])
        .filter((it) => (it.email || "").toLowerCase() === userEmail)
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setUserItems(filtered);
      localStorage.setItem("foundItems", JSON.stringify(items));
    } catch (err) {
      console.error(err);
      setError("Unable to fetch items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserItems();
    const onRefresh = () => fetchUserItems();
    window.addEventListener("foundItems:refresh", onRefresh);
    return () =>
      window.removeEventListener("foundItems:refresh", onRefresh);
  }, []);

  /* =========================
     MARK AS RETURNED (NEW)
     ========================= */
  const markAsReturned = async (id) => {
    if (!id) return;
    const ok = window.confirm(
      "Mark this item as returned? This cannot be undone."
    );
    if (!ok) return;

    try {
      setMarkingId(id);
      setError("");

      const idToken = localStorage.getItem("idToken");

      const res = await fetch(`${API_BASE}/items/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ returned: true }),
      });

      if (!res.ok) {
        throw new Error(`Mark returned failed: ${res.status}`);
      }

      // update local state
     setUserItems(prev =>
  prev.map(it =>
    (it.id || it.itemId) === id
      ? { ...it, returned: true, returnedDate: Date.now() }
      : it
        )
      );

      // update localStorage
      try {
        const stored = JSON.parse(localStorage.getItem("foundItems")) || [];
const updated = stored.map(it =>
  (it.id || it.itemId) === id
    ? { ...it, returned: true, returnedDate: Date.now() }
    : it
);
localStorage.setItem("foundItems", JSON.stringify(updated));

      } catch {}

      window.dispatchEvent(new Event("foundItems:refresh"));
    } catch (err) {
      console.error(err);
      setError("Failed to mark item as returned.");
    } finally {
      setMarkingId(null);
    }
  };

  /* =========================
     DELETE (UNCHANGED)
     ========================= */
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

      if (!res.ok) throw new Error("Delete failed");

      await fetchUserItems();
      window.dispatchEvent(new Event("foundItems:refresh"));
    } catch (err) {
      console.error(err);
      setError("Failed to delete item.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Settings / Manage Items</h1>
        <button
          onClick={fetchUserItems}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
        {loading ? (
          <div className="p-6 text-center">Loading…</div>
        ) : userItems.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            You haven't reported any items yet.
          </div>
        ) : (
          userItems.map((it) => {
            const id = it.id || it.itemId;
            return (
              <div
                key={id}
                className="flex items-center justify-between p-4 border-b dark:border-gray-700"
              >
                <div>
                  <div className="font-medium">{it.itemName}</div>
                  <div className="text-sm text-gray-500">
                    {it.returned ? "Returned" : "Active"}
                  </div>
                </div>

                <div className="flex gap-3">
                  {!it.returned && (
                    <button
                      onClick={() => markAsReturned(id)}
                      disabled={markingId === id}
                      className="flex items-center gap-1 text-green-600 hover:bg-green-50 px-3 py-2 rounded"
                    >
                      <CheckCircle size={14} />
                      {markingId === id ? "Marking…" : "Mark Returned"}
                    </button>
                  )}

                  <button
                    onClick={() => deleteItem(id)}
                    disabled={deletingId === id}
                    className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-2 rounded"
                  >
                    <Trash2 size={14} />
                    {deletingId === id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
