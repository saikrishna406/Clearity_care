import { useState, useEffect, useRef, useCallback } from "react";

/* ─── BRAND TOKENS ────────────────────────────────────────────── */
const B = {
  cream:    "#fce1c5",
  slate:    "#4f6575",
  sage:     "#83a494",
  stone:    "#b5aca1",
  offwhite: "#faf7f4",
  white:    "#ffffff",
  text:     "#2d3a42",
  muted:    "#1a262e",
};

/* ─── GLOBAL STYLES (injected once) ──────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.cdnfonts.com/css/aileron');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Poppins', sans-serif; background: ${B.offwhite}; color: ${B.text}; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
  h1, h2, h3, h4, h5, h6 { font-family: 'Aileron', sans-serif; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
  @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
  @keyframes scanMove { 0%{top:5%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:95%;opacity:0} }
  @keyframes pulse    { from{transform:scale(1) translate(0,0)} to{transform:scale(1.18) translate(16px,-16px)} }
  @keyframes pulse2   { from{transform:scale(1) translate(0,0)} to{transform:scale(1.12) translate(-12px,18px)} }
  @keyframes floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes countUp  { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }

  .stagger-1 { animation-delay: 0.1s !important; }
  .stagger-2 { animation-delay: 0.25s !important; }
  .stagger-3 { animation-delay: 0.4s !important; }
  .stagger-4 { animation-delay: 0.55s !important; }
  .stagger-5 { animation-delay: 0.7s !important; }

  input, select, textarea {
    font-family: 'Poppins', sans-serif;
    font-size: 14px;
    width: 100%;
    background: ${B.offwhite};
    border: 1.5px solid rgba(181,172,161,0.35);
    border-radius: 10px;
    padding: 13px 16px;
    color: ${B.text};
    outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
    -webkit-appearance: none;
  }
  input::placeholder, textarea::placeholder { color: ${B.stone}; }
  input:focus, select:focus {
    border-color: ${B.sage};
    background: #fff;
    box-shadow: 0 0 0 4px rgba(131,164,148,0.1);
  }
  input.error { border-color: #c0836a !important; box-shadow: 0 0 0 3px rgba(192,131,106,0.12) !important; }
  select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23b5aca1' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 38px;
    cursor: pointer;
  }
  select option { color: ${B.text}; background: #fff; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${B.stone}; border-radius: 2px; }

  .cc-nav {
    position: fixed; top:0; left:0; right:0; z-index:100;
    padding: 18px 40px;
    display: flex; align-items:center; justify-content:space-between;
    background: rgba(250,247,244,0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(181,172,161,0.18);
    transition: padding .3s ease, box-shadow .3s;
  }
  .cc-nav.scrolled { padding: 12px 40px; box-shadow: 0 4px 24px rgba(79,101,117,0.06); }

  @media (max-width: 768px) {
    .cc-nav { padding: 14px 20px !important; }
    .cc-nav.scrolled { padding: 10px 20px !important; }
    .founders-grid { grid-template-columns: 1fr !important; }
    .hero-headline { font-size: clamp(30px,8vw,52px) !important; }
    .form-row { grid-template-columns: 1fr !important; }
    .stats-grid { grid-template-columns: 1fr 1fr !important; }
    .trust-strip { flex-direction: column; gap: 10px !important; }
    .trust-divider { display: none !important; }
  }
  @media (max-width: 480px) {
    .stats-grid { grid-template-columns: 1fr !important; }
  }
`;

/* ─── INTERSECTION OBSERVER HOOK ─────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── ANIMATED COUNTER ───────────────────────────────────────── */
function AnimCounter({ to, suffix = "", duration = 1800 }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useReveal(0.3);
  useEffect(() => {
    if (!visible) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, to, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── LOGO IMAGE ─────────────────────────────────────────────── */
function LogoIcon({ size = 44, style = {} }) {
  return (
    <img 
      src="/logo.png" 
      alt="Clearity Care Logo" 
      style={{ height: size, width: "auto", display: "block", objectFit: "contain", ...style }} 
    />
  );
}

/* ─── NAV ────────────────────────────────────────────────────── */
function Nav({ onCTA }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav className={`cc-nav${scrolled ? " scrolled" : ""}`}>
      <div style={{ display:"flex", alignItems:"center" }}>
        <LogoIcon size={44} />
      </div>
      <button
        onClick={onCTA}
        style={{
          fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:600,
          color:"#fff", background:B.slate, border:"none",
          padding:"9px 22px", borderRadius:100, cursor:"pointer",
          letterSpacing:"0.03em", transition:"background .25s, transform .2s, box-shadow .25s"
        }}
        onMouseEnter={e => { e.target.style.background = B.sage; e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = `0 8px 24px rgba(131,164,148,0.3)`; }}
        onMouseLeave={e => { e.target.style.background = B.slate; e.target.style.transform = ""; e.target.style.boxShadow = ""; }}
      >Stay Informed</button>
    </nav>
  );
}

/* ─── HERO ───────────────────────────────────────────────────── */
function Hero({ onCTA }) {
  const words = ["answers", "clarity", "insight", "understanding"];
  const [wordIdx, setWordIdx] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => { setWordIdx(i => (i + 1) % words.length); setWordVisible(true); }, 350);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section style={{
      minHeight:"100svh", padding:"120px 24px 80px",
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", textAlign:"center", position:"relative", overflow:"hidden",
      background:`linear-gradient(175deg, ${B.offwhite} 60%, rgba(252,225,197,0.18) 100%)`
    }}>
      {/* Scientific Visual (Generated) */}
      <div style={{
        position:"absolute", top:0, left:0, width:"100%", height:"100%",
        opacity:0.08, mixBlendMode:"multiply", pointerEvents:"none",
        backgroundImage:`url(/hero-visual.png)`, backgroundSize:"cover", backgroundPosition:"center",
        WebkitMaskImage: `radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, transparent 70%)`,
        maskImage: `radial-gradient(ellipse at center, rgba(0,0,0,1) 0%, transparent 70%)`
      }}/>
      {/* Ambient blobs */}
      <div style={{ position:"absolute", top:-80, right:-120, width:480, height:480, borderRadius:"50%",
        background:`radial-gradient(circle, rgba(131,164,148,0.13) 0%, transparent 70%)`,
        pointerEvents:"none", animation:"pulse 9s ease-in-out infinite alternate" }}/>
      <div style={{ position:"absolute", bottom:-60, left:-80, width:380, height:380, borderRadius:"50%",
        background:`radial-gradient(circle, rgba(252,225,197,0.22) 0%, transparent 70%)`,
        pointerEvents:"none", animation:"pulse2 11s ease-in-out 2s infinite alternate" }}/>
      {/* Scan line */}
      <div style={{ position:"absolute", width:"100%", height:1,
        background:`linear-gradient(90deg, transparent, rgba(131,164,148,0.25), transparent)`,
        animation:"scanMove 7s linear infinite", pointerEvents:"none" }}/>
      {/* DNA dots decoration */}
      <DnaDecoration />

      {/* Eyebrow */}
      <div className="stagger-1" style={{
        fontSize:11, fontWeight:500, letterSpacing:"0.18em", textTransform:"uppercase",
        color:B.sage, marginBottom:20, display:"flex", alignItems:"center", gap:10,
        opacity:0, animation:"fadeUp 0.8s ease forwards"
      }}>
        <span style={{ width:28, height:1, background:B.sage, opacity:0.45 }}/>
        Clearity Care · Amsterdam
        <span style={{ width:28, height:1, background:B.sage, opacity:0.45 }}/>
      </div>

      {/* Headline */}
      <h1 className="hero-headline stagger-2" style={{
        fontSize:"clamp(34px,7.5vw,62px)", fontWeight:800, lineHeight:1.08,
        color:B.slate, letterSpacing:"-0.025em", maxWidth:720, marginBottom:22,
        opacity:0, animation:"fadeUp 0.9s ease forwards"
      }}>
        Finally answers after pregnancy loss.
      </h1>

      {/* Sub */}
      <p className="stagger-3" style={{
        fontSize:"clamp(18px,2.5vw,22px)", fontWeight:400, lineHeight:1.5,
        color:B.sage, maxWidth:500, marginBottom:16,
        opacity:0, animation:"fadeUp 1s ease forwards"
      }}>
        It is about time...
      </p>

      <p className="stagger-3" style={{
        fontSize:"clamp(15px,2.2vw,18px)", fontWeight:300, lineHeight:1.75,
        color:B.muted, maxWidth:500, marginBottom:36,
        opacity:0, animation:"fadeUp 1s ease forwards"
      }}>
        Clearity Care brings answers to parents who deserve to understand what happened and why.
      </p>

      {/* CTA Row */}
      <div className="stagger-4" style={{
        display:"flex", gap:14, flexWrap:"wrap", justifyContent:"center",
        marginBottom:52, opacity:0, animation:"fadeUp 1s ease forwards"
      }}>
        <button onClick={onCTA} style={{
          fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:600,
          color:"#fff", background:B.slate, border:"none",
          padding:"15px 36px", borderRadius:100, cursor:"pointer",
          letterSpacing:"0.03em", boxShadow:`0 8px 32px rgba(79,101,117,0.2)`,
          transition:"transform .2s, box-shadow .25s, background .25s"
        }}
          onMouseEnter={e => { e.target.style.background = B.sage; e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = `0 16px 40px rgba(131,164,148,0.3)`; }}
          onMouseLeave={e => { e.target.style.background = B.slate; e.target.style.transform = ""; e.target.style.boxShadow = `0 8px 32px rgba(79,101,117,0.2)`; }}
        >Stay Informed →</button>
        <button onClick={() => document.getElementById("video-section")?.scrollIntoView({ behavior:"smooth" })}
          style={{
            fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:500,
            color:B.slate, background:"transparent",
            border:`1.5px solid rgba(79,101,117,0.25)`,
            padding:"15px 32px", borderRadius:100, cursor:"pointer",
            letterSpacing:"0.03em", transition:"border-color .2s, background .2s"
          }}
          onMouseEnter={e => { e.target.style.borderColor = B.sage; e.target.style.background = "rgba(131,164,148,0.06)"; }}
          onMouseLeave={e => { e.target.style.borderColor = "rgba(79,101,117,0.25)"; e.target.style.background = "transparent"; }}
        >▶ Watch the process</button>
      </div>


    </section>
  );
}

function DnaDecoration() {
  return (
    <svg style={{ position:"absolute", right:"-20px", top:"50%", transform:"translateY(-50%)", opacity:0.06, pointerEvents:"none" }}
      width="160" height="400" viewBox="0 0 160 400">
      {Array.from({ length: 18 }).map((_, i) => {
        const y = i * 22 + 10;
        const phase = (i / 18) * Math.PI * 2;
        const x1 = 20 + Math.sin(phase) * 50;
        const x2 = 140 + Math.sin(phase + Math.PI) * 50;
        return (
          <g key={i}>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke={B.slate} strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx={x1} cy={y} r="3" fill={B.sage}/>
            <circle cx={x2} cy={y} r="3" fill={B.sage}/>
          </g>
        );
      })}
    </svg>
  );
}




/* ─── STATS SECTION ────────────────────────────────────────── */
function Stats() {
  const [ref, vis] = useReveal(0.15);
  const stats = [
    { val: 15, suffix: "%", label: "of all confirmed pregnancies ends in pregnancy loss", detail: null, highlight: true },
    { val: 23, suffix: " million", label: "miscarriages occur every year", detail: null, highlight: false },
    { val: 44, suffix: "", label: "pregnancies are lost worldwide every minute", detail: null, highlight: false },
    { val: 1, suffix: "/10", label: "couples has to deal with one or more losses", detail: null, highlight: false },
    { val: 90, suffix: "%", label: "of the times, the answer is we don't know what happened", detail: null, highlight: false },
  ];
  return (
    <section style={{ padding:"80px 24px", background:B.white, position:"relative" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
        background:`linear-gradient(90deg, transparent, rgba(131,164,148,0.25), transparent)` }}/>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <SectionTitle text="Why this matters" center />
        <div ref={ref} className="stats-grid" style={{
          display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:20, marginTop:48
        }}>
          {stats.map((s, i) => (
            <StatCard key={i} {...s} visible={vis} delay={i * 100} />
          ))}
        </div>

        <div style={{
          marginTop: 64, textAlign: "center", display: "flex", flexDirection: "column", gap: 16,
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(20px)",
          transition: "opacity .8s ease .6s, transform .8s ease .6s"
        }}>
          <p style={{ fontSize: "clamp(16px, 2.5vw, 18px)", fontWeight: 500, color: B.slate }}>
            Based on 20 years of research on early human development.
          </p>
          <p style={{ fontSize: 15, fontWeight: 300, color: B.muted, maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
            Built together with a team of medical doctors from Amsterdam UMC.<br/>Created with compassion, clarity and scientific integrity.
          </p>
          <div style={{ fontSize: 13, fontWeight: 600, color: B.sage, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 8 }}>
            From parents to parents. Through science.
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ val, suffix, label, detail, highlight, visible, delay }) {
  return (
    <div
      style={{
        background: highlight ? B.slate : B.offwhite,
        border: highlight ? `1.5px solid transparent` : `1.5px solid rgba(181,172,161,0.22)`,
        borderRadius:16, padding: detail ? "28px 22px" : "40px 22px", textAlign:"center",
        cursor:"default",
        transform: visible ? "translateY(0)" : "translateY(20px)",
        opacity: visible ? 1 : 0,
        transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`,
        boxShadow: highlight ? `0 12px 40px rgba(79,101,117,0.15)` : `0 4px 16px rgba(79,101,117,0.04)`,
        display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center"
      }}
    >
      <div style={{
        fontSize:"clamp(32px,4vw,44px)", fontWeight:800, lineHeight:1.1,
        color: highlight ? B.cream : B.slate, marginBottom:8,
        animation: visible ? `countUp .6s ease ${delay}ms both` : "none"
      }}>
        {visible ? <AnimCounter to={val} suffix={suffix} /> : `0${suffix}`}
      </div>
      <div style={{ fontSize:15, fontWeight:500, color: highlight ? "rgba(252,225,197,0.75)" : B.muted, lineHeight:1.4, marginBottom: detail ? 10 : 0 }}>
        {label}
      </div>
      {detail && (
        <div style={{ fontSize:12, fontWeight:300, color: highlight ? "rgba(252,225,197,0.5)" : "rgba(79,101,117,0.6)", lineHeight:1.55, maxWidth:240 }}>
          {detail}
        </div>
      )}
    </div>
  );
}

/* ─── HOW IT WORKS (with embedded video) ───────────────────────── */
const IStep0 = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IStep1 = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>;
const IStep2 = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IStep3 = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>;
const IStep4 = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14h6"/><path d="M9 10h6"/></svg>;
const IStep5 = () => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>;

function HowItWorks() {
  const steps = [
    { n:"00", icon:<IStep0/>, title:"Onboarding", body:"We start by informing potential parents about the procedure, explaining how it works, and providing a collection kit in case of pregnancy loss." },
    { n:"01", icon:<IStep1/>, title:"Send or bring your tissue", body:"If a miscarriage happens, parents send or bring us the collected tissue and DNA samples safely and securely." },
    { n:"02", icon:<IStep2/>, title:"Genetic analysis", body:"We investigate possible genetic or chromosomal causes of pregnancy loss." },
    { n:"03", icon:<IStep3/>, title:"Advanced MicroCT imaging", body:"If the genetic result is inconclusive, we use ultra-high resolution imaging to examine early development in exceptional detail and make an anatomical assessment." },
    { n:"04", icon:<IStep4/>, title:"Expert interpretation", body:"Our embryology specialists carefully analyze the findings using years of scientific expertise and reference data." },
    { n:"05", icon:<IStep5/>, title:"Clear reporting", body:"You receive a clear and compassionate report with the findings and possible explanations." },
  ];
  const [ref, vis] = useReveal(0.1);
  const [vidRef, vidVis] = useReveal(0.1);
  return (
    <section id="video-section" style={{ padding:"80px 24px", background:`linear-gradient(175deg, ${B.white} 0%, rgba(252,225,197,0.08) 100%)` }}>
      <div style={{ maxWidth:960, margin:"0 auto" }}>
        <SectionLabel text="The Process" center />
        <SectionTitle text="From loss to understanding" center />
        <p style={{ fontSize:15, fontWeight:300, color:B.muted, textAlign:"center", maxWidth:560, margin:"12px auto 52px", lineHeight:1.7 }}>
          Six steps that transform uncertainty into scientific clarity.
        </p>
        <div ref={ref} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:20, marginBottom:64 }}>
          {steps.map((s, i) => (
            <StepCard key={i} {...s} index={i} visible={vis} />
          ))}
        </div>
        {/* Embedded video */}
        <SectionLabel text="How we do this" center />
        <SectionTitle text="See the science behind the mission" center />
        <p style={{ fontSize:15, fontWeight:300, color:B.muted, textAlign:"center", lineHeight:1.7, maxWidth:640, margin:"12px auto 36px" }}>
          Watch how Clearity Care combines advanced genetics, ultra-high resolution Micro-CT imaging and world-leading embryology expertise to help parents better understand why a pregnancy ended in loss.
        </p>
        <div ref={vidRef} style={{
          borderRadius:20, overflow:"hidden", position:"relative",
          boxShadow:`0 24px 72px rgba(79,101,117,0.14), 0 4px 16px rgba(79,101,117,0.07)`,
          opacity: vidVis ? 1 : 0, transform: vidVis ? "translateY(0) scale(1)" : "translateY(24px) scale(0.98)",
          transition:"opacity .8s ease, transform .8s cubic-bezier(0.34,1.2,0.64,1)"
        }}>
          <div style={{ position:"absolute", inset:0, border:`1px solid rgba(131,164,148,0.22)`, borderRadius:20, pointerEvents:"none", zIndex:2 }}/>
          <iframe
            width="100%"
            style={{ display:"block", aspectRatio:"16/9", border:"none", position:"relative", zIndex:3 }}
            src="https://www.youtube.com/embed/OBXBpbB7tG0?rel=0&modestbranding=1&color=white"
            title="Clearity Care — Explainer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}

function StepCard({ n, icon, title, body, index, visible }) {
  return (
    <div
      style={{
        background: B.white,
        border:`1.5px solid rgba(181,172,161,0.22)`,
        borderRadius:16, padding:"28px 24px",
        transform: visible ? "translateY(0)" : "translateY(24px)",
        opacity: visible ? 1 : 0,
        transition: `opacity .6s ease ${index * 80}ms, transform .6s ease ${index * 80}ms`,
        boxShadow: `0 4px 16px rgba(79,101,117,0.06)`
      }}
    >
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ color: B.sage, display:"flex", alignItems:"center" }}>{icon}</div>
        <div style={{ fontSize:12, fontWeight:700, color:"rgba(181,172,161,0.6)", letterSpacing:"0.06em" }}>{n}</div>
      </div>
      <div style={{ fontSize:15, fontWeight:700, color: B.slate, marginBottom:10, lineHeight:1.3 }}>{title}</div>
      <div style={{ fontSize:13.5, fontWeight:300, color: B.muted, lineHeight:1.65 }}>{body}</div>
    </div>
  );
}

/* ─── FOUNDERS ───────────────────────────────────────────────── */
function Founders() {
  const [imgRef, imgVis] = useReveal(0.15);
  const [txtRef, txtVis] = useReveal(0.15);
  return (
    <section style={{ padding:"80px 24px", background:B.offwhite, position:"relative" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
        background:`linear-gradient(90deg, transparent, rgba(131,164,148,0.2), transparent)` }}/>
      <div className="founders-grid" style={{ maxWidth:900, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:56, alignItems:"center" }}>
        {/* Photo */}
        <div ref={imgRef} style={{
          opacity: imgVis ? 1 : 0, transform: imgVis ? "translateX(0)" : "translateX(-28px)",
          transition:"opacity .8s ease, transform .8s cubic-bezier(0.34,1.2,0.64,1)"
        }}>
          <div style={{
            position:"relative", borderRadius:24, overflow:"hidden",
            boxShadow:`0 24px 64px rgba(79,101,117,0.12)`
          }}>
            <img
              src="/founders.jpg"
              alt="Clearity Care founders"
              style={{ width:"100%", height:460, objectFit:"cover", objectPosition:"center top", display:"block", filter:"saturate(0.88) contrast(1.03)" }}
              onError={e => { e.target.style.display="none"; }}
            />
            {/* Overlay badge */}
            <div style={{
              position:"absolute", bottom:20, left:20, right:20,
              background:"rgba(250,247,244,0.92)", backdropFilter:"blur(12px)",
              borderRadius:12, padding:"12px 16px",
              display:"flex", gap:20, alignItems:"center"
            }}>
              <div style={{ textAlign:"center", flex:1 }}>
                <div style={{ fontSize:11, fontWeight:600, color:B.sage, textTransform:"uppercase", letterSpacing:"0.08em" }}>Bernadette de Bakker</div>
                <div style={{ fontSize:10, fontWeight:300, color:B.muted }}>Chief Medical Officer</div>
              </div>
              <div style={{ width:1, height:28, background:B.stone, opacity:0.3 }}/>
              <div style={{ textAlign:"center", flex:1 }}>
                <div style={{ fontSize:11, fontWeight:600, color:B.sage, textTransform:"uppercase", letterSpacing:"0.08em" }}>Madeleine de Bakker</div>
                <div style={{ fontSize:10, fontWeight:300, color:B.muted }}>Chief Executive Officer</div>
              </div>
            </div>
          </div>
        </div>
        {/* Text */}
        <div ref={txtRef} style={{
          opacity: txtVis ? 1 : 0, transform: txtVis ? "translateX(0)" : "translateX(28px)",
          transition:"opacity .8s ease .1s, transform .8s cubic-bezier(0.34,1.2,0.64,1) .1s"
        }}>
          <SectionLabel text="The Founding Mothers" />
          <h2 style={{ fontSize:"clamp(22px,3.5vw,34px)", fontWeight:800, color:B.slate, lineHeight:1.15, letterSpacing:"-0.02em", margin:"8px 0 20px" }}>
            From parents to parents. Through science.
          </h2>
          <div style={{ fontSize:14.5, fontWeight:300, color:B.muted, lineHeight:1.7, display:"flex", flexDirection:"column", gap:14, marginBottom:28 }}>
            <p>Clearity Care was founded by sisters Madeleine and Bernadette de Bakker, driven by both scientific expertise and personal experience.</p>
            <p>Bernadette de Bakker, MD PhD, is a leading embryologist specialized in early human development and advanced embryo imaging. As a mother of four who experienced three miscarriages herself, she understands both the scientific and human side of pregnancy loss.</p>
            <p>Madeleine de Bakker combines strategic leadership, empathy and a future-driven vision to connect science, healthcare and innovation. After a long fertility journey and becoming a mother of three, she is committed to transforming how pregnancy loss is understood and supported worldwide.</p>
            <p>By combining breakthrough technology with compassionate care, we are building a new foundation for miscarriage research, understanding and future care.</p>
            <p>Every case contributes to better understanding, future research and improved care for the next generation.</p>
            <p>Together, they are building a future where fewer parents are left without answers.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FORM SECTION ───────────────────────────────────────────── */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1M_XepKlfQ1ds0DmZCBNNOosSc5Rkq1XLSGrfi1SXNm2ilbtHAeNPcPl557YbaSST6g/exec";

function Field({ label, optional, error, children }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <label style={{ fontSize:11, fontWeight:600, color:B.muted, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</label>
        {optional && <span style={{ fontSize:10, color:B.stone, fontWeight:400 }}>Optional</span>}
      </div>
      {children}
      {error && <div style={{ fontSize:11, color:"#c0836a", marginTop:4, fontWeight:400 }}>This field is required</div>}
    </div>
  );
}

function FormSection() {
  const INIT = { name: "", email: "", category: "parent", phone: "" };
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [tab, setTab] = useState("parent"); // parent | investor
  const [ref, vis] = useReveal(0.1);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = true;
    if (!form.category) e.category = true;
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    
    setLoading(true);
    setSubmitError(null);

    try {
      // Send data using Content-Type text/plain to avoid CORS preflight options check
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Mode no-cors lets the request go through to Google Script without CORS issues
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(form),
      });

      // With "no-cors", response status is 0 and we can't read response body.
      // If we made it here without an exception, it successfully reached Google Sheet!
      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      setSubmitError("Failed to submit form. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="form-section" style={{ padding:"80px 24px", background:B.white, position:"relative" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:1,
        background:`linear-gradient(90deg, transparent, rgba(131,164,148,0.2), transparent)` }}/>
      <div style={{ maxWidth:540, margin:"0 auto" }} ref={ref}>

        {!submitted ? (
          <>
            <SectionTitle text="Join us" center />
            <div style={{ fontSize:15, fontWeight:300, color:B.muted, textAlign:"center", lineHeight:1.7, maxWidth:580, margin:"16px auto 40px", display:"flex", flexDirection:"column", gap:16 }}>
              <p>Clearity Care paves the way to understanding pregnancy loss and early human development.</p>
              <p>Join us to stay informed about our progress, research developments and early opportunities to be part of the future of pregnancy loss and care.</p>
              <p>For parents. For healthcare professionals. For early supporters and investors who believe healthcare can do better.</p>
            </div>

            {/* Tab switcher */}
            <div style={{
              display:"flex", background:B.offwhite, borderRadius:100,
              padding:4, marginBottom:32, border:`1px solid rgba(181,172,161,0.2)`
            }}>
              {[
                {k:"parent", label:"I'm a Parent"},
                {k:"investor", label:"I'm an Investor"},
                {k:"institution", label:"I'm from an Institution"}
              ].map(t => (
                <button key={t.k} onClick={() => { setTab(t.k); setForm(f => ({...f, category: t.k})); }}
                  style={{
                    flex:1, fontFamily:"'Poppins',sans-serif", fontSize:12, fontWeight:600,
                    border:"none", borderRadius:100, padding:"10px 4px", cursor:"pointer",
                    background: tab === t.k ? B.slate : "transparent",
                    color: tab === t.k ? "#fff" : B.muted,
                    transition:"all .25s"
                  }}>{t.label}</button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate style={{
              opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)",
              transition:"opacity .7s ease, transform .7s ease"
            }}>
              <div style={{ display:"grid", gap:18 }}>
                <div className="form-row" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                  <Field label="Name" error={errors.name}>
                    <input className={errors.name ? "error" : ""} value={form.name} placeholder="Your full name"
                      onChange={e => { setForm(f=>({...f,name:e.target.value})); setErrors(er=>({...er,name:false})); }}/>
                  </Field>
                  <Field label="Email" error={errors.email}>
                    <input className={errors.email ? "error" : ""} type="email" value={form.email} placeholder="you@email.com"
                      onChange={e => { setForm(f=>({...f,email:e.target.value})); setErrors(er=>({...er,email:false})); }}/>
                  </Field>
                </div>

                <Field label="Phone" optional error={errors.phone}>
                  <input type="tel" value={form.phone} placeholder="+31 6 00 00 00 00"
                    onChange={e => setForm(f=>({...f,phone:e.target.value}))}/>
                </Field>

                {submitError && (
                  <div style={{ fontSize:13, color:"#c0836a", textAlign:"center", fontWeight:500 }}>
                    {submitError}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  fontFamily:"'Poppins',sans-serif", fontSize:15, fontWeight:700,
                  color:"#fff", background: loading ? B.stone : B.slate,
                  border:"none", borderRadius:100, padding:"17px 32px",
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing:"0.04em", transition:"all .25s",
                  boxShadow: loading ? "none" : `0 8px 32px rgba(79,101,117,0.2)`,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8
                }}
                  onMouseEnter={e => { if(!loading){ e.currentTarget.style.background = B.sage; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 16px 40px rgba(131,164,148,0.3)`; }}}
                  onMouseLeave={e => { e.currentTarget.style.background = loading ? B.stone : B.slate; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = loading ? "none" : `0 8px 32px rgba(79,101,117,0.2)`; }}
                >
                  {loading ? <LoadingDots /> : "Stay Informed →"}
                </button>

                <p style={{ fontSize:11, color:B.stone, textAlign:"center", lineHeight:1.65 }}>
                  Your information is handled with full GDPR compliance. No spam, ever.
                </p>
              </div>
            </form>
          </>
        ) : (
          <ThankYou name={form.name} category={form.category} />
        )}

      </div>
    </section>
  );
}

function LoadingDots() {
  return (
    <span style={{ display:"flex", gap:4, alignItems:"center" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,0.7)",
          animation:`floatY .8s ease-in-out ${i*0.15}s infinite`
        }}/>
      ))}
    </span>
  );
}

function ThankYou({ name, category }) {
  const isInvestor = category === "investor";
  return (
    <div style={{ textAlign:"center", padding:"20px 0", animation:"fadeUp .7s ease both" }}>
      <div style={{
        width:64, height:64, borderRadius:"50%",
        background:`rgba(131,164,148,0.12)`, border:`2px solid rgba(131,164,148,0.3)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        margin:"0 auto 24px"
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke={B.sage} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3 style={{ fontSize:28, fontWeight:800, color:B.slate, marginBottom:10, letterSpacing:"-0.02em" }}>
        Thank you, {name?.split(" ")[0] || ""}
      </h3>
      <p style={{ fontSize:15, fontWeight:300, color:B.muted, lineHeight:1.7, maxWidth:380, margin:"0 auto" }}>
        {isInvestor
          ? "We'll be in touch with an early investor update. You're backing something that truly matters."
          : "We'll be in touch. You're now part of a community that believes every family deserves answers."}
      </p>
      <div style={{
        marginTop:28, padding:"16px 24px",
        background:"rgba(131,164,148,0.07)", borderRadius:12,
        border:"1px solid rgba(131,164,148,0.15)"
      }}>
        <div style={{ fontSize:12, color:B.sage, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>
          What happens next
        </div>
        <div style={{ fontSize:13, color:B.muted, fontWeight:300, lineHeight:1.55 }}>
          You'll receive a confirmation email shortly, followed by updates as we approach our launch.
        </div>
      </div>
    </div>
  );
}

/* ─── CLOSING ────────────────────────────────────────────────── */
function Closing({ onCTA }) {
  const [ref, vis] = useReveal(0.15);
  return (
    <section style={{
      padding:"96px 24px", background:B.sage, textAlign:"center",
      position:"relative", overflow:"hidden"
    }}>
      <div style={{ position:"absolute", top:-80, left:"50%", transform:"translateX(-50%)",
        width:600, height:400, borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
        pointerEvents:"none" }}/>
      <div ref={ref} style={{
        opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)",
        transition:"opacity .7s ease, transform .7s ease"
      }}>
        <div style={{ fontSize:11, fontWeight:500, letterSpacing:"0.18em", textTransform:"uppercase",
          color:"rgba(255,255,255,0.8)", marginBottom:16, display:"flex", alignItems:"center", gap:10, justifyContent:"center" }}>
          <span style={{ width:24, height:1, background:"#fff", opacity:0.5 }}/>
          The Mission
          <span style={{ width:24, height:1, background:"#fff", opacity:0.5 }}/>
        </div>
        <h2 style={{ fontSize:"clamp(24px,4vw,40px)", fontWeight:800, color:"#fff",
          letterSpacing:"-0.025em", lineHeight:1.15, maxWidth:600, margin:"0 auto 16px" }}>
          Giving all parents worldwide the answers they deserve
        </h2>
        <p style={{ fontSize:16, fontWeight:400, color:"#fff",
          maxWidth:640, margin:"0 auto 0px", lineHeight:1.7 }}>
          We are building a new foundation for understanding pregnancy loss and early human development through science, compassion and breakthrough technology
        </p>
      </div>
    </section>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      padding:"28px 40px", background:B.slate,
      borderTop:"1px solid rgba(255,255,255,0.06)",
      display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12
    }}>
      <div style={{ display:"flex", alignItems:"center", background:"#fff", padding:"6px 14px", borderRadius:8 }}>
        <LogoIcon size={28} />
      </div>
      <div style={{ fontSize:11, color:"#fff", letterSpacing:"0.04em", fontWeight:400 }}>
        © 2026 Clearity Care · All rights reserved
      </div>
      <div style={{ fontSize:11, color:"#fff", fontWeight:400 }}>
        Privacy · GDPR · Contact
      </div>
    </footer>
  );
}

/* ─── REUSABLE PRIMITIVES ────────────────────────────────────── */
function SectionLabel({ text, center = false }) {
  return (
    <div style={{
      fontSize:11, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase",
      color:B.sage, marginBottom:10, textAlign: center ? "center" : "left"
    }}>{text}</div>
  );
}

function SectionTitle({ text, center = false }) {
  return (
    <h2 style={{
      fontSize:"clamp(24px,4vw,38px)", fontWeight:800, color:B.slate,
      letterSpacing:"-0.02em", lineHeight:1.12, textAlign: center ? "center" : "left"
    }}>{text}</h2>
  );
}

/* ─── ROOT APP ───────────────────────────────────────────────── */
export default function App() {
  // Inject global CSS once
  useEffect(() => {
    const id = "cc-global-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id;
      tag.textContent = GLOBAL_CSS;
      document.head.appendChild(tag);
    }
  }, []);

  const scrollToForm = useCallback(() => {
    document.getElementById("form-section")?.scrollIntoView({ behavior:"smooth" });
  }, []);

  return (
    <>
      <Nav onCTA={scrollToForm} />
      <main>
        <Hero onCTA={scrollToForm} />
        <Stats />
        <Closing onCTA={scrollToForm} />
        <HowItWorks />
        <Founders />
        <FormSection />
      </main>
      <Footer />
    </>
  );
}
