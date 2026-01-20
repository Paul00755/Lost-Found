import React, { useState, useEffect } from "react";
import { CheckCircle, Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://xq7a7biw3b.execute-api.ap-south-1.amazonaws.com/dev";

const ReturnedItems = () => {
  const [returnedItems, setReturnedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, week, month, year
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest

  /* =====================================================
     SOURCE OF TRUTH = API (cross-device safe)
     ===================================================== */
  const loadReturnedItems = async () => {
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

      if (!res.ok) throw new Error("Failed to fetch items");

      const data = await res.json();

      const returned = (Array.isArray(data) ? data : []).filter(
        (item) => item.returned === true
      );

      setReturnedItems(returned);
    } catch (err) {
      console.error("Failed to load returned items:", err);
      setReturnedItems([]);
    }
  };

  /* initial load */
  useEffect(() => {
    loadReturnedItems();
  }, []);

  /* refresh listener */
  useEffect(() => {
    const onRefresh = () => loadReturnedItems();
    window.addEventListener("foundItems:refresh", onRefresh);
    return () =>
      window.removeEventListener("foundItems:refresh", onRefresh);
  }, []);

  /* =====================================================
     FILTER & SORT
     ===================================================== */
  useEffect(() => {
    filterAndSortItems();
  }, [returnedItems, searchTerm, dateFilter, sortBy]);

  const filterAndSortItems = () => {
    let filtered = [...returnedItems];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    const now = Date.now();
    filtered = filtered.filter((item) => {
      if (!item.returnedDate) return true;

      const daysDiff =
        (now - Number(item.returnedDate)) / (1000 * 60 * 60 * 24);

      switch (dateFilter) {
        case "week":
          return daysDiff <= 7;
        case "month":
          return daysDiff <= 30;
        case "year":
          return daysDiff <= 365;
        default:
          return true;
      }
    });

    // Sort
    filtered.sort((a, b) => {
      const dateA = Number(a.returnedDate || a.timestamp);
      const dateB = Number(b.returnedDate || b.timestamp);
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredItems(filtered);
  };

  /* =====================================================
     HELPERS
     ===================================================== */
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
      case "week":
        return "Last 7 Days";
      case "month":
        return "Last 30 Days";
      case "year":
        return "Last Year";
      default:
        return "All Time";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
    setSortBy("newest");
  };

  const getTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  /* =====================================================
     STATS
     ===================================================== */
  const stats = {
    total: returnedItems.length,
    thisWeek: returnedItems.filter(
      (i) => Date.now() - Number(i.returnedDate) <= 7 * 24 * 60 * 60 * 1000
    ).length,
    thisMonth: returnedItems.filter(
      (i) => Date.now() - Number(i.returnedDate) <= 30 * 24 * 60 * 60 * 1000
    ).length,
  };

  /* =====================================================
     JSX (UNCHANGED STRUCTURE & TEXT)
     ===================================================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-green-600 mb-4">
            ✅ Successfully Returned Items
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            These items have been successfully reunited with their owners.
            A big thank you to everyone who helped in the recovery process!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.total}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Total Returns
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.thisWeek}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              This Week
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.thisMonth}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              This Month
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔍 Search Returned Items
              </label>
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by item name, description, location, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📅 Return Date
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔄 Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Filter summary */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Showing {filteredItems.length} of {returnedItems.length} returned items
              {(searchTerm || dateFilter !== "all") && (
                <span className="ml-2 text-green-600 dark:text-green-400">
                  • {getDateFilterLabel()}
                  {searchTerm && ` • Search: "${searchTerm}"`}
                </span>
              )}
            </div>

            {(searchTerm || dateFilter !== "all" || sortBy !== "newest") && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Back */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {/* Returned items grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
            <CheckCircle size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              {returnedItems.length === 0
                ? "No Returned Items Yet"
                : "No Matching Returns"}
            </h3>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-200 dark:border-green-800"
              >
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-t-xl flex justify-between">
                  <span className="font-semibold">Successfully Returned</span>
                  <span className="text-sm bg-green-600 px-2 py-1 rounded-full">
                    {item.returnedDate
                      ? getTimeAgo(item.returnedDate)
                      : "Return date unknown"}
                  </span>
                </div>

                <div className="p-6">
                  {item.images?.length > 0 ? (
                    <Slider {...sliderSettings}>
                      {item.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ))}
                    </Slider>
                  ) : (
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      No Images
                    </div>
                  )}

                  <h3 className="text-xl font-bold mt-4">
                    {item.itemName}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnedItems;
