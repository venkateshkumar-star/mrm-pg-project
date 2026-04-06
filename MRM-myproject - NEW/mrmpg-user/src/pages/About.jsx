import React from "react";
import { assets } from "../assets/assets";

export const About = () => {
  return (
    <section className="px-6 py-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      {/* Left side content */}
      <div className="flex flex-col gap-6">
        {/* Title and Image 1 */}
        <div className="relative  overflow-hidden">
          <h2 className="absolute bg-white text-xl sm:text-2xl font-bold mb-6 px-9 py-2 rounded-2xl left-[-10px] top-[-10px] text-gray-900 shadow">
            About Us
          </h2>
          <img
            src={assets.about1}
            alt="PG Room 1"
            className="w-full h-72 object-cover rounded-3xl"
          />
          <p className="h-12 w-1/2 sm:w-72 bg-white absolute right-[-10px]  bottom-[-10px] rounded-2xl"></p>
        </div>

        {/* Quote */}
        <blockquote className="bg-white shadow-md rounded-2xl p-6 border-l-4 border-primary">
          <p className="text-gray-700 text-lg italic mb-4">
            “At MRM PG, we believe in creating a space where you can live, study, and relax with ease. Our facility is thoughtfully designed with your comfort, safety, and convenience in mind. We offer well-maintained rooms, 24/7 security, and a warm, supportive environment. Whether you're here for studies or work, you'll always feel right at home.”
          </p>
          <footer className="text-primary font-semibold">
          – The Heartful Warden
          </footer>
        </blockquote>

        {/* Image 2 */}
        <div className="relative  overflow-hidden">
          <p className="absolute h-12  w-4/6 sm:w-72 bg-white right-[-10px] rounded-2xl top-[-10px]"></p>
          <img
            src={assets.about2}
            alt="PG Room 2"
            className="w-full h-72 object-cover rounded-3xl"
          />
        </div>
      </div>

      {/* Right side big image */}
      <div className="relative h-full  overflow-hidden">
        <img
          src={assets.about3}
          alt="PG Room 3"
          className="w-full h-full object-cover rounded-3xl"
        />
      </div>
    </section>
  );
};
