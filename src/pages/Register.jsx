// src/pages/Register.jsx
import React, { useState, useContext } from "react";
import { CognitoUserAttribute } from "amazon-cognito-identity-js";
import UserPool from "../utils/cognitoConfig";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    const attributeList = [new CognitoUserAttribute({ Name: "email", Value: email })];
    UserPool.signUp(email, password, attributeList, null, (err, data) => {
      if (err) {
        setMessage("❌ " + err.message);
      } else {
        setMessage("✅ Verification code sent!");
        navigate("/confirm", { state: { email } });
      }
    });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow p-8 w-full max-w-md`}>
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {["email", "password"].map((field) => (
            <div key={field}>
              <label className="block mb-1">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type={field}
                placeholder={field}
                className={`w-full px-4 py-2 rounded border focus:outline-none focus:ring ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={field === "email" ? email : password}
                onChange={(e) => (field === "email" ? setEmail(e.target.value) : setPassword(e.target.value))}
                required
              />
            </div>
          ))}
          <button className="w-full bg-blue-600 py-2 rounded text-white hover:bg-blue-700 transition">
            Register
          </button>
        </form>
        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </div>
  );
}

export default Register;
