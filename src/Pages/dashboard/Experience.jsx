import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import {
  Plus,
  Trash2,
  Upload,
  Briefcase,
  X,
  ImageIcon,
  Pencil,
  ArrowUp,
  ArrowDown,
  GripVertical,
  LayoutGrid,
  List,
  Check,
  Loader2,
  Info,
} from "lucide-react";
import { Reorder, motion } from "framer-motion";

const Card = ({ children, className = "" }) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3c84f6] to-[#06b6d4] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-500" />
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/12 rounded-2xl h-full">
      {children}
    </div>
  </div>
);

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) => (
  <div className="space-y-1.5">
    <label className="text-xs text-blue-300/70 uppercase tracking-wider font-medium">
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full bg-[#0d0d22] border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-600 text-sm outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all"
    />
  </div>
);

const SkeletonCard = () => (
  <div className="relative">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3c84f6] to-[#06b6d4] rounded-2xl blur opacity-10" />
    <div className="relative bg-white/5 border border-white/12 rounded-2xl p-4 flex flex-col gap-3">
      <div className="w-12 h-12 bg-white/5 animate-pulse rounded-xl" />
      <div className="h-4 bg-white/5 animate-pulse rounded-lg w-2/3" />
      <div className="h-3 bg-white/5 animate-pulse rounded-lg w-full" />
      <div className="h-3 bg-white/5 animate-pulse rounded-lg w-4/5" />
      <div className="flex justify-between items-center pt-2 border-t border-white/8 mt-auto">
        <div className="flex gap-2">
          <div className="w-7 h-7 bg-white/5 animate-pulse rounded-lg" />
          <div className="w-7 h-7 bg-white/5 animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  </div>
);

const PriorityBadge = ({ index }) => {
  if (index === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
        ⭐ Prioritas #1
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
      #{index + 1}
    </span>
  );
};

// Grid Item Card
const ExperienceCard = ({
  experience,
  index,
  total,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Card>
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            {experience.logo ? (
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/20 relative">
                {!imgLoaded && (
                  <div className="w-full h-full animate-pulse bg-white/5 absolute inset-0" />
                )}
                <img
                  src={experience.logo}
                  alt={experience.company}
                  onLoad={() => setImgLoaded(true)}
                  className={`w-full h-full object-contain p-1 transition-opacity duration-300 ${
                    imgLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/20">
                <Briefcase className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-white text-sm mb-0.5 line-clamp-1">
                {experience.company}
              </h3>
              <p className="text-gray-400 text-xs line-clamp-1">
                {experience.role}
              </p>
              <p className="text-blue-400 text-xs font-medium mt-0.5">
                {experience.year}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <PriorityBadge index={index} />
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-white/8 mt-auto">
          {/* Reorder Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Pindah Prioritas Lebih Tinggi (Naik)"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Pindah Prioritas Lebih Rendah (Turun)"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(experience)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(experience.id)}
              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Row List Item (Ideal for Reordering and Drag & Drop)
const ExperienceRowItem = ({
  experience,
  index,
  total,
  onDelete,
  onEdit,
  onMoveUp,
  onMoveDown,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Reorder.Item
      value={experience}
      id={experience.id}
      className="list-none select-none"
    >
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3c84f6] to-[#06b6d4] rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-300" />
        <div className="relative bg-[#0d0d22]/80 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all">
          {/* Left: Drag Handle, Badge, Logo, Details */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Drag Handle */}
            <div
              className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 p-1 -ml-1 shrink-0 touch-none"
              title="Seret untuk mengubah urutan prioritas"
            >
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Priority Badge */}
            <div className="shrink-0 w-24">
              <PriorityBadge index={index} />
            </div>

            {/* Logo */}
            {experience.logo ? (
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center shrink-0 overflow-hidden relative">
                {!imgLoaded && (
                  <div className="w-full h-full animate-pulse bg-white/5 absolute inset-0" />
                )}
                <img
                  src={experience.logo}
                  alt={experience.company}
                  onLoad={() => setImgLoaded(true)}
                  className={`w-full h-full object-contain p-1 transition-opacity duration-300 ${
                    imgLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-gray-400" />
              </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                {experience.company}
              </h3>
              <p className="text-gray-400 text-xs truncate">
                {experience.role}
              </p>
              <p className="text-blue-400 text-xs font-medium sm:hidden mt-0.5">
                {experience.year}
              </p>
            </div>
          </div>

          {/* Right: Year, Order Arrows, Edit, Delete */}
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/8 shrink-0">
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
              {experience.year}
            </span>

            {/* Reorder Buttons */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={onMoveUp}
                disabled={index === 0}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                title="Naikkan Urutan (Prioritas Lebih Tinggi)"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={onMoveDown}
                disabled={index === total - 1}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                title="Turunkan Urutan (Prioritas Lebih Rendah)"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            {/* Edit / Delete */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onEdit(experience)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 transition-colors"
                title="Edit Pengalaman"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(experience.id)}
                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors"
                title="Hapus Pengalaman"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    />
    <div
      className="relative z-10 w-full max-w-2xl flex flex-col"
      style={{ maxHeight: "calc(100vh - 24px)" }}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3c84f6] to-[#06b6d4] rounded-2xl blur opacity-20 pointer-events-none" />
      <div className="relative bg-[#0a0a1a] border border-white/12 rounded-2xl flex flex-col overflow-hidden">
        {/* Fixed header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  </div>
);

const ExperienceForm = ({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save Experience",
  uploading,
  isCreating = false,
}) => {
  const [form, setForm] = useState({
    company: initial?.company || "",
    role: initial?.role || "",
    year: initial?.year || "",
    positionPreference: "top", // "top" or "bottom" for new items
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial?.logo || null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form, file);
      }}
      className="p-5 sm:p-6 space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <InputField
            label="Company / School Name"
            value={form.company}
            onChange={set("company")}
            placeholder="e.g. Nama Perusahaan / Organisasi"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <InputField
            label="Role / Position"
            value={form.role}
            onChange={set("role")}
            placeholder="e.g. Teaching Assistant"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <InputField
            label="Year / Duration"
            value={form.year}
            onChange={set("year")}
            placeholder="e.g. 2025 - Present"
            required
          />
        </div>

        {isCreating && (
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs text-blue-300/70 uppercase tracking-wider font-medium">
              Posisi Prioritas Awal
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  form.positionPreference === "top"
                    ? "bg-blue-500/15 border-blue-500/50 text-white"
                    : "bg-[#0d0d22] border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="positionPreference"
                  value="top"
                  checked={form.positionPreference === "top"}
                  onChange={() =>
                    setForm((f) => ({ ...f, positionPreference: "top" }))
                  }
                  className="hidden"
                />
                <span className="text-sm font-medium">⭐ Paling Atas (#1)</span>
              </label>

              <label
                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                  form.positionPreference === "bottom"
                    ? "bg-blue-500/15 border-blue-500/50 text-white"
                    : "bg-[#0d0d22] border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="positionPreference"
                  value="bottom"
                  checked={form.positionPreference === "bottom"}
                  onChange={() =>
                    setForm((f) => ({ ...f, positionPreference: "bottom" }))
                  }
                  className="hidden"
                />
                <span className="text-sm font-medium">⬇️ Paling Bawah</span>
              </label>
            </div>
          </div>
        )}

        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs text-blue-300/70 uppercase tracking-wider font-medium">
            Logo Image
          </label>
          <label className="flex items-center gap-4 w-full bg-[#0d0d22] border border-dashed border-white/15 rounded-xl px-4 py-4 cursor-pointer hover:border-blue-500/40 hover:bg-white/4 transition-all">
            {preview ? (
              <img
                src={preview}
                className="h-16 w-16 object-contain rounded-lg border border-white/10 bg-white/5 p-1"
                alt="preview"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                <ImageIcon className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-300">
                {preview ? "Change image" : "Click to upload image"}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                Gunakan gambar rasio 1:1 (persegi, misal 500x500px) agar rapi
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
        <button type="submit" disabled={uploading} className="relative group/s">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2c67ed] to-[#0891b2] rounded-xl opacity-60 blur group-hover/s:opacity-100 transition duration-300" />
          <div className="relative flex items-center gap-2 px-5 py-2 bg-[#030014] rounded-xl border border-white/10">
            {uploading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-sm text-gray-200">
              {uploading ? "Saving..." : submitLabel}
            </span>
          </div>
        </button>
      </div>
    </form>
  );
};

export default function Experience() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editExperience, setEditExperience] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Layout mode: 'list' (great for ordering & drag) or 'grid' (classic cards)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("experience_view_mode") || "list";
  });

  // Reorder sync state
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);

  const setAndSaveViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("experience_view_mode", mode);
  };

  const fetchExperiences = async () => {
    setLoading(true);
    // Try order_index first
    let { data, error } = await supabase
      .from("experiences")
      .select("*")
      .order("order_index", { ascending: true, nullsFirst: false });

    // Fallback if order_index column doesn't exist yet
    if (error || !data) {
      const fallback = await supabase
        .from("experiences")
        .select("*")
        .order("created_at", { ascending: false });
      data = fallback.data || [];
    }

    setExperiences(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  // Save new order to Supabase
  const saveOrderToDatabase = async (orderedList) => {
    if (!orderedList || orderedList.length === 0) return;
    setSavingOrder(true);
    setOrderSaved(false);

    try {
      // Test if column order_index exists
      const test = await supabase
        .from("experiences")
        .update({ order_index: 1 })
        .eq("id", orderedList[0].id);

      const hasOrderIndex = !test.error;

      const baseTime = Date.now();
      const updates = orderedList.map((item, index) => {
        // Staggered timestamp: Priority #1 (index 0) is most recent, lower priorities are older
        const newTimestamp = new Date(baseTime - index * 60000).toISOString();
        const payload = {
          created_at: newTimestamp,
        };
        if (hasOrderIndex) {
          payload.order_index = index + 1;
        }
        return supabase
          .from("experiences")
          .update(payload)
          .eq("id", item.id);
      });

      await Promise.all(updates);

      setOrderSaved(true);
      setTimeout(() => setOrderSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save experience order:", err);
    } finally {
      setSavingOrder(false);
    }
  };

  // Move item up / down by 1 step
  const moveItem = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= experiences.length) return;

    const updated = [...experiences];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setExperiences(updated);
    saveOrderToDatabase(updated);
  };

  // Drag and drop reorder handler
  const handleReorder = (newOrder) => {
    setExperiences(newOrder);
    saveOrderToDatabase(newOrder);
  };

  const uploadImage = async (f) => {
    const fileName = `exp-${Date.now()}-${f.name}`;
    await supabase.storage.from("project-images").upload(fileName, f);
    const { data } = supabase.storage
      .from("project-images")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCreate = async (form, file) => {
    setUploading(true);
    let imgUrl = "";
    if (file) imgUrl = await uploadImage(file);

    // If placed at top, set created_at newer than current top item
    const isTop = form.positionPreference === "top";
    let newTimestamp = new Date().toISOString();
    if (isTop && experiences.length > 0) {
      const topDate = new Date(experiences[0].created_at || Date.now());
      newTimestamp = new Date(topDate.getTime() + 60000).toISOString();
    } else if (!isTop && experiences.length > 0) {
      const lastDate = new Date(
        experiences[experiences.length - 1].created_at || Date.now()
      );
      newTimestamp = new Date(lastDate.getTime() - 60000).toISOString();
    }

    const { data: inserted, error } = await supabase
      .from("experiences")
      .insert({
        company: form.company,
        role: form.role,
        year: form.year,
        logo: imgUrl,
        created_at: newTimestamp,
      })
      .select();

    setShowCreate(false);
    setUploading(false);

    if (inserted && inserted[0]) {
      const updatedList = isTop
        ? [inserted[0], ...experiences]
        : [...experiences, inserted[0]];
      setExperiences(updatedList);
      saveOrderToDatabase(updatedList);
    } else {
      fetchExperiences();
    }
  };

  const handleEdit = async (form, file) => {
    setUploading(true);
    let imgUrl = editExperience.logo || "";
    if (file) imgUrl = await uploadImage(file);
    await supabase
      .from("experiences")
      .update({
        company: form.company,
        role: form.role,
        year: form.year,
        logo: imgUrl,
      })
      .eq("id", editExperience.id);
    setEditExperience(null);
    setUploading(false);
    fetchExperiences();
  };

  const deleteExperience = async (id) => {
    if (!confirm("Hapus pengalaman ini?")) return;
    const remaining = experiences.filter((exp) => exp.id !== id);
    setExperiences(remaining);
    await supabase.from("experiences").delete().eq("id", id);
    saveOrderToDatabase(remaining);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3c84f6] to-[#06b6d4] rounded-xl blur opacity-50" />
            <div className="relative w-9 h-9 bg-[#030014] rounded-xl border border-white/15 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Experience
              </h1>
              {/* Order Status Indicator */}
              {savingOrder && (
                <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan
                  urutan...
                </span>
              )}
              {orderSaved && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <Check className="w-3 h-3" /> Urutan tersimpan
                </span>
              )}
            </div>
            <p className="text-gray-400 text-xs mt-0.5">
              {loading
                ? "Memuat..."
                : `${experiences.length} pengalaman total • Seret atau gunakan panah untuk mengatur prioritas`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setAndSaveViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Tampilan Daftar Prioritas (Mudah diatur)"
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar Prioritas</span>
            </button>
            <button
              onClick={() => setAndSaveViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Tampilan Grid Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>

          {/* New Experience Button */}
          <button
            onClick={() => setShowCreate(true)}
            className="relative group shrink-0"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2c67ed] to-[#0891b2] rounded-xl opacity-50 blur group-hover:opacity-80 transition duration-300" />
            <div className="relative flex items-center gap-2 px-4 py-2 bg-[#030014] rounded-xl border border-white/10">
              <Plus className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-200">New Experience</span>
            </div>
          </button>
        </div>
      </div>

      {/* Info helper banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200/80">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p>
          Urutan di halaman ini menentukan urutan yang tampil pada halaman
          portofolio kamu. Posisi <strong>#1</strong> adalah yang paling atas /
          prioritas utama. Kamu bisa langsung menggeser dengan tombol{" "}
          <strong>panah (▲ / ▼)</strong> atau <strong>drag & drop</strong> icon
          titik di sebelah kiri.
        </p>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal
          title="Add New Experience"
          onClose={() => setShowCreate(false)}
        >
          <ExperienceForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            submitLabel="Save Experience"
            uploading={uploading}
            isCreating={true}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {editExperience && (
        <Modal
          title="Edit Experience"
          onClose={() => setEditExperience(null)}
        >
          <ExperienceForm
            initial={editExperience}
            onSubmit={handleEdit}
            onCancel={() => setEditExperience(null)}
            submitLabel="Update Experience"
            uploading={uploading}
            isCreating={false}
          />
        </Modal>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : experiences.length === 0 ? (
        <Card>
          <div className="p-16 text-center">
            <Briefcase className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              No experience yet. Add your first one!
            </p>
          </div>
        </Card>
      ) : viewMode === "list" ? (
        /* List Mode: Drag & Drop + Direct Up/Down Controls */
        <Reorder.Group
          axis="y"
          values={experiences}
          onReorder={handleReorder}
          className="space-y-3"
        >
          {experiences.map((exp, index) => (
            <ExperienceRowItem
              key={exp.id}
              experience={exp}
              index={index}
              total={experiences.length}
              onDelete={deleteExperience}
              onEdit={setEditExperience}
              onMoveUp={() => moveItem(index, -1)}
              onMoveDown={() => moveItem(index, 1)}
            />
          ))}
        </Reorder.Group>
      ) : (
        /* Grid Mode: 3-column card view with priority badges and move controls */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {experiences.map((exp, index) => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              index={index}
              total={experiences.length}
              onDelete={deleteExperience}
              onEdit={setEditExperience}
              onMoveUp={() => moveItem(index, -1)}
              onMoveDown={() => moveItem(index, 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
