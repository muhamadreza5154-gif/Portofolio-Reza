import { ExternalLink } from "lucide-react";

const socialLinks = [
  {
    name: "LinkedIn",
    displayName: "Let's Connect",
    subText: "on LinkedIn",
    icon: "/linkedin-logo-linkedin-icon-transparent-free-png.webp",
    url: "https://www.linkedin.com/in/username",
    iconScale: "scale-[1.7] group-hover:scale-[1.85]",
    darkBadge: false,
  },
  {
    name: "Instagram",
    displayName: "Instagram",
    subText: "@call_merein",
    icon: "/Instagram_icon.webp",
    url: "https://www.instagram.com/call_merein?lqvp=MXgzMzBoZTVncjg3MQ%3D%3D&utm_source=qr",
    iconScale: "group-hover:scale-105",
    darkBadge: false,
  },
  {
    name: "GitHub",
    displayName: "GitHub",
    subText: "@muhamadreza5154-gif",
    icon: "/github.png",
    url: "https://github.com/muhamadreza5154-gif",
    iconScale: "group-hover:scale-105",
    darkBadge: false,
  },
  {
    name: "TikTok",
    displayName: "TikTok",
    subText: "@lielikeaizen",
    icon: "/tiktok.svg",
    url: "https://www.tiktok.com/@lielikeaizen",
    iconScale: "group-hover:scale-105",
    darkBadge: true,
  },
];

const SocialRow = ({ link }) => (
  <a
    href={link.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-center gap-4 py-3.5 px-1 transition-colors duration-200"
  >
    {/* Icon — fixed 40x40 container */}
    <div
      className={`relative flex-shrink-0 flex items-center justify-center w-10 h-10 overflow-hidden ${
        link.darkBadge ? "bg-zinc-900 rounded-lg p-1.5" : ""
      }`}
    >
      <img
        src={link.icon}
        alt={link.name}
        className={`w-full h-full object-contain transition-transform duration-300 ${link.iconScale}`}
      />
    </div>

    {/* Text */}
    <div className="flex flex-col min-w-0 flex-1">
      <span className="text-sm font-bold text-zinc-900 group-hover:text-[#2c67ed] transition-colors duration-200 leading-snug">
        {link.displayName}
      </span>
      <span className="text-xs text-zinc-600 truncate group-hover:text-zinc-800 transition-colors duration-200">
        {link.subText}
      </span>
    </div>

    {/* External Link Icon */}
    <ExternalLink
      className="flex-shrink-0 w-4 h-4 text-zinc-400 group-hover:text-[#2c67ed]
                 transition-[color,transform] duration-200
                 group-hover:translate-x-0.5"
    />
  </a>
);

const SocialLinks = () => {
  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div>
        <h3
          className="text-xl font-bold text-zinc-900 mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Find Me
        </h3>

        <div className="flex flex-col divide-y divide-zinc-200/80">
          {socialLinks.map((link) => (
            <SocialRow key={link.name} link={link} />
          ))}
        </div>
      </div>

      {/* Event Photo */}
      <div className="mt-5 pt-1">
        <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-200/80 shadow-sm group">
          <img
            src={`${import.meta.env.BASE_URL}foto-saya.png`}
            alt="Event Activity"  
            className="w-full h-auto block transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default SocialLinks;
