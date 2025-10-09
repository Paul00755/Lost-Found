import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Home = () => {
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    const storedItems = JSON.parse(localStorage.getItem("foundItems")) || [];
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    const recent = storedItems
      .filter(item => now - item.timestamp < oneDay)
      .sort((a, b) => b.timestamp - a.timestamp);

    setRecentItems(recent);
  }, []);

  const ImageCarousel = ({ images, alt, className }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const touchAreaRef = useRef(null);

    // Minimum swipe distance
    const minSwipeDistance = 50;

    if (!images || images.length === 0) {
      return (
        <div className={`${className} bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 rounded`}>
          No Image
        </div>
      );
    }

    const goToPrevious = () => {
      setCurrentIndex((prevIndex) => 
        prevIndex === 0 ? images.length - 1 : prevIndex - 1
      );
    };

    const goToNext = () => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    };

    const onTouchStart = (e) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
      setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe) {
        goToNext();
      } else if (isRightSwipe) {
        goToPrevious();
      }
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
        
        {/* Navigation arrows - only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-80 hover:opacity-100"
            >
              <ChevronLeft size={20} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all opacity-80 hover:opacity-100"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        
        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold text-blue-600 text-center mb-6">
        🔍 Welcome to the Lost & Found Portal
      </h1>

      <div className="text-center text-gray-700 dark:text-gray-300 mb-10 max-w-3xl mx-auto text-lg leading-relaxed">
        <p className="mb-4">
          This platform helps you recover lost belongings and report items you've found on campus.
        </p>
        <p>
          Click one of the options below to get started. You can report a lost item you've found or browse recent submissions to help reunite lost items with their owners.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <Link
          to="/submit"
          className="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 p-6 rounded-xl shadow-md text-center transition"
        >
          <h2 className="text-2xl font-bold text-blue-800 dark:text-white mb-2">📦 Report Lost Item</h2>
          <p className="text-gray-700 dark:text-gray-300">Found something? Let others know by submitting details and an image.</p>
        </Link>

        <Link
          to="/find"
          className="bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 p-6 rounded-xl shadow-md text-center transition"
        >
          <h2 className="text-2xl font-bold text-green-800 dark:text-white mb-2">🔍 Find a Lost Item</h2>
          <p className="text-gray-700 dark:text-gray-300">Lost something recently? Browse the full list of submitted items.</p>
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-blue-600 text-center mb-6">🕒 Recently Reported Items (within 24 hours)</h2>

      {recentItems.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          No recently reported items in the last 24 hours.<br />
          <Link to="/find" className="text-blue-600 hover:underline">Click here</Link> to see all reported items.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentItems.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 hover:shadow-lg transition-shadow">
              <ImageCarousel
                images={item.images}
                alt={item.itemName}
                className="w-full h-48 object-cover rounded mb-4 cursor-pointer"
              />

              <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 mb-2">{item.itemName}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{item.description}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                📍 <strong>Location:</strong> {item.location}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                📧 {item.email} | 📱 {item.phone}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;