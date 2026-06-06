import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import "./ChachosTournamentRoundsStyles.css";
import { formatDate } from "../../../helpers/dateFormatter";
import ChachosMenu from "../ChachosMenu";
import VoteButton from "../../Layout/Buttons/VoteButton";
import ViewResultsButton from "../../Layout/Buttons/ViewResultsButton";
import fetchAllTournamentRounds from "../../../reactquery/chachos/fetchAllTournamentRounds";
import fetchVoteByVoterAndRound from "../../../reactquery/chachos/fetchVoteByVoterAndRound";
import { getUserId } from "../../../reactquery/getUserInformation";


const resultMeta = (round) => {
  if (round.win)    return { cls: "win",    label: "V" };
  if (round.draw)   return { cls: "draw",   label: "E" };
  if (round.defeat) return { cls: "defeat", label: "D" };
  return { cls: "neutral", label: "—" };
};

const RESULT_PILLS = [
  { key: "",        label: "Todos",    short: "J" },
  { key: "win",     label: "Victoria", short: "V" },
  { key: "draw",    label: "Empate",   short: "E" },
  { key: "defeat",  label: "Derrota",  short: "D" },
];

const ChachosTournamentRounds = () => {
  const [selectedYear,   setSelectedYear]   = useState("");
  const [selectedResult, setSelectedResult] = useState("");
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tournament-rounds"],
    queryFn: fetchAllTournamentRounds,
    staleTime: 0,
  });

  const tournamentRounds = data?.tournamentRounds ?? [];

  // Round abierto para votar (puede ser null)
  const openRound = useMemo(
    () => tournamentRounds.find((r) => r.open_for_vote) ?? null,
    [tournamentRounds]
  );

  const userId = getUserId();

  const { data: voteData } = useQuery({
    queryKey: ["cf-my-vote", openRound?._id, userId],
    queryFn:  () => fetchVoteByVoterAndRound(openRound._id),
    enabled:  !!openRound && !!userId,
    staleTime: 5 * 60 * 1000,
    retry:    false,
  });

  const alreadyVoted = !!voteData?.usersVote;

  // Años únicos disponibles
  const years = useMemo(() => {
    const unique = [...new Set(
      tournamentRounds.map((r) => r.tournament?.year).filter(Boolean)
    )];
    return unique.sort((a, b) => b - a);
  }, [tournamentRounds]);

  // Rounds filtrados solo por año (para las stats del header)
  const yearFilteredRounds = useMemo(() => {
    if (!selectedYear) return tournamentRounds;
    return tournamentRounds.filter((r) => r.tournament?.year === selectedYear);
  }, [tournamentRounds, selectedYear]);

  // Rounds filtrados por año + resultado (para la tabla)
  const filteredRounds = useMemo(() => {
    if (!selectedResult) return yearFilteredRounds;
    return yearFilteredRounds.filter((r) => r[selectedResult] === true);
  }, [yearFilteredRounds, selectedResult]);

  // Stats del header (solo filtro año)
  const stats = useMemo(() => ({
    total:   yearFilteredRounds.length,
    wins:    yearFilteredRounds.filter((r) => r.win).length,
    draws:   yearFilteredRounds.filter((r) => r.draw).length,
    defeats: yearFilteredRounds.filter((r) => r.defeat).length,
  }), [yearFilteredRounds]);


  return (
    <>
      <ChachosMenu />

      <div className="cf">

        {/* ── Header ── */}
        <div className="cf-header">
          <div className="cf-eyebrow"><span className="cf-eyebrow-dot" />Chachos</div>
          <h1 className="cf-title">Fechas</h1>
        </div>

        {/* ── Filtros ── */}
        <div className="cf-filters-row">
          <div className="cf-dd" ref={dropdownRef}>
            <button
              type="button"
              className={`cf-dd-trigger${dropdownOpen ? " cf-dd-trigger--open" : ""}`}
              onClick={() => setDropdownOpen((o) => !o)}
            >
              <div className="cf-dd-trigger-inner">
                <div className="cf-dd-label">Año</div>
                <div className="cf-dd-value">
                  {selectedYear ? selectedYear : "Todos los años"}
                </div>
              </div>
              <svg className={`cf-dd-chevron${dropdownOpen ? " cf-dd-chevron--open" : ""}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {dropdownOpen && (
              <ul className="cf-dd-list" role="listbox">
                {["", ...years].map((y) => (
                  <li
                    key={y}
                    role="option"
                    aria-selected={selectedYear === y}
                    className={`cf-dd-item${selectedYear === y ? " cf-dd-item--active" : ""}`}
                    onClick={() => { setSelectedYear(y); setDropdownOpen(false); }}
                  >
                    {y === "" ? "Todos los años" : y}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="cf-filters-divider" />

          <div className="cf-result-pills">
            {RESULT_PILLS.map((p) => (
              <button
                key={p.key}
                type="button"
                title={p.label}
                className={`cf-result-pill cf-result-pill--${p.key || "all"}${selectedResult === p.key ? " cf-result-pill--active" : ""}`}
                onClick={() => setSelectedResult(p.key)}
              >
                {p.short}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stats strip ── */}
        {!isLoading && !isError && (
          <div className="cf-stats-strip">
            {[
              { value: stats.total,   label: "Jugadas",   cls: ""       },
              { value: stats.wins,    label: "Victorias", cls: "win"    },
              { value: stats.draws,   label: "Empates",   cls: "draw"   },
              { value: stats.defeats, label: "Derrotas",  cls: "defeat" },
            ].map(({ value, label, cls }) => (
              <div key={label} className={`cf-stat-item${cls ? ` cf-stat-item--${cls}` : ""}`}>
                <span className="cf-stat-value">{value}</span>
                <span className="cf-stat-label">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Sección heading ── */}
        <h2 className="cf-section-heading">Historial de fechas</h2>

        {/* ── Contenido ── */}
        {isError ? (
          <p className="cf-empty">Error al cargar las fechas.</p>
        ) : isLoading ? (
          <p className="cf-loading">Cargando fechas…</p>
        ) : filteredRounds.length === 0 ? (
          <p className="cf-empty">No se encontraron fechas para este año.</p>
        ) : (
          <div className="cf-card cf-table-card">
            <div className="cf-table-wrapper">
              <table className="cf-table">
                <colgroup>
                  <col className="cf-col--badge"       />
                  <col className="cf-col--rival"       />
                  <col className="cf-col--score"       />
                  <col className="cf-col--white-pearl" />
                  <col className="cf-col--black-pearl" />
                  <col className="cf-col--action"      />
                </colgroup>
                <thead>
                  <tr>
                    <th className="cf-th" />
                    <th className="cf-th cf-th--left">Partido</th>
                    <th className="cf-th cf-th--center">Marcador</th>
                    <th className="cf-th cf-th--left cf-th--white-pearl">⚪ Perla Blanca</th>
                    <th className="cf-th cf-th--left cf-th--black-pearl">⚫ Perla Negra</th>
                    <th className="cf-th" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRounds.map((round) => {
                    const { cls, label } = resultMeta(round);

                    const wp = round.white_pearl?.[0] ?? null;
                    const wpInitials = wp ? (wp.first_name?.[0] ?? "").toUpperCase() : null;

                    const bp = round.black_pearl?.[0] ?? null;
                    const bpInitials = bp ? (bp.first_name?.[0] ?? "").toUpperCase() : null;

                    return (
                      <tr key={round._id} className={`cf-tr cf-tr--${cls}${round.open_for_vote ? " cf-tr--active" : ""}`}>

                        <td className="cf-td cf-td--badge">
                          <span className={`cf-badge cf-badge--${cls}`}>{label}</span>
                        </td>

                        <td className="cf-td cf-td--rival">
                          <span className="cf-rival-name">{round.rival?.name}</span>
                          <span className="cf-rival-date">{formatDate(round.match_date)}</span>
                        </td>

                        <td className={`cf-td cf-td--score cf-score--${cls}`}>
                          {round.score_chachos} – {round.score_rival}
                        </td>

                        <td className="cf-td cf-td--mvp">
                          {wp ? (
                            <div className="cf-mvp-cell">
                              {wp.profile_picture
                                ? <img src={wp.profile_picture} alt={wp.first_name} className="cf-mvp-avatar" />
                                : <span className="cf-mvp-avatar cf-mvp-avatar--initials">{wpInitials}</span>
                              }
                              <span className="cf-mvp-name">{wp.first_name} {wp.last_name}</span>
                            </div>
                          ) : (
                            <span className="cf-pearl-empty">—</span>
                          )}
                        </td>

                        <td className="cf-td cf-td--black-pearl">
                          {bp ? (
                            <div className="cf-black-pearl-cell">
                              {bp.profile_picture
                                ? <img src={bp.profile_picture} alt={bp.first_name} className="cf-mvp-avatar" />
                                : <span className="cf-mvp-avatar cf-mvp-avatar--initials">{bpInitials}</span>
                              }
                              <span className="cf-black-pearl-name">{bp.first_name} {bp.last_name}</span>
                            </div>
                          ) : (
                            <span className="cf-pearl-empty">—</span>
                          )}
                        </td>

                        <td className="cf-td cf-td--action">
                          {round.open_for_vote
                            ? (!alreadyVoted
                                ? <VoteButton />
                                : <span className="cf-action-btn cf-action-btn--pending">En curso</span>
                              )
                            : <ViewResultsButton to={`${round._id}/results`} />
                          }
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default ChachosTournamentRounds;
