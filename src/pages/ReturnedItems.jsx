import React, { useState, useEffect } from "react";
import { CheckCircle, Calendar, Search, Filter, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const ReturnedItems = () => {
  const [returnedItems, setReturnedItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, week, month, year
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest

  useEffect(() => {
    loadReturnedItems();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [returnedItems, searchTerm, dateFilter, sortBy]);

  const loadReturnedItems = () => {
    const storedItems = JSON.parse(localStorage.getItem("foundItems")) || [];
    const returned = storedItems.filter(item => item.isReturned);
    setReturnedItems(returned);
  };

  const filterAndSortItems = () => {
    let filtered = [...returnedItems];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    const now = new Date().getTime();
    filtered = filtered.filter(item => {
      if (!item.returnedDate) return false;
      
      const returnedDate = new Date(item.returnedDate).getTime();
      const daysDiff = (now - returnedDate) / (1000 * 60 * 60 * 24);
      
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

    // Sort items
    filtered.sort((a, b) => {
      const dateA = a.returnedDate || a.timestamp;
      const dateB = b.returnedDate || b.timestamp;
      
      if (sortBy === "newest") {
        return new Date(dateB) - new Date(dateA);
      } else {
        return new Date(dateA) - new Date(dateB);
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
      case "week": return "Last 7 Days";
      case "month": return "Last 30 Days";
      case "year": return "Last Year";
      default: return "All Time";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
    setSortBy("newest");
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date().getTime();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const stats = {
    total: returnedItems.length,
    thisWeek: returnedItems.filter(item => {
      if (!item.returnedDate) return false;
      const days = (new Date().getTime() - new Date(item.returnedDate).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 7;
    }).length,
    thisMonth: returnedItems.filter(item => {
      if (!item.returnedDate) return false;
      const days = (new Date().getTime() - new Date(item.returnedDate).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 30;
    }).length,
  };

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
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.total}</div>
            <div className="text-gray-600 dark:text-gray-400">Total Returns</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.thisWeek}</div>
            <div className="text-gray-600 dark:text-gray-400">This Week</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.thisMonth}</div>
            <div className="text-gray-600 dark:text-gray-400">This Month</div>
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
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by item name, description, location, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                🔄 Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
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
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        {/* Returned Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
            <CheckCircle size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              {returnedItems.length === 0 ? "No Returned Items Yet" : "No Matching Returns"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {returnedItems.length === 0 
                ? "No items have been marked as returned yet. Check back later for success stories!" 
                : "No returned items match your current search criteria. Try adjusting your filters."
              }
            </p>
            {returnedItems.length === 0 ? (
              <Link
                to="/find"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle size={20} />
                Browse Active Items
              </Link>
            ) : (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Show All Returned Items
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-green-200 dark:border-green-800 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Success Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={20} />
                      <span className="font-semibold">Successfully Returned</span>
                    </div>
                    <div className="text-sm bg-green-600 px-2 py-1 rounded-full">
                      {getTimeAgo(item.returnedDate || item.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Image Carousel */}
                  {item.images?.length > 0 ? (
                    <div className="mb-4">
                      <Slider {...sliderSettings}>
                        {item.images.map((img, index) => (
                          <div key={index} className="w-full h-48 rounded-lg overflow-hidden">
                            <img
                              src={img}
                              alt={`${item.itemName} - Image ${index + 1}`}
                              className="w-full h-48 object-cover"
                            />
                          </div>
                        ))}
                      </Slider>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      No Images
                    </div>
                  )}

                  {/* Item Details */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {item.itemName}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">📍 Found at:</span>
                      <span>{item.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">📧 Owner:</span>
                      <span className="truncate">{item.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">📱 Contact:</span>
                      <span>{item.phone}</span>
                    </div>

                    {/* Timeline */}
                    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div>
                          <div className="font-semibold">Reported</div>
                          <div>{new Date(item.timestamp).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">Returned</div>
                          <div>{item.returnedDate ? new Date(item.returnedDate).toLocaleDateString() : 'Date unknown'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    {item.adminNotes && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <span className="font-semibold">📝 Admin Notes:</span> {item.adminNotes}
                        </p>
                        {item.returnedBy && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Processed by: {item.returnedBy}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success Celebration */}
        {filteredItems.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
              <h3 className="text-2xl font-bold text-green-600 mb-4">
                🎉 Making a Difference Together!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Every returned item represents a happy reunion and a community working together. 
                Thank you for being part of our mission to reunite lost items with their owners.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnedItems;