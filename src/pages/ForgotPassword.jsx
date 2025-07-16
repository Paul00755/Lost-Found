// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";
import UserPool from "../utils/cognitoConfig";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSendCode = (e) => {
    e.preventDefault();
    const user = new CognitoUser({ Username: email, Pool: UserPool });
    user.forgotPassword({
      onSuccess: () => setMessage("✅ Code sent to your email."),
      onFailure: (err) => setMessage("❌ " + err.message),
      inputVerificationCode: () => setCodeSent(true),
    });
  };

  const handleConfirmReset = (e) => {
    e.preventDefault();
    const user = new CognitoUser({ Username: email, Pool: UserPool });
    user.confirmPassword(verificationCode, newPassword, {
      onSuccess: () => setMessage("✅ Password reset successful."),
      onFailure: (err) => setMessage("❌ " + err.message),
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-blue-600 dark:text-blue-400">Forgot Password</h2>

      <form onSubmit={codeSent ? handleConfirmReset : handleSendCode} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded text-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {codeSent && (
          <>
            <input
              type="text"
              placeholder="Verification Code"
              className="w-full border p-2 rounded text-black"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="New Password"
              className="w-full border p-2 rounded text-black"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {codeSent ? "Reset Password" : "Send Verification Code"}
        </button>
      </form>

      {message && <p className="text-sm mt-4">{message}</p>}
    </div>
  );
}

export default ForgotPassword;
