import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SubmitItem from "./pages/SubmitItem";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ConfirmSignup from "./pages/ConfirmSignup.jsx";
import PrivateRoute from "./components/PrivateRoute";
import ForgotPassword from "./pages/ForgotPassword";
import FindItems from "./pages/FindItems";
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-white transition-colors duration-300">
        <Navbar />
        <div className="p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/confirm" element={<ConfirmSignup />} />
            <Route path="/find" element={<FindItems />} />

            <Route path="/submit" element={
              <PrivateRoute>
                <SubmitItem />
              </PrivateRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
