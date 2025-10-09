import React, { useState, useContext } from "react";
import {
  CognitoUser,
  AuthenticationDetails
} from "amazon-cognito-identity-js";
import UserPool from "../utils/cognitoConfig";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleSubmit = (e) => {
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
    const idToken = result.getIdToken().getJwtToken();   // ✅ get idToken
    const accessToken = result.getAccessToken().getJwtToken();
    const refreshToken = result.getRefreshToken().getToken();

  // ✅ Save in localStorage so you can attach to API requests later
      localStorage.setItem("idToken", idToken);
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      setMessage("✅ Login successful! Redirecting...");
      setUser(user);
      setTimeout(() => navigate("/"), 2000);
    },
      onFailure: (err) => {
        setMessage("❌ " + err.message);
      },
      newPasswordRequired: () => {
        setMessage("❌ New password is required. Please reset.");
      }
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-900 shadow-lg rounded-lg transition duration-300">
      <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4 text-center">
        Login to Your Account
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border border-gray-300 dark:border-gray-700 p-2 rounded bg-transparent text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex justify-between items-center text-sm">
          <Link
            to="/forgot-password"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          Login
        </button>
      </form>

      {message && (
        <p className="mt-4 text-sm text-center text-gray-700 dark:text-gray-300">
          {message}
        </p>
      )}
    </div>
  );
}

export default Login;
