import React from "react";
import { useQuery } from "@tanstack/react-query";
import fetchPodridaStats from "../../../reactquery/podrida/fetchPodridaStats";
import PodridaMenu from "../PodridaMenu";
import "./PodridaEstadisticasStyles.css";


/* ── helpers ── */
const getInitial = (name) => name?.[0]?.toUpperCase() ?? "?";

const fmtDays = (days) => {
  if (days === null || days === undefined) return null;
  if (days === 0) return "hoy";
  if (days === 1) return "1 día";
  return `${days} días`;
};

/* ── RecordCard ── */
const RecordCard = ({ record }) => {
  const isNeg    = record.type === "negativo";
  const isSequia = record.group === "sequias";
  const first    = record.top[0];

  return (
    <div className={`pe-card ${isNeg ? "pe-card--neg" : "pe-card--pos"}`}>
      <div className="pe-card__header">
        <span className={`pe-card__badge ${isNeg ? "pe-card__badge--neg" : "pe-card__badge--pos"}`}>
          {isNeg ? "−" : "+"}
        </span>
        <p className="pe-card__title">{record.title}</p>
      </div>

      {first && (
        <>
          <div className="pe-card__first">
            <div className="pe-card__avatar pe-card__avatar--lg">
              {getInitial(first.name)}
            </div>
            <div className="pe-card__first-info">
              <div className="pe-card__first-top">
                <span className="pe-card__first-name">{first.name}</span>
                {isSequia && first.active && (
                  <span className="pe-card__fire" title="Racha vigente">🔥</span>
                )}
              </div>
              <span className={`pe-card__first-value ${isNeg ? "pe-card__first-value--neg" : ""}`}>
                {first.value}
              </span>
              {isSequia && first.days !== null && (
                <span className="pe-card__first-days">{fmtDays(first.days)}</span>
              )}
            </div>
          </div>
        </>
      )}

      <div className="pe-card__runners">
        {(record.top ?? []).slice(1, 5).filter(Boolean).map((item, idx) => (
          <div
            key={idx}
            className={`pe-card__runner${isSequia && item.active ? " pe-card__runner--active" : ""}`}
          >
            <span className="pe-card__runner-pos">{idx + 2}°</span>
            <span className="pe-card__runner-name">{item.name}</span>
            {isSequia && item.active && <span className="pe-card__fire" title="Racha vigente">🔥</span>}
            <span className={`pe-card__runner-value ${isNeg ? "pe-card__runner-value--neg" : ""}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── RecordGroup ── */
const GROUP_SUBTITLES = {
  dominio: "Acumulado a lo largo de toda la historia",
  epicas:  "Lo mejor y lo peor de una sola noche",
  sequias: "El tramo más largo entre dos victorias o dos últimos puestos",
};

const GROUP_LEGEND = {
  sequias: <span className="pe-group__legend">🔥 racha vigente</span>,
};

const RecordGroup = ({ title, groupKey, records }) => (
  <section className="pe-group">
    <div className="pe-group__header">
      <h2 className="pe-group__title">{title}</h2>
      <div className="pe-group__subtitle-row">
        <p className="pe-group__subtitle">{GROUP_SUBTITLES[groupKey]}</p>
        {GROUP_LEGEND[groupKey] && (
          <>
            <span className="pe-group__legend-divider" />
            {GROUP_LEGEND[groupKey]}
          </>
        )}
      </div>
    </div>
    <div className="pe-group__grid">
      {records.map((record, i) => (
        <RecordCard key={i} record={record} />
      ))}
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
const PodridaEstadisticas = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["fetchPodridaStats"],
    queryFn: fetchPodridaStats,
  });

  const records = data?.records ?? [];

  const dominio = records.filter((r) => r.group === "dominio");
  const epicas  = records.filter((r) => r.group === "epicas");
  const sequias = records.filter((r) => r.group === "sequias");

  return (
    <>
      <PodridaMenu />
      <div className="pe-root">

        <div className="pe-header">
          <div className="pe-eyebrow">
            <span className="pe-eyebrow-dot" />
            Podrida
          </div>
          <h1 className="pe-title">Estadísticas</h1>
        </div>

        {isLoading && (
          <div className="pe-state">
            <p className="pe-state__text">Cargando estadísticas...</p>
          </div>
        )}

        {isError && (
          <div className="pe-state">
            <p className="pe-state__text pe-state__text--error">
              No se pudieron cargar las estadísticas.
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <RecordGroup title="Dominio histórico" groupKey="dominio" records={dominio} />
            <RecordGroup title="Noches épicas"     groupKey="epicas"  records={epicas}  />
            <RecordGroup title="Sequías"           groupKey="sequias" records={sequias} />
          </>
        )}
      </div>
    </>
  );
};

export default PodridaEstadisticas;
