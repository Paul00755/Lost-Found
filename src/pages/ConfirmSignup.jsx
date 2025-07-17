import React, { useState } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";
import UserPool from "../utils/cognitoConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

function ConfirmSignup() {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  // Extract email from navigation state
  const emailFromState = location.state?.email || "";
  const [email] = useState(emailFromState);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  const handleConfirm = (e) => {
    e.preventDefault();

    const userData = {
      Username: email,
      Pool: UserPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(code, true, function (err, result) {
      if (err) {
        setMessage("❌ " + err.message);
      } else {
        setMessage("✅ Account verified successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000); // redirect after 2s
      }
    });
  };

  const handleResend = (e) => {
    e.preventDefault();

    const userData = {
      Username: email,
      Pool: UserPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.resendConfirmationCode(function (err, result) {
      if (err) {
        setMessage("❌ " + err.message);
      } else {
        setMessage("✅ Verification code resent to your email.");
      }
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      <div className={`${darkMode ? "bg-gray-800" : "bg-white"} p-8 rounded-lg shadow-lg w-full max-w-md`}>
        <h2 className="text-xl font-bold mb-4 text-center text-blue-600">Confirm Your Account</h2>
        <p className="text-sm mb-4 text-center">Email: <strong>{email}</strong></p>
        <form onSubmit={handleConfirm} className="space-y-4">
          <input
            type="text"
            placeholder="Verification Code"
            className={`w-full border rounded px-4 py-2 focus:outline-none focus:ring ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            }`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <div className="flex gap-4 justify-between">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Confirm
            </button>
            <button
              onClick={handleResend}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
            >
              Resend Code
            </button>
          </div>
        </form>
        {message && <p className="mt-4 text-center text-sm">{message}</p>}
      </div>
    </div>
  );
}

export default ConfirmSignup;
