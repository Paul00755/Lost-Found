import React, { useState, useContext } from "react";
import {
  CognitoUser,
  AuthenticationDetails
} from "amazon-cognito-identity-js";
import UserPool from "../utils/cognitoConfig";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Shield, User, Lock, Mail } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [cognitoUser, setCognitoUser] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  // Admin email (username in Cognito)
  const ADMIN_EMAIL = "lostandfound0075@gmail.com";

  const handleRegularLogin = (e) => {
    e.preventDefault();
    
    const user = new CognitoUser({
      Username: email,
      Pool: UserPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        const accessToken = result.getAccessToken().getJwtToken();
        const refreshToken = result.getRefreshToken().getToken();

        // Get user attributes to check if admin
        const userAttributes = result.getIdToken().payload;
        const userGroups = userAttributes['cognito:groups'] || [];
        const isAdmin = userGroups.includes('Admin');

        localStorage.setItem("idToken", idToken);
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("userRole", isAdmin ? "admin" : "user");
        localStorage.setItem("userEmail", email);

        setMessage("✅ Login successful! Redirecting...");
        setUser(user);
        setTimeout(() => navigate(isAdmin ? "/admin" : "/"), 2000);
      },
      onFailure: (err) => {
        setMessage("❌ " + err.message);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        // Handle new password requirement for first-time login
        // Only include attributes that can be modified
        const updatedAttributes = {};
        
        // Only include non-readonly attributes
        if (userAttributes.email) updatedAttributes.email = userAttributes.email;
        if (userAttributes.name) updatedAttributes.name = userAttributes.name;
        
        // Set the new password without modifying readonly attributes
        user.completeNewPasswordChallenge('RMX2161@Paul', updatedAttributes, {
          onSuccess: (result) => {
            setMessage("✅ Password set successfully! Logging in...");
            // Continue with normal login flow
            const idToken = result.getIdToken().getJwtToken();
            const accessToken = result.getAccessToken().getJwtToken();
            const refreshToken = result.getRefreshToken().getToken();

            const userAttributes = result.getIdToken().payload;
            const userGroups = userAttributes['cognito:groups'] || [];
            const isAdmin = userGroups.includes('Admin');

            localStorage.setItem("idToken", idToken);
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("userRole", isAdmin ? "admin" : "user");
            localStorage.setItem("userEmail", email);

            setUser(user);
            setTimeout(() => navigate(isAdmin ? "/admin" : "/"), 2000);
          },
          onFailure: (err) => {
            setMessage("❌ Failed to set new password: " + err.message);
          }
        });
      }
    });
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();

    const user = new CognitoUser({
      Username: email,
      Pool: UserPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (result) => {
        // Check if user is in Admin group
        const userAttributes = result.getIdToken().payload;
        const userGroups = userAttributes['cognito:groups'] || [];
        
        if (!userGroups.includes('Admin')) {
          setMessage("❌ Access denied. Admin privileges required.");
          return;
        }

        // Store the authentication result for later use
        const idToken = result.getIdToken().getJwtToken();
        const accessToken = result.getAccessToken().getJwtToken();
        const refreshToken = result.getRefreshToken().getToken();

        localStorage.setItem("idToken", idToken);
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // For admin, require MFA verification
        user.getAttributeVerificationCode('email', {
          onSuccess: () => {
            setCognitoUser(user);
            setShowOtp(true);
            setMessage("📧 Verification code sent to your registered email.");
          },
          onFailure: (err) => {
            setMessage("❌ Failed to send verification code: " + err.message);
          }
        });
      },
      onFailure: (err) => {
        setMessage("❌ " + err.message);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        // Handle new password requirement for admin first-time login
        // Create a clean attributes object without readonly attributes
        const updatedAttributes = {};
        
        // Only include attributes that can be safely modified
        if (userAttributes.email) updatedAttributes.email = userAttributes.email;
        if (userAttributes.name) updatedAttributes.name = userAttributes.name;
        
        // Set the new password
        user.completeNewPasswordChallenge('RMX2161@Paul', updatedAttributes, {
          onSuccess: (result) => {
            setMessage("✅ Admin password set successfully! Please login again.");
            // After setting password, they need to login again
            setEmail(ADMIN_EMAIL);
            setPassword("");
            setShowOtp(false);
          },
          onFailure: (err) => {
            console.error("Password change error:", err);
            // Try without any attributes if it still fails
            user.completeNewPasswordChallenge('RMX2161@Paul', {}, {
              onSuccess: (result) => {
                setMessage("✅ Admin password set successfully! Please login again.");
                setEmail(ADMIN_EMAIL);
                setPassword("");
                setShowOtp(false);
              },
              onFailure: (err2) => {
                setMessage("❌ Failed to set admin password: " + err2.message);
              }
            });
          }
        });
      }
    });
  };

  const verifyAdminMFA = (e) => {
    e.preventDefault();

    cognitoUser.verifyAttribute('email', otp, {
      onSuccess: () => {
        // OTP verification successful - now we need to re-authenticate to get fresh tokens
        const user = new CognitoUser({
          Username: email,
          Pool: UserPool,
        });

        const authDetails = new AuthenticationDetails({
          Username: email,
          Password: password,
        });

        user.authenticateUser(authDetails, {
          onSuccess: (result) => {
            const idToken = result.getIdToken().getJwtToken();
            const accessToken = result.getAccessToken().getJwtToken();
            const refreshToken = result.getRefreshToken().getToken();

            localStorage.setItem("idToken", idToken);
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("userRole", "admin");
            localStorage.setItem("adminEmail", email);
            localStorage.setItem("adminAuthenticated", "true");

            setMessage("✅ Admin login successful! Redirecting to dashboard...");
            setUser(user);
            setTimeout(() => navigate("/admin"), 2000);
          },
          onFailure: (err) => {
            setMessage("❌ Authentication failed after OTP verification: " + err.message);
          }
        });
      },
      onFailure: (err) => {
        setMessage("❌ Invalid verification code: " + err.message);
      }
    });
  };

  const resendVerificationCode = () => {
    cognitoUser.getAttributeVerificationCode('email', {
      onSuccess: () => {
        setMessage("📧 Verification code resent to your email.");
      },
      onFailure: (err) => {
        setMessage("❌ Failed to resend code: " + err.message);
      }
    });
  };

  const switchToAdmin = () => {
    setIsAdminLogin(true);
    setEmail(ADMIN_EMAIL);
    setPassword("");
    setMessage("");
    setShowOtp(false);
    setOtp("");
  };

  const switchToUser = () => {
    setIsAdminLogin(false);
    setEmail("");
    setPassword("");
    setMessage("");
    setShowOtp(false);
    setOtp("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${isAdminLogin ? 'bg-red-100 dark:bg-red-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
              {isAdminLogin ? <Shield size={32} className="text-red-600 dark:text-red-400" /> : <User size={32} className="text-blue-600 dark:text-blue-400" />}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isAdminLogin ? "Admin Login" : "User Login"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isAdminLogin ? "Secure admin access portal" : "Welcome back to Lost & Found"}
          </p>
        </div>

        {/* Login Type Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={switchToUser}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              !isAdminLogin 
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <User size={16} className="inline mr-2" />
            User Login
          </button>
          <button
            onClick={switchToAdmin}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isAdminLogin 
                ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Shield size={16} className="inline mr-2" />
            Admin Login
          </button>
        </div>

        {/* MFA Verification Form */}
        {showOtp ? (
          <form onSubmit={verifyAdminMFA} className="space-y-6">
            <div className="text-center">
              <Mail size={48} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Admin Security Verification
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                For security, please enter the verification code sent to your email.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Verification Code
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-xl font-mono"
                required
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Shield size={20} />
              Verify & Login
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={resendVerificationCode}
                className="text-red-600 dark:text-red-400 hover:underline text-sm"
              >
                Resend Code
              </button>
            </div>
          </form>
        ) : (
          /* Regular Login Form */
          <form onSubmit={isAdminLogin ? handleAdminLogin : handleRegularLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 p-3 pl-10 rounded-lg bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isAdminLogin}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 p-3 pl-10 rounded-lg bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {!isAdminLogin && (
              <div className="flex justify-between items-center text-sm">
                <Link
                  to="/forgot-password"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot Password?
                </Link>
                <Link
                  to="/register"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Create Account
                </Link>
              </div>
            )}

            <button
              type="submit"
              className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                isAdminLogin 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isAdminLogin ? <Shield size={20} /> : <User size={20} />}
              {isAdminLogin ? "Admin Login" : "User Login"}
            </button>
          </form>
        )}

        {/* Message Display */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg text-center ${
            message.includes("✅") 
              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" 
              : message.includes("❌")
              ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
              : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
          }`}>
            {message}
          </div>
        )}

        {/* Admin Security Notice */}
        {isAdminLogin && !showOtp && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  Admin Security Notice
                </h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  Admin access requires multi-factor authentication. You'll receive a verification code via email.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;