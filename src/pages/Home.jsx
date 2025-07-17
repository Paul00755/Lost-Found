import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Home = () => {
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    const storedItems = JSON.parse(localStorage.getItem("foundItems")) || [];
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Filter items submitted within the last 24 hours
    const recent = storedItems.filter((item) => {
      return now - item.timestamp < oneDay;
    });

    setRecentItems(recent);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Welcome Message */}
      <h1 className="text-4xl font-bold text-blue-600 text-center mb-6">
        🔍 Welcome to the Lost & Found Portal
      </h1>

      {/* Description */}
      <div className="text-center text-gray-700 dark:text-gray-300 mb-10 max-w-3xl mx-auto text-lg leading-relaxed">
        <p className="mb-4">
          This platform helps you recover lost belongings and report items you've found on campus. Whether it’s a misplaced ID card, water bottle, or an umbrella – we’re here to connect you with the rightful owner.
        </p>
        <p>
          Click one of the options below to get started. You can report a lost item you've found or browse recent submissions to help reunite lost items with their owners.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Link
          to="/submit"
          className="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 p-6 rounded-xl shadow-md text-center transition"
        >
          <h2 className="text-2xl font-bold text-blue-800 dark:text-white mb-2">📦 Report Lost Item</h2>
          <p className="text-gray-700 dark:text-gray-300">Found something? Let others know by submitting details and an image.</p>
        </Link>

        <Link
          to="/find"
          className="bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 p-6 rounded-xl shadow-md text-center transition"
        >
          <h2 className="text-2xl font-bold text-green-800 dark:text-white mb-2">🔍 Find a Lost Item</h2>
          <p className="text-gray-700 dark:text-gray-300">Lost something recently? Browse the full list of submitted items.</p>
        </Link>
      </div>

      {/* Recently Found Items */}
      <h2 className="text-2xl font-bold text-blue-600 text-center mb-6">🕒 Recently Reported Items (within 24 hours)</h2>

      {recentItems.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          No recently reported items in the last 24 hours.<br />
          <Link to="/find" className="text-blue-600 hover:underline">Click here</Link> to see all reported items.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentItems.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
              <img
                src={item.image}
                alt={item.itemName}
                className="w-full h-48 object-cover rounded mb-4"
              />
              <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300">{item.itemName}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                📍 <strong>Location:</strong> {item.location}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                📧 {item.email} | 📱 {item.phone}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
