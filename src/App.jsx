import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useState, lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import AOS from 'aos';
import 'aos/dist/aos.css';
import "./index.css";
import Navbar from "./components/Navbar";
import AnimatedBackground from "./components/Background";
import { AnimatePresence } from "framer-motion";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

const importHome = () => import("./Pages/Home");
const importAbout = () => import("./Pages/About");
const importPortofolio = () => import("./Pages/Portofolio");
const importPhotoGallery = () => import("./components/PhotoGallery");
const importContact = () => import("./Pages/Contact");

const Home = lazy(importHome);
const About = lazy(importAbout);
const Portofolio = lazy(importPortofolio);
const PhotoGallery = lazy(importPhotoGallery);
const ContactPage = lazy(importContact);
const ProjectDetails = lazy(() => import("./components/ProjectDetail"));
const WelcomeScreen = lazy(() => import("./Pages/WelcomeScreen"));
const NotFoundPage = lazy(() => import("./Pages/404"));
const Login = lazy(() => import("./Pages/Login"));
const Dashboard = lazy(() => import("./Pages/Dashboard"));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Portfolio caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="h-20" />}>
        <Home />
        <About />
        <ErrorBoundary>
          <Portofolio>
            {/* Galeri dibiarkan tembus klik (pointer-events-none diatur di Portofolio.jsx) */}
            <PhotoGallery />
            {/* FIX: Contact & Footer diaktifkan kembali supaya form dan link tetap bisa diklik */}
            <div className="pointer-events-auto">
              <ContactPage />
              <Footer light />
            </div>
          </Portofolio>
        </ErrorBoundary>
      </Suspense>
    </>
  );
};

const ProjectPageLayout = () => (
  <>
    <Suspense fallback={<div className="min-h-screen" />}>
      <ProjectDetails />
    </Suspense>
    <Footer />
  </>
);

function App() {
  // Inisialisasi AOS sekali di sini
  useEffect(() => {
    AOS.init({ once: true, offset: 10, duration: 800, mirror: false });
    
    // Preload halaman di background
    importHome();
    importAbout();
    importPortofolio();
    importPhotoGallery();
    importContact();
  }, []);

  return (
    <HelmetProvider>
      <div className="pointer-events-none">
        <AnimatedBackground />
      </div>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<LandingPage />} />

          <Route path="/project/:slug" element={<ProjectPageLayout />} />

          {/* AUTH */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<div className="min-h-screen bg-[#030712]" />}>
                <Login />
              </Suspense>
            }
          />

          {/* ADMIN (PROTECTED) */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Suspense fallback={<div className="min-h-screen bg-[#030712]" />}>
                  <Dashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <Suspense fallback={null}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;