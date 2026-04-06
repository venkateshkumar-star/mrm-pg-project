import React from "react";
import { assets } from "../assets/assets";
import { useState } from "react";
export const Branches = () => {
  const womenbranches = [
    {
      city: "Porur",
      desc: "Plot no: 4 subbu villa sterling avenue, shakthi nagar, porur, chennai 600116",
            src:"https://www.google.com/maps/place/13%C2%B001'42.1%22N+80%C2%B009'44.8%22E/@13.0283468,80.1598818,17z/data=!3m1!4b1!4m4!3m3!8m2!3d13.0283468!4d80.1624567?entry=tts&g_ep=EgoyMDI1MDkyNC4wIPu8ASoASAFQAw%3D%3D&skid=1651c670-2540-47dc-b6fd-469537cb38b8",


img:[assets.shathi_nadar]          },


    {
      city: "Mugalivakkam",
      desc: "Door no , 5, Subashree nagar ext-VI, mugalivakkam, Chennai -125",
            src: "https://www.google.com/maps/place/13%C2%B001'42.1%22N+80%C2%B009'44.8%22E/@13.0283611,80.1624444,17z/data=!3m1!4b1!4m4!3m3!8m2!3d13.0283611!4d80.1624444?entry=ttu&g_ep=EgoyMDI1MTAwOC4wIKXMDSoASAFQAw%3D%3D",
img:[assets.mugakivakkam]    },

    {
      city: "Arumpakam",
            src: "https://www.google.com/maps/place/13%C2%B003'43.9%22N+80%C2%B012'45.7%22E/@13.0621954,80.2101087,17z/data=!3m1!4b1!4m4!3m3!8m2!3d13.0621954!4d80.2126836?entry=tts&g_ep=EgoyMDI1MDkyNC4wIPu8ASoASAFQAw%3D%3D&skid=e853bb62-6fa9-46ca-bbe2-f8dd2aabec3c"
,
      desc: "No.19, Kamala Nehru Nagar2nd cross Street, MMD bus stop.. Arumpakam near metro station, land mark - Ayswariya Mahal opposite-  Chennai -600094",
img:[assets.arumpakkam]    },


    {
      city: "Porur",
            src: "https://www.google.com/maps/place/13%C2%B001'54.2%22N+80%C2%B009'28.3%22E/@13.0317222,80.1578611,17z/data=!3m1!4b1!4m4!3m3!8m2!3d13.0317222!4d80.1578611?entry=ttu&g_ep=EgoyMDI1MTAwOC4wIKXMDSoASAFQAw%3D%3D"
,
      desc: "No.1, Thamarai street, ambal nagar, porur.. Chennai - 600116",
img:[assets.ambal_nadar]    },
  ];
    const menbranches = [
    {
      city: "Kattupakkam",
            src: "https://www.google.com/maps/place/13%C2%B002'36.5%22N+80%C2%B007'19.1%22E/@13.0434675,80.1194072,17z/data=!3m1!4b1!4m4!3m3!8m2!3d13.0434675!4d80.1219821?entry=tts&g_ep=EgoyMDI1MDkyNC4wIPu8ASoASAFQAw%3D%3D&skid=65c5776e-dd11-4b2c-a771-c052178068cb"
,
      desc: "No 2/224, trunk Road, land mark- Sangeetha desi mane opposite ...Kattupakkam , chennai - 600056",
img:[assets.kattupakkam]    },
    {
      city: "Kumananchavadi",
            src: "https://www.google.com/maps/place/24V8%2BWVW,+MSS+Nagar,+Chennai,+Tamil+Nadu+600056/@13.0447874,80.117359,17z/data=!4m5!3m4!1s0x3a5261c645947b9d:0xc809d672d6489271!8m2!3d13.0448625!4d80.1172031?entry=ttu&g_ep=EgoyMDI1MTAwOC4wIKXMDSoASAFQAw%3D%3D"
,
      desc: "24V8+WVW, MSS Nagar, Kumananchavadi, Chennai, Tamil Nadu 600056, India",
img:[assets.kumananchavadi]    },
    {
      city: "Manapakkam",
            src: "https://www.google.com/maps/place/13%C2%B000'55.1%22N+80%C2%B010'45.7%22E/@13.0152945,80.1767925,17z/data=!3m1!4b1!4m4!3m3!8m2!3d13.0152945!4d80.1793674?entry=tts&g_ep=EgoyMDI1MDkyNC4wIPu8ASoASAFQAw%3D%3D&skid=01b75b92-f2c3-40a1-9bd2-def72f083438"
,
      desc: "L&T / DLF back gateNear saibaba templeNo.16, Dr Ambedkar Nagar, Manapakkam, Chennai- 125",
img:[assets.testimonial]    },
    
  ];
  const [currentMap, setCurrentMap] = useState(womenbranches[0]);
 return (
  <section className="px-4 py-8 md:px-6 lg:py-12 max-w-7xl mx-auto font-sans">
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start">

      {/* Left Side - Branches */}
      <div className="space-y-10">

        {/* Women PG */}
        <p className="text-xl font-medium text-gray-900">Women PG Locations</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {womenbranches.map((b, i) => (
            <a
              key={i}
              href={b.src}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition cursor-pointer"
            >
              <img src={b.img} alt={b.city} className="w-full h-48 sm:h-56 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{b.city}</h3>
                <p className="text-gray-600 text-sm mt-1">{b.desc}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Men PG */}
        <p className="text-xl font-medium text-gray-900 mt-6">Men PG Locations</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {menbranches.map((b, i) => (
            <a
              key={i}
              href={b.src}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition cursor-pointer"
            >
              <img src={b.img} alt={b.city} className="w-full h-48 sm:h-56 object-cover" />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{b.city}</h3>
                <p className="text-gray-600 text-sm mt-1">{b.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex items-center justify-center sticky top-24">
        <img
          src={assets.branch}
          alt="Branches illustration"
          className="w-full h-auto max-h-[90vh] object-cover rounded-3xl shadow-lg"
        />
      </div>
    </div>
  </section>
);
};
