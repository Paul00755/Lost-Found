import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { 
  Shield, 
  CheckCircle, 
  Home, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Sun, 
  Moon, 
  Mail, 
  User,
  Settings,
  Search,
  Package,
  Menu,
  X
} from "lucide-react";

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsUserDropdownOpen(false);
    setIsMenuOpen(false);
  };

  // Improved user data retrieval
  const getUserData = () => {
    const userRole = localStorage.getItem("userRole");
    let userEmail = "";
    let displayName = "User";

    // Check both possible email storage locations
    if (userRole === "admin") {
      userEmail = localStorage.getItem("adminEmail") || localStorage.getItem("userEmail") || "";
    } else {
      userEmail = localStorage.getItem("userEmail") || localStorage.getItem("adminEmail") || "";
    }

    // If no email found in localStorage, try to get from AuthContext user object
    if (!userEmail && user && user.email) {
      userEmail = user.email;
    }

    // Function to format display name from email
    const formatDisplayName = (email) => {
      if (!email) return 'User';
      
      const emailPart = email.split('@')[0];
      const nameParts = emailPart.split(/[._]/);
      const formattedName = nameParts.map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
      return formattedName;
    };

    displayName = formatDisplayName(userEmail);

    // Function to get initials from display name
    const getInitials = (name) => {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return {
      role: userRole,
      email: userEmail,
      displayName: displayName,
      initials: getInitials(displayName)
    };
  };

  const userData = getUserData();

  const navLinks = [
    { to: "/", icon: Home, label: "Home", show: true },
    { to: "/find", icon: Search, label: "Find Items", show: true },
    { to: "/submit", icon: Package, label: "Report Item", show: !!user },
    { to: "/returned", icon: CheckCircle, label: "Returned Items", show: true, highlight: true },
    { to: "/admin", icon: Shield, label: "Admin", show: user && userData.role === "admin", admin: true },
  ];

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg sticky top-0 z-50 transition-all duration-300 border-b border-gray-200/60 dark:border-gray-700/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-3 group"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200 shadow-lg">
                  <span className="text-white text-lg">🔍</span>
                </div>
                <div className="absolute -inset-1 bg-blue-500/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300"></div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                  Lost & Found
                </span>
                <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 rounded-full"></div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1 ml-4">
              {navLinks.map((link) => 
                link.show && (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      link.highlight
                        ? "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : link.admin
                        ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <link.icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Right Section - User Auth & Theme Toggle */}
          <div className="flex items-center space-x-3">
            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <>
                  {/* Theme Toggle */}
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                    title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>

                  {/* User Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white text-sm font-bold">
                            {userData.initials}
                          </span>
                        </div>
                        <div className="text-left hidden lg:block">
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {userData.displayName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${userData.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            {userData.role || 'user'}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 backdrop-blur-md">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {userData.initials}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {userData.displayName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {userData.email}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <div className={`w-2 h-2 rounded-full ${userData.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  {userData.role || 'user'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown Items */}
                        <button
                          onClick={() => {
                            navigate("/profile");
                            setIsUserDropdownOpen(false);
                          }}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <User size={18} />
                          <span>Profile</span>
                        </button>

                        <button
                          onClick={() => {
                            navigate("/settings");
                            setIsUserDropdownOpen(false);
                          }}
                          className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <Settings size={18} />
                          <span>Settings</span>
                        </button>

                        {/* Logout Button */}
                        <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <LogOut size={18} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Theme Toggle */}
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
                  >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>

                  {/* Auth Buttons */}
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/login"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <LogIn size={18} />
                      <span>Login</span>
                    </Link>

                    <Link
                      to="/register"
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <UserPlus size={18} />
                      <span>Register</span>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="px-4 py-3 space-y-2">
              {/* Navigation Links */}
              {navLinks.map((link) =>
                link.show && (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      link.highlight
                        ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : link.admin
                        ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <link.icon size={20} />
                    <span>{link.label}</span>
                  </Link>
                )
              )}

              {/* Mobile Auth Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                {user ? (
                  <div className="space-y-3">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {userData.initials}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {userData.displayName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {userData.email}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Menu Items */}
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                    >
                      <User size={20} />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/settings");
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                    >
                      <Settings size={20} />
                      <span>Settings</span>
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                    >
                      <LogIn size={20} />
                      <span>Login</span>
                    </Link>

                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-3 w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium transition-colors"
                    >
                      <UserPlus size={20} />
                      <span>Register</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;