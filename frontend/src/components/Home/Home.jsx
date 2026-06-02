import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import "./HomeStyles.css";

import fetchAllCronicas          from "../../reactquery/cronica/fetchAllCronicas";
import fetchAllPodridaMatches    from "../../reactquery/podrida/fetchAllPodridaMatches";
import fetchAllTournamentRounds  from "../../reactquery/chachos/fetchAllTournamentRounds";
import { IconUsers, IconLayers, IconBars, IconOpenBook } from "../Layout/Icons/SectionIcons";

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
                <span className="hw-card-watermark" aria-hidden="true">{s.label}</span>
                <div className="hw-card-ico-wrap">
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
