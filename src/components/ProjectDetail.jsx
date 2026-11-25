import { supabase } from "../supabase";
import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Code2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layout,
  Globe,
  Package,
  Cpu,
  Code,
} from "lucide-react";
import { toSlug } from "../utils/slug";

const TECH_ICONS = {
  React: Globe,
  Tailwind: Layout,
  Express: Cpu,
  Python: Code,
  Javascript: Code,
  HTML: Code,
  CSS: Code,
  default: Package,
};

const TechBadge = ({ tech }) => {
  const Icon = TECH_ICONS[tech] || TECH_ICONS["default"];
  return (
    <div className="group relative overflow-hidden px-3 py-2 md:px-4 md:py-2.5 bg-white/5 rounded-xl border border-white/10 hover:border-white/25 hover:bg-white/10 transition-all duration-300 cursor-default">
      <div className="relative flex items-center gap-1.5 md:gap-2">
        <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/60 group-hover:text-white transition-colors" />
        <span className="text-xs md:text-sm font-medium text-white/80 group-hover:text-white transition-colors">
          {tech}
        </span>
      </div>
    </div>
  );
};

const ProjectDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsDescriptionExpanded(false);
    const fetchProject = async () => {
      const { data } = await supabase.from("projects").select("*");
      const selectedProject = data?.find((p) => toSlug(p.title) === slug);
      if (selectedProject) {
        setProject(selectedProject);
      }
    };
    fetchProject();
  }, [slug]);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center">
        <div className="text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 md:w-24 md:h-24 mx-auto border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <h2 className="text-xl md:text-3xl font-bold text-white">
            Loading Project...
          </h2>
        </div>
      </div>
    );
  }

  const projectUrl = `https://domain-kamu.vercel.app/project/${toSlug(project.title)}`;
  const formattedDescription = (project.description || "").replace(/\\n/g, "\n");
  const isLongDescription =
    formattedDescription.length > 220 ||
    (formattedDescription.match(/\n/g) || []).length >= 4;

  return (
    <>
      <Helmet>
        <title>{project.title} — Nama Kamu</title>
        <meta
          name="description"
          content={
            project.description
              ? project.description.slice(0, 155)
              : `Project ${project.title} oleh Nama Kamu.`
          }
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={projectUrl} />
        <meta property="og:title" content={`${project.title} — Nama Kamu`} />
        <meta property="og:description" content={project.description?.slice(0, 155)} />
        <meta property="og:url" content={projectUrl} />
        <meta property="og:type" content="website" />
        {project.img && <meta property="og:image" content={project.img} />}
      </Helmet>

      <div className="min-h-screen bg-[#030014] px-[2%] sm:px-0 relative overflow-hidden">
        <div className="fixed inset-0">
          <div className="absolute -inset-[10px] opacity-20">
            <div className="absolute top-0 -left-4 w-72 md:w-96 h-72 md:h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
            <div className="absolute top-0 -right-4 w-72 md:w-96 h-72 md:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-72 md:w-96 h-72 md:h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
          </div>
        </div>

        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
            {/* FIX: min-w-0 supaya judul di breadcrumb bisa dipotong rapi (truncate) tanpa merusak layout */}
            <div className="flex items-center space-x-2 md:space-x-4 mb-8 md:mb-12 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="group inline-flex flex-shrink-0 items-center space-x-1.5 md:space-x-2 px-3 md:px-5 py-2 md:py-2.5 bg-white/5 backdrop-blur-xl rounded-xl text-white/90 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20 text-sm md:text-base"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-1 md:space-x-2 text-sm md:text-base text-white/50 min-w-0">
                <span className="flex-shrink-0">Projects</span>
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                <span className="text-white/90 truncate min-w-0">{project.title}</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-start">
              <div className="space-y-6 md:space-y-10 min-w-0">
                <div className="space-y-4 md:space-y-6">
                  {/* FIX: ukuran judul diperkecil sedikit dan break-words agar tidak terpotong */}
                  <h1
                    className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-snug pr-3 pb-1 overflow-visible break-words"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {project.title}
                  </h1>
                </div>

                <div className="prose prose-invert max-w-none">
                  {/* FIX: deskripsi hanya dipotong di mobile; di desktop ditampilkan penuh */}
                  <p
                    className={`text-sm md:text-base text-gray-300/90 leading-relaxed whitespace-pre-line break-words ${
                      !isDescriptionExpanded && isLongDescription
                        ? "line-clamp-4 md:line-clamp-none"
                        : ""
                    }`}
                  >
                    {formattedDescription}
                  </p>

                  {isLongDescription && (
                    <button
                      type="button"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-3 inline-flex md:hidden items-center gap-1.5 text-sm md:text-base font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200 focus:outline-none group/btn"
                    >
                      <span>
                        {isDescriptionExpanded
                          ? "Tampilkan lebih sedikit"
                          : "Lihat selengkapnya"}
                      </span>
                      {isDescriptionExpanded ? (
                        <ChevronUp className="w-4 h-4 transition-transform group-hover/btn:-translate-y-0.5" />
                      ) : (
                        <ChevronDown className="w-4 h-4 transition-transform group-hover/btn:translate-y-0.5" />
                      )}
                    </button>
                  )}
                </div>

                <div className="space-y-4 md:space-y-6">
                  <h3 className="text-base md:text-lg font-semibold text-white/90 flex items-center gap-2 md:gap-3">
                    <Code2 className="w-4 h-4 md:w-5 md:h-5 text-white/60" />
                    Technologies Used
                  </h3>
                  {project.tech_stack?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {project.tech_stack.map((tech, index) => (
                        <TechBadge key={index} tech={tech} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm md:text-base text-gray-400 opacity-50">
                      No technologies added.
                    </p>
                  )}
                </div>
              </div>

              {/* FIX: foto dibatasi tinggi (max 75% layar) dan memakai object-contain agar utuh,
                  serta menempel (sticky) saat halaman di-scroll di desktop */}
              <div className="min-w-0 lg:sticky lg:top-8">
                <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group bg-white/5 flex items-center justify-center">
                  <img
                    src={project.img}
                    alt={project.title}
                    className="w-full max-h-[75vh] object-contain transform transition-transform duration-700 will-change-transform group-hover:scale-105"
                    onLoad={() => setIsImageLoaded(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FIX: <style jsx> adalah sintaks Next.js; di React biasa ganti dengan <style> biasa */}
        <style>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob { animation: blob 10s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}</style>
      </div>
    </>
  );
};

export default ProjectDetails;