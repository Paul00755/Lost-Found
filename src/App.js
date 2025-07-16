import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SubmitItem from "./pages/SubmitItem";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login.jsx";
import Register from "./pages/register.jsx";
import ConfirmSignup from "./pages/ConfirmSignup.jsx";
import PrivateRoute from "./components/PrivateRoute";
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 text-gray-800">
        <Navbar />
        <div className="p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit" element={<SubmitItem />} />
            <Route path="/register" element={<Register />} /> {/* updated route */}
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/confirm" element={<ConfirmSignup />} />
             <Route path="/submit" element={
                         <PrivateRoute>
                         <SubmitItem />
                         </PrivateRoute>
                        } />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
