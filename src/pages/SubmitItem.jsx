import React, { useState } from "react";

function SubmitItem() {
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-blue-700 text-center mb-6">
          🧾 Submit Found Item
        </h2>

        <form className="space-y-5">
          {/* Your Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Item Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* Location Found */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Location Found
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Upload Photo (Required)
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full border rounded-lg px-4 py-2 file:bg-blue-600 file:text-white file:border-none file:px-4 file:py-2 file:rounded file:cursor-pointer hover:file:bg-blue-700 transition"
              onChange={handleImageChange}
              required
            />
          </div>

          {/* Image Preview */}
          {preview && (
            <div className="flex justify-center mt-4">
              <img
                src={preview}
                alt="Preview"
                className="w-48 h-auto rounded-lg border shadow"
              />
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center pt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition duration-200"
            >
              🚀 Submit Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubmitItem;
