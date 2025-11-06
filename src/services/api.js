// services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://xq7a7biw3b.execute-api.ap-south-1.amazonaws.com/dev';

const getAuthHeader = () => {
  const idToken = localStorage.getItem("idToken");
  return idToken ? { Authorization: `Bearer ${idToken}` } : {};
};

const parsePossibleBody = async (response) => {
  // Try to parse JSON normally
  try {
    const parsed = await response.json();
    // Common shapes:
    // 1) Array => return array
    if (Array.isArray(parsed)) return parsed;
    // 2) { items: [...] } => return items
    if (parsed && Array.isArray(parsed.items)) return parsed.items;
    // 3) { body: "json-string" } => try to parse the body
    if (parsed && typeof parsed.body === "string") {
      try {
        const inner = JSON.parse(parsed.body);
        if (Array.isArray(inner)) return inner;
        if (inner && Array.isArray(inner.items)) return inner.items;
      } catch (e) {
        // not JSON — fall through
      }
    }
    // If it's an object but not an array, try to find an array value
    for (const k of Object.keys(parsed || {})) {
      if (Array.isArray(parsed[k])) return parsed[k];
    }
    // Nothing matched — return empty array
    return [];
  } catch (err) {
    // response wasn't JSON — return empty array
    return [];
  }
};

export const api = {
  // Get all items - robust fallback: GET -> if 400 then POST
  getItems: async () => {
    const endpoint = `${API_BASE_URL}/items`;
    console.log("🔍 Attempting to fetch items from API (GET)...");

    // Default headers
    const baseHeaders = {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    };

    // 1) Try plain GET (no body)
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: baseHeaders,
      });

      if (res.ok) {
        const items = await parsePossibleBody(res);
        console.log("✅ API GET returned items:", items.length);
        return items;
      }

      // If server returns 400, we'll try POST fallback
      if (res.status === 400) {
        console.warn("⚠️ GET returned 400 — will try POST fallback.");
      } else {
        // other non-OK statuses -> throw to go to catch below (will be handled by caller)
        const text = await res.text().catch(() => "");
        throw new Error(`GET /items failed: ${res.status} ${text}`);
      }
    } catch (getErr) {
      // network error or other problem — we'll attempt POST fallback below
      console.warn("GET /items failed, attempting POST fallback:", getErr.message || getErr);
    }

    // 2) POST fallback (some backends expect a POST to list items)
    try {
      console.log("🔁 Trying POST /items fallback...");
      const postRes = await fetch(endpoint, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({}), // empty payload for backends that expect JSON
      });

      if (!postRes.ok) {
        const txt = await postRes.text().catch(() => "");
        throw new Error(`POST /items failed: ${postRes.status} ${txt}`);
      }

      const items = await parsePossibleBody(postRes);
      console.log("✅ API POST returned items:", items.length);
      return items;
    } catch (postErr) {
      console.error("❌ Both GET and POST /items failed:", postErr);
      // Return empty array so UI can fallback to localStorage gracefully
      return [];
    }
  },

  // Create new item
  createItem: async (itemData) => {
    if (!Array.isArray(itemData.images) || itemData.images.length === 0) {
      throw new Error("At least one image is required");
    }

    const submissionData = {
      itemName: itemData.itemName,
      description: itemData.description,
      location: itemData.location,
      email: itemData.email,
      phone: itemData.phone,
      images: itemData.images,
      timestamp: Date.now(),
    };

    const endpoint = `${API_BASE_URL}/items`;
    const headers = {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(submissionData),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Submission failed: ${response.status} - ${text}`);
    }

    return await response.json();
  },

  // Health check - plain GET (no body)
  healthCheck: async () => {
    const endpoint = `${API_BASE_URL}/items`;
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      return {
        status: res.status,
        working: res.ok,
        message: res.ok ? "API is working (GET)" : `API returned ${res.status}`,
      };
    } catch (err) {
      return { working: false, message: err.message || String(err) };
    }
  },
};
