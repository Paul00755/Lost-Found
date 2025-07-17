import React, { useEffect, useState } from "react";

const FindItems = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("foundItems")) || [];
    setItems(stored);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-blue-600 text-center mb-6">
        🔎 All Reported Lost & Found Items
      </h1>

      {items.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-300">No items have been reported yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, idx) => (
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

export default FindItems;
