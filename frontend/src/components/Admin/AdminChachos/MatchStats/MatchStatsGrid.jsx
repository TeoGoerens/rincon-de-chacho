//Import React
import React from "react";

//Import helpers
import { STAT_FIELDS } from "../../../../helpers/matchStatsFields";

//----------------------------------------
//COMPONENT
//Grilla de estadísticas por jugador, compartida entre Create/Update (editable)
//y Detail (solo lectura). En editable, statsByPlayer + onFieldChange son requeridos.
//----------------------------------------

const MatchStatsGrid = ({
  players,
  statsByPlayer,
  readOnly = false,
  onFieldChange,
}) => {
  const getValue = (player, field) => statsByPlayer?.[player._id]?.[field.key] ?? 0;

  return (
    <>
      {/* ── Desktop: grid ── */}
      <div className="msc-grid-wrap msc-desktop-only">
        <div className="msc-grid">
          <div className="msc-grid-header">
            <span className="msc-col-player">Jugador</span>
            {STAT_FIELDS.map((field) => (
              <span className="msc-col-stat" key={field.key}>
                {field.label}
              </span>
            ))}
          </div>

          {players?.map((player) => (
            <div className="msc-grid-row" key={player._id}>
              <span className="msc-col-player msc-player-name">
                #{player.shirt} {player.first_name} {player.last_name}
              </span>
              {STAT_FIELDS.map((field) => {
                const value = getValue(player, field);
                return readOnly ? (
                  <span
                    className={`msc-col-stat msc-col-stat--readonly ${
                      value > 0 ? "msc-col-stat--highlight" : ""
                    }`}
                    key={field.key}
                  >
                    {value}
                  </span>
                ) : (
                  <span className="msc-col-stat" key={field.key}>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={value}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        onFieldChange(player._id, field.key, e.target.value)
                      }
                    />
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile: cards apiladas ── */}
      <div className="msc-mobile-list">
        {players?.map((player) => (
          <div className="msc-mobile-card" key={player._id}>
            <span className="msc-mobile-card-name">
              #{player.shirt} {player.first_name} {player.last_name}
            </span>
            <div className="msc-mobile-stats-grid">
              {STAT_FIELDS.map((field) => {
                const value = getValue(player, field);
                return (
                  <div className="msc-mobile-stat" key={field.key}>
                    <span className="msc-mobile-stat-label">{field.label}</span>
                    {readOnly ? (
                      <span
                        className={`msc-col-stat--readonly ${
                          value > 0 ? "msc-col-stat--highlight" : ""
                        }`}
                      >
                        {value}
                      </span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={value}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) =>
                          onFieldChange(player._id, field.key, e.target.value)
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default MatchStatsGrid;
