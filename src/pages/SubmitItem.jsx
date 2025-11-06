import React, { useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const SubmitItem = () => {
  const [itemData, setItemData] = useState({
    itemName: "",
    description: "",
    location: "",
    email: "",
    phone: "",
  });

  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setItemData({ ...itemData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    console.log("Selected files:", selectedFiles);

    if (selectedFiles.length > 4) {
      setError("❌ You can upload a maximum of 4 images.");
      setImages([]);
      return;
    }

    if (selectedFiles.length < 1) {
      setError("❌ Please upload at least 1 image.");
      setImages([]);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const presignedRequests = selectedFiles.map(file => ({
        fileName: file.name,
        fileType: file.type || "image/jpeg"
      }));

      console.log("Sending request for presigned URLs:", presignedRequests);

      const res = await axios.post(
        "https://xq7a7biw3b.execute-api.ap-south-1.amazonaws.com/dev/presigned-urls",
        { files: presignedRequests },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Presigned URL response:", res);

      const { urls } = res.data;
      if (!urls || urls.length !== selectedFiles.length) {
        setError("❌ Failed to fetch upload URLs.");
        return;
      }

      const uploadedImageUrls = [];

      await Promise.all(
        selectedFiles.map(async (file, idx) => {
          const { uploadUrl, imageUrl } = urls[idx];
          console.log(`Uploading file ${idx} to:`, uploadUrl);

          await axios.put(uploadUrl, file, {
            headers: {
              "Content-Type": file.type,
            },
          });
          uploadedImageUrls.push(imageUrl);
        })
      );

      setImages(uploadedImageUrls);
      setError("");
      toast.success("✅ Images uploaded successfully!");
    } catch (err) {
      console.error("Upload error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers
      });

      if (err.response?.data) {
        console.error("Lambda error response:", err.response.data);
      }

      if (err.response?.status === 400) {
        setError(`❌ Bad request: ${err.response?.data?.error || 'Please check your file data'}`);
      } else if (err.response?.status === 403) {
        setError("❌ Access denied. Please check API Gateway configuration.");
      } else if (err.response?.status === 500) {
        setError("❌ Server error. Please try again later.");
      } else {
        setError("❌ Failed to upload images. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const idToken = localStorage.getItem("idToken");

    if (!idToken) {
      setError("❌ Not authenticated. Please login.");
      return;
    }

    if (
      !itemData.itemName ||
      !itemData.description ||
      !itemData.location ||
      !itemData.email ||
      !itemData.phone
    ) {
      setError("❌ Please fill in all fields.");
      return;
    }

    if (images.length < 1) {
      setError("❌ Please upload at least 1 image.");
      return;
    }

    // Use a stable timestamp to mark the temp-local item so we can replace it later
    const submissionTimestamp = Date.now();

    const payload = {
      ...itemData,
      images,
      timestamp: submissionTimestamp
    };

    console.log("Submitting item with payload:", payload);

    try {
      setIsSubmitting(true);

      const response = await axios.post(
        "https://xq7a7biw3b.execute-api.ap-south-1.amazonaws.com/dev/items",
        payload,
        {
          headers: {
            Authorization: idToken,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Submit response:", response);

      // API might return the created item under response.data.item or response.data
      const serverItem = response.data?.item ? response.data.item : response.data;

      // Success notifications
      toast.success("✅ Item successfully submitted!");

      // Update localStorage:
      // - Remove any temporary local item with same timestamp
      // - Insert server canonical item at the front
      const prevItems = JSON.parse(localStorage.getItem("foundItems")) || [];

      // Filter out any temp items that used this timestamp (protect with typeof)
      const cleaned = prevItems.filter(it => {
        // Some older code used 'timestamp' as number, some as string — normalize both
        const itemTs = it?.timestamp ? Number(it.timestamp) : null;
        return itemTs !== submissionTimestamp;
      });

      // If server didn't return a full item object (rare), build a fallback
      const canonical = serverItem && typeof serverItem === "object" && (serverItem.id || serverItem.itemId || serverItem.itemName)
        ? serverItem
        : {
            // fallback -- use what we submitted but mark an id from server if present
            id: String(submissionTimestamp),
            ...payload
          };

      // Ensure canonical has timestamp as number
      canonical.timestamp = canonical.timestamp ? Number(canonical.timestamp) : submissionTimestamp;

      // Put server canonical at the front
      const newLocal = [canonical, ...cleaned];
      localStorage.setItem("foundItems", JSON.stringify(newLocal));

      // Clear form & images
      setItemData({
        itemName: "",
        description: "",
        location: "",
        email: "",
        phone: "",
      });
      setImages([]);
      setError("");
      if (fileInputRef.current) fileInputRef.current.value = null;

      // Notify other parts of the app to refresh (optional)
      try {
        window.dispatchEvent(new Event("foundItems:refresh"));
      } catch (e) {
        // ignore
      }

      // Redirect to search/find tab
      // NOTE: change '/find' to whatever route your app uses for FindItems if different.
      try {
        navigate("/find"); // preferred (react-router)
      } catch (navErr) {
        console.warn("navigate('/find') failed, falling back to root:", navErr);
        window.location.href = "/";
      }

    } catch (err) {
      console.error("Submit error details:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config
      });

      if (err.response?.data) {
        console.error("Lambda error response:", err.response.data);
      }

      if (err.response?.status === 500) {
        setError("❌ Server error. Please check Lambda function logs.");
      } else if (err.response?.status === 403) {
        setError("❌ Access denied. Please check authorization.");
      } else if (err.response?.status === 400) {
        setError(`❌ Bad request: ${err.response?.data?.error || 'Invalid data'}`);
      } else {
        setError("❌ Submission failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-300 mb-8">
        📤 Submit a Found Item
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              name="itemName"
              placeholder="e.g., Black Wallet, iPhone 13"
              value={itemData.itemName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              placeholder="Describe the item in detail..."
              value={itemData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location Found *
            </label>
            <input
              type="text"
              name="location"
              placeholder="e.g., Main Library, Room 201"
              value={itemData.location}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Email *
              </label>
              <input
                type="email"
                name="email"
                placeholder="your.email@example.com"
                value={itemData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="+1234567890"
                value={itemData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Upload Images (1-4) 📸
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={isSubmitting}
              className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Select 1 to 4 images of the found item
            </p>
          </div>

          {images.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Uploaded Images ({images.length}/4):
              </p>
              <div className="flex flex-wrap gap-3">
                {images.map((url, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={url}
                      alt={`preview-${idx}`}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm"
                    />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                      {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || images.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </span>
            ) : (
              "Submit Item"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitItem;
