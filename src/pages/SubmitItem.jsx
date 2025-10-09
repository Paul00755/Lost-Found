import React, { useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";

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
    
    // ✅ Prepare file data for presigned URLs
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

    // ✅ Upload each image using its presigned URL
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
    
    // ✅ Log the exact error message from Lambda
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

  const payload = { 
    ...itemData, 
    images,
    timestamp: Date.now()
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

    if (response.status === 200) {
      toast.success("✅ Item successfully submitted!");

      // Save locally for quick UI updates
      const prevItems = JSON.parse(localStorage.getItem("foundItems")) || [];
      const newItem = { 
        ...itemData, 
        id: Date.now().toString(),
        timestamp: Date.now(), 
        images 
      };
      localStorage.setItem("foundItems", JSON.stringify([newItem, ...prevItems]));

      // Reset form
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
      
      toast.success("✅ Item submitted successfully!");
    }
  } catch (err) {
    console.error("Submit error details:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      config: err.config
    });
    
    // Log the exact Lambda error
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
        className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md"
      >
        <div className="grid gap-4">
          <input
            type="text"
            name="itemName"
            placeholder="Item Name"
            value={itemData.itemName}
            onChange={handleChange}
            required
            className="input-field"
          />
          <textarea
            name="description"
            placeholder="Item Description"
            value={itemData.description}
            onChange={handleChange}
            required
            rows={3}
            className="input-field"
          />
          <input
            type="text"
            name="location"
            placeholder="Location Found"
            value={itemData.location}
            onChange={handleChange}
            required
            className="input-field"
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            value={itemData.email}
            onChange={handleChange}
            required
            className="input-field"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Your Phone Number"
            value={itemData.phone}
            onChange={handleChange}
            required
            className="input-field"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Images (1–4) 📸
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={isSubmitting}
              className="block w-full text-sm text-gray-900 dark:text-gray-100 file:bg-blue-50 file:dark:bg-blue-800 file:border-0 file:rounded-md file:py-2 file:px-4 file:text-sm file:font-semibold file:text-blue-700 dark:file:text-blue-200 disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Upload minimum 1 and maximum 4 images.
            </p>
          </div>

          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {images.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`preview-${idx}`}
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              ))}
            </div>
          )}

          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || images.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Item"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitItem;