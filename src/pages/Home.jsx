import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  CheckCircle,
  Heart,
  MessageCircle,
  Star
} from "lucide-react";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  "https://xq7a7biw3b.execute-api.ap-south-1.amazonaws.com/dev";

const Home = () => {
  const [recentItems, setRecentItems] = useState([]);

  /* ======================================================
     🔧 FIXED: API SOURCE + CALENDAR-DAY LOGIC + RETURN FILTER
     ====================================================== */
  useEffect(() => {
    const loadRecentItems = async () => {
      try {
        const res = await fetch(`${API_BASE}/items`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("idToken")
              ? { Authorization: `Bearer ${localStorage.getItem("idToken")}` }
              : {})
          }
        });

        if (!res.ok) throw new Error("Failed to fetch items");

        const allItems = await res.json();
        if (!Array.isArray(allItems)) return;

        const now = Date.now();
const last24Hours = 24 * 60 * 60 * 1000;

const recent = allItems
  .filter(
    (item) =>
      item.timestamp &&
      now - Number(item.timestamp) <= last24Hours
  )
  .sort((a, b) => b.timestamp - a.timestamp);


        setRecentItems(recent);
      } catch (err) {
        console.error("Failed to load recent items:", err);
        setRecentItems([]);
      }
    };

    loadRecentItems();

    const onRefresh = () => loadRecentItems();
    window.addEventListener("foundItems:refresh", onRefresh);
    return () => window.removeEventListener("foundItems:refresh", onRefresh);
  }, []);

  /* ======================
     IMAGE CAROUSEL (UNCHANGED)
     ====================== */
  const ImageCarousel = ({ images, alt, className }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const touchAreaRef = useRef(null);

    const minSwipeDistance = 50;

    if (!images || images.length === 0) {
      return (
        <div
          className={`${className} bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded`}
        >
          No Image
        </div>
      );
    }

    const goToPrevious = () =>
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

    const goToNext = () =>
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

    const onTouchStart = (e) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      if (distance > minSwipeDistance) goToNext();
      if (distance < -minSwipeDistance) goToPrevious();
    };

    return (
      <div
        ref={touchAreaRef}
        className="relative"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className={className}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    );
  };

  /* ======================
     JSX BELOW IS 100% YOUR ORIGINAL UI
     ====================== */

  return (
<div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-blue-600 mb-6">
          🔍 Welcome to Lost & Found Platform
        </h1>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 mb-8">
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            

            Every lost item has a story, and every owner misses a piece of their world. We bridge the gap between what's lost and what's loved. Whether you've found an item looking for its home or you're searching for a cherished possession, our community-driven platform is here to make the reunion simple, secure, and swift.

 
            
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
          How Our Platform Works
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Quick Reporting</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Found something? Report it in minutes with photos and details. Your submission goes live instantly.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Community Access</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Browse all reported items easily. Search by location, item type, or description to find what you've lost.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">Safe Returns</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Contact finders directly through secure channels. Arrange returns with confidence and ease.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Link
          to="/submit"
          className="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 p-8 rounded-xl shadow-md text-center transition transform hover:-translate-y-1"
        >
          <h2 className="text-2xl font-bold text-blue-800 dark:text-white mb-3">📦 Report Found Item</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Found someone's belongings? Be a good Samaritan! Upload clear photos, describe where you found it, 
            and help reunite the item with its owner. Your small act can make someone's day.
          </p>
          <div className="text-blue-600 dark:text-blue-400 font-semibold">
            Click to Report →
          </div>
        </Link>

        <Link
          to="/find"
          className="bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 p-8 rounded-xl shadow-md text-center transition transform hover:-translate-y-1"
        >
          <h2 className="text-2xl font-bold text-green-800 dark:text-white mb-3">🔍 Search Lost Items</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Lost something valuable? Don't worry! Browse through all recently found items. 
            Use our search filters to quickly locate your belongings. Many items are waiting to be claimed.
          </p>
          <div className="text-green-600 dark:text-green-400 font-semibold">
            Start Searching →
          </div>
        </Link>
      </div>

      {/* Community Impact Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 mb-12">
        <div className="text-center mb-6">
          <Heart className="text-green-500 mx-auto mb-3" size={32} />
          <h3 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-2">
            Community Impact
          </h3>
          <p className="text-green-700 dark:text-green-300">
            Together, we're building a more caring community
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Helping Hands</h4>
            <p className="text-green-700 dark:text-green-400 text-sm">
              People working together to return lost items to their owners
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Direct Connections</h4>
            <p className="text-green-700 dark:text-green-400 text-sm">
              Finders and owners connect directly for quick and personal returns
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="text-green-600 dark:text-green-400" size={28} />
            </div>
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">Trust Building</h4>
            <p className="text-green-700 dark:text-green-400 text-sm">
              Creating a culture of honesty and responsibility across world
            </p>
          </div>
        </div>
      </div>

      {/* Recently Reported Items */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-blue-600 text-center mb-2">
          🕒 Recently Reported Items
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Items reported in the last 24 hours - Fresh opportunities for reunions!
        </p>

        {recentItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-4">
              No Recent Reports Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Be the first to report a found item today! Your submission could help someone recover their lost belongings.
            </p>
            <Link 
              to="/find" 
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse All Items
              <ChevronRight size={20} />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentItems.map((item, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-xl shadow p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600">
                <ImageCarousel
                  images={item.images}
                  alt={item.itemName}
                  className="w-full h-48 object-cover rounded-lg mb-4 cursor-pointer"
                />

                <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">{item.itemName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{item.description}</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    📍 <strong>Found at:</strong> {item.location}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    📧 <strong>Contact:</strong> {item.email}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    📱 <strong>Phone:</strong> {item.phone}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Reported {new Date(item.timestamp).toLocaleTimeString()} today
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Final CTA */}
      <div className="text-center mt-12">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-4">Ready to Make a Difference?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Whether you've found an item or lost one, our platform connects caring people across campus. 
            Join our community today and help create more happy reunions!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/submit"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Report Found Item
            </Link>
            <Link
              to="/find"
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Search Lost Items
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
