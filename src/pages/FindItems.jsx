import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { api } from "../services/api";

const FindItems = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL || "https://xq7a7biw3b.execute-api.ap-south-1.amazonaws.com/dev";

  // Admin check (simple): set localStorage.setItem('isAdmin','true') for admin testing
  const isAdmin = typeof window !== "undefined" && localStorage.getItem("isAdmin") === "true";

  // Load from localStorage on mount
  useEffect(() => {
    const storedItems = JSON.parse(localStorage.getItem("foundItems")) || [];
    setItems(storedItems);

    const lastUpdateTime = localStorage.getItem("lastDataUpdate");
    if (lastUpdateTime) setLastUpdate(new Date(parseInt(lastUpdateTime)).toLocaleString());

    // listen for custom refresh events (from submit or delete)
    const onRefresh = () => fetchItems();
    window.addEventListener("foundItems:refresh", onRefresh);

    // initial fetch
    fetchItems();

    return () => window.removeEventListener("foundItems:refresh", onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch items (tries api.getItems then fallback)
  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("🔄 Fetching latest items...");

      const currentStored = JSON.parse(localStorage.getItem("foundItems")) || [];
      setItems(currentStored);

      let apiResponseData = null;
      let usedApiHelper = false;

      try {
        if (api && typeof api.getItems === "function") {
          console.log("api.js: trying api.getItems()");
          const helperResult = await api.getItems();
          apiResponseData = helperResult;
          usedApiHelper = true;
        }
      } catch (helperErr) {
        console.warn("api.getItems failed or threw:", helperErr);
        apiResponseData = null;
      }

      if (!apiResponseData) {
        const endpoint = `${API_BASE}/items`;
        console.log("api.js: falling back to direct fetch ->", endpoint);

        try {
          console.log("Attempting GET /items (no body)...");
          const res = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(localStorage.getItem("idToken") ? { Authorization: `Bearer ${localStorage.getItem("idToken")}` } : {}),
            },
          });

          if (res.ok) {
            apiResponseData = await res.json();
            console.log("GET /items OK");
          } else {
            console.warn("GET /items returned status", res.status);
            if (res.status === 400) {
              console.log("GET returned 400; will try POST /items with empty payload");
              const postRes = await fetch(endpoint, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(localStorage.getItem("idToken") ? { Authorization: `Bearer ${localStorage.getItem("idToken")}` } : {}),
                },
                body: JSON.stringify({}),
              });
              if (postRes.ok) {
                apiResponseData = await postRes.json();
                console.log("POST /items OK");
              } else {
                console.warn("POST /items returned status", postRes.status);
                throw new Error(`Server responded ${postRes.status}`);
              }
            } else {
              let text = await res.text();
              console.warn("GET /items non-OK response body:", text);
              throw new Error(`GET /items failed: ${res.status}`);
            }
          }
        } catch (fetchErr) {
          console.error("Direct fetch failed:", fetchErr);
          throw fetchErr;
        }
      }

      // normalize response
      let apiItems = [];
      if (Array.isArray(apiResponseData)) apiItems = apiResponseData;
      else if (apiResponseData && Array.isArray(apiResponseData.items)) apiItems = apiResponseData.items;
      else if (apiResponseData && Array.isArray(apiResponseData.body)) apiItems = apiResponseData.body;
      else if (apiResponseData && typeof apiResponseData.body === "string") {
        try {
          const parsed = JSON.parse(apiResponseData.body);
          if (Array.isArray(parsed)) apiItems = parsed;
          else if (parsed && Array.isArray(parsed.items)) apiItems = parsed.items;
        } catch (e) {
          console.warn("Could not parse apiResponseData.body as JSON");
        }
      }

      if (apiItems && apiItems.length >= 0) {
        const merged = mergeItems(currentStored, apiItems);
        setItems(merged);
        localStorage.setItem("foundItems", JSON.stringify(merged));
        localStorage.setItem("lastDataUpdate", Date.now().toString());
        setLastUpdate(new Date().toLocaleString());
        console.log("✅ Updated with API data, count:", merged.length, usedApiHelper ? "(from api.getItems())" : "(direct fetch)");
      } else {
        setItems(currentStored);
        setError("No new items found from server. Showing local data.");
        console.log("ℹ️ Using local storage data (no usable API response)");
      }
    } catch (err) {
      console.error("❌ API fetch failed, using localStorage:", err);
      setError("Unable to connect to server. Showing local data.");
      const fallback = JSON.parse(localStorage.getItem("foundItems")) || [];
      setItems(fallback);
    } finally {
      setLoading(false);
    }
  };

  // merge items: prefer API; dedupe by id AND by timestamp (to replace temp local items)
  const mergeItems = (localItems, apiItems) => {
    const merged = [...localItems];

    apiItems.forEach((apiItem) => {
      const apiId = apiItem.itemId || apiItem.id || apiItem.itemID || apiItem.idStr || apiItem.uuid;
      const apiTs = apiItem.timestamp ? Number(apiItem.timestamp) : null;

      // find by id
      let existingIndex = -1;
      if (apiId) {
        existingIndex = merged.findIndex((it) => {
          const itId = it.itemId || it.id || it.itemID || it.idStr || it.uuid;
          return itId && itId === apiId;
        });
      }

      // if not found by id, try match by timestamp (temp-local item)
      if (existingIndex === -1 && apiTs) {
        existingIndex = merged.findIndex((it) => {
          const itTs = it?.timestamp ? Number(it.timestamp) : null;
          return itTs && itTs === apiTs;
        });
      }

      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...apiItem };
      } else {
        merged.push(apiItem);
      }
    });

    // Optionally remove duplicates if any remaining (by id or timestamp)
    const seen = new Map();
    const deduped = [];
    merged.forEach((it) => {
      const key = (it.id || it.itemId || "") + "::" + (it.timestamp ? String(it.timestamp) : "");
      if (!seen.has(key)) {
        seen.set(key, true);
        deduped.push(it);
      }
    });

    return deduped;
  };

  useEffect(() => {
    filterItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, searchTerm, dateFilter, customDate, sortBy]);

  const filterItems = () => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const now = new Date().getTime();
    filtered = filtered.filter((item) => {
      if (!item.timestamp) return true;
      const itemDate = new Date(item.timestamp).getTime();
      switch (dateFilter) {
        case "today":
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          return itemDate >= startOfToday;
        case "yesterday":
          const startOfYesterday = new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000;
          const endOfYesterday = new Date().setHours(0, 0, 0, 0) - 1;
          return itemDate >= startOfYesterday && itemDate <= endOfYesterday;
        case "week":
          const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
          return itemDate >= oneWeekAgo;
        case "month":
          const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
          return itemDate >= oneMonthAgo;
        case "custom":
          if (customDate) {
            const selectedDate = new Date(customDate).getTime();
            const nextDay = selectedDate + 24 * 60 * 60 * 1000;
            return itemDate >= selectedDate && itemDate < nextDay;
          }
          return true;
        default:
          return true;
      }
    });

    filtered.sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return sortBy === "newest" ? timeB - timeA : timeA - timeB;
    });

    setFilteredItems(filtered);
  };

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "today": return "Today";
      case "yesterday": return "Yesterday";
      case "week": return "Last Week";
      case "month": return "Last Month";
      case "custom": return customDate ? new Date(customDate).toLocaleDateString() : "Custom Date";
      default: return "All Time";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
    setCustomDate("");
    setSortBy("newest");
  };

  const refreshItems = () => fetchItems();

  // Delete handler - calls backend DELETE then updates state & localStorage
  const handleDelete = async (itemId) => {
    if (!itemId) return;
    const confirmed = window.confirm("Are you sure you want to delete this item? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setLoading(true);
      setError("");
      const idToken = localStorage.getItem("idToken");

      // Prefer path param delete
      const res = await fetch(`${API_BASE}/items/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      });

      if (!res.ok) {
        // fallback: DELETE with JSON body
        if (res.status === 400) {
          const fallback = await fetch(`${API_BASE}/items`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({ id: itemId }),
          });
          if (!fallback.ok) throw new Error(`Delete failed: ${fallback.status}`);
        } else {
          throw new Error(`Delete failed: ${res.status}`);
        }
      }

      // remove locally
      const newItems = items.filter(it => (it.id || it.itemId || it.itemID) !== itemId);
      setItems(newItems);
      setFilteredItems(prev => prev.filter(it => (it.id || it.itemId || it.itemID) !== itemId));
      localStorage.setItem("foundItems", JSON.stringify(newItems));

      // notify others
      try { window.dispatchEvent(new Event("foundItems:refresh")); } catch(e) {}

      // optional toast
      // toast.success("Item deleted");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete item. Check server logs or permissions.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300">Loading items...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-300 mb-2">🔎 Found Items</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {items.length > 0 ? `Browse ${items.length} found items` : "No items found yet"}
            {lastUpdate && (<span className="text-sm text-gray-500 dark:text-gray-500 ml-2">• Updated {lastUpdate}</span>)}
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={refreshItems} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium">
            {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Refreshing...</>) : (<><span>🔄</span> Refresh</>)}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 text-sm">💡</span>
            </div>
            <p className="text-blue-800 dark:text-blue-300 text-sm flex-1">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🔍 Search Items</label>
            <input type="text" placeholder="Search by name, description, location..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📅 Filter by Date</label>
            <select value={dateFilter} onChange={(e)=>setDateFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {dateFilter === "custom" && (<div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
            <input type="date" value={customDate} onChange={(e)=>setCustomDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"/>
          </div>)}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🔄 Sort By</label>
            <select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{filteredItems.length}</span> of <span className="font-semibold text-gray-800 dark:text-gray-200">{items.length}</span> items
            {(dateFilter !== "all" || searchTerm) && (<span className="ml-3 text-xs text-blue-600 dark:text-blue-400">{dateFilter !== "all" && `• ${getDateFilterLabel()}`}{searchTerm && ` • Search: "${searchTerm}"`}</span>)}
          </div>

          {(searchTerm || dateFilter !== "all" || sortBy !== "newest") && (<button onClick={clearFilters} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium">Clear Filters</button>)}
        </div>
      </div>

      {/* Results */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-6">🔍</div>
          <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-3">No items found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">{items.length === 0 ? "No items have been reported yet. Be the first to report a found item!" : "Try adjusting your search criteria or filters to see more results."}</p>
          {items.length > 0 && (<button onClick={clearFilters} className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">Show All Items</button>)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <div key={item.itemId || item.id || idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
              {item.images?.length > 0 ? (
                <Slider {...sliderSettings}>
                  {item.images.map((img, i) => (
                    <div key={i} className="w-full h-48 rounded-lg overflow-hidden">
                      <img src={img} alt={`${item.itemName} - Image ${i + 1}`} className="w-full h-48 object-cover" onError={(e)=>{ e.target.src='data:image/svg+xml;base64,PHN2Zy...'; e.target.className="w-full h-48 object-contain bg-gray-100 dark:bg-gray-700"; }}/>
                    </div>
                  ))}
                </Slider>
              ) : (
                <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-3xl mb-2">📷</div>
                  <span className="text-sm">No Image</span>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white line-clamp-1">{item.itemName}</h3>
                {item.description && <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">{item.description}</p>}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="text-gray-400">📍</span><span className="line-clamp-1">{item.location}</span></div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="text-gray-400">📧</span><span className="line-clamp-1">{item.email}</span></div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><span className="text-gray-400">📱</span><span>{item.phone}</span></div>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reported {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "Unknown Date"} • {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</p>

                  {/* Admin delete */}
                  {isAdmin && (
                    <div>
                      <button onClick={() => handleDelete(item.id || item.itemId)} className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindItems;
