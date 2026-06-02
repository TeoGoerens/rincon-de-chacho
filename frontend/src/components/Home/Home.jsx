import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import "./HomeStyles.css";

import fetchAllCronicas          from "../../reactquery/cronica/fetchAllCronicas";
import fetchAllPodridaMatches    from "../../reactquery/podrida/fetchAllPodridaMatches";
import fetchAllTournamentRounds  from "../../reactquery/chachos/fetchAllTournamentRounds";

/* ── Count-up hook ─────────────────────────────────────── */
const useCountUp = (target, duration = 1600, delay = 0) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const num = parseInt(target);
    if (isNaN(num)) return;
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setCount(Math.floor(eased * num));
        if (p < 1) requestAnimationFrame(tick);
        else setCount(num);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return isNaN(parseInt(target)) ? target : count;
};

/* ── SVG Icons ─────────────────────────────────────────── */
/* Usuarios / equipo — Chachos */
const IconUsers = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.2"/>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke={color} strokeWidth="1.8"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="1.8" strokeOpacity="0.5"/>
    <path d="M21 21v-2a4 4 0 0 0-3-3.85" stroke={color} strokeWidth="1.8" strokeOpacity="0.5"/>
  </svg>
);

/* Capas / cartas apiladas — Podrida */
const IconLayers = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 2 7 12 12 22 7" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.2"/>
    <polyline points="2 12 12 17 22 12" stroke={color} strokeWidth="1.8" strokeOpacity="0.7"/>
    <polyline points="2 17 12 22 22 17" stroke={color} strokeWidth="1.8" strokeOpacity="0.4"/>
  </svg>
);

/* Barras / ranking — Prode */
const IconBars = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2"  y="10" width="5" height="11" rx="1" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.15"/>
    <rect x="9"  y="4"  width="5" height="17" rx="1" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.25"/>
    <rect x="16" y="13" width="5" height="8"  rx="1" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.1"/>
  </svg>
);

/* Libro abierto — Crónicas */
const IconOpenBook = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.2"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke={color} strokeWidth="1.8" fill={color} fillOpacity="0.12"/>
  </svg>
);

const IconArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

/* ── Stat card with count-up ───────────────────────────── */
const StatCard = ({ value, label, delay }) => {
  const animated = useCountUp(value, 1600, delay);
  return (
    <div className="hw-stat-card">
      <span className="hw-stat-card-num">{animated}</span>
      <span className="hw-stat-card-lbl">{label}</span>
    </div>
  );
};

/* ── Component ─────────────────────────────────────────── */
const FOUNDING_YEAR = 2024;

const Home = () => {
  const navigate = useNavigate();
  const sectionsRef = useRef(null);
  const gridRef = useRef(null);

  // Fade-in escalonado solo cuando las cards entran en el viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (gridRef.current) observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);
  const currentYear = new Date().getFullYear();
  const yearsRunning = currentYear - FOUNDING_YEAR + 1;

  const { data: cronicasData } = useQuery({
    queryKey: ["fetchAllCronicas"],
    queryFn: fetchAllCronicas,
  });
  const { data: podridaData } = useQuery({
    queryKey: ["fetchAllPodridaMatches"],
    queryFn: fetchAllPodridaMatches,
  });
  const { data: roundsData } = useQuery({
    queryKey: ["fetchAllTournamentRounds"],
    queryFn: fetchAllTournamentRounds,
  });

  const cronicasCount = cronicasData?.cronicas?.length       ?? "—";
  const podridaCount  = podridaData?.matches?.length
                     ?? podridaData?.podridaMatches?.length  ?? "—";
  const chachosCount  = roundsData?.tournamentRounds?.length ?? "—";

  const scrollToSections = () => {
    sectionsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sections = [
    { to: "/chachos",  icon: <IconUsers    color="#a8dadc" />, label: "01", title: "Chachos",  desc: "Estadísticas, fechas y plantel del equipo", mod: "teal"   },
    { to: "/podrida",  icon: <IconLayers   color="#f6c90e" />, label: "02", title: "Podrida",  desc: "Rankings y récords históricos del juego",  mod: "yellow" },
    { to: "/prode",    icon: <IconBars     color="#f97316" />, label: "03", title: "Prode",    desc: "Posiciones y resultados del torneo actual", mod: "orange" },
    { to: "/cronicas", icon: <IconOpenBook color="#e63946" />, label: "04", title: "Crónicas", desc: "La historia del grupo contada en palabras",  mod: "red"    },
  ];

  return (
    <div className="hw">

      {/* ────────── HERO ────────────────────────────────── */}
      <section className="hw-hero">
        <div className="hw-hero-bg" aria-hidden="true">
          <div className="hw-hero-bg-glow" />
        </div>
        <div className="hw-hero-vline" aria-hidden="true" />

        <div className="hw-hero-inner">

          {/* Izquierda: texto */}
          <div className="hw-hero-content">
            <p className="hw-eyebrow">
              <span className="hw-eyebrow-dot" aria-hidden="true" />
              Temporada {currentYear}
            </p>
            <h1 className="hw-title">
              <span className="hw-title-line hw-title-line--1">El Rincón</span>
              <span className="hw-title-line hw-title-line--2">de</span>
              <span className="hw-title-line hw-title-line--3">Chacho</span>
            </h1>
            <p className="hw-subtitle">
              El punto de encuentro entre amigos,<br />
              fútbol y apuestas.
            </p>
            <div className="hw-ctas">
              <button onClick={scrollToSections} className="hw-cta-primary">
                Explorar el sitio
                <span className="hw-cta-ico"><IconChevronDown /></span>
              </button>
              <Link to="/photo-gallery" className="hw-cta-ghost">Galería</Link>
            </div>
          </div>

          {/* Derecha: stats libres 2x2 */}
          <div className="hw-hero-right">
            <div className="hw-stats-free">
              <StatCard value={yearsRunning}  label="Años"                delay={800}  />
              <StatCard value={podridaCount}  label="Podridas"            delay={950}  />
              <StatCard value={chachosCount}  label="Partidos de Chachos" delay={1100} />
              <StatCard value={cronicasCount} label="Crónicas"            delay={1250} />
            </div>
          </div>

        </div>

        {/* Barra inferior */}
        <div className="hw-hero-bar">
          <span className="hw-hero-bar-text">amigos · fútbol · apuestas · memoria</span>
          <span className="hw-hero-bar-year">{currentYear}</span>
        </div>
      </section>

      {/* ────────── SECCIONES ───────────────────────────── */}
      <section className="hw-sections" ref={sectionsRef}>
        <div className="hw-sections-inner">

          <div className="hw-sections-head">
            <span className="hw-sections-tag">Explora</span>
            <h2 className="hw-sections-title">
              Todo lo que podés encontrar<br />
              <span className="hw-sections-title-accent">en el Rincón de Chacho</span>
            </h2>
          </div>

          <div className="hw-grid" ref={gridRef}>
            {sections.map((s) => (
              <div
                key={s.to}
                className={`hw-card hw-card--${s.mod}`}
                onClick={() => navigate(s.to)}
              >
                <div className="hw-card-top">
                  <span className="hw-card-num">{s.label}</span>
                  <span className="hw-card-ico">{s.icon}</span>
                </div>
                <h3 className="hw-card-title">{s.title}</h3>
                <p className="hw-card-desc">{s.desc}</p>
                <span className="hw-card-arrow"><IconArrow /></span>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
};

export default Home;
