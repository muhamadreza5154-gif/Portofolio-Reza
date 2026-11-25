import React from 'react';

const TechStackIcon = ({ TechStackIcon, Language }) => {
  return (
    <div className="group p-5 rounded-2xl bg-white hover:bg-blue-50/40 border border-zinc-200/90 hover:border-[#2c67ed]/40 transition-all duration-300 ease-in-out flex flex-col items-center justify-center gap-3 hover:-translate-y-1.5 cursor-pointer shadow-[0_6px_22px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_rgba(44,103,237,0.12)] w-full h-full">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#2c67ed] to-cyan-500 rounded-full opacity-0 group-hover:opacity-25 blur transition duration-300"></div>
        <img
          src={TechStackIcon}
          alt={`${Language} icon`}
          className="relative h-14 w-14 md:h-16 md:w-16 object-contain transform group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <span className="text-zinc-800 font-semibold text-xs sm:text-sm tracking-wide group-hover:text-[#2c67ed] transition-colors duration-300 text-center">
        {Language}
      </span>
    </div>
  );
};

export default TechStackIcon;
