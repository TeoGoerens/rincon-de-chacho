// Import React dependencies
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Imports CSS & helpers
import "./ProdeRecordsStyles.css";

//Import components
import ProdeMenu from "./ProdeMenu";
import SpinnerOverlay from "../Layout/Spinner/SpinnerOverlay";

//Import React Query functions
import fetchProdeRecords from "../../reactquery/prode/fetchProdeRecords";

const formatPts = (value) => `${value} pts`;
const formatFechas = (value) => (value === 1 ? "1 fecha" : `${value} fechas`);
const formatMargin = (value) => `+${value}`;
const formatCount = (value) => `${value}`;
const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;

/* Misma regla que el resto del sitio: foto de perfil propia si hay una
   cargada (las default de pixabay no cuentan), inicial si no */
const hasCustomPhoto = (pic) => pic && !pic.includes("pixabay.com");
const initialOf = (name) => (name ? name.charAt(0).toUpperCase() : "?");

const Avatar = ({ player, small = false }) => {
  const withPhoto = hasCustomPhoto(player?.avatar);
  return (
    <span
      className={`prr-avatar${small ? " prr-avatar--sm" : ""}${
        withPhoto ? " prr-avatar--photo" : ""
      }`}
    >
      {withPhoto ? (
        <img src={player.avatar} alt={player.name} />
      ) : (
        initialOf(player?.name)
      )}
    </span>
  );
};

/* Cards top-3 — sección Duelos y rachas (cross-era) */
const STREAK_RECORDS = [
  {
    key: "winStreak",
    title: "Racha de duelos ganados",
    hint: "Duelos ganados en fechas consecutivas",
    format: formatFechas,
  },
  {
    key: "unbeatenStreak",
    title: "Racha invicta",
    hint: "Fechas consecutivas sin perder el duelo",
    format: formatFechas,
  },
  {
    key: "losingStreak",
    title: "Racha de derrotas",
    hint: "Duelos perdidos en fechas consecutivas",
    format: formatFechas,
  },
  {
    key: "biggestProdeMargin",
    title: "Mayor paliza en la suma de prodes en una fecha",
    hint: "Mayor diferencia de puntos sumando Prode Argentina + Resto del Mundo en el duelo de una fecha",
    format: formatMargin,
  },
  {
    key: "biggestGdtMargin",
    title: "Mayor paliza en el Gran DT en una fecha",
    hint: "Mayor diferencia de mini-duelos ganados en el duelo de una fecha",
    format: formatMargin,
  },
];

/* Cards top-3 — sección Fechas, meses y torneos (cross-era) */
const FEATURE_RECORDS = [
  {
    key: "bestMatchday",
    title: "Mejor suma de prodes en una fecha",
    hint: "Más puntos sumando Prode Argentina + Resto del Mundo en una sola fecha",
    format: formatPts,
  },
  {
    key: "bestMonth",
    title: "Mejor mes histórico",
    hint: "Más puntos de duelo (con bonus) en un mes",
    format: formatPts,
  },
  {
    key: "bestTournament",
    title: "Mejor torneo histórico",
    hint: "Más puntos de duelo (con bonus) en un torneo",
    format: formatPts,
  },
  {
    key: "bestEfficiency",
    title: "Eficiencia récord",
    hint: "Mejor EF% en un torneo con al menos 8 fechas consolidadas",
    format: formatPercent,
  },
];

/* Vitrinas del palmarés — tiles centradas con el número protagonista */
const HONOR_RECORDS = [
  {
    key: "mostChampionships",
    title: "Más campeonatos",
    hint: "Torneos ganados",
    format: formatCount,
  },
  {
    key: "mostMeals",
    title: "Más comidas ganadas",
    hint: "Apariciones en el top 4 de un mes",
    format: formatCount,
  },
  {
    key: "mostOrganizer",
    title: "Más veces organizador",
    hint: "Últimos puestos de un mes",
    format: formatCount,
  },
  {
    key: "mostLastPlaces",
    title: "Más veces último",
    hint: "Últimos puestos de torneo",
    format: formatCount,
  },
];

/* Cards top-3 — sección Gran DT (solo-rebuild: hay datos desde 2026) */
const GDT_RECORDS = [
  {
    key: "bestSquadScore",
    title: "Mejor puntaje del plantel en una fecha",
    hint: "La mejor suma de puntos de los 11 del plantel en una fecha",
    format: formatPts,
  },
  {
    key: "worstSquadScore",
    title: "Menor puntaje del plantel en una fecha",
    hint: "La peor suma de puntos de los 11 del plantel en una fecha",
    format: formatPts,
  },
];

/* Pills de la tabla histórica por desafío */
const CHALLENGE_TABS = [
  { key: "arg", label: "ARG", title: "Prode Argentina" },
  { key: "misc", label: "RESTO", title: "Prode Resto del Mundo" },
  { key: "gdt", label: "GDT", title: "Gran DT" },
];

/* En GDT los "puntos" históricos son mini-duelos ganados → columna MD */
const tableColumns = (challenge) => [
  { key: "played", label: "PJ", title: "Desafíos jugados" },
  challenge === "gdt"
    ? { key: "points", label: "MD", title: "Mini-duelos del Gran DT ganados" }
    : { key: "points", label: "Pts", title: "Puntos sumados en el desafío" },
  { key: "won", label: "G", title: "Desafíos ganados" },
  { key: "drawn", label: "E", title: "Desafíos empatados" },
  { key: "lost", label: "P", title: "Desafíos perdidos" },
  {
    key: "efficiency",
    label: "EF%",
    title:
      "Eficiencia: 3 puntos por desafío ganado y 1 por empatado, sobre el máximo posible (PJ × 3)",
  },
];

const fireBadge = (
  <span className="prr-fire" title="Racha vigente">
    🔥
  </span>
);

/* Card de récord estilo podio: el 1° es protagonista con avatar y valor
   gigante; el 2° y el 3° quedan como filas compactas debajo */
const RecordCard = ({ config, groups }) => {
  const [first, ...runners] = groups ?? [];
  return (
    <article className="prr-card">
      <h3 className="prr-card-title" title={config.hint}>
        {config.title}
      </h3>
      {!first ? (
        <p className="prr-card-empty">Sin datos todavía.</p>
      ) : (
        <>
          <div className="prr-first">
            <div className="prr-first-holders">
              {first.holders.map((holder, index) => (
                <div
                  key={`${holder.player._id}-${index}`}
                  className="prr-first-holder"
                >
                  <Avatar player={holder.player} />
                  <div className="prr-first-info">
                    <span className="prr-first-name">
                      {holder.player.name}
                      {holder.active && fireBadge}
                    </span>
                    {holder.context && (
                      <span className="prr-first-context">
                        {holder.context}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <span className="prr-first-value">
              {config.format(first.value)}
            </span>
          </div>
          {runners.length > 0 && (
            <ol className="prr-runners">
              {runners.map((group) => (
                <li key={group.position} className="prr-runner">
                  <span className="prr-runner-pos">{group.position}</span>
                  {/* Solo nombre y valor: el contexto (fecha/torneo) queda
                      reservado para el 1° y la card respira */}
                  <div className="prr-runner-holders">
                    {group.holders.map((holder, index) => (
                      <span
                        key={`${holder.player._id}-${index}`}
                        className="prr-runner-name"
                      >
                        {holder.player.name}
                        {holder.active && fireBadge}
                      </span>
                    ))}
                  </div>
                  <span className="prr-runner-value">
                    {config.format(group.value)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </article>
  );
};

/* Vitrina del palmarés: número gigante centrado, dueños abajo */
const TrophyTile = ({ config, groups }) => {
  const [first, ...runners] = groups ?? [];
  return (
    <article className="prr-tile">
      <span className="prr-tile-label" title={config.hint}>
        {config.title}
      </span>
      {!first ? (
        <p className="prr-card-empty">Sin datos todavía.</p>
      ) : (
        <>
          <span className="prr-tile-value">{config.format(first.value)}</span>
          <div className="prr-tile-holders">
            {first.holders.map((holder, index) => (
              <span
                key={`${holder.player._id}-${index}`}
                className="prr-tile-holder"
              >
                <Avatar player={holder.player} small />
                {holder.player.name}
              </span>
            ))}
          </div>
          {runners.length > 0 && (
            <div className="prr-tile-runners">
              {runners.map((group) => (
                <span key={group.position} className="prr-tile-runner">
                  {group.position}°{" "}
                  {group.holders
                    .map((holder) => holder.player.name)
                    .join(" · ")}{" "}
                  — {config.format(group.value)}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </article>
  );
};

/* Pestaña Records: el salón de records histórico del Prode (3.9) */
const ProdeRecords = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["prode-records"],
    queryFn: fetchProdeRecords,
  });

  const [challenge, setChallenge] = useState("arg");
  const [sortKey, setSortKey] = useState("points");

  const records = data?.records ?? {};
  const scope = data?.scope ?? null;

  const columns = tableColumns(challenge);
  const tableRows = useMemo(() => {
    const rows = data?.challengeTable ?? [];
    return [...rows].sort((a, b) => {
      const valueOf = (row) => row[challenge]?.[sortKey] ?? -1;
      return (
        valueOf(b) - valueOf(a) ||
        a.player.name.localeCompare(b.player.name, "es")
      );
    });
  }, [data, challenge, sortKey]);

  return (
    <>
      <ProdeMenu />
      <div className="prr-root">
        <header className="prr-header">
          <span className="prr-eyebrow">
            <span className="prr-eyebrow-dot" />
            Prode
          </span>
          <h1 className="prr-title">Records</h1>
        </header>

        {isLoading && <SpinnerOverlay />}

        {!isLoading && isError && (
          <div className="prr-state">
            <p className="prr-state-text">{error?.message}</p>
          </div>
        )}

        {!isLoading && !isError && data && scope?.matchdayCount === 0 && (
          <div className="prr-state">
            <p className="prr-state-text">
              Todavía no hay fechas consolidadas: los records aparecen acá
              cuando se juegue la primera.
            </p>
          </div>
        )}

        {!isLoading && !isError && data && scope?.matchdayCount > 0 && (
          <>
            {/* ── Hero del salón ── */}
            <section className="prr-hero">
              <div className="prr-hero-text">
                <span className="prr-hero-main">Salón de records</span>
                <span className="prr-hero-caption">
                  Todo lo que dejó la historia del Prode, fecha a fecha
                </span>
              </div>
              <div className="prr-hero-chips">
                <span className="prr-hero-chip">
                  <strong>{scope.tournamentCount}</strong>{" "}
                  {scope.tournamentCount === 1 ? "torneo" : "torneos"}
                </span>
                <span className="prr-hero-chip">
                  <strong>{scope.matchdayCount}</strong>{" "}
                  {scope.matchdayCount === 1
                    ? "fecha consolidada"
                    : "fechas consolidadas"}
                </span>
              </div>
            </section>

            {/* ── Duelos y rachas ── */}
            <section className="prr-section prr-delay-1">
              <div className="prr-section-head">
                <span className="prr-section-index">01</span>
                <h2 className="prr-section-title">Duelos y rachas</h2>
              </div>
              <div className="prr-grid">
                {STREAK_RECORDS.map((config) => (
                  <RecordCard
                    key={config.key}
                    config={config}
                    groups={records[config.key]}
                  />
                ))}
              </div>
            </section>

            {/* ── Fechas, meses y torneos ── */}
            <section className="prr-section prr-delay-2">
              <div className="prr-section-head">
                <span className="prr-section-index">02</span>
                <h2 className="prr-section-title">Fechas, meses y torneos</h2>
              </div>
              <div className="prr-grid">
                {FEATURE_RECORDS.map((config) => (
                  <RecordCard
                    key={config.key}
                    config={config}
                    groups={records[config.key]}
                  />
                ))}
              </div>
            </section>

            {/* ── Palmarés: vitrinas ── */}
            <section className="prr-section prr-delay-3">
              <div className="prr-section-head">
                <span className="prr-section-index">03</span>
                <h2 className="prr-section-title">Palmarés</h2>
              </div>
              <div className="prr-tiles">
                {HONOR_RECORDS.map((config) => (
                  <TrophyTile
                    key={config.key}
                    config={config}
                    groups={records[config.key]}
                  />
                ))}
              </div>
            </section>

            {/* ── Historial por desafío ── */}
            <section className="prr-section prr-delay-4">
              <div className="prr-section-head">
                <span className="prr-section-index">04</span>
                <h2 className="prr-section-title">Historial por desafío</h2>
                <span className="prr-section-hint">
                  Tocá una columna para ordenar
                </span>
              </div>
              <div className="prr-pills" role="tablist" aria-label="Desafío">
                {CHALLENGE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`prr-pill${
                      challenge === tab.key ? " prr-pill--active" : ""
                    }`}
                    onClick={() => setChallenge(tab.key)}
                    title={tab.title}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="prr-table-wrap">
                <table className="prr-table">
                  <colgroup>
                    <col className="prr-col--name" />
                    {columns.map((col) => (
                      <col key={col.key} className="prr-col--stat" />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="prr-th prr-th--name">Participante</th>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className={`prr-th prr-th--sortable${
                            sortKey === col.key ? " prr-th--active" : ""
                          }`}
                          title={col.title}
                          onClick={() => setSortKey(col.key)}
                        >
                          <span>{col.label}</span>
                          <span className="prr-sort-icon">▼</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => {
                      const stats = row[challenge] ?? {};
                      return (
                        <tr key={row.player._id} className="prr-tr">
                          <td className="prr-td prr-td--name">
                            <div className="prr-td-name-inner">
                              <span className="prr-name-text">
                                {row.player.name}
                              </span>
                            </div>
                          </td>
                          {columns.map((col) => {
                            const value = stats[col.key];
                            const display =
                              col.key === "efficiency"
                                ? value === null || value === undefined
                                  ? "—"
                                  : formatPercent(value)
                                : (value ?? 0);
                            const isZero =
                              col.key === "efficiency"
                                ? value === null || value === undefined
                                : (value ?? 0) === 0;
                            return (
                              <td
                                key={col.key}
                                className={`prr-td${
                                  sortKey === col.key ? " prr-td--sorted" : ""
                                }${isZero ? " prr-td--zero" : ""}`}
                              >
                                {display}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {challenge === "gdt" && (
                <p className="prr-legend">
                  En el Gran DT la columna MD cuenta mini-duelos ganados, no
                  puntos de plantel.
                </p>
              )}
            </section>

            {/* ── Gran DT ── */}
            <section className="prr-section prr-delay-5">
              <div className="prr-section-head">
                <span className="prr-section-index">05</span>
                <h2 className="prr-section-title">Gran DT</h2>
              </div>
              <div className="prr-grid">
                {GDT_RECORDS.map((config) => (
                  <RecordCard
                    key={config.key}
                    config={config}
                    groups={records[config.key]}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
};

export default ProdeRecords;
