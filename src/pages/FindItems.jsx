// FindItems.jsx
import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://xq7a7biw3b.execute-api.ap-south-1.amazonaws.com/dev";

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

  const isAdmin =
    typeof window !== "undefined" &&
    localStorage.getItem("isAdmin") === "true";
    // Helper: consistent ID extraction
const getId = (item) =>
  item?.id ||
  item?.itemId ||
  item?.itemID ||
  item?.uuid ||
  "";

// Manual refresh button handler
const refreshItems = () => fetchItems();

// Date filter label helper
const getDateFilterLabel = () => {
  switch (dateFilter) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "week":
      return "Last 7 Days";
    case "month":
      return "Last 30 Days";
    case "custom":
      return customDate
        ? new Date(customDate).toLocaleDateString()
        : "Custom Date";
    default:
      return "All Time";
  }
};


  /* ======================================================
     🔧 FIX: API IS SINGLE SOURCE OF TRUTH
     ====================================================== */
  useEffect(() => {
    fetchItems();

    const onRefresh = () => fetchItems();
    window.addEventListener("foundItems:refresh", onRefresh);
    return () => window.removeEventListener("foundItems:refresh", onRefresh);
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/items`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem("idToken")
            ? { Authorization: `Bearer ${localStorage.getItem("idToken")}` }
            : {}),
        },
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid API response");

      // 🔒 HARD FILTER — authoritative
      const clean = data.filter(
        (item) => item.deleted !== true && item.returned !== true
      );

      setItems(clean);
      localStorage.setItem("foundItems", JSON.stringify(clean));
      localStorage.setItem("lastDataUpdate", Date.now().toString());
      setLastUpdate(new Date().toLocaleString());
    } catch (err) {
      console.error(err);
      setError("Unable to load items from server.");
      const fallback =
        JSON.parse(localStorage.getItem("foundItems")) || [];
      setItems(fallback);
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     FILTER & SORT (UNCHANGED)
     ====================== */
  useEffect(() => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const now = Date.now();
    filtered = filtered.filter((item) => {
      if (!item.timestamp) return true;
      const ts = Number(item.timestamp);

      switch (dateFilter) {
        case "today":
          return (
            new Date(ts).toISOString().split("T")[0] ===
            new Date().toISOString().split("T")[0]
          );
        case "yesterday": {
          const y = new Date();
          y.setDate(y.getDate() - 1);
          return (
            new Date(ts).toISOString().split("T")[0] ===
            y.toISOString().split("T")[0]
          );
        }
        case "week":
          return ts >= now - 7 * 86400000;
        case "month":
          return ts >= now - 30 * 86400000;
        case "custom":
          if (!customDate) return true;
          const d = new Date(customDate).toISOString().split("T")[0];
          return new Date(ts).toISOString().split("T")[0] === d;
        default:
          return true;
      }
    });

    filtered.sort((a, b) =>
      sortBy === "newest"
        ? (b.timestamp || 0) - (a.timestamp || 0)
        : (a.timestamp || 0) - (b.timestamp || 0)
    );

    setFilteredItems(filtered);
  }, [items, searchTerm, dateFilter, customDate, sortBy]);

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
    setCustomDate("");
    setSortBy("newest");
  };

  const handleDelete = async (id) => {
    if (!id || !window.confirm("Delete this item permanently?")) return;

    try {
      await fetch(`${API_BASE}/items/${id}`, {
        method: "DELETE",
        headers: {
          ...(localStorage.getItem("idToken")
            ? { Authorization: `Bearer ${localStorage.getItem("idToken")}` }
            : {}),
        },
      });

      await fetchItems();
      window.dispatchEvent(new Event("foundItems:refresh"));
    } catch {
      alert("Delete failed");
    }
  };

  /* ======================
     UI BELOW IS 100% YOURS
     ====================== */

  if (loading && items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
        Loading items...
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
            <div key={getId(item) || idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
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
                      <button onClick={() => handleDelete(getId(item))} className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
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

