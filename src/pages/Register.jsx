import React, { useState } from "react";
import { CognitoUserAttribute } from "amazon-cognito-identity-js";
import UserPool from "../utils/cognitoConfig";
import { Link } from "react-router-dom";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const attributeList = [
      new CognitoUserAttribute({
        Name: "email",
        Value: email,
      }),
    ];

    UserPool.signUp(email, password, attributeList, null, (err, data) => {
      if (err) {
        setMessage("❌ " + err.message);
      } else {
        setMessage("✅ A verification code has been sent to your email.");
      }
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-blue-700 text-center mb-6">
          Create a New Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="********"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            Register
          </button>
        </form>

        {message && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-700">{message}</p>
            {message.includes("verification code") && (
              <Link
                to="/confirm"
                className="inline-block mt-2 text-blue-600 font-semibold hover:underline"
              >
                ➤ Click here to Confirm Signup
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Register;
