import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../supabase";
import {
  MessageSquare,
  Pin,
  Trash2,
  PinOff,
  Calendar,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

const PROFANITY_LIST = [
  "tolol", "kontol", "bangsat", "anjing", "anjir",
  "anying", "babi", "tai", "taik", "memek", "goblok", "goblog",
  "bodoh", "bodo", "mampus", "setan", "iblis", "bajingan", "keparat",
  "brengsek", "ngentot", "ngentod", "ngetod", "jancok", "jancuk", "asu", "celeng", "monyet",
  "kampret", "sialan", "bedebah", "sontoloyo", "gendeng", "edan", "gila",
  "sinting", "dungu", "cuk", "cok", "lonte", "pelacur", "sundal",
  "kimak", "puki", "pepek", "titit", "toket", "ngewe", "bokep", "bego", "oon",
  "kondol", "kontod",
  // Singkatan gaul kasar / umpatan
  "bgst", "bngst", "bgsd", "kntl", "kntd", "gblk", "gblg",
  "ajg", "anjg", "anjr", "anyg", "mmk", "bjgn", "bjnk",
  "tll", "tlol", "mmps", "pntk", "jnc", "janck", "asw",
  "kmprt", "brngsk", "brengsk", "bgo", "kacung", "babu",
  "fuck", "fck", "shit", "ass", "asshole", "bitch", "bastard", "damn",
  "crap", "cock", "dick", "pussy", "slut", "whore", "cunt", "piss",
  "retard", "moron", "loser", "stupid", "dumb", "idiot"
];

const PROFANITY_REGEX = new RegExp(
  PROFANITY_LIST.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i"
);
const BOT_USERNAME_REGEX = /^user_[a-z0-9]{4,}$/i;

const containsHTMLOrScript = (text) => {
  if (!text) return false;
  return /<[^>]*>|javascript:|on\w+\s*=/i.test(text);
};

const normalizeText = (raw) => {
  if (!raw) return { original: "", collapsed: "", noSeparators: "" };
  const str = raw
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/d$/g, "t")
    .replace(/d\b/g, "t");
  const collapsed = str.replace(/(.)\1+/g, (m, c) => c);
  const noSeparators = collapsed.replace(/[\s\._\-+*#@!?,]/g, "");
  return { original: raw.toLowerCase(), collapsed, noSeparators };
};

const containsProfanity = (text) => {
  if (!text) return false;
  if (containsHTMLOrScript(text)) return true;
  if (PROFANITY_REGEX.test(text)) return true;
  const { collapsed, noSeparators } = normalizeText(text);
  return PROFANITY_REGEX.test(collapsed) || PROFANITY_REGEX.test(noSeparators);
};

const isSpam = (comment) => {
  if (!comment) return false;
  const content = comment.content || "";
  const name = comment.user_name || "";
  return (
    containsProfanity(content) ||
    containsProfanity(name) ||
    BOT_USERNAME_REGEX.test(name)
  );
};

const PAGE_SIZE = 10;

const Card = ({ children, className = "" }) => (
  <div className={`relative group ${className}`}>
    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3c84f6] to-[#06b6d4] rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500 pointer-events-none" />
    <div className="relative bg-white/5 backdrop-blur-xl border border-white/12 rounded-2xl h-full">
      {children}
    </div>
  </div>
);

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // Bulk delete
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [purgeKeyword, setPurgeKeyword] = useState("");

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("portfolio_comments")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) {
        console.error("Error fetching comments:", error);
      }
      setComments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // Reset page + selection when filter/search changes
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [filter, search]);

  const pin = async (id, value) => {
    await supabase
      .from("portfolio_comments")
      .update({ is_pinned: value })
      .eq("id", id);
    fetchComments();
  };

  const remove = async (id) => {
    if (selected.size > 1 && selected.has(id)) {
      if (
        confirm(
          `Anda telah mencentang ${selected.size} komentar.\n\nKlik OK untuk menghapus SEMUA ${selected.size} komentar yang dicentang sekaligus!\nAtau klik Cancel jika hanya ingin menghapus 1 baris komentar ini saja.`
        )
      ) {
        await deleteSelected();
        return;
      }
    }
    if (!confirm("Hapus komentar ini?")) return;
    await supabase.from("portfolio_comments").delete().eq("id", id);
    setSelected((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
    fetchComments();
  };

  // Helper batch delete
  const deleteBatch = async (ids) => {
    const batchSize = 50;
    for (let i = 0; i < ids.length; i += batchSize) {
      const chunk = ids.slice(i, i + batchSize);
      await supabase.from("portfolio_comments").delete().in("id", chunk);
    }
  };

  // ── Bulk delete ──
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Hapus ${selected.size} komentar yang dipilih?`)) return;
    setBulkDeleting(true);
    await deleteBatch([...selected]);
    setSelected(new Set());
    setBulkDeleting(false);
    fetchComments();
  };

  // ── Delete all by search keyword ──
  const deleteBySearch = async () => {
    if (filtered.length === 0) return;
    const msg = search.trim()
      ? `Hapus SEMUA ${filtered.length} komentar yang cocok dengan kata kunci "${search}"?`
      : `Hapus SEMUA ${filtered.length} komentar pada filter ini?`;
    if (!confirm(msg)) return;

    setBulkDeleting(true);
    const ids = filtered.map((c) => c.id);
    await deleteBatch(ids);
    setSelected(new Set());
    setBulkDeleting(false);
    fetchComments();
  };

  // ── Auto-detected spam ──
  const spamComments = useMemo(() => comments.filter(isSpam), [comments]);
  const spamCount = spamComments.length;

  const deleteAutoDetectedSpam = async () => {
    if (spamCount === 0) return;
    if (
      !confirm(
        `Bersihkan SEMUA ${spamCount} komentar spam yang terdeteksi secara otomatis? Komentar asli/positif TIDAK akan terhapus.`
      )
    )
      return;

    setBulkDeleting(true);
    const ids = spamComments.map((c) => c.id);
    await deleteBatch(ids);
    setSelected(new Set());
    setBulkDeleting(false);
    fetchComments();
  };

  // ── Purge by custom keyword ──
  const handlePurgeKeyword = async (e) => {
    if (e) e.preventDefault();
    const word = purgeKeyword.trim();
    if (!word) return;

    const matches = comments.filter(
      (c) =>
        (c.user_name || "").toLowerCase().includes(word.toLowerCase()) ||
        (c.content || "").toLowerCase().includes(word.toLowerCase())
    );

    if (matches.length === 0) {
      alert(`Tidak ditemukan komentar dengan kata "${word}".`);
      return;
    }

    if (
      !confirm(
        `Ditemukan ${matches.length} komentar yang memuat kata "${word}".\n\nYakin ingin menghapus SEMUA komentar tersebut sekaligus?`
      )
    )
      return;

    setBulkDeleting(true);
    await deleteBatch(matches.map((c) => c.id));
    setPurgeKeyword("");
    setSelected(new Set());
    setBulkDeleting(false);
    fetchComments();
    alert(`Berhasil! ${matches.length} komentar dengan kata "${word}" telah dihapus.`);
  };

  const pinnedCount = comments.filter((c) => c.is_pinned).length;


  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter + search
  const filtered = useMemo(() => {
    let result = comments;
    if (filter === "pinned") {
      result = comments.filter((c) => c.is_pinned);
    } else if (filter === "spam") {
      result = comments.filter(isSpam);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (c) =>
          (c.user_name || "").toLowerCase().includes(q) ||
          (c.content || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [comments, filter, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3c84f6] to-[#06b6d4] rounded-xl blur opacity-50 pointer-events-none" />
            <div className="relative w-9 h-9 bg-[#030014] rounded-xl border border-white/15 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Comments
            </h1>
            <p className="text-gray-500 text-xs">
              {comments.length} total · {pinnedCount} pinned
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 flex-wrap">
          {[
            { value: "all", label: "All", count: comments.length },
            { value: "spam", label: "Spam", count: spamCount, isSpamTab: true },
            { value: "pinned", label: "Pinned", count: pinnedCount },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                filter === tab.value
                  ? tab.isSpamTab
                    ? "bg-red-500/25 border border-red-500/40 text-red-300 font-medium"
                    : "bg-gradient-to-r from-blue-500/25 to-cyan-500/20 border border-blue-500/35 text-white font-medium"
                  : tab.isSpamTab && tab.count > 0
                  ? "text-red-400 hover:text-red-300"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs ${
                  filter === tab.value
                    ? tab.isSpamTab
                      ? "bg-red-500/30 text-red-200"
                      : "bg-blue-500/25 text-blue-300"
                    : tab.isSpamTab && tab.count > 0
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/8 text-gray-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Spam & Keyword Cleaner Tool ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-purple-950/20 to-slate-900/60 border border-red-500/30 space-y-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Pembersih Spam & Kata Negatif Sekaligus
                {spamCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-semibold">
                    {spamCount} spam ditemukan
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-400">
                Hapus semua komentar spam otomatis atau masukkan kata tertentu (misal: TOLOL, user_, kontol). Komentar asli/positif tetap aman!
              </p>
            </div>
          </div>

          {spamCount > 0 && (
            <button
              onClick={deleteAutoDetectedSpam}
              disabled={bulkDeleting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all disabled:opacity-50 ml-auto shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              {bulkDeleting ? "Membersihkan..." : `Hapus Semua Spam Otomatis (${spamCount})`}
            </button>
          )}
        </div>

        {/* Input Hapus Berdasarkan Kata Kunci Langsung */}
        <form onSubmit={handlePurgeKeyword} className="flex items-center gap-2 flex-wrap sm:flex-nowrap pt-1">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={purgeKeyword}
              onChange={(e) => setPurgeKeyword(e.target.value)}
              placeholder="Ketik kata negatif yang ingin dibasmi (contoh: TOLOL atau user_)..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={bulkDeleting || !purgeKeyword.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Hapus Semua Komentar Dengan Kata Ini</span>
          </button>
        </form>
      </div>


      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: comments.length, color: "text-blue-400" },
          {
            label: "Spam Terdeteksi",
            value: spamCount,
            color: spamCount > 0 ? "text-red-400" : "text-gray-400",
          },
          { label: "Pinned", value: pinnedCount, color: "text-cyan-400" },
          {
            label: "Bersih / Asli",
            value: Math.max(0, comments.length - spamCount),
            color: "text-emerald-400",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="p-3 sm:p-4">
              <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kata kunci spam (misal: TOLOL, user_, kontol)..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-gray-200 placeholder-gray-600 text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Result count & Direct Delete by Keyword */}
      {search && (
        <div className="flex items-center justify-between gap-3 -mt-3 flex-wrap">
          <p className="text-xs text-gray-400">
            Ditemukan <span className="text-white font-medium">{filtered.length}</span> komentar untuk kata kunci "<span className="text-blue-400">{search}</span>"
          </p>
          {filtered.length > 0 && (
            <button
              onClick={deleteBySearch}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:text-red-200 text-xs font-medium transition-all ml-auto disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {bulkDeleting
                ? "Menghapus..."
                : `Hapus Semua Hasil Cari "${search}" (${filtered.length})`}
            </button>
          )}
        </div>
      )}

      {/* ── Bulk action toolbar ── */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-400 hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 accent-blue-500 cursor-pointer"
            />
            {selected.size > 0
              ? `${selected.size} dipilih`
              : "Pilih semua"}
          </label>

          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25 hover:text-red-300 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {bulkDeleting ? "Menghapus..." : `Hapus ${selected.size} Komentar`}
            </button>
          )}
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : paginated.length === 0 ? (
        <Card>
          <div className="p-14 text-center">
            <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {search
                ? "No comments match your search."
                : filter === "pinned"
                  ? "No pinned comments."
                  : "No comments yet."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {paginated.map((comment) => (

            <div key={comment.id} className="relative group">
              {comment.is_pinned && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3c84f6] to-[#06b6d4] rounded-2xl blur opacity-15 pointer-events-none" />
              )}
              <div
                className={`relative bg-white/5 backdrop-blur-xl border rounded-2xl px-4 py-4 sm:px-5 transition-all duration-200 ${
                  selected.has(comment.id)
                    ? "border-red-500/40 bg-red-500/5"
                    : comment.is_pinned
                    ? "border-blue-500/30"
                    : "border-white/10 hover:border-white/18"
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selected.has(comment.id)}
                    onChange={() => toggleSelect(comment.id)}
                    className="mt-1 w-4 h-4 accent-red-500 cursor-pointer shrink-0"
                  />

                  {/* Avatar */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shrink-0">
                    <img
                      src={comment.profile_image || "/default-avatar.jpg"}
                      alt="Avatar"
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-white">
                        {/* Highlight search match in name */}
                        {highlightMatch(
                          comment.user_name || "Anonymous",
                          search,
                        )}
                      </span>
                      {comment.is_pinned && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-300 text-xs">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-gray-600 text-xs ml-auto shrink-0">
                        <Calendar className="w-3 h-3" />
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {/* Highlight search match in content */}
                      {highlightMatch(comment.content || "", search)}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => pin(comment.id, !comment.is_pinned)}
                      title={comment.is_pinned ? "Unpin" : "Pin"}
                      className={`p-2 rounded-lg border transition-all duration-200 ${
                        comment.is_pinned
                          ? "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                          : "border-white/10 text-gray-500 hover:text-blue-400 hover:border-blue-500/25"
                      }`}
                    >
                      {comment.is_pinned ? (
                        <PinOff className="w-3.5 h-3.5" />
                      ) : (
                        <Pin className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => remove(comment.id)}
                      className="p-2 rounded-lg border border-white/10 text-gray-500 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-gray-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
              )
              .reduce((acc, p, i, arr) => {
                if (i > 0 && arr[i - 1] !== p - 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span
                    key={`dots-${i}`}
                    className="px-2 text-gray-600 text-xs"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-xs border transition-all duration-200 ${
                      page === p
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-300 font-medium"
                        : "border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom Bar when items are selected */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#0b1120]/95 backdrop-blur-xl border border-red-500/40 shadow-2xl shadow-red-500/25 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500 text-white text-xs font-bold">
              {selected.size}
            </span>
            Komentar Dipilih
          </span>
          <div className="h-4 w-px bg-white/20" />
          <button
            onClick={deleteSelected}
            disabled={bulkDeleting}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-red-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {bulkDeleting
                ? "Menghapus..."
                : `Hapus Semua (${selected.size}) Sekaligus`}
            </span>
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-2.5 sm:px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 text-xs font-medium transition-all"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
}

// Highlight matching text
function highlightMatch(text, query) {
  if (!query.trim()) return text;
  const regex = new RegExp(
    `(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-blue-500/30 text-blue-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
