// src/pages/Signup.js
import React, { useState } from 'react';
import UserPool from '../aws/cognitoConfig';
import { CognitoUserAttribute } from 'amazon-cognito-identity-js';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSignup = (e) => {
    e.preventDefault();

    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email })
    ];

    UserPool.signUp(email, password, attributeList, null, (err, result) => {
      if (err) {
        setMessage(err.message || JSON.stringify(err));
      } else {
        setMessage("Signup successful! Please check your email for a confirmation link.");
      }
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
      <form onSubmit={handleSignup} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Sign Up
        </button>
        {message && <p className="text-sm mt-2">{message}</p>}
      </form>
    </div>
  );
}
