import React from "react";
import { Link } from "react-router-dom";
import "../styles/ProdeUserSideStyles.css";

const ProdeReglas = () => {
  const premios = [
    { pos: 1, monto: "Campeón" },
    { pos: 2, monto: "-10 USD" },
    { pos: 3, monto: "-15 USD" },
    { pos: 4, monto: "-20 USD" },
    { pos: 5, monto: "-25 USD" },
    { pos: 6, monto: "-30 USD" },
    { pos: 7, monto: "-35 USD" },
    { pos: 8, monto: "-40 USD" },
    { pos: 9, monto: "-45 USD" },
    { pos: 10, monto: "-50 USD" },
  ];

  return (
    <div className="prode-user-home container">
      <header className="p-hero">
        <div className="p-hero-left">
          <span className="p-kicker">Competición Oficial</span>
          <h1 className="p-main-title" style={{ color: "#1a1a1a" }}>
            Reglas del Prode
          </h1>
        </div>
        <div className="p-hero-right">
          <Link className="p-btn p-btn-outline" to="/prode">
            Home
          </Link>
          <Link className="p-btn p-btn-outline" to="/prode/h2h">
            H2H
          </Link>
          <Link className="p-btn p-btn-outline" to="/prode/records">
            Records
          </Link>
        </div>
      </header>

      <div className="p-reglas-container fade-in">
        <main className="p-reglas-main-content">
          <section className="p-reglas-section">
            <h2 className="p-reglas-title">Liquidación de Duelos</h2>
            <div className="p-reglas-body">
              <p>
                El valor de los duelos se calcula en <strong>Dólar Blue</strong>{" "}
                (tipo vendedor al cierre) del día en que finaliza la fecha
                deportiva.
              </p>
              <ul className="p-reglas-list">
                <li>Duelos Regulares: 5 USD por enfrentamiento.</li>
                <li>Fechas de Clásicos: 10 USD por enfrentamiento.</li>
                <li>
                  Premio Historial: Reconocimiento especial para el ganador del
                  balance contra su clásico. Premio tentativo entre 50 y 100
                  USD.
                </li>
              </ul>
            </div>
          </section>

          <section className="p-reglas-section">
            <h2 className="p-reglas-title">Sistemas de Desempate</h2>
            <div className="p-reglas-body">
              <h3 className="p-reglas-subtitle">Tabla General</h3>
              <ul className="p-reglas-list">
                <li>1. Historial de duelos directos en el periodo.</li>
                <li>2. Diferencia de puntos bonus en duelos directos.</li>
                <li>3. Puntos totales Gran DT (última fecha jugada).</li>
                <li>4. Puntaje última fecha Prode Argentina.</li>
                <li>5. Puntaje última fecha Prode Misceláneo.</li>
              </ul>

              <h3 className="p-reglas-subtitle">Enfrentamientos Clásicos</h3>
              <ul className="p-reglas-list">
                <li>1. Puntos bonus acumulados entre sí.</li>
                <li>2. Rendimiento GDT última fecha de clásicos.</li>
                <li>3. Rendimiento Prode JC última fecha de clásicos.</li>
              </ul>
            </div>
          </section>

          <section className="p-reglas-section">
            <h2 className="p-reglas-title">Normas Gran DT</h2>
            <div className="p-reglas-body">
              <div className="p-reglas-warning-box">
                <strong>Cláusula de Exclusividad:</strong> Cualquier jugador
                seleccionado por 4 o más participantes al inicio del torneo será
                vetado. Esta medida busca fomentar la variedad de planteles.
              </div>
              <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
                * Los cambios de plantel durante el semestre deben respetar la
                disponibilidad de jugadores libres.
              </p>
            </div>
          </section>
        </main>

        <aside className="p-reglas-sidebar">
          <div className="p-premios-card">
            <h3 className="p-premios-title">Aporte s/ Posición</h3>
            <table className="p-premios-table">
              <tbody>
                {premios.map((p, idx) => (
                  <tr
                    key={idx}
                    className={`p-premios-row ${idx === 0 ? "champion" : ""}`}
                  >
                    <td className="p-premios-pos">{idx + 1}º</td>
                    <td className="p-premios-val">{p.monto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="p-premios-footer">
              Aportes convertibles a ARS utilizando la cotización del USD blue
              del día de pago correspondiente.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProdeReglas;
