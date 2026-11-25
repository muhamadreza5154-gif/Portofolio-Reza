import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { MessageCircle, UserCircle2, Loader2, AlertCircle, Send, ImagePlus, X, Pin, ShieldAlert } from 'lucide-react';
import { supabase } from '../supabase';

// ─────────────────────────────────────────────
//  PROFANITY LIST — Indonesia + English
// ─────────────────────────────────────────────
const PROFANITY_LIST = [
  // Indonesia — kasar/umpatan
  'tolol', 'kontol', 'bangsat', 'anjing', 'anjir',
  'anying', 'babi', 'tai', 'taik', 'memek', 'goblok', 'goblog',
  'bodoh', 'bodo', 'mampus', 'setan', 'iblis', 'bajingan', 'keparat',
  'brengsek', 'ngentot', 'ngentod', 'ngetod', 'jancok', 'jancuk', 'asu', 'celeng', 'monyet',
  'kampret', 'sialan', 'bedebah', 'sontoloyo', 'gendeng',
  'edan', 'gila', 'sinting', 'dungu', 'berengsek', 'bajing',
  'cuk', 'cok', 'lonte', 'pelacur', 'sundal', 'lacur', 'kimak', 'puki',
  'pepek', 'titit', 'toket', 'ngewe', 'bokep', 'bego', 'oon', 'anj', 'jembod',
  'kondol', 'kontod',
  // Singkatan gaul kasar / umpatan (tanpa vokal)
  'bgst', 'bngst', 'bgsd', 'kntl', 'kntd', 'gblk', 'gblg',
  'ajg', 'anjg', 'anjr', 'anyg', 'mmk', 'bjgn', 'bjnk',
  'tll', 'tlol', 'mmps', 'pntk', 'jnc', 'janck', 'asw',
  'kmprt', 'brngsk', 'brengsk', 'bgo', 'kacung', 'babu',
  // Indonesia — negatif/menghina
  'jelek', 'buruk', 'payah', 'parah', 'gagal', 'pecundang', 'pengecut',
  'penghianat', 'sampah', 'najis', 'kotor', 'busuk', 'menjijikkan',
  'memalukan', 'hina', 'rendah', 'murahan', 'norak', 'kampungan',
  'ndeso', 'culun', 'alay', 'lebay', 'sotoy', 'sombong', 'congkak',
  'serakah', 'rakus', 'pemalas', 'pengemis', 'gelandangan',
  'kurang waras', 'stres', 'plonga plongo',
  // English — profanity / insults
  'fuck', 'fck', 'shit', 'ass', 'asshole', 'bitch',
  'bastard', 'damn', 'crap', 'cock', 'dick', 'pussy', 'slut', 'whore',
  'nigga', 'nigger', 'cunt', 'piss', 'retard', 'moron', 'loser', 'stupid',
  'dumb', 'idiot', 'ugly', 'trash', 'garbage', 'kill', 'die',
  'kys', 'stfu', 'jerk', 'freak', 'scum', 'filthy',
  'disgusting', 'pathetic', 'worthless', 'useless', 'brainless', 'fool',
];

const PROFANITY_REGEX = new RegExp(
  PROFANITY_LIST.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i'
);

// Bot-username pattern e.g. user_g7zyp5dd
const BOT_USERNAME_REGEX = /^user_[a-z0-9]{4,}$/i;

const RATE_LIMIT_SECONDS = 120;
const LS_KEY = 'comment_last_submit';

// ─────────────────────────────────────────────
//  Anti HTML / Script Injection (<marquee>, <script>, javascript:)
// ─────────────────────────────────────────────
const containsHTMLOrScript = (text) => {
  if (!text) return false;
  return /<[^>]*>|javascript:|on\w+\s*=/i.test(text);
};

// ─────────────────────────────────────────────
//  Smart Normalizer — Anti Bypass
//  Menangani: huruf berulang, leetspeak, spasi/titik, substitusi konsonan
// ─────────────────────────────────────────────
const normalizeText = (raw) => {
  if (!raw) return { original: '', collapsed: '', noSeparators: '' };
  let str = raw.toLowerCase()
    // Leetspeak angka/simbol → huruf
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    // Substitusi konsonan umum (d ↔ t di akhir kata/suku kata)
    .replace(/d$/g, 't')
    .replace(/d\b/g, 't');
  const collapsed = str.replace(/(.)\1+/g, (m, c) => c);
  const noSeparators = collapsed.replace(/[\s\._\-+*#@!?,]/g, '');
  return { original: raw.toLowerCase(), collapsed, noSeparators };
};

const containsProfanity = (text) => {
  if (!text) return false;
  if (containsHTMLOrScript(text)) return true;
  // Cek langsung
  if (PROFANITY_REGEX.test(text)) return true;
  // Cek setelah normalisasi pintar
  const { collapsed, noSeparators } = normalizeText(text);
  return PROFANITY_REGEX.test(collapsed) || PROFANITY_REGEX.test(noSeparators);
};

const getRemainingCooldown = () => {
  const last = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
  if (!last) return 0;
  const elapsed = Math.floor((Date.now() - last) / 1000);
  return Math.max(0, RATE_LIMIT_SECONDS - elapsed);
};

const setLastSubmit = () => localStorage.setItem(LS_KEY, Date.now().toString());


// Flat editorial list item inside the Komentar card (avoids "Nested Cards" anti-pattern)
const Comment = memo(({ comment, formatDate, isPinned = false }) => (
    <div className="py-3.5 border-b border-zinc-200/80 last:border-b-0">
        {isPinned && (
            <div className="flex items-center gap-1.5 mb-2 text-[#2c67ed]">
                <Pin className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Pinned comment</span>
            </div>
        )}
        <div className="flex items-start gap-3">
            {comment.profile_image ? (
                <img
                    src={comment.profile_image}
                    alt={`${comment.user_name}'s profile`}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-zinc-100"
                    loading="lazy"
                />
            ) : (
                <div className={`p-2 rounded-full flex-shrink-0 ${
                    isPinned ? 'bg-blue-50 text-[#2c67ed]' : 'bg-zinc-100 text-zinc-600'
                }`}>
                    <UserCircle2 className="w-5 h-5" />
                </div>
            )}
            <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                        <h4 className={`font-semibold truncate text-sm ${
                            isPinned ? 'text-[#1d4ed8]' : 'text-zinc-900'
                        }`}>
                            {comment.user_name}
                        </h4>
                        {isPinned && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-[#2c67ed] rounded-full">
                                Admin
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-zinc-600 whitespace-nowrap">
                        {formatDate(comment.created_at)}
                    </span>
                </div>
                <p className="text-zinc-700 text-sm break-words leading-relaxed max-w-prose">
                    {comment.content}
                </p>
            </div>
        </div>
    </div>
));

const CommentForm = memo(({ onSubmit, isSubmitting, error }) => {
    const [newComment, setNewComment]     = useState('');
    const [userName, setUserName]         = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile]       = useState(null);
    const [formError, setFormError]       = useState('');
    const [cooldown, setCooldown]         = useState(0);
    // Honeypot — must stay empty (only bots fill this)
    const [honeypot, setHoneypot]         = useState('');

    const textareaRef  = useRef(null);
    const fileInputRef = useRef(null);

    // Init cooldown from localStorage on mount
    useEffect(() => {
        const remaining = getRemainingCooldown();
        if (remaining > 0) setCooldown(remaining);
    }, []);

    // Countdown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown(prev => {
                if (prev <= 1) { clearInterval(timer); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleImageChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB. Please choose a smaller image.');
                if (e.target) e.target.value = '';
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file.');
                if (e.target) e.target.value = '';
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    }, []);

    const handleTextareaChange = useCallback((e) => {
        setNewComment(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, []);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        setFormError('');

        // ── Honeypot: silently reject bots ──
        if (honeypot.trim() !== '') return;

        // ── Rate limit ──
        const remaining = getRemainingCooldown();
        if (remaining > 0) {
            setCooldown(remaining);
            setFormError(`Tunggu ${remaining} detik sebelum komentar lagi.`);
            return;
        }

        const trimmedName    = userName.trim();
        const trimmedComment = newComment.trim();
        if (!trimmedComment || !trimmedName) return;

        // ── Username validation ──
        if (trimmedName.length < 2) {
            setFormError('Nama minimal 2 karakter.');
            return;
        }
        if (BOT_USERNAME_REGEX.test(trimmedName)) {
            setFormError('Nama tidak valid. Gunakan nama asli kamu.');
            return;
        }
        if (containsProfanity(trimmedName)) {
            setFormError('Nama mengandung kata yang tidak pantas.');
            return;
        }

        // ── Profanity filter ──
        if (containsProfanity(trimmedComment)) {
            setFormError('Komentar mengandung kata yang tidak pantas. Harap gunakan kata yang positif !!!!.');
            return;
        }

        // ── All good — submit ──
        setLastSubmit();
        setCooldown(RATE_LIMIT_SECONDS);
        onSubmit({ newComment: trimmedComment, userName: trimmedName, imageFile });
        setNewComment('');
        setUserName('');
        setImagePreview(null);
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }, [newComment, userName, imageFile, honeypot, onSubmit]);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── Honeypot field (invisible to real users, bots fill it) ── */}
            <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex="-1"
                autoComplete="off"
                aria-hidden="true"
                style={{ display: 'none' }}
            />

            <div className="space-y-2">
                <label className="block text-sm font-semibold text-zinc-800">
                    Nama
                </label>
                <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    maxLength={30}
                    placeholder="Masukkan nama kamu"
                    className="w-full p-3.5 rounded-xl bg-zinc-100/80 border border-transparent text-zinc-900 placeholder-zinc-500 focus:outline-none focus:bg-white focus:border-[#2c67ed] focus:ring-2 focus:ring-[#2c67ed]/20 transition-colors duration-200"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-semibold text-zinc-800">
                    Komentar
                </label>
                <textarea
                    ref={textareaRef}
                    value={newComment}
                    maxLength={200}
                    onChange={handleTextareaChange}
                    placeholder="Tulis komentar kamu di sini..."
                    className="w-full p-4 rounded-xl bg-zinc-100/80 border border-transparent text-zinc-900 placeholder-zinc-500 focus:outline-none focus:bg-white focus:border-[#2c67ed] focus:ring-2 focus:ring-[#2c67ed]/20 transition-colors duration-200 resize-none min-h-[120px]"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-semibold text-zinc-800">
                    Foto Profil <span className="text-zinc-600 font-normal">(opsional)</span>
                </label>
                <div className="mt-2">
                    {imagePreview ? (
                        <div className="flex items-center gap-4">
                            <img
                                src={imagePreview}
                                alt="Profile preview"
                                className="w-16 h-16 rounded-full object-cover border-2 border-[#2c67ed]/50"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setImagePreview(null);
                                    setImageFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors duration-200"
                            >
                                <X className="w-4 h-4" />
                                <span>Hapus Foto</span>
                            </button>
                        </div>
                    ) : (
                        <div className="w-full">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-100/80 text-zinc-800 hover:text-[#2c67ed] hover:bg-blue-50/60 transition-colors duration-200 border border-dashed border-zinc-300 hover:border-[#2c67ed]/60 group"
                            >
                                <ImagePlus className="w-5 h-5 group-hover:scale-105 transition-transform duration-200" />
                                <span className="font-medium">Choose Profile Photo</span>
                            </button>
                            <p className="text-center text-zinc-600 text-xs mt-2.5">
                                Max file size: 5MB
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Error / Validation message ── */}
            {(formError || error) && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>{formError || error}</span>
                </div>
            )}

            {/* ── Cooldown progress bar (GPU scaleX, no width transition) ── */}
            {cooldown > 0 && (
                <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-zinc-200 overflow-hidden">
                        <div
                            className="h-full w-full bg-[#2c67ed] rounded-full origin-left transition-transform duration-1000"
                            style={{ transform: `scaleX(${cooldown / RATE_LIMIT_SECONDS})` }}
                        />
                    </div>
                    <p className="text-xs text-zinc-600 text-right">
                        Bisa komentar lagi dalam {cooldown}s
                    </p>
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting || cooldown > 0}
                className="w-full h-12 bg-[#2c67ed] hover:bg-[#1d4ed8] rounded-xl font-semibold text-white shadow-sm transition-[transform,background-color] duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Posting...</span>
                    </>
                ) : cooldown > 0 ? (
                    <>
                        <ShieldAlert className="w-4 h-4" />
                        <span>Tunggu {cooldown}s...</span>
                    </>
                ) : (
                    <>
                        <Send className="w-4 h-4" />
                        <span>Kirim Komentar</span>
                    </>
                )}
            </button>
        </form>
    );
});


const Komentar = () => {
    const [comments, setComments] = useState([]);
    const [pinnedComment, setPinnedComment] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Fetch pinned comment
    useEffect(() => {
        const fetchPinnedComment = async () => {
            try {
                const { data, error } = await supabase
                    .from('portfolio_comments')
                    .select('*')
                    .eq('is_pinned', true)
                    .single();
                
                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching pinned comment:', error);
                    return;
                }
                
                if (data) {
                    setPinnedComment(data);
                }
            } catch (error) {
                console.error('Error fetching pinned comment:', error);
            }
        };

        fetchPinnedComment();
    }, []);

    // Fetch regular comments (excluding pinned) and set up real-time subscription
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const { data, error } = await supabase
                    .from('portfolio_comments')
                    .select('*')
                    .eq('is_pinned', false)
                    .order('created_at', { ascending: false })
                    .limit(500);
                
                if (error) {
                    console.error('Error fetching comments:', error);
                    return;
                }
                
                setComments(data || []);
            } catch (err) {
                console.error('Error in fetchComments:', err);
            }
        };

        fetchComments();

        // Set up real-time subscription
        const subscription = supabase
            .channel('portfolio_comments')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'portfolio_comments',
                    filter: 'is_pinned=eq.false'
                }, 
                () => {
                    fetchComments(); // Refresh comments when changes occur
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const uploadImage = useCallback(async (imageFile) => {
        if (!imageFile) return null;
        
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `profile-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('profile-images')
            .upload(filePath, imageFile);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage
            .from('profile-images')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }, []);

    const handleCommentSubmit = useCallback(async ({ newComment, userName, imageFile }) => {
        setError('');
        setIsSubmitting(true);
        
        try {
            const profileImageUrl = await uploadImage(imageFile);
            
            // Kirim melalui API perantara /api/comment (tidak langsung tembak Supabase)
            const response = await fetch('/api/comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newComment,
                    user_name: userName,
                    profile_image: profileImageUrl
                })
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(result.error || 'Gagal mengirim komentar. Silakan coba lagi.');
            }

            // Immediately add the new comment to the local state
            if (result.data) {
                setComments(prevComments => [result.data, ...prevComments]);
            }
        } catch (error) {
            setError(error.message || 'Gagal mengirim komentar. Silakan coba lagi.');
            console.error('Error adding comment: ', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [uploadImage]);

    const formatDate = useCallback((timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }, []);

    // Calculate total comments (pinned + regular)
    const totalComments = comments.length + (pinnedComment ? 1 : 0);

    return (
        <div className="flex flex-col gap-6 sm:gap-8 h-full">
            {/* Card 1: Form Tulis Komentar */}
            <div className="flex flex-col bg-white rounded-3xl p-6 py-8 sm:p-10 soft-card-shadow">
                <div className="pb-6 border-b border-zinc-200 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50">
                            <MessageCircle className="w-6 h-6 text-[#2c67ed]" />
                        </div>
                        <h3
                            className="text-xl font-bold text-zinc-900"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            Tulis Komentar
                        </h3>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-4 mb-4 text-red-700 bg-red-50 rounded-xl">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                
                <CommentForm onSubmit={handleCommentSubmit} isSubmitting={isSubmitting} error={error} />
            </div>

            {/* Card 2: Daftar Komentar (Flush bottom alignment) */}
            <div className="flex-1 flex flex-col bg-white rounded-3xl p-6 py-8 sm:p-10 soft-card-shadow">
                <div className="pb-6 border-b border-zinc-200 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50">
                            <MessageCircle className="w-6 h-6 text-[#2c67ed]" />
                        </div>
                        <h3
                            className="text-xl font-bold text-zinc-900"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            Komentar <span className="text-[#2c67ed]">({totalComments})</span>
                        </h3>
                    </div>
                </div>

                <div
                    data-lenis-prevent
                    onWheel={(e) => e.stopPropagation()}
                    className="flex-1 min-h-[220px] max-h-[380px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2 overscroll-contain"
                >
                    {/* Pinned Comment */}
                    {pinnedComment && (
                        <Comment 
                            comment={pinnedComment} 
                            formatDate={formatDate}
                            isPinned={true}
                        />
                    )}
                    
                    {/* Regular Comments */}
                    {comments.length === 0 && !pinnedComment ? (
                        <div className="text-center py-8">
                            <UserCircle2 className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                            <p className="text-zinc-600 text-sm">No comments yet. Start the conversation!</p>
                        </div>
                    ) : (
                        comments.map((comment) => (
                            <Comment 
                                key={comment.id} 
                                comment={comment} 
                                formatDate={formatDate}
                                isPinned={false}
                            />
                        ))
                    )}
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(15, 23, 42, 0.04);
                    border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(44, 103, 237, 0.45);
                    border-radius: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(44, 103, 237, 0.7);
                }
            `}</style>
        </div>
    );
};

export default Komentar;
