import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const SubmitItem = () => {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState(null);
  const navigate = useNavigate();
  const { dark } = useContext(ThemeContext);

  const containerClass = dark ? "bg-gray-900 text-white" : "bg-white text-gray-800";

  // Convert image to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result); // Base64 string
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const item = {
      itemName,
      description,
      location,
      email,
      phone,
      image, // Base64 image
      timestamp: new Date().getTime(),
    };

    // Get existing from localStorage
    const existing = JSON.parse(localStorage.getItem("foundItems")) || [];
    existing.push(item);
    localStorage.setItem("foundItems", JSON.stringify(existing));

    navigate("/"); // Redirect to home
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${containerClass}`}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md">
        <h2 className="text-2xl font-bold text-center text-blue-600 dark:text-blue-300 mb-6">
          Submit Found Item
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
            className="w-full p-2 rounded border focus:outline-none"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full p-2 rounded border focus:outline-none"
          />
          <input
            type="text"
            placeholder="Location Found"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full p-2 rounded border focus:outline-none"
          />
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 rounded border focus:outline-none"
          />
          <input
            type="tel"
            placeholder="Your Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full p-2 rounded border focus:outline-none"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
            className="w-full"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Submit Item
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitItem;
