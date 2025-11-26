// HeroSection.jsx
import React, { useState, useEffect, useRef } from "react";
import { Star, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react"; // Lightweight & perfect
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
  const [images, setImages] = useState([]); // From your API
  const [loading, setLoading] = useState(true); // Loading state
  const [currentSlide, setCurrentSlide] = useState(0); // Current slide

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
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
        console.error("Failed to load slider images");
      } finally {
        setLoading(false);
      }
    };
    fetchSlider();
  }, []);

  // Sync current slide
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentSlide(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  // Auto Slide Every 5 Seconds
  useEffect(() => {
    if (images.length === 0 || loading) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [images, loading]);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();
  const scrollTo = (index) => emblaApi && emblaApi.scrollTo(index);

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setActiveModal("category");
  };

  return (
    <div className="min-h-[100dvh] pt-safe-top pb-safe-bottom bg-white relative overflow-hidden">
      {/* Blur when modal open */}
      <div
        className={`${
          activeModal ? "blur-sm pointer-events-none" : ""
        } transition-all duration-300`}
      >
        <section className="min-h-screen flex flex-col lg:flex-row items-center justify-between w-full lg:px-20 pt-[20px] lg:py-24">
          {/* Left Side */}
          <div className="w-full lg:w-[95%] flex flex-col items-center lg:items-start text-center lg:text-left gap-1">
            <div className="p-[10px]">{isMobile && <MobileHeader />}</div>
            <MobileDetect />
            <ServiceCard onServiceSelect={handleServiceClick} />
          </div>
          {/* Right Side - IMAGE SLIDER (Replace your whole <div className="w-full lg:w-[95%] ..."> with this) */}
          <div className="w-full lg:w-[95%] flex justify-center mt-8 lg:mt-0">
            <div className="w-[97vw] lg:w-full max-w-[540px]">
              <div className="relative h-72 md:h-100 overflow-hidden p-[1px] rounded-[15px]">
                {/* Loading Spinner */}
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
                  </div>
                )}

                {/* Slider - Shows ONE image at a time */}
                {!loading && images.length > 0 && (
                  <>
                    {/* Images Container */}
                    <div className="relative w-full h-full">
                      <div
                        className="flex transition-transform duration-500 ease-in-out h-full"
                        style={{
                          transform: `translateX(-${currentSlide * 100}%)`,
                        }}
                      >
                        {images.map((img, index) => (
                          <div
                            key={index}
                            className="w-full h-full flex-shrink-0"
                          >
                            <img
                              src={img}
                              alt={`Slide ${index + 1}`}
                              className="w-full h-full object-contain"
                              onError={(e) =>
                                (e.currentTarget.src = "/placeholder.jpg")
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Left Arrow */}
                    {images.length > 1 && (
                      <button
                        onClick={() =>
                          setCurrentSlide((prev) =>
                            prev === 0 ? images.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white z-10"
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
                    )}

                    {/* Right Arrow */}
                    {images.length > 1 && (
                      <button
                        onClick={() =>
                          setCurrentSlide((prev) =>
                            prev === images.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white z-10"
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
                    )}

                    {/* Dots Indicator */}
                    {images.length > 1 && (
                      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`transition-all duration-300 ${
                              currentSlide === index
                                ? "w-10 h-2.5 bg-white rounded-full shadow-lg"
                                : "w-2.5 h-2.5 bg-white/60 rounded-full hover:bg-white/80"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Fallback if no image */}
                {!loading && images.length === 0 && (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">No images available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
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

export default HeroSection;
