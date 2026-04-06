import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    id: 1,
    title: "Your Home Away From Home",
    subtitle:
      "Experience comfort and affordability with our PG accommodations.",
    image: assets.banner1,
    buttonText: "Explore More",
    buttonLink: "/about",
  },
  {
    id: 2,
    title: "Multiple PG Branches Across the City",
    subtitle:
      "Find the perfect stay near your workplace or college. Spacious rooms, secure facilities, and all modern amenities at every branch.",
    image: assets.banner2,
    buttonText: "Explore Branches",
    buttonLink: "/branches",
  },
  {
    id: 3,
    title: "Safe & Secure Living",
    subtitle:
      "24/7 security and a peaceful environment tailored for students and professionals.",
    image: assets.banner3,
    buttonText: "Learn More",
    buttonLink: "/services",
  },
  {
    id: 4,
    title: "Our Branch Videos",
    subtitle:
      "Take a quick tour of our branches and explore the comfort, facilities, and vibrant community we offer.",
    image: assets.banner4,
    buttonText: "Watch Now",
    buttonLink: "/branch-video",
  },
];

export const Home = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const currentSlide = slides[currentIndex];

  return (
    <section className="relative w-full h-[100dvh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background Image */}
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            className="w-full h-full object-cover object-center"
          />

          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20"></div>

          {/* Overlay Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 sm:px-10 text-white z-10">
            <motion.h1
              key={currentSlide.title}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight drop-shadow-2xl max-w-[90%] sm:max-w-2xl"
            >
              {currentSlide.title}
            </motion.h1>

            <motion.p
              key={currentSlide.subtitle}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-base sm:text-lg md:text-2xl mb-6 sm:mb-8 leading-relaxed max-w-sm sm:max-w-2xl text-gray-100 drop-shadow-lg"
            >
              {currentSlide.subtitle}
            </motion.p>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Link
                to={currentSlide.buttonLink}
                className="inline-block bg-primary hover:bg-secondary transition px-8 py-3 sm:px-10 sm:py-4 rounded-full font-semibold text-sm sm:text-base shadow-lg"
              >
                {currentSlide.buttonText}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots Navigation */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentIndex === idx
                ? "bg-primary w-6"
                : "bg-white/70 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </section>
  );
};
