import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import { Plus, Trash2, Camera, X } from "lucide-react";

export default function GalleryPhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

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
        console.warn("Supabase error or table missing:", error);
      } else if (data) {
        setPhotos(data);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setSaving(true);
    try {
      // 1. Upload ke Storage Supabase
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;

      // 2. Dapatkan Public URL
      const { data: urlData } = supabase.storage
        .from("project-images")
        .getPublicUrl(fileName);
        
      const imageUrl = urlData.publicUrl;

      // 3. Simpan URL ke tabel gallery_photos
      const { error: dbError } = await supabase
        .from("gallery_photos")
        .insert([{ image_url: imageUrl }]);

      if (dbError) throw dbError;
      
      await fetchPhotos();
      setShowModal(false);
      setFile(null);
      setPreview(null);
    } catch (error) {
      console.error("Error adding photo:", error);
      alert(`Gagal menambahkan foto: ${error.message || "Unknown error"}. Pastikan tabel dan bucket sudah disetting.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (photo) => {
    if (!window.confirm("Yakin ingin menghapus foto ini?")) return;

    try {
      let query = supabase.from("gallery_photos").delete();
      if (photo.id) {
        query = query.eq("id", photo.id);
      } else if (photo.image_url) {
        query = query.eq("image_url", photo.image_url);
      } else if (photo.created_at) {
        query = query.eq("created_at", photo.created_at);
      }

      const { error } = await query;
      if (error) throw error;
      await fetchPhotos();
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert(`Gagal menghapus foto: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="relative z-50 space-y-6 w-full h-full min-h-[500px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Camera className="w-6 h-6 text-blue-400" />
            Gallery Photos
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Kelola foto-foto untuk Coverflow Carousel di halaman utama.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Photo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-50">
        {loading ? (
          <p className="text-gray-400 col-span-full">Loading photos...</p>
        ) : photos.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white/5 border border-white/10 rounded-2xl">
            <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">Belum ada foto. Tambahkan foto pertama Anda!</p>
            <p className="text-gray-500 text-sm mt-2">Pastikan tabel 'gallery_photos' sudah ada di Supabase.</p>
          </div>
        ) : (
          photos.map((photo, index) => (
            <div key={photo.id || photo.image_url || index} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3c84f6] to-[#06b6d4] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/12 rounded-2xl h-full">
                <div className="p-4 flex flex-col h-full">
                  <div className="w-full aspect-[4/3] rounded-xl mb-4 border border-white/8 overflow-hidden bg-white/5 relative">
                    <img
                      src={photo.image_url}
                      alt="Gallery Photo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Error+Loading+Image';
                      }}
                    />
                  </div>
                  <div className="flex justify-end items-center pt-2 mt-auto">
                    <button
                      onClick={() => handleDelete(photo)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-lg bg-[#0a0a1a] border border-white/10 rounded-2xl shadow-2xl p-6">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Add New Photo</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-blue-300/70 uppercase tracking-wider font-medium">
                  Upload Photo
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full bg-[#0d0d22] border border-white/10 border-dashed rounded-xl px-4 py-8 text-center transition-all group-hover:border-blue-500/50 group-hover:bg-blue-500/5 flex flex-col items-center justify-center gap-2">
                    <Camera className="w-8 h-8 text-gray-500 group-hover:text-blue-400 transition-colors" />
                    <p className="text-sm text-gray-400 group-hover:text-blue-300">
                      {file ? file.name : "Klik atau seret file gambar ke sini"}
                    </p>
                  </div>
                </div>
              </div>

              {preview && (
                <div className="mt-4 rounded-xl border border-white/10 overflow-hidden bg-white/5 aspect-[4/3] relative">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFile(null);
                    setPreview(null);
                  }}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-sm font-medium border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm font-medium disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Photo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
