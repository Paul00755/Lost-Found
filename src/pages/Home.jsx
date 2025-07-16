import React from "react";

function Home() {
  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Recently Found Items</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {/* Sample card */}
        <div className="bg-white rounded-xl shadow p-4">
          <img src="https://via.placeholder.com/150" alt="item" className="rounded w-full h-40 object-cover mb-2" />
          <h3 className="font-semibold text-lg">Black Wallet</h3>
          <p className="text-sm text-gray-500">Found near cafeteria</p>
        </div>
        {/* More cards can be dynamically listed here */}
      </div>
    </div>
  );
}

export default Home;
