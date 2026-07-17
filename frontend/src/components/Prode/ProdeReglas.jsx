// Import React dependencies
import React from "react";
import { Link, useNavigate } from "react-router-dom";

// Imports CSS & helpers
import "./ProdeReglasStyles.css";

//Import components
import ProdeMenu from "./ProdeMenu";

/* Reglas del Prode (3.12): contenido estático, fiel a las reglas canónicas
   del grupo. Si una regla cambia, se corrige ACÁ y en el código que la
   implementa — nunca una sola de las dos. */
const ProdeReglas = () => {
  const navigate = useNavigate();

  /* Volver a la última pantalla desde la que se llegó; ruta absoluta solo
     como fallback de link directo */
  const goBack = (event) => {
    event.preventDefault();
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/prode");
  };

  return (
    <>
      <ProdeMenu />
      <div className="prl-root">
        <div className="prl-content">
          <header className="prl-header">
            <span className="prl-eyebrow">
              <span className="prl-eyebrow-dot" />
              Prode
            </span>
            <h1 className="prl-title">Reglas</h1>
            <p className="prl-subtitle">
              Cómo se juega, cómo se suma y cómo se define — todo lo que hay
              que saber para no llorar después.
            </p>
          </header>

          {/* ── 01 · Lo básico ── */}
          <section className="prl-section">
            <div className="prl-section-head">
              <span className="prl-section-index">01</span>
              <h2 className="prl-section-title">Lo básico</h2>
            </div>
            <div className="prl-card">
              <p>
                El Prode se juega en <strong>torneos semestrales</strong>{" "}
                entre los participantes anotados. En cada fecha, el admin
                arma <strong>duelos uno contra uno</strong>: todos juegan
                todas las fechas, siempre contra un rival distinto.
              </p>
              <p>
                Cada duelo se define por <strong>tres desafíos</strong>: el{" "}
                <strong>Prode Argentina</strong>, el{" "}
                <strong>Prode Resto del Mundo</strong> y el{" "}
                <strong>Gran DT</strong>. Ganás el desafío si sumás más que
                tu rival en él; el Gran DT vale doble.
              </p>
            </div>
          </section>

          {/* ── 02 · Los prodes ── */}
          <section className="prl-section">
            <div className="prl-section-head">
              <span className="prl-section-index">02</span>
              <h2 className="prl-section-title">
                Prode Argentina y Prode Resto del Mundo
              </h2>
            </div>
            <div className="prl-card">
              <p>
                Los dos funcionan igual: una lista de{" "}
                <strong>partidos y preguntas</strong> que arma el admin para
                cada fecha. Los ítems son los mismos para todos.
              </p>
              <ul className="prl-list">
                <li>
                  <strong>Partidos:</strong> se pronostica el resultado
                  (local, empate o visitante) <em>y</em> el marcador exacto —{" "}
                  <strong>los dos juntos, o el pronóstico no vale</strong>.
                  Pueden contradecirse a propósito: se evalúan por separado.
                </li>
                <li>
                  <strong>Puntos por partido:</strong> los define el admin
                  (por defecto 5 por acertar el resultado). Embocar el
                  marcador exacto suma un <strong>bonus fijo de +5</strong>,
                  aunque el resultado esté mal pronosticado.
                </li>
                <li>
                  <strong>Preguntas:</strong> respuesta de texto libre; el
                  admin arbitra quién acertó. Valen 5 puntos salvo que se
                  indique otra cosa.
                </li>
                <li>
                  <strong>Partido suspendido o postergado:</strong> el admin
                  lo anula y no suma puntos para nadie.
                </li>
              </ul>
            </div>
          </section>

          {/* ── 03 · Gran DT ── */}
          <section className="prl-section">
            <div className="prl-section-head">
              <span className="prl-section-index">03</span>
              <h2 className="prl-section-title">Gran DT</h2>
            </div>
            <div className="prl-card">
              <p>
                El fantasy del Prode: cada participante arma un{" "}
                <strong>plantel de 11 jugadores reales</strong> (1 arquero, 4
                defensores, 4 volantes y 2 delanteros) con una regla de
                hierro: <strong>máximo un jugador por club</strong>. El orden
                de los slots lo elegís vos y es estratégico.
              </p>
              <ul className="prl-list">
                <li>
                  <strong>Draft a ciegas:</strong> todos arman su plantel sin
                  ver los ajenos. Al revelarse, todo jugador elegido por{" "}
                  <strong>4 o más</strong> participantes{" "}
                  <strong>se quema para todo el torneo</strong> y quienes lo
                  tenían deben reemplazarlo — también a ciegas, las veces que
                  haga falta hasta que no queden quemas nuevas.
                </li>
                <li>
                  <strong>Exclusividad:</strong> después del draft, cada
                  jugador real pertenece a un solo plantel. Un reemplazo o un
                  entrante no puede estar en ningún otro plantel ni quemado.
                </li>
                <li>
                  <strong>Ventana mensual:</strong> hasta{" "}
                  <strong>2 cambios por mes</strong> en el equipo argentino,
                  a ciegas y simultáneos. El que sale queda ocupado hasta el
                  mes siguiente. Si 4 o más eligen al mismo entrante, también
                  se quema.
                </li>
                <li>
                  <strong>Mini-duelos:</strong> en cada fecha tu plantel
                  enfrenta al del rival <strong>slot contra slot</strong>{" "}
                  (arquero vs arquero, DEF1 vs DEF1...): 11 mini-duelos, y el
                  empate de puntaje no lo gana nadie. Gana el desafío quien
                  gane más mini-duelos.
                </li>
                <li>
                  <strong>Puntajes:</strong> el admin carga un número final
                  por jugador real por fecha. El que no jugó suma 0 — no hay
                  banco ni suplentes.
                </li>
                <li>
                  <strong>Conflicto de mercado:</strong> si una transferencia
                  te deja con dos jugadores del mismo club, el admin puede
                  bloquear al jugador en conflicto y suma 0 mientras dure.
                </li>
              </ul>
              <p>
                Puede haber hasta <strong>3 universos GDT por torneo</strong>
                : el principal de la liga argentina y hasta dos suplentes de
                otras ligas para fines de semana sin fútbol local. Los
                suplentes se draftean una vez y quedan fijos.
              </p>
            </div>
          </section>

          {/* ── 04 · El duelo y los puntos ── */}
          <section className="prl-section">
            <div className="prl-section-head">
              <span className="prl-section-index">04</span>
              <h2 className="prl-section-title">El duelo y los puntos</h2>
            </div>
            <div className="prl-card">
              <p>
                Cada desafío ganado suma para definir el duelo:{" "}
                <strong>los prodes valen 1 y el Gran DT vale 2</strong>. El
                que suma más, gana el duelo; los desafíos empatados no suman
                para nadie.
              </p>
              <ul className="prl-list">
                <li>
                  Duelo ganado: <strong>3 puntos</strong> · empatado:{" "}
                  <strong>1 punto</strong> · perdido: <strong>0</strong>.
                </li>
                <li>
                  <strong>Bonus +1</strong> por ganar{" "}
                  <strong>los tres desafíos</strong> del duelo (los empates
                  no cuentan como ganados).
                </li>
              </ul>
            </div>
          </section>

          {/* ── 05 · La carga ── */}
          <section className="prl-section">
            <div className="prl-section-head">
              <span className="prl-section-index">05</span>
              <h2 className="prl-section-title">La carga y el deadline</h2>
            </div>
            <div className="prl-card">
              <ul className="prl-list">
                <li>
                  Cada fecha tiene un <strong>deadline único</strong>. Hasta
                  ese momento podés cargar y corregir tus pronósticos las
                  veces que quieras; después, la carga se cierra sola.
                </li>
                <li>
                  Lo que no cargaste, <strong>suma 0</strong> — lo cargado
                  puntúa igual.
                </li>
                <li>
                  Antes del deadline solo ves tus pronósticos. Después del
                  deadline se revelan los de todos —{" "}
                  <strong>solo entre participantes</strong>.
                </li>
                <li>
                  Si te dormiste, el admin puede{" "}
                  <strong>reabrirte la carga</strong>: los partidos que ya
                  empezaron quedan bloqueados (van con 0) y no ves los
                  pronósticos ajenos hasta guardar.
                </li>
              </ul>
            </div>
          </section>

          {/* ── 06 · Tabla, comidas y desempates ── */}
          <section className="prl-section">
            <div className="prl-section-head">
              <span className="prl-section-index">06</span>
              <h2 className="prl-section-title">
                Tabla, comidas y desempates
              </h2>
            </div>
            <div className="prl-card">
              <ul className="prl-list">
                <li>
                  La tabla suma los puntos de duelo (bonus incluido) y se
                  actualiza con cada fecha consolidada.
                </li>
                <li>
                  <strong>Cada mes:</strong> los primeros 4 de la tabla
                  mensual ganan la comida; el último la organiza.
                </li>
                <li>
                  <strong>Cada torneo:</strong> el primero de la acumulada es
                  el campeón; el último... también pasa a la historia.
                </li>
              </ul>
              <p>
                Ante igualdad de puntos —en el mes o en el torneo— el orden
                se define por esta cadena, siempre sobre el período en juego:
              </p>
              <ol className="prl-chain">
                <li>Puntos totales</li>
                <li>Puntos sin bonus</li>
                <li>Mini-duelos del Gran DT ganados</li>
                <li>Puntos del Prode Argentina</li>
                <li>Puntos del Prode Resto del Mundo</li>
                <li>Orden alfabético (si llegaste hasta acá, abrazate)</li>
              </ol>
            </div>
          </section>

          <footer className="prl-footer">
            <Link className="prl-footer-link" to="/prode" onClick={goBack}>
              ← Volver
            </Link>
          </footer>
        </div>
      </div>
    </>
  );
};

export default ProdeReglas;
