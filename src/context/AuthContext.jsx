// src/context/AuthContext.js
import React, { createContext, useEffect, useState } from "react";
import { CognitoUserPool, CognitoUser } from "amazon-cognito-identity-js";
import UserPool from "../utils/cognitoConfig";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Check user session on load
  useEffect(() => {
    const cognitoUser = UserPool.getCurrentUser();

    if (cognitoUser) {
      cognitoUser.getSession((err, session) => {
        if (err || !session.isValid()) {
          setUser(null);
        } else {
          setUser(cognitoUser);
        }
      });
    }
  }, []);

  const logout = () => {
    const cognitoUser = UserPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    setUser(null);
  };

  const value = {
    user,
    setUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
