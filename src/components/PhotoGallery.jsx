import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import PerspectiveTunnelHero from "./ui/perspective-tunnel-hero";

const PhotoGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") {
          console.log("Please create 'gallery_photos' table in Supabase.");
        } else {
          console.error("Error fetching photos:", error);
        }
      } else if (data) {
        const slides = data.map((photo) => ({
          id: photo.id,
          src: photo.image_url,
          title: photo.title || "",
        }));
        setPhotos(slides);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  return <PerspectiveTunnelHero images={photos} loading={loading} id="Gallery" />;
};

export default PhotoGallery;
