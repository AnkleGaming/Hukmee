// HeroSection.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ServiceCard from "./ui/service-card";
import MobileHeader from "./ui/mobileheader";
import MobileDetect from "./ui/mobiledetect";
import WomensSalonCard from "./ui/womensaloonCard";
import GetSliderImage from "../backend/homepageimage/getsliderimage";

const HeroSection = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [selectedService, setSelectedService] = useState(null);

  // Slider State
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch Slider Images
  useEffect(() => {
    const fetchSlider = async () => {
      try {
        setLoading(true);
        const data = await GetSliderImage();
        if (data && data.length > 0) {
          const imageUrls = data.map(
            (item) => `https://api.hukmee.in/Images/${item.Img}`
          );
          setImages(imageUrls);
        }
      } catch (err) {
        console.error("Failed to load slider images", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlider();
  }, []);

  // Auto-play every 5 seconds
  useEffect(() => {
    if (images.length <= 1 || loading) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [images, loading]);

  const goPrev = () =>
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goNext = () =>
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const goTo = (index) => setCurrentSlide(index);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setActiveModal("category");
  };

  return (
    <div className="min-h-[100dvh] pt-safe-top pb-safe-bottom bg-white relative overflow-hidden">
      {/* Blur background when modal is open */}
      <div
        className={`${
          activeModal ? "blur-sm pointer-events-none" : ""
        } transition-all duration-300`}
      >
        {/* ==== MOBILE: Slider at the TOP ==== */}

        <section className="flex flex-col lg:flex-row items-center justify-between w-full lg:px-20 pt-6 lg:py-24 gap-8 lg:gap-12">
          {/* Left Side - Content */}
          <div className="w-full lg:w-[95%] flex flex-col items-center lg:items-start text-center lg:text-left">
            {isMobile && <MobileHeader />}
            <MobileDetect />
            {isMobile && (
              <div className="w-full px-4 pt-4">
                <Slider
                  images={images}
                  loading={loading}
                  currentSlide={currentSlide}
                  goPrev={goPrev}
                  goNext={goNext}
                  goTo={goTo}
                />
              </div>
            )}
            <div className="mt-6">
              <ServiceCard onServiceSelect={handleServiceClick} />
            </div>
          </div>

          {/* Right Side - Desktop Slider */}
          {!isMobile && (
            <div className="w-full lg:w-[95%] flex justify-center">
              <div className="w-[97vw] lg:w-full max-w-[540px]">
                <Slider
                  images={images}
                  loading={loading}
                  currentSlide={currentSlide}
                  goPrev={goPrev}
                  goNext={goNext}
                  goTo={goTo}
                />
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {activeModal === "category" && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <WomensSalonCard
                onClose={() => setActiveModal(null)}
                service={selectedService}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reusable Slider Component (extracted for clean code)
const Slider = ({ images, loading, currentSlide, goPrev, goNext, goTo }) => {
  return (
    <div className="relative h-72 md:h-96 lg:h-[500px] overflow-hidden rounded-[15px] bg-transparent">
      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
        </div>
      )}

      {/* Images */}
      {!loading && images.length > 0 && (
        <>
          <div className="relative w-full h-full">
            <div
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {images.map((img, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0">
                  <img
                    src={img}
                    alt={`Slide ${idx + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => (e.currentTarget.src = "/placeholder.jpg")}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows (show only if >1 image) */}
          {images.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white z-10"
                aria-label="Previous slide"
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={goNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white z-10"
                aria-label="Next slide"
              >
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`transition-all duration-300 ${
                    currentSlide === idx
                      ? "w-10 h-2.5 bg-white rounded-full shadow-lg"
                      : "w-2.5 h-2.5 bg-white/60 rounded-full hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* No images fallback */}
      {!loading && images.length === 0 && (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-500">No images available</p>
        </div>
      )}
    </div>
  );
};

export default HeroSection;
