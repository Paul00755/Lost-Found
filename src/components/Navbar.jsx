import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { Shield, CheckCircle, Home, LogOut, LogIn, UserPlus, Sun, Moon, Mail } from "lucide-react";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userRole = localStorage.getItem("userRole");
  const userEmail = localStorage.getItem("userEmail") || localStorage.getItem("adminEmail");

  // Function to get display name from email
  const getDisplayName = () => {
    if (userEmail) {
      // Extract name from email (e.g., "john.doe@gmail.com" -> "John Doe")
      const emailPart = userEmail.split('@')[0];
      const nameParts = emailPart.split('.');
      const formattedName = nameParts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
      return formattedName;
    }
    return 'User';
  };

  // Function to get initials from display name
  const getInitials = () => {
    const displayName = getDisplayName();
    return displayName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 transition-colors duration-300 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-2xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🔍</span>
            </div>
            <span>Lost & Found</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {/* Home Link */}
            <Link
              to="/"
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Home size={18} />
              <span>Home</span>
            </Link>

            {/* Find Items Link */}
            <Link
              to="/find"
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span>🔎</span>
              <span>Find Items</span>
            </Link>

            {/* Submit Item Link - Only for logged-in users */}
            {user && (
              <Link
                to="/submit"
                className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span>📦</span>
                <span>Report Item</span>
              </Link>
            )}

            {/* Returned Items Link - Visible to all */}
            <Link
              to="/returned"
              className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <CheckCircle size={18} />
              <span>Returned Items</span>
            </Link>

            {/* Admin Link - Only for admin users who are logged in */}
            {user && userRole === "admin" && (
              <Link
                to="/admin"
                className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Shield size={18} />
                <span>Admin</span>
              </Link>
            )}

            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center space-x-3 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                {/* User Info */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {getInitials()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-sm">
                    <div className="text-gray-700 dark:text-gray-200 font-medium flex items-center gap-1">
                      <Mail size={12} className="text-gray-500" />
                      {getDisplayName()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${userRole === 'admin' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                      {userRole || 'user'}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-white bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg transition-colors font-medium"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700">
                {/* Login Button */}
                <Link
                  to="/login"
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </Link>

                {/* Register Button */}
                <Link
                  to="/register"
                  className="flex items-center space-x-1 text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors font-medium"
                >
                  <UserPlus size={16} />
                  <span>Register</span>
                </Link>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center space-x-1 text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;