import React, { useState } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";
import UserPool from "../utils/cognitoConfig";
import { useNavigate } from "react-router-dom";

function ConfirmSignup() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

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
        setTimeout(() => navigate("/login"), 2000); // auto-redirect after 2s
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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-blue-600">Confirm Signup</h2>
      <form onSubmit={handleConfirm} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Verification Code"
          className="w-full border p-2 rounded"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <div className="flex space-x-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Confirm
          </button>
          <button
            onClick={handleResend}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Resend Code
          </button>
        </div>
      </form>
      {message && <p className="mt-4 text-sm text-center">{message}</p>}
    </div>
  );
}

export default ConfirmSignup;
