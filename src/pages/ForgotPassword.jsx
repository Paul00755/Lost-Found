// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";
import UserPool from "../utils/cognitoConfig";
import { useNavigate } from "react-router-dom";
const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const user = () => new CognitoUser({ Username: email, Pool: UserPool });

  const sendCode = (e) => {
    e.preventDefault();
    user().forgotPassword({
      onSuccess: () => setMsg("✅ Check your email for the code."),
      onFailure: (err) => setMsg("❌ " + err.message),
      inputVerificationCode: () => setStep(2)
    });
  };

  const confirmNewPass = (e) => {
    e.preventDefault();
    user().confirmPassword(code, newPass, {
      onSuccess: () => {
            setMsg("✅ Password changed successfully! Redirecting to login...");
            setTimeout(() => navigate("/login"), 2000); 
  },
      onFailure: (err) => setMsg("❌ " + err.message)
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-blue-600 dark:text-blue-400">
        Forgot Password
      </h2>

      {step === 1 ? (
        <form onSubmit={sendCode} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded bg-inherit"
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
            Send Code
          </button>
        </form>
      ) : (
        <form onSubmit={confirmNewPass} className="space-y-4">
          <input
            type="text"
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full border p-2 rounded bg-inherit"
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="w-full border p-2 rounded bg-inherit"
            required
          />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
            Reset Password
          </button>
        </form>
      )}

      {msg && <p className="mt-4 text-center text-sm">{msg}</p>}
    </div>
  );
};

export default ForgotPassword;
