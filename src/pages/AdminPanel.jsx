import React, { useState, useEffect } from "react";
import { 
  Trash2, CheckCircle, X, Users, BarChart3, 
  Download, Search, Filter, Shield, Loader,
  Eye, UserCheck, AlertCircle, LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "https://xq7a7biw3b.execute-api.ap-south-1.amazonaws.com/dev";

const AdminPanel = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    returned: 0,
    today: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAndLoadItems();
  }, [navigate]);

  const checkAdminAndLoadItems = async () => {
    // Check for admin authentication in multiple possible storage locations
    const userRole = localStorage.getItem("userRole");
    const adminAuthenticated = localStorage.getItem("adminAuthenticated");
    const idToken = localStorage.getItem("idToken");
    const adminEmail = localStorage.getItem("adminEmail") || localStorage.getItem("userEmail");
    
    console.log("🔍 Admin Check Debug:");
    console.log("userRole:", userRole);
    console.log("adminAuthenticated:", adminAuthenticated);
    console.log("idToken present:", !!idToken);
    console.log("adminEmail:", adminEmail);
    
    // Check if user has admin role OR is the specific admin email
    const isAdmin = userRole === "admin" || 
                   adminAuthenticated === "true" || 
                   adminEmail === "lostandfound0075@gmail.com";
    
    if (!isAdmin || !idToken) {
      console.log("❌ Admin access denied. Redirecting to login.");
      alert("Admin access required. Please login as admin.");
      navigate("/login");
      return;
    }
    
    console.log("✅ Admin access granted");
    await loadItems();
  };

  const loadItems = async () => {
    setLoading(true);
    setError("");
    try {
      // Use idToken instead of userToken
      const token = localStorage.getItem("idToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Loading items from API...");
      
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("API Response status:", response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token might be expired, redirect to login
          localStorage.removeItem("idToken");
          localStorage.removeItem("userRole");
          localStorage.removeItem("adminAuthenticated");
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(`Failed to load items: ${response.status}`);
      }

      const allItems = await response.json();
      console.log("Loaded items from API:", allItems);

      if (!Array.isArray(allItems)) {
        throw new Error("Invalid data format received from server");
      }
      
      setItems(allItems);
      
      // Calculate statistics
      const today = new Date().toDateString();
      const todayItems = allItems.filter(item => 
        item.timestamp && new Date(item.timestamp).toDateString() === today
      ).length;

      setStats({
        total: allItems.length,
        active: allItems.length,
        returned: 0,
        today: todayItems
      });
    } catch (err) {
      console.error("Error loading items:", err);
      setError(err.message || "Failed to load items from server");
      if (err.message.includes("Session expired")) {
        setTimeout(() => navigate("/login"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Are you sure you want to delete "${itemName}" permanently? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("idToken");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Deleting item:", itemId);

      const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Delete response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `Server error: ${response.status}` };
        }
        throw new Error(errorData.error || `Failed to delete item: ${response.status}`);
      }

      const result = await response.json();
      console.log("Delete successful:", result);

      // Remove the item from local state
      setItems(prev => prev.filter(item => item.id !== itemId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        active: prev.active - 1
      }));
      
      // Show success message
      alert(`"${itemName}" has been deleted successfully!`);
      
    } catch (err) {
      console.error("Error deleting item:", err);
      setError(err.message || "Failed to delete item from server");
      alert(`Delete failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const markAsReturned = async (itemToMark) => {
    setActionLoading(true);
    try {
      // For now, we'll just remove it from the list since backend doesn't have return functionality
      setItems(prev => prev.filter(item => item.id !== itemToMark.id));
      setSelectedItem(null);
      setAdminNotes("");
      
      // Update stats
      setStats(prev => ({
        ...prev,
        active: prev.active - 1,
        returned: prev.returned + 1
      }));
      
      alert(`"${itemToMark.itemName}" has been marked as returned!`);
      
    } catch (err) {
      console.error("Error marking item as returned:", err);
      setError("Failed to mark item as returned");
    } finally {
      setActionLoading(false);
    }
  };

  const exportData = () => {
    const data = items;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lost-found-admin-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const viewItemDetails = (item) => {
    setSelectedItem({...item, viewMode: true});
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      // Clear all admin-related storage
      localStorage.removeItem("idToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("adminAuthenticated");
      localStorage.removeItem("adminEmail");
      localStorage.removeItem("userEmail");
      navigate("/login");
    }
  };

  const getAdminEmail = () => {
    return localStorage.getItem("adminEmail") || 
           localStorage.getItem("userEmail") || 
           "lostandfound0075@gmail.com";
  };

  const filteredItems = items.filter(item =>
    item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Shield className="text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome, {getAdminEmail()} • Manage all found items and user submissions
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={exportData}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Export Data
            </button>
            <button
              onClick={loadItems}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Loader size={18} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Action Loading Overlay */}
        {actionLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <Loader className="animate-spin text-blue-600" size={24} />
              <span>Processing...</span>
            </div>
          </div>
        )}

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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Items</h3>
                <p className="text-3xl font-bold text-orange-600">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center gap-3">
              <UserCheck className="text-green-600" size={24} />
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
              placeholder="Search items by name, description, location, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Active Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              📋 All Found Items ({filteredItems.length})
            </h2>
            <span className="text-sm text-gray-500">
              Showing {filteredItems.length} of {items.length} items
            </span>
          </div>
          <div className="p-6">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-400 mb-4" size={64} />
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                  {items.length === 0 ? "No items found" : "No items match your search"}
                </p>
                <p className="text-gray-400 text-sm">
                  {items.length === 0 
                    ? "Items will appear here when users report found items." 
                    : "Try adjusting your search terms."}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-800">
                    {item.images?.[0] && (
                      <img
                        src={item.images[0]}
                        alt={item.itemName}
                        className="w-full h-48 object-cover rounded-md mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 text-lg">
                      {item.itemName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="space-y-1 mb-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        📍 {item.location}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        📧 {item.email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        📱 {item.phone}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Reported: {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : "Unknown date"}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewItemDetails(item)}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={16} />
                        Return
                      </button>
                      <button
                        onClick={() => deleteItem(item.id, item.itemName)}
                        className="bg-red-600 text-white py-2 px-3 rounded-md text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                        title="Delete Item"
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

        {/* Item Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedItem.viewMode ? "Item Details" : "Mark Item as Returned"}
                </h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                {selectedItem.images && selectedItem.images.length > 0 && (
                  <div className="mb-4">
                    <img
                      src={selectedItem.images[0]}
                      alt={selectedItem.itemName}
                      className="w-full h-64 object-cover rounded-md"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Item Information</h4>
                    <p className="text-gray-600 dark:text-gray-400"><strong>Name:</strong> {selectedItem.itemName}</p>
                    <p className="text-gray-600 dark:text-gray-400"><strong>Description:</strong> {selectedItem.description}</p>
                    <p className="text-gray-600 dark:text-gray-400"><strong>Location:</strong> {selectedItem.location}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Information</h4>
                    <p className="text-gray-600 dark:text-gray-400"><strong>Email:</strong> {selectedItem.email}</p>
                    <p className="text-gray-600 dark:text-gray-400"><strong>Phone:</strong> {selectedItem.phone}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Reported:</strong> {selectedItem.timestamp ? new Date(selectedItem.timestamp).toLocaleString() : "Unknown"}
                    </p>
                  </div>
                </div>

                {!selectedItem.viewMode && (
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
                )}
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  {selectedItem.viewMode ? "Close" : "Cancel"}
                </button>
                {!selectedItem.viewMode && (
                  <button
                    onClick={() => markAsReturned(selectedItem)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Confirm Return
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;