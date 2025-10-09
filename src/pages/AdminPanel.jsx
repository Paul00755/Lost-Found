import React, { useState, useEffect } from "react";
import { 
  Trash2, CheckCircle, X, Edit, Users, BarChart3, 
  Download, Upload, Search, Filter, Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const [items, setItems] = useState([]);
  const [returnedItems, setReturnedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "admin") {
      navigate("/login");
      return;
    }
    loadItems();
  }, [navigate]);

  const loadItems = () => {
    const storedItems = JSON.parse(localStorage.getItem("foundItems")) || [];
    const activeItems = storedItems.filter(item => !item.isReturned);
    const returned = storedItems.filter(item => item.isReturned);
    
    setItems(activeItems);
    setReturnedItems(returned);
    
    // Calculate statistics
    setStats({
      total: storedItems.length,
      active: activeItems.length,
      returned: returned.length,
      today: activeItems.filter(item => 
        new Date(item.timestamp).toDateString() === new Date().toDateString()
      ).length
    });
  };

  const markAsReturned = (itemToMark) => {
    // Get all items from localStorage
    const allItems = JSON.parse(localStorage.getItem("foundItems")) || [];
    
    // Update only the specific item
    const updatedItems = allItems.map(item => {
      if (item.id === itemToMark.id) {
        return {
          ...item,
          isReturned: true,
          returnedDate: Date.now(),
          adminNotes: adminNotes,
          returnedBy: localStorage.getItem("adminEmail") || "Admin"
        };
      }
      return item;
    });
    
    localStorage.setItem("foundItems", JSON.stringify(updatedItems));
    loadItems(); // Reload items to reflect changes
    setSelectedItem(null);
    setAdminNotes("");
  };

  const deleteItem = (itemId) => {
    if (window.confirm("Are you sure you want to delete this item permanently?")) {
      // Get all items and filter out the one to delete
      const allItems = JSON.parse(localStorage.getItem("foundItems")) || [];
      const updatedItems = allItems.filter(item => item.id !== itemId);
      
      localStorage.setItem("foundItems", JSON.stringify(updatedItems));
      loadItems(); // Reload items to reflect changes
    }
  };

  const exportData = () => {
    const data = JSON.parse(localStorage.getItem("foundItems")) || [];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lost-found-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredItems = items.filter(item =>
    item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Shield className="text-red-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage found items and track returns
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportData}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Export Data
            </button>
            <button
              onClick={() => navigate("/returned")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} />
              View Returns
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("userRole");
                localStorage.removeItem("adminEmail");
                navigate("/");
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-blue-600" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Items</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Users className="text-orange-600" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Returned</h3>
                <p className="text-3xl font-bold text-green-600">{stats.returned}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <Filter className="text-purple-600" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today</h3>
                <p className="text-3xl font-bold text-purple-600">{stats.today}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search items by name, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Active Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              📋 Active Found Items ({filteredItems.length})
            </h2>
            <span className="text-sm text-gray-500">Showing {filteredItems.length} of {items.length}</span>
          </div>
          <div className="p-6">
            {filteredItems.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {items.length === 0 ? "No active found items" : "No items match your search"}
              </p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {item.images?.[0] && (
                      <img
                        src={item.images[0]}
                        alt={item.itemName}
                        className="w-full h-40 object-cover rounded-md mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                      {item.itemName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {item.description}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      📍 {item.location}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      📧 {item.email} | 📱 {item.phone}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Reported: {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={16} />
                        Mark Returned
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="bg-red-600 text-white py-2 px-3 rounded-md text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mark as Returned Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Mark Item as Returned
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Item: <strong>{selectedItem.itemName}</strong>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Owner: {selectedItem.email} | {selectedItem.phone}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about the return process..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => markAsReturned(selectedItem)}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Confirm Return
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;