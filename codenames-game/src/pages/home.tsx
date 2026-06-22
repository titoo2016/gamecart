import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { getSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Loader2 } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const FLOATING_WORDS = ["جاسوس", "عميل", "تلميح", "سر", "فريق", "كلمة", "بطاقة", "فوز", "خسارة", "مهمة"];

function FloatingCard({ word, style }: { word: string; style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center font-sans text-white/30 text-sm font-bold select-none pointer-events-none"
      style={{ width: 90, height: 55, ...style }}
      animate={{
        y: [0, -18, 0],
        rotateX: [5, -5, 5],
        rotateY: [-8, 8, -8],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: (style as any)._dur || 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: (style as any)._delay || 0,
      }}
    >
      {word}
    </motion.div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 150, damping: 20 });
  const smy = useSpring(my, { stiffness: 150, damping: 20 });
  const cardRotateX = useTransform(smy, [-0.5, 0.5], [6, -6]);
  const cardRotateY = useTransform(smx, [-0.5, 0.5], [-6, 6]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => { mx.set(0); my.set(0); };

  const floatingCards = FLOATING_WORDS.map((word, i) => {
    const angle = (i / FLOATING_WORDS.length) * Math.PI * 2;
    const r = 340 + (i % 3) * 60;
    return {
      word,
      style: {
        left: `calc(50% + ${Math.cos(angle) * r}px - 45px)`,
        top: `calc(50% + ${Math.sin(angle) * r * 0.45}px - 27px)`,
        _dur: 3.5 + (i % 4) * 0.8,
        _delay: i * 0.4,
        perspective: "600px",
      } as React.CSSProperties,
    };
  });

  const handleCreate = () => {
    if (!name.trim()) { setError("اكتب اسمك الأول"); return; }
    setLoading(true); setError("");
    const socket = getSocket();
    socket.emit("create-room", { name: name.trim() }, (res: { error?: string; code?: string }) => {
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      localStorage.setItem("codenames_name", name.trim());
      setLocation(`/room/${res.code}`);
    });
  };

  const handleJoin = () => {
    if (!name.trim()) { setError("اكتب اسمك الأول"); return; }
    if (!code.trim()) { setError("اكتب كود الغرفة"); return; }
    setLoading(true); setError("");
    const socket = getSocket();
    socket.emit("join-room", { code: code.trim().toUpperCase(), name: name.trim() }, (res: { error?: string }) => {
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      localStorage.setItem("codenames_name", name.trim());
      setLocation(`/room/${code.trim().toUpperCase()}`);
    });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 3D grid floor */}
      <div className="absolute inset-0 pointer-events-none" style={{ perspective: "600px" }}>
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(30,136,229,0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(30,136,229,0.6) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            transform: "rotateX(55deg) translateY(30%) scaleX(2)",
            transformOrigin: "center bottom",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
      </div>

      {/* Floating background cards */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingCards.map((fc, i) => (
          <FloatingCard key={i} word={fc.word} style={fc.style} />
        ))}
      </div>

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />

      {/* Main card with 3D tilt */}
      <motion.div
        ref={cardRef}
        className="z-10 max-w-md w-full"
        style={{ perspective: "1000px", rotateX: cardRotateX, rotateY: cardRotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="space-y-8">
          {/* Logo */}
          <div className="text-center space-y-3">
            <motion.div
              className="flex justify-center"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <img
                src="/logo.png"
                alt="جيم كارت"
                className="w-36 h-36 object-contain"
                style={{
                  filter: "drop-shadow(0 0 24px rgba(30,136,229,0.7)) drop-shadow(0 0 60px rgba(30,136,229,0.3))",
                }}
              />
            </motion.div>
            <p className="text-muted-foreground font-sans text-sm">لعبة الكلمات السرية — أونلاين</p>
          </div>

          {/* Form card */}
          <motion.div
            className="bg-card/50 backdrop-blur-md border border-card-border p-6 rounded-2xl shadow-2xl space-y-5"
            style={{
              boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <div className="space-y-2 text-xs text-muted-foreground font-sans">
              <p className="flex items-center gap-2 justify-end"><Shield className="w-3 h-3 shrink-0" />فريقين بيتنافسوا يوصلوا لعملاءهم الأول</p>
              <p className="flex items-center gap-2 justify-end"><Shield className="w-3 h-3 shrink-0" />رئيس الجواسيس يدي تلميح، العملاء يخمنوا</p>
              <p className="flex items-center gap-2 justify-end"><Shield className="w-3 h-3 shrink-0" />تجنبوا البطاقة السوداء — القاتل فوري</p>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1 font-sans">اسمك في اللعبة</label>
              <Input
                dir="rtl"
                placeholder="اكتب اسمك"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && mode === "join") handleJoin();
                  if (e.key === "Enter" && mode === "create") handleCreate();
                }}
                className="font-sans bg-background text-right"
                maxLength={20}
                autoFocus
              />
            </div>

            {mode === "choose" && (
              <div className="flex flex-col gap-3">
                <Button onClick={() => setMode("create")} className="w-full h-12 font-sans font-bold text-base">
                  إنشاء غرفة جديدة
                </Button>
                <Button variant="outline" onClick={() => setMode("join")} className="w-full h-12 font-sans font-bold text-base">
                  انضم لغرفة موجودة
                </Button>
              </div>
            )}

            {mode === "create" && (
              <div className="space-y-3">
                <Button onClick={handleCreate} disabled={loading || !name.trim()} className="w-full h-12 font-sans font-bold text-base">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "إنشاء الغرفة"}
                </Button>
                <button onClick={() => { setMode("choose"); setError(""); }} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
                  رجوع
                </button>
              </div>
            )}

            {mode === "join" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1 font-sans">كود الغرفة</label>
                  <Input
                    dir="ltr"
                    placeholder="مثال: ABCD"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    className="font-mono bg-background text-center tracking-widest text-xl"
                    maxLength={4}
                  />
                </div>
                <Button onClick={handleJoin} disabled={loading || !name.trim() || !code.trim()} className="w-full h-12 font-sans font-bold text-base">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "انضم للغرفة"}
                </Button>
                <button onClick={() => { setMode("choose"); setError(""); }} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
                  رجوع
                </button>
              </div>
            )}

            {error && (
              <p className="text-center text-sm text-destructive font-sans">{error}</p>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="z-10 mt-8 text-center space-y-1">
        <p className="text-xs text-muted-foreground/40 font-sans">
          جيم كارت — كل الحقوق محفوظة
        </p>
        <p className="text-xs text-muted-foreground/30 font-sans tracking-wide">
          ⚡ برمجة وتصميم{" "}
          <span className="text-blue-400/60 font-bold">TITO</span>
        </p>
      </div>
    </div>
  );
}
