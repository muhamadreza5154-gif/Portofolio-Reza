import React, { useRef, useState } from "react";
import { User, Mail, MessageSquare, Send } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import SocialLinks from "../components/SocialLinks";
import Komentar from "../components/Commentar";
import Swal from "sweetalert2";

const ContactPage = () => {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 92%", "start 35%"],
  });

  const smoothReveal = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 28,
    restDelta: 0.001,
  });

  const revealOpacity = useTransform(smoothReveal, [0, 0.75, 1], [0.15, 1, 1]);
  const revealY = useTransform(smoothReveal, [0, 1], [32, 0]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    Swal.fire({
      title: "Mengirim Pesan...",
      html: "Harap tunggu selagi kami mengirim pesan Anda",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // Ganti dengan email Anda di FormSubmit
      const formSubmitUrl = "https://formsubmit.co/emailkamu@gmail.com";

      // Siapkan data form untuk FormSubmit
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("message", formData.message);
      submitData.append("_subject", "Pesan Baru dari Website Portfolio");
      submitData.append("_captcha", "false"); // Nonaktifkan captcha
      submitData.append("_template", "table"); // Format email sebagai tabel

      await fetch(formSubmitUrl, {
        method: "POST",
        body: submitData,
      });

      Swal.fire({
        title: "Berhasil!",
        text: "Pesan Anda telah berhasil terkirim!",
        icon: "success",
        confirmButtonColor: "#2c67ed",
        timer: 2000,
        timerProgressBar: true,
      });

      setFormData({
        name: "",
        email: "",
        message: "",
      });
    } catch (error) {
      if (error.request && error.request.status === 0) {
        Swal.fire({
          title: "Berhasil!",
          text: "Pesan Anda telah berhasil terkirim!",
          icon: "success",
          confirmButtonColor: "#2c67ed",
          timer: 2000,
          timerProgressBar: true,
        });

        setFormData({
          name: "",
          email: "",
          message: "",
        });
      } else {
        Swal.fire({
          title: "Gagal!",
          text: "Terjadi kesalahan. Silakan coba lagi nanti.",
          icon: "error",
          confirmButtonColor: "#2c67ed",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="Contact"
      ref={sectionRef}
      className="relative z-20 w-full bg-transparent pt-10 pb-16 px-[5%] sm:px-[5%] lg:px-[10%]"
    >
      <motion.div
        style={
          reduceMotion
            ? undefined
            : {
              opacity: revealOpacity,
              y: revealY,
            }
        }
        className="will-change-transform"
      >
        <div className="text-center mb-6 sm:px-0 px-[5%]">
          <h2
            className="section-label"
            style={{ fontFamily: "var(--font-display)", color: "#09090b" }}
          >
            Hubungi Saya
          </h2>
        </div>

        <div className="h-auto py-6 flex items-center justify-center 2xl:pr-[3.1%] lg:pr-[3.8%] md:px-0">
          <div className="container px-[1%] grid grid-cols-1 lg:grid-cols-[36%_64%] 2xl:grid-cols-[35%_65%] gap-6 sm:gap-8">
            {/* Left Column: Separated Contact Form Card (Top) & Find Me Card (Bottom) */}
            <div className="flex flex-col gap-6 sm:gap-8 h-full">
              {/* Card 1: Contact Form (Multi-layer soft elevation shadow) */}
              <div className="flex flex-col bg-white rounded-3xl p-6 py-8 sm:p-10 soft-card-shadow">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2
                      className="text-3xl font-bold mb-3"
                      style={{ fontFamily: "var(--font-display)", color: "#2c67ed" }}
                    >
                      Hubungi
                    </h2>
                    <p className="text-zinc-600 text-sm sm:text-base leading-relaxed">
                      Tertarik untuk mengenal lebih lanjut?

                      Saya terbuka untuk dihubungi terkait peluang karier, proses rekrutmen, maupun kesempatan kolaborasi profesional. Silakan sampaikan pesan melalui formulir yang tersedia.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="relative group">
                    <User className="absolute left-4 top-4 w-5 h-5 text-zinc-500 group-focus-within:text-[#2c67ed] transition-colors" />
                    <input
                      type="text"
                      name="name"
                      placeholder="Nama Anda"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full p-4 pl-12 bg-zinc-100/80 rounded-xl border border-transparent placeholder-zinc-500 text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2c67ed]/20 focus:border-[#2c67ed] transition-colors duration-200 disabled:opacity-50"
                      required
                    />
                  </div>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-4 w-5 h-5 text-zinc-500 group-focus-within:text-[#2c67ed] transition-colors" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Anda"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full p-4 pl-12 bg-zinc-100/80 rounded-xl border border-transparent placeholder-zinc-500 text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2c67ed]/20 focus:border-[#2c67ed] transition-colors duration-200 disabled:opacity-50"
                      required
                    />
                  </div>
                  <div className="relative group">
                    <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-zinc-500 group-focus-within:text-[#2c67ed] transition-colors" />
                    <textarea
                      name="message"
                      placeholder="Pesan Anda"
                      value={formData.message}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full resize-none p-4 pl-12 bg-zinc-100/80 rounded-xl border border-transparent placeholder-zinc-500 text-zinc-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2c67ed]/20 focus:border-[#2c67ed] transition-colors duration-200 h-[8.5rem] disabled:opacity-50"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white py-4 rounded-xl font-semibold bg-[#2c67ed] hover:bg-[#1d4ed8] shadow-sm transition-[transform,background-color] duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    <Send className="w-5 h-5" />
                    {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
                  </button>
                </form>
              </div>

              {/* Card 2: Find Me (Bottom Left Card, aligns flush with Card 4) */}
              <div className="flex-1 flex flex-col bg-white rounded-3xl p-6 py-8 sm:p-10 soft-card-shadow">
                <SocialLinks />
              </div>
            </div>

            {/* Right Column: Komentar Form (Top) & Komentar List (Bottom) */}
            <div className="h-full">
              <Komentar />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ContactPage;
