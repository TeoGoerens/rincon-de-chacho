// Import React dependencies
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeFormStyles.css";
import "../ProdeIndexStyles.css";
import { formatDeadline, toDatetimeLocalValue } from "../prodeAdminConstants";

//Import components
import SpinnerOverlay from "../../../Layout/Spinner/SpinnerOverlay";
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import { IconEdit } from "../../../Layout/Buttons/ActionIcons";

//Import React Query functions
import addProdeMatchdayItem from "../../../../reactquery/prode/addProdeMatchdayItem";
import updateProdeMatchdayItem from "../../../../reactquery/prode/updateProdeMatchdayItem";
import deleteProdeMatchdayItem from "../../../../reactquery/prode/deleteProdeMatchdayItem";
import fetchProdeSportsLeagues from "../../../../reactquery/prode/fetchProdeSportsLeagues";
import fetchProdeLeagueUpcomingEvents from "../../../../reactquery/prode/fetchProdeLeagueUpcomingEvents";
import addProdeMatchdayItemsFromCatalog from "../../../../reactquery/prode/addProdeMatchdayItemsFromCatalog";

const CHALLENGE_CARDS = [
  { code: "ARG", title: "Prode Argentina" },
  { code: "MISC", title: "Prode Resto del Mundo" },
];

const emptyMatchValues = {
  leagueName: "",
  homeName: "",
  awayName: "",
  kickoff: "",
  pointsHome: "5",
  pointsDraw: "5",
  pointsAway: "5",
};

const emptyQuestionValues = {
  questionText: "",
  pointsCorrect: "5",
};

const isValidPoints = (value) =>
  value !== "" && Number.isInteger(Number(value)) && Number(value) >= 0;

const plural = (count, singular, pluralWord) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

const ProdeMatchdayItems = ({ matchday }) => {
  const queryClient = useQueryClient();
  const items = matchday.items ?? [];
  const locked = matchday.phase !== "draft" && matchday.phase !== "open";

  /* form = { challenge, kind, itemId (null = alta), source, values } */
  const [form, setForm] = useState(null);

  /* catalog = { challenge, leagueId, selected: [providerEventId] } */
  const [catalog, setCatalog] = useState(null);

  const addedProviderIds = new Set(
    items
      .filter((item) => item.providerEventId)
      .map((item) => String(item.providerEventId)),
  );

  const invalidate = () => {
    queryClient.invalidateQueries(["prode-matchday", matchday._id]);
    queryClient.invalidateQueries(["prode-matchdays"]);
  };

  const addMutation = useMutation({
    mutationFn: addProdeMatchdayItem,
    onSuccess: () => {
      toast.success("Ítem agregado");
      invalidate();
      setForm(null);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al agregar el ítem");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProdeMatchdayItem,
    onSuccess: () => {
      toast.success("Ítem actualizado");
      invalidate();
      setForm(null);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al actualizar el ítem");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProdeMatchdayItem,
    onSuccess: () => {
      toast.success("Ítem eliminado");
      invalidate();
    },
    onError: (error) => {
      toast.error(error?.message || "Error al eliminar el ítem");
    },
  });

  /* Catálogo: ligas solo cuando el panel está abierto; partidos próximos al
     elegir liga. El server cachea 5 min, acá alcanza con no re-pedir al toque */
  const leaguesQuery = useQuery({
    queryKey: ["prode-sports-leagues"],
    queryFn: fetchProdeSportsLeagues,
    enabled: catalog !== null,
    staleTime: 30 * 60 * 1000,
  });

  const upcomingQuery = useQuery({
    queryKey: ["prode-sports-upcoming", catalog?.leagueId],
    queryFn: () => fetchProdeLeagueUpcomingEvents(catalog.leagueId),
    enabled: Boolean(catalog?.leagueId),
    staleTime: 2 * 60 * 1000,
  });

  const catalogMutation = useMutation({
    mutationFn: addProdeMatchdayItemsFromCatalog,
    onSuccess: (data, variables) => {
      toast.success(
        plural(
          variables.events.length,
          "partido agregado",
          "partidos agregados",
        ),
      );
      invalidate();
      setCatalog(null);
    },
    onError: (error) => {
      toast.error(
        error?.message || "Error al agregar los partidos del catálogo",
      );
    },
  });

  const saving = addMutation.isPending || updateMutation.isPending;

  const openAdd = (challenge, kind) => {
    setCatalog(null);
    setForm({
      challenge,
      kind,
      itemId: null,
      values: kind === "match" ? emptyMatchValues : emptyQuestionValues,
    });
  };

  const openEdit = (item) => {
    setCatalog(null);
    setForm({
      challenge: item.challenge,
      kind: item.kind,
      itemId: item._id,
      source: item.source,
      values:
        item.kind === "match"
          ? {
              leagueName: item.leagueName ?? "",
              homeName: item.homeName ?? "",
              awayName: item.awayName ?? "",
              kickoff: toDatetimeLocalValue(item.kickoffAt),
              kickoffIso: item.kickoffAt ?? "",
              pointsHome: String(item.pointsHome ?? 5),
              pointsDraw: String(item.pointsDraw ?? 5),
              pointsAway: String(item.pointsAway ?? 5),
            }
          : {
              questionText: item.questionText ?? "",
              pointsCorrect: String(item.pointsCorrect ?? 5),
            },
    });
  };

  const openCatalog = (challenge) => {
    setForm(null);
    setCatalog({ challenge, leagueId: "", selected: [], points: {} });
  };

  /* Al tildar un partido se habilita su editor de puntos L/E/V (default 5);
     al destildarlo, sus puntos se descartan */
  const toggleCatalogEvent = (providerEventId) => {
    setCatalog((prev) => {
      const isOn = prev.selected.includes(providerEventId);
      const points = { ...prev.points };
      if (isOn) {
        delete points[providerEventId];
      } else {
        points[providerEventId] = {
          pointsHome: "5",
          pointsDraw: "5",
          pointsAway: "5",
        };
      }
      return {
        ...prev,
        selected: isOn
          ? prev.selected.filter((id) => id !== providerEventId)
          : [...prev.selected, providerEventId],
        points,
      };
    });
  };

  const setCatalogPoints = (providerEventId, field, value) => {
    setCatalog((prev) => ({
      ...prev,
      points: {
        ...prev.points,
        [providerEventId]: {
          ...prev.points[providerEventId],
          [field]: value,
        },
      },
    }));
  };

  const submitCatalog = () => {
    catalogMutation.mutate({
      matchdayId: matchday._id,
      challenge: catalog.challenge,
      leagueId: catalog.leagueId,
      events: catalog.selected.map((providerEventId) => ({
        providerEventId,
        ...catalog.points[providerEventId],
      })),
    });
  };

  const setValue = (field, value) => {
    setForm((prev) => ({
      ...prev,
      values: { ...prev.values, [field]: value },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { challenge, kind, itemId, values } = form;

    let item;
    if (kind === "match" && form.source === "api") {
      /* Ítem del catálogo: solo los puntos son del admin */
      if (
        !isValidPoints(values.pointsHome) ||
        !isValidPoints(values.pointsDraw) ||
        !isValidPoints(values.pointsAway)
      ) {
        toast.error("Los puntos del partido deben ser enteros de 0 o más");
        return;
      }
      item = {
        challenge,
        kind,
        pointsHome: Number(values.pointsHome),
        pointsDraw: Number(values.pointsDraw),
        pointsAway: Number(values.pointsAway),
      };
    } else if (kind === "match") {
      if (!values.homeName.trim() || !values.awayName.trim()) {
        toast.error("El partido debe tener equipo local y visitante");
        return;
      }
      if (
        values.homeName.trim().toLowerCase() ===
        values.awayName.trim().toLowerCase()
      ) {
        toast.error("Local y visitante no pueden ser el mismo equipo");
        return;
      }
      if (!values.kickoff) {
        toast.error("Fijá el kickoff del partido");
        return;
      }
      if (
        !isValidPoints(values.pointsHome) ||
        !isValidPoints(values.pointsDraw) ||
        !isValidPoints(values.pointsAway)
      ) {
        toast.error("Los puntos del partido deben ser enteros de 0 o más");
        return;
      }
      item = {
        challenge,
        kind,
        leagueName: values.leagueName.trim(),
        homeName: values.homeName.trim(),
        awayName: values.awayName.trim(),
        kickoffAt: new Date(values.kickoff).toISOString(),
        pointsHome: Number(values.pointsHome),
        pointsDraw: Number(values.pointsDraw),
        pointsAway: Number(values.pointsAway),
      };
    } else {
      if (!values.questionText.trim()) {
        toast.error("La pregunta no puede estar vacía");
        return;
      }
      if (!isValidPoints(values.pointsCorrect)) {
        toast.error("Los puntos de la pregunta deben ser enteros de 0 o más");
        return;
      }
      item = {
        challenge,
        kind,
        questionText: values.questionText.trim(),
        pointsCorrect: Number(values.pointsCorrect),
      };
    }

    if (itemId) {
      updateMutation.mutate({ matchdayId: matchday._id, itemId, item });
    } else {
      addMutation.mutate({ matchdayId: matchday._id, item });
    }
  };

  const renderPointsField = () => (
    <div className="prf-field">
      <label>Puntos por acertar (local / empate / visitante)</label>
      <div className="prf-points-row">
        <input
          type="number"
          min="0"
          value={form.values.pointsHome}
          onChange={(e) => setValue("pointsHome", e.target.value)}
          required
        />
        <input
          type="number"
          min="0"
          value={form.values.pointsDraw}
          onChange={(e) => setValue("pointsDraw", e.target.value)}
          required
        />
        <input
          type="number"
          min="0"
          value={form.values.pointsAway}
          onChange={(e) => setValue("pointsAway", e.target.value)}
          required
        />
      </div>
      <p className="prf-hint">
        El bonus por marcador exacto es siempre 5 puntos fijos.
      </p>
    </div>
  );

  const renderForm = () => (
    <form className="prf-item-form" onSubmit={handleSubmit}>
      {form.kind === "match" && form.source === "api" ? (
        <>
          <div className="prf-field">
            <label>Partido del catálogo</label>
            <p className="prf-catalog-locked">
              {form.values.homeName} vs {form.values.awayName}
            </p>
            <p className="prf-hint">
              {[
                form.values.leagueName,
                formatDeadline(form.values.kickoffIso),
              ]
                .filter(Boolean)
                .join(" · ")}{" "}
              — equipos y horario vienen del catálogo y no se editan a mano.
            </p>
          </div>
          {renderPointsField()}
        </>
      ) : form.kind === "match" ? (
        <>
          <div className="prf-field">
            <label>Liga / competencia (opcional)</label>
            <input
              type="text"
              value={form.values.leagueName}
              onChange={(e) => setValue("leagueName", e.target.value)}
              placeholder="Liga Profesional, Premier League..."
            />
          </div>
          <div className="prf-player-row">
            <div className="prf-field">
              <label>Local</label>
              <input
                type="text"
                value={form.values.homeName}
                onChange={(e) => setValue("homeName", e.target.value)}
                required
              />
            </div>
            <div className="prf-field">
              <label>Visitante</label>
              <input
                type="text"
                value={form.values.awayName}
                onChange={(e) => setValue("awayName", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="prf-field">
            <label>Kickoff</label>
            <input
              type="datetime-local"
              value={form.values.kickoff}
              onChange={(e) => setValue("kickoff", e.target.value)}
              required
            />
          </div>
          {renderPointsField()}
        </>
      ) : (
        <>
          <div className="prf-field">
            <label>Pregunta</label>
            <textarea
              rows={2}
              value={form.values.questionText}
              onChange={(e) => setValue("questionText", e.target.value)}
              placeholder="¿Quién gana la Copa Sudamericana?"
              required
            />
          </div>
          <div className="prf-field">
            <label>Puntos por acertar</label>
            <input
              type="number"
              min="0"
              value={form.values.pointsCorrect}
              onChange={(e) => setValue("pointsCorrect", e.target.value)}
              required
            />
          </div>
        </>
      )}

      <div className="prf-item-form-actions">
        <button type="submit" className="prf-submit-btn" disabled={saving}>
          {saving
            ? "Guardando..."
            : form.itemId
              ? "Guardar cambios"
              : "Agregar"}
        </button>
        <button
          type="button"
          className="prf-cancel-btn"
          onClick={() => setForm(null)}
        >
          Cancelar
        </button>
      </div>
    </form>
  );

  const renderCatalog = () => {
    const leagues = leaguesQuery.data ?? [];
    const events = upcomingQuery.data ?? [];
    const adding = catalogMutation.isPending;

    return (
      <div className="prf-catalog">
        <div className="prf-field">
          <label>Liga del catálogo</label>
          <select
            value={catalog.leagueId}
            onChange={(e) =>
              setCatalog((prev) => ({
                ...prev,
                leagueId: e.target.value,
                selected: [],
                points: {},
              }))
            }
          >
            <option value="">Elegí una liga...</option>
            {leagues.map((league) => (
              <option key={league.id} value={league.id}>
                {league.name}
              </option>
            ))}
          </select>
          {leaguesQuery.isLoading && (
            <p className="prf-hint">Cargando ligas...</p>
          )}
          {leaguesQuery.isError && (
            <p className="prf-hint">
              {leaguesQuery.error?.message ||
                "Error al cargar las ligas del catálogo"}
            </p>
          )}
        </div>

        {Boolean(catalog.leagueId) && (
          <>
            {upcomingQuery.isLoading && (
              <p className="prf-hint">Buscando partidos próximos...</p>
            )}
            {upcomingQuery.isError && (
              <p className="prf-hint">
                {upcomingQuery.error?.message ||
                  "Error al cargar los partidos próximos de la liga"}
              </p>
            )}
            {upcomingQuery.isSuccess && events.length === 0 && (
              <p className="prf-hint">
                La liga no tiene partidos próximos en el catálogo.
              </p>
            )}
            {events.length > 0 && (
              <div className="prf-catalog-list">
                {events.map((event) => {
                  const added = addedProviderIds.has(
                    String(event.providerEventId),
                  );
                  const selected = catalog.selected.includes(
                    event.providerEventId,
                  );
                  return (
                    <React.Fragment key={event.providerEventId}>
                      <button
                        type="button"
                        className={`prf-catalog-row${
                          added ? " prf-catalog-row--added" : ""
                        }`}
                        disabled={added || adding}
                        onClick={() =>
                          toggleCatalogEvent(event.providerEventId)
                        }
                      >
                        {/* divs (no spans): button:hover span escala globalmente */}
                        <div
                          className={`prf-catalog-check${
                            selected ? " prf-catalog-check--on" : ""
                          }`}
                        />
                        <div className="prf-item-body">
                          <div className="prf-item-main">
                            {event.homeTeam} vs {event.awayTeam}
                          </div>
                          <div className="prf-item-meta">
                            {[
                              formatDeadline(event.kickoff),
                              event.round ? `Fecha ${event.round}` : "",
                              added ? "Ya está en la fecha" : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </div>
                      </button>
                      {/* Editor compacto de puntos del partido tildado:
                          L/E/V abreviados con el nombre completo en el
                          tooltip (default 5) */}
                      {selected && (
                        <div className="prf-catalog-pts">
                          <span className="prf-catalog-pts-label">
                            Puntos por acertar
                          </span>
                          {[
                            {
                              field: "pointsHome",
                              short: "L",
                              full: event.homeTeam,
                            },
                            {
                              field: "pointsDraw",
                              short: "E",
                              full: "Empate",
                            },
                            {
                              field: "pointsAway",
                              short: "V",
                              full: event.awayTeam,
                            },
                          ].map(({ field, short, full }) => (
                            <label
                              className="prf-catalog-pts-input"
                              key={field}
                              title={full}
                            >
                              <span>{short}</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={
                                  catalog.points[event.providerEventId]?.[
                                    field
                                  ] ?? "5"
                                }
                                onChange={(e) =>
                                  setCatalogPoints(
                                    event.providerEventId,
                                    field,
                                    e.target.value,
                                  )
                                }
                                disabled={adding}
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="prf-item-form-actions">
          <button
            type="button"
            className="prf-submit-btn"
            disabled={catalog.selected.length === 0 || adding}
            onClick={submitCatalog}
          >
            {adding
              ? "Agregando..."
              : catalog.selected.length === 0
                ? "Agregar partidos"
                : `Agregar ${plural(
                    catalog.selected.length,
                    "partido",
                    "partidos",
                  )}`}
          </button>
          <button
            type="button"
            className="prf-cancel-btn"
            onClick={() => setCatalog(null)}
            disabled={adding}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  };

  const renderItemRow = (item) => (
    <div className="prf-item-row" key={item._id}>
      <span className={`prf-item-kind prf-item-kind--${item.kind}`}>
        {item.kind === "match" ? "Partido" : "Pregunta"}
      </span>
      {item.source === "api" && <span className="prf-item-source">API</span>}
      <div className="prf-item-body">
        <span className="prf-item-main">
          {item.kind === "match"
            ? `${item.homeName} vs ${item.awayName}`
            : item.questionText}
        </span>
        <span className="prf-item-meta">
          {item.kind === "match"
            ? [
                item.leagueName,
                formatDeadline(item.kickoffAt),
                `${item.pointsHome}-${item.pointsDraw}-${item.pointsAway} pts`,
              ]
                .filter(Boolean)
                .join(" · ")
            : `${item.pointsCorrect} pts`}
        </span>
      </div>
      {!locked && (
        <div className="pri-actions">
          <button type="button" onClick={() => openEdit(item)}>
            <span className="edit-button">
              <IconEdit />
            </span>
            <span className="tooltip-text">Editar</span>
          </button>
          <DeleteButton
            onClick={deleteMutation.mutate}
            id={{ matchdayId: matchday._id, itemId: item._id }}
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      {deleteMutation.isPending && <SpinnerOverlay />}

      {CHALLENGE_CARDS.map(({ code, title }) => {
        const challengeItems = items.filter((i) => i.challenge === code);
        const matchCount = challengeItems.filter(
          (i) => i.kind === "match",
        ).length;
        const questionCount = challengeItems.length - matchCount;
        const formIsHere = form?.challenge === code;

        return (
          <section className="prf-form" key={code}>
            <div className="prf-card-title">
              {title}
              {challengeItems.length > 0 && (
                <span className="prf-card-count">
                  {`${plural(matchCount, "partido", "partidos")} · ${plural(
                    questionCount,
                    "pregunta",
                    "preguntas",
                  )}`}
                </span>
              )}
            </div>

            {challengeItems.length === 0 && (
              <p className="prf-hint">
                Todavía no hay ítems en este prode.
              </p>
            )}

            <div className="prf-items-list">
              {challengeItems.map((item) =>
                formIsHere && form.itemId === item._id
                  ? <React.Fragment key={item._id}>{renderForm()}</React.Fragment>
                  : renderItemRow(item),
              )}
            </div>

            {formIsHere && !form.itemId && renderForm()}

            {catalog?.challenge === code && renderCatalog()}

            {locked ? (
              <p className="prf-hint">
                Los ítems ya no pueden modificarse en esta instancia de la
                fecha.
              </p>
            ) : (
              <div className="prf-item-add-row">
                <button
                  type="button"
                  className="prf-add-item-btn"
                  onClick={() => openCatalog(code)}
                >
                  + Desde catálogo
                </button>
                <button
                  type="button"
                  className="prf-add-item-btn"
                  onClick={() => openAdd(code, "match")}
                >
                  + Partido
                </button>
                <button
                  type="button"
                  className="prf-add-item-btn"
                  onClick={() => openAdd(code, "question")}
                >
                  + Pregunta
                </button>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
};

export default ProdeMatchdayItems;
