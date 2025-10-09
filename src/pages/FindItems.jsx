import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const FindItems = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, yesterday, week, month, custom
  const [customDate, setCustomDate] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("foundItems")) || [];
    setItems(stored);
    setFilteredItems(stored);
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, dateFilter, customDate, sortBy]);

  const filterItems = () => {
    let filtered = [...items];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    const now = new Date().getTime();
    filtered = filtered.filter(item => {
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

    // Sort items
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return b.timestamp - a.timestamp;
      } else {
        return a.timestamp - b.timestamp;
      }
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-blue-600 text-center mb-6">
        🔎 All Reported Lost & Found Items
      </h1>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔍 Search Items
            </label>
            <input
              type="text"
              placeholder="Search by name, description, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📅 Filter by Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {/* Custom Date Picker */}
          {dateFilter === "custom" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              🔄 Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filter Summary and Clear Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Showing {filteredItems.length} of {items.length} items
            {dateFilter !== "all" && (
              <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                {getDateFilterLabel()}
              </span>
            )}
            {searchTerm && (
              <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded">
                Search: "{searchTerm}"
              </span>
            )}
          </div>
          
          {(searchTerm || dateFilter !== "all" || sortBy !== "newest") && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            No items found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {items.length === 0 
              ? "No items have been reported yet." 
              : "Try adjusting your search criteria or filters."
            }
          </p>
          {items.length > 0 && (
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Show All Items
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 hover:shadow-lg transition-shadow">
              {item.images?.length > 0 ? (
                <Slider {...sliderSettings}>
                  {item.images.map((img, i) => (
                    <div key={i} className="w-full h-48 rounded overflow-hidden">
                      <img
                        src={img}
                        alt={`${item.itemName} - Image ${i + 1}`}
                        className="w-full h-48 object-cover rounded-md"
                      />
                    </div>
                  ))}
                </Slider>
              ) : (
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <span>No Image</span>
                </div>
              )}

              <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mt-3">
                {item.itemName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {item.description}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                📍 <strong>Location:</strong> {item.location}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                📧 {item.email} | 📱 {item.phone}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Reported on {new Date(item.timestamp).toLocaleDateString()} at{" "}
                {new Date(item.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindItems;