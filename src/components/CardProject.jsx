import React, { memo } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, ArrowRight } from "lucide-react";
import { toSlug } from "../utils/slug";

const CardProject = ({ Img, Title, Description, Link: ProjectLink, id }) => {
  const handleLiveDemo = (e) => {
    if (!ProjectLink) {
      e.preventDefault();
      alert("Live demo link is not available");
    }
  };

  const handleDetails = (e) => {
    if (!id) {
      e.preventDefault();
      alert("Project details are not available");
    }
  };

  return (
    <div className="group relative w-full h-full">
      <div className="relative overflow-hidden rounded-2xl bg-white soft-card-shadow h-full flex flex-col justify-between">
        <div className="relative p-5 z-10 flex flex-col justify-between h-full">
          <div className="relative overflow-hidden rounded-xl bg-zinc-100">
            <div className="w-full h-full transition-transform duration-500 group-hover:scale-105">
              <img
                src={Img}
                alt={Title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-top aspect-[16/8]"
              />
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <h3
              className="text-xl font-bold text-zinc-900 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {Title}
            </h3>

            <p className="text-zinc-600 text-sm leading-relaxed line-clamp-2">
              {Description}
            </p>

            <div className="pt-3 flex items-center justify-between gap-3">
              {id ? (
                <Link
                  to={`/project/${toSlug(Title)}`}
                  onClick={handleDetails}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-[#2c67ed] hover:bg-[#1d4ed8] shadow-sm transition-[transform,background-color] duration-200 hover:scale-[1.03] active:scale-95 focus:outline-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <span className="text-sm">Details</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="text-zinc-600 text-sm">
                  Details Not Available
                </span>
              )}

              {ProjectLink && (
                <a
                  href={ProjectLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLiveDemo}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-[#2c67ed] bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  <span className="text-sm">Live Demo</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(CardProject);