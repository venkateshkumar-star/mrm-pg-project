


import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin } from "lucide-react";
import { assets } from '../assets/assets';
import { backendUrl } from '../App';

// Toast Notification Component
const ToastNotification = ({ message, type, onClose }) => {
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const icon = type === "success" ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-8.63"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  );

  return (
    <div className={`fixed top-6 right-6 p-4 rounded-xl shadow-lg text-white font-semibold flex items-center gap-3 z-50 ${bgColor} transition-transform duration-300 ease-out transform`}>
      {icon}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
};

export const Contact = () => {
  const [formData, setFormData] = useState({ name: "", phone: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [toast, setToast] = useState({ message: "", type: "", visible: false });

  // Array of Map URLs
   const maps = [
    {
    city: "Porur",
      src:"https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3887.1147945477883!2d80.1624444!3d13.0283611!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTPCsDAxJzQyLjEiTiA4MMKwMDknNDQuOCJF!5e0!3m2!1sen!2sin!4v1760012931117!5m2!1sen!2sin",
    },
    {
      city: "Mugalivakkam",
      src: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3887.2085259546543!2d80.1685!3d13.022388900000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTPCsDAxJzIwLjYiTiA4MMKwMTAnMDYuNiJF!5e0!3m2!1sen!2sin!4v1760013109973!5m2!1sen!2sin"
    },
    {
      city: "Arumpakam",
      src: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3886.5829964734985!2d80.21269439999999!3d13.062194399999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTPCsDAzJzQzLjkiTiA4MMKwMTInNDUuNyJF!5e0!3m2!1sen!2sin!4v1760013203980!5m2!1sen!2sin"
    },
    {
       city: "Porur",
      src: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3887.0620247895276!2d80.15786109999999!3d13.0317222!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTPCsDAxJzU0LjIiTiA4MMKwMDknMjguMyJF!5e0!3m2!1sen!2sin!4v1760013255651!5m2!1sen!2sin"
    },
    {
       city: "Kattupakkam",
      src: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3886.8774429650734!2d80.1219722!3d13.0434722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTPCsDAyJzM2LjUiTiA4MMKwMDcnMTkuMSJF!5e0!3m2!1sen!2sin!4v1760013840798!5m2!1sen!2sin"
    },
    {
     city: "Kumananchavadi",
      src: "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3886.85677219523!2d80.117359!3d13.0447874!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5261c645947b9d%3A0xc809d672d6489271!2s24V8%2BWVW%2C%20MSS%20Nagar%2C%20Chennai%2C%20Tamil%20Nadu%20600056!5e0!3m2!1sen!2sin!4v1760013897590!5m2!1sen!2sin"
    },
    {
      city: "Manapakkam",
      src: "https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d3887.319640902261!2d80.1793611!3d13.0153056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTPCsDAwJzU1LjEiTiA4MMKwMTAnNDUuNyJF!5e0!3m2!1sen!2sin!4v1760013945957!5m2!1sen!2sin"
    }
  ];
  // Auto-rotate maps every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMapIndex(prev => (prev + 1) % maps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [maps.length]);

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Show toast
  const showToast = (message, type) => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ message: "", type: "", visible: false }), 3000);
  };

  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) { showToast("Name is required.", "error"); return false; }
    if (!/^[0-9]{10}$/.test(formData.phone)) { showToast("Phone must be 10 digits.", "error"); return false; }
    if (formData.message.trim().length < 10) { showToast("Message must be at least 10 characters.", "error"); return false; }
    return true;
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${backendUrl}/enquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await res.json();

      if (result.success) {
        showToast(result.message, "success");
        setFormData({ name: "", phone: "", message: "" });
        setTimeout(() => window.location.href = "/", 2000);
      } else {
        showToast(result.message || "Submission failed. Try again.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
   <section className="px-4 py-10 sm:px-6 lg:py-16 max-w-7xl mx-auto font-sans min-h-screen">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-start">
    
    {/* LEFT SIDE – Map, Form, and Contact Info */}
    <div className="space-y-10">

      {/* 🗺️ Map with Location Name */}
      <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-200 aspect-video relative">
        <h3 className="absolute top-2 left-1 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg font-semibold text-gray-900 text-sm sm:text-base shadow-md border border-gray-300">
          {maps[currentMapIndex].city}
        </h3>
        <iframe
          key={maps[currentMapIndex].city}
          src={maps[currentMapIndex].src}
          title={maps[currentMapIndex].city}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out opacity-100"
        />
      </div>

      {/* 📋 Enquiry Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Enquiry Form</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-red-400 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Enter your mobile number"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-red-400 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
            required
          />
          <textarea
            name="message"
            placeholder="Enter your message..."
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-red-400 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all"
            required
          />
          <button
            type="submit"
            className="w-full md:w-auto px-8 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-all duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>

      {/* 📞 Contact Info */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h2>
        <ul className="space-y-4 text-gray-700">
          <li className="flex items-start gap-3">
            <MapPin className="w-5 h-5 mt-1 text-pink-500 flex-shrink-0" />
            <p>
              Anna Nagar, Tirupur <br />
              Dhruvam, Kallakurichi <br />
              Porur, Chennai <br />
              Avadi, Chennai
            </p>
          </li>
          <li className="flex items-start gap-3">
            <Phone className="w-5 h-5 mt-1 text-pink-500 flex-shrink-0" />
            <p>+01234567890, +09876543210</p>
          </li>
          <li className="flex items-start gap-3">
            <Mail className="w-5 h-5 mt-1 text-pink-500 flex-shrink-0" />
            <p>
              mailinfo00@rotal.com <br />
              support24@rotal.com
            </p>
          </li>
        </ul>
      </div>
    </div>

    {/* RIGHT SIDE – Illustration */}
    <div className="hidden lg:flex items-center justify-center">
      <img
        src={assets.ambal_nadar}
        alt="Contact illustration"
        className="w-full h-full object-cover rounded-3xl shadow-lg"
      />
    </div>
  </div>

  {/* ✅ Toast Notification */}
  {toast.visible && (
    <ToastNotification
      message={toast.message}
      type={toast.type}
      onClose={() => setToast({ ...toast, visible: false })}
    />
  )}
</section>

  );
};
