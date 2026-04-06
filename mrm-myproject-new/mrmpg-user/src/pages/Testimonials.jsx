import React from "react";
import { assets } from "../assets/assets";

export const Testimonials = () => {
  const testimonials = [
    {
      src: assets.women1,
      text: "The rooms at MRMPG are spotless and spacious, with comfortable beds that make it feel just like home. The staff is always ready to help, and the location near the metro is perfect for my daily commute.",
      author: "Priya K., Software Engineer, Anna Nagar"
    },
    {
      src: assets.women2,
      text: "Staying here as a solo female traveler, I felt completely safe with 24/7 security and CCTV. The home-cooked meals are delicious and hygienic—highly recommended for anyone new to Chennai.",
      author: "Lakshmi R., Student, Bangalore"
    },
    {
      src: assets.men1,
      text: "MRMPG offers great value with AC rooms, fast WiFi, and friendly management. My short stay was hassle-free, and the quiet neighborhood helped me focus on work.",
      author: "Arjun S., IT Consultant, Coimbatore"
    },
    {
      src: assets.women3,
      text: "The hostel has a warm, community vibe with shared spaces that are always clean. The food service is punctual and tasty—I've been here for three months and plan to stay longer.",
      author: "Kavya M., Marketing Professional, Chennai"
    },
    {
      src: assets.men2,
      text: "As a working professional, the laundry and power backup facilities are a big plus. Staff responds quickly to any needs, making it reliable for long-term stays.",
      author: "Rahul P., Engineer, Pune"
    },
    {
      src: assets.men3,
      text: "Clean facilities and nutritious South Indian food made my student life easier. The proximity to colleges and eateries is unbeatable—feels secure and homely.",
      author: "Sneha D., Undergraduate Student, Madurai"
    },
    {
      src: assets.men4,
      text: "Upgraded my room without extra cost when I arrived late—the team went above and beyond. Great for solo stays, with helpful advice on local spots.",
      author: "Vikram G., Business Traveler, Mumbai"
    },
    {
      src: assets.women5,
      text: "Neat rooms, positive atmosphere, and spacious common areas. It's like a second home, especially with the homely meals and no hidden charges.",
      author: "Divya S., Freelancer, Hyderabad."
    }
  ];

  return (
<section className="px-4 sm:px-6 py-10 lg:py-16 max-w-7xl mx-auto">
  <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start">

    {/* LEFT: Testimonials */}
    <div className="relative bg-white rounded-3xl shadow-lg p-6 sm:p-8 border border-gray-200">
      
      {/* Floating Heading */}
      <h2 className="absolute -top-6 right-6 bg-white px-5 py-2 text-lg font-bold text-gray-900 rounded-lg shadow-md border border-gray-200">
        Testimonials
      </h2>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {testimonials.map((t, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-6 border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 bg-white"
          >
            {/* Circular Frame for Image */}
            <div className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full overflow-hidden border-2 border-gray-300 shadow-md mb-4 flex items-center justify-center">
              <img
                src={t.src}
                alt={t.author}
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Testimonial Text */}
            <p className="text-gray-700 text-sm sm:text-base italic mb-2">
              "{t.text}"
            </p>
            <span className="text-primary text-sm sm:text-base font-semibold">
              – {t.author}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* RIGHT: Image */}
    <div className=" lg:block sticky top-24">
         <img
           src={assets.testimonial}
           alt="Branch view"
           className="w-full h-auto max-h-[80vh] object-cover rounded-3xl shadow-lg"
         />
       </div>
  </div>

 
</section>

  );
};
