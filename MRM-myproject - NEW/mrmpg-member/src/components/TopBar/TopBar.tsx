import React, { useState } from "react";
import { assets } from "../../assets/assets.js";
import { Menu as MenuIcon } from "lucide-react";
import { MobileMenu } from "../../pages/MobileMenu";
import { useNavigate } from "react-router-dom";
export const TopBar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [open,setOpen]=useState(false)
  const navigate = useNavigate();
  return (
    <div className="w-full h-[50px] bg-white flex items-center justify-between px-6 py-3 shadow-md">
      {/* Left */}
       <div  onClick={()=>navigate("/overview")} className="flex   cursor-pointer items-center gap-3 sm:gap-2">
             <img
            
               src={assets.logo}
               alt="logo"
               className="
                 w-12 h-12 rounded-full object-cover 
               
                 lg:w-12 lg:h-12
                 md:w-11 md:h-11
                 sm:w-10 sm:h-10
                 max-[480px]:w-9 max-[480px]:h-9
                 max-[360px]:w-8 max-[360px]:h-8
               "
             />
     
             <h2
               className="
                 text-[22px] font-semibold m-0
                 lg:text-[22px]
                 md:text-[20px]
                 sm:text-[18px]
                 max-[480px]:text-[16px]
                 max-[360px]:text-[14px]
               "
             >
               MRM PG
             </h2>
           </div>

      {/* Right */}
      <div className="flex items-center gap-3">
      

<div className="relative group">
  <img
    src={assets.person}
    alt="profile"
    tabIndex={0}  // IMPORTANT
    className="w-10 h-10 rounded-full cursor-pointer focus:outline-none"
  />



  
</div>
<div>

</div>
          <button
        className="md:hidden p-2 bg-white rounded-full text-white shadow-lg transition-all"
        onClick={() => setMenuOpen(true)}
      >
        <div className="flex flex-col gap-1 cursor-pointer">
          <div className={`w-2 h-0.5 bg-gray-800 transition-all ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`}></div>
          <div className={`w-3 h-0.5 bg-gray-800 transition-all ${menuOpen ? "opacity-0" : ""}`}></div>
          <div className={`w-4 h-0.5 bg-gray-800 transition-all ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}></div>
        </div>
      </button>
      </div>




      {/* Mobile Menu */}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};
