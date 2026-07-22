//Import React & Hooks
import React from "react";

//Import CSS & styles
import "./ProdeGuideStyles.css";

//----------------------------------------
//CONSTANTS
//----------------------------------------

const SECTIONS = [
  { id: "conceptos", num: "01", title: "Cómo funciona el juego" },
  { id: "jugadores", num: "02", title: "Jugadores y vínculos" },
  { id: "torneo", num: "03", title: "El torneo" },
  { id: "gdt-draft", num: "04", title: "Gran DT: universo y draft" },
  { id: "gdt-torneo", num: "05", title: "Gran DT durante el torneo" },
  { id: "crear-fecha", num: "06", title: "Crear y abrir una fecha" },
  { id: "fecha-viva", num: "07", title: "Fecha abierta y en juego" },
  { id: "consolidar", num: "08", title: "Consolidar la fecha" },
  { id: "cierres", num: "09", title: "Cierres automáticos y fin del torneo" },
];

//----------------------------------------
//SUB-COMPONENTS
//----------------------------------------

const Alert = ({ hard, children }) => (
  <div className={`pgu-alert${hard ? " pgu-alert--hard" : ""}`}>
    <span className="pgu-alert-tag">{hard ? "Crítico" : "Atención"}</span>
    <div className="pgu-alert-body">{children}</div>
  </div>
);

const Section = ({ id, num, title, children }) => (
  <section className="pgu-section" id={id}>
    <div className="pgu-section-head">
      <span className="pgu-section-num">{num}</span>
      <h2 className="pgu-section-title">{title}</h2>
    </div>
    {children}
  </section>
);

//----------------------------------------
//COMPONENT
//----------------------------------------

const ProdeGuide = () => {
  return (
    <div className="pgu">
      <div className="pgu-header">
        <div className="pgu-eyebrow">
          <span className="pgu-eyebrow-dot" />
          Prode · Manual de operación
        </div>
        <h1 className="pgu-title">Guía</h1>
        <p className="pgu-subtitle">
          El flujo recomendado para operar el Prode de punta a punta, en el
          orden real de un torneo, con los puntos que piden atención especial.
        </p>
      </div>

      <nav className="pgu-toc" aria-label="Índice de la guía">
        {SECTIONS.map((s) => (
          <a key={s.id} className="pgu-toc-link" href={`#${s.id}`}>
            <span className="pgu-toc-num">{s.num}</span>
            {s.title}
          </a>
        ))}
      </nav>

      {/* ── 01 · Conceptos ── */}
      <Section id="conceptos" num="01" title="Cómo funciona el juego">
        <p className="pgu-p">
          El torneo es semestral y se juega por fechas. En cada fecha los
          participantes se enfrentan en <strong>duelos 1 contra 1</strong> que
          el admin arma a mano (cantidad de duelos = participantes ÷ 2 — todos
          juegan todas las fechas).
        </p>
        <p className="pgu-p">
          Cada duelo se define por <strong>tres desafíos</strong>:{" "}
          <strong>Gran DT</strong> (vale 2), <strong>Prode Argentina</strong>{" "}
          (vale 1) y <strong>Prode Resto del Mundo</strong> (vale 1). El duelo
          lo gana el que suma más entre los desafíos que ganó. El ganador
          cobra <strong>3 puntos</strong>, el empate reparte{" "}
          <strong>1 y 1</strong>, el perdedor se va con 0. Hay un{" "}
          <strong>bonus de +1</strong> por ganar los tres desafíos (la barrida
          — un desafío empatado la arruina).
        </p>
        <ul className="pgu-list">
          <li>
            <strong>Prode Argentina y Prode Resto del Mundo</strong> son
            idénticos en estructura; la diferencia es puramente temática. Ambos
            admiten dos tipos de ítem: <strong>partidos</strong> (pick
            local/empate/visitante + marcador exacto, siempre los dos juntos) y{" "}
            <strong>preguntas de texto libre</strong> que arbitra el admin. Los
            partidos pueden salir del <strong>catálogo de la API</strong> o
            cargarse <strong>a mano</strong> — la carga manual sirve para
            proponer otro deporte, alguna liga exótica o el fútbol de CUBA (un
            resultado de los Chachos).
          </li>
          <li>
            <strong>Puntaje de un partido</strong>: acertar el 1X2 paga los
            puntos configurados para ese resultado (default 5-5-5, editables
            para premiar underdogs); el marcador exacto suma{" "}
            <strong>+5 fijo</strong>. Se evalúan por separado: un pick
            deliberadamente inconsistente puede cobrar solo el bonus.
          </li>
          <li>
            <strong>Puntaje de una pregunta</strong>: vale 5 por default
            (editable al crearla), sin bonus.
          </li>
          <li>
            <strong>Gran DT</strong>: 11 mini-duelos slot contra slot (arquero
            vs arquero, DEF1 vs DEF1…). El desafío lo gana quien gane más
            mini-duelos; puede terminar empatado.
          </li>
        </ul>
        <p className="pgu-p">
          Toda fecha atraviesa cuatro fases, siempre en este orden:{" "}
          <span className="pgu-phase pgu-phase--draft">Borrador</span>
          <span className="pgu-arrow">→</span>
          <span className="pgu-phase pgu-phase--open">Abierta</span>
          <span className="pgu-arrow">→</span>
          <span className="pgu-phase pgu-phase--inplay">En juego</span>
          <span className="pgu-arrow">→</span>
          <span className="pgu-phase pgu-phase--done">Consolidada</span>
        </p>
        <details className="pgu-details">
          <summary>Qué se puede hacer en cada fase</summary>
          <ul className="pgu-list">
            <li>
              <strong>Borrador</strong> — la fecha se arma completa (duelos,
              ítems, universo GDT). Invisible para los participantes.
            </li>
            <li>
              <strong>Abierta</strong> — los participantes cargan pronósticos.
              Todo sigue editable; los mails automáticos trabajan solos.
            </li>
            <li>
              <strong>En juego</strong> — llega sola al vencer el deadline. Se
              cargan resultados, arbitrajes y puntajes GDT; los participantes
              ven los parciales en vivo.
            </li>
            <li>
              <strong>Consolidada</strong> — puntos definitivos escritos y mail
              de resultados enviado. Solo lectura, con la válvula de
              reapertura para correcciones (sección 08).
            </li>
          </ul>
        </details>
      </Section>

      {/* ── 02 · Jugadores ── */}
      <Section id="jugadores" num="02" title="Jugadores y vínculos">
        <ol className="pgu-steps">
          <li>
            Crear cada jugador en <strong>Prode → Jugadores → Nuevo
            jugador</strong>. El nombre es el que se ve en tablas, duelos y
            mails.
          </li>
          <li>
            Vincular el jugador a su usuario del sitio en{" "}
            <strong>Panel admin → Usuarios</strong> (campo de jugador de
            Prode del usuario).
          </li>
        </ol>
        <Alert>
          Sin ese vínculo el participante <strong>no recibe ningún mail y no
          puede cargar pronósticos ni armar su Gran DT</strong> (el sitio lo
          rechaza como no-participante). Es el paso que más fácil se olvida
          cuando entra alguien nuevo.
        </Alert>
        <Alert>
          Un jugador con historial no se puede borrar (el sistema lo bloquea
          para proteger las estadísticas): si alguien deja de jugar, se lo{" "}
          <strong>desactiva</strong>.
        </Alert>
      </Section>

      {/* ── 03 · Torneo ── */}
      <Section id="torneo" num="03" title="El torneo">
        <ol className="pgu-steps">
          <li>
            <strong>Torneos → Nuevo torneo</strong>: nombre, año, los meses
            reales de juego y los participantes.
          </li>
          <li>
            El torneo nace en <strong>Borrador</strong>: invisible al público,
            ideal para dejarlo armado con anticipación.
          </li>
          <li>
            <strong>Activar</strong> cuando esté listo para arrancar: pasa a
            estar operativo (fechas, Gran DT y sección pública).
          </li>
        </ol>
        <Alert>
          La cantidad de participantes debe ser <strong>par</strong> — el
          formato es de duelos 1 contra 1, sin descansos. El form no deja
          guardar una cantidad impar.
        </Alert>
        <p className="pgu-p">
          Al terminar el semestre, el botón <strong>Finalizar</strong> (en el
          índice de Torneos) cierra el torneo: exige que{" "}
          <strong>todas las fechas estén consolidadas</strong> y deja sellados
          campeón y último. Un torneo con fechas creadas no se puede borrar.
        </p>
      </Section>

      {/* ── 04 · GDT draft ── */}
      <Section id="gdt-draft" num="04" title="Gran DT: universo y draft">
        <p className="pgu-p">
          El Gran DT se juega dentro de un <strong>universo</strong>: una liga
          con su pool de jugadores reales y los planteles de los
          participantes. El universo <strong>principal</strong> es de liga
          argentina y se usa en casi todas las fechas; se pueden crear hasta{" "}
          <strong>2 universos suplentes</strong> de otras ligas para fines de
          semana sin fútbol argentino (quedan fijos tras su draft: no tienen
          ventanas de cambios).
        </p>
        <ol className="pgu-steps">
          <li>
            <strong>Gran DT → Nuevo universo GDT</strong>: elegir torneo y
            liga.
          </li>
          <li>
            <strong>Importar el pool</strong> desde la API (son cientos de
            jugadores; la importación tarda un rato). Revisar por arriba que
            clubes y posiciones estén bien.
          </li>
          <li>
            Definir el deadline y <strong>abrir el draft</strong>: cada
            participante arma su plantel <strong>a ciegas</strong> — 11
            jugadores (1 arquero, 4 defensores, 4 volantes, 2 delanteros),
            máximo 1 por club. El orden dentro de cada línea es estratégico y{" "}
            <strong>queda fijo todo el torneo</strong>.
          </li>
          <li>
            Al deadline, <strong>revelar</strong>: se muestran todos los
            planteles y saltan las quemas.
          </li>
          <li>
            Resolver las rondas de reemplazo hasta converger → el draft queda{" "}
            <strong>Definitivo</strong>.
          </li>
        </ol>
        <details className="pgu-details">
          <summary>Cómo funcionan las quemas y las rondas</summary>
          <ul className="pgu-list">
            <li>
              Un jugador elegido en <strong>4 o más planteles</strong> se
              quema <strong>para todo el torneo</strong>: nadie lo conserva y
              todos los que lo pusieron deben reemplazarlo.
            </li>
            <li>
              Los afectados re-eligen viendo los planteles revelados, pero{" "}
              <strong>sin verse entre sí</strong> — pueden volver a coincidir
              y generar quemas nuevas.
            </li>
            <li>
              El admin cierra ronda tras ronda hasta que un cierre no produce
              quemas nuevas: ahí el draft converge. Quien no re-elige a tiempo
              conserva su jugador anterior (el sistema nunca deja un plantel
              inválido).
            </li>
          </ul>
        </details>
        <Alert>
          Al crear cada fecha se elige <strong>con qué universo se juega</strong>.
          Si una fecha usa un universo suplente, ese universo tiene que tener
          su draft definitivo antes de abrirla.
        </Alert>
        <Alert>
          No existe reabrirle el armado completo a un participante después de
          la revelación — ya vio todos los planteles. Las únicas ediciones
          post-reveal son los reemplazos de quemados y las herramientas de la
          sección 05.
        </Alert>
      </Section>

      {/* ── 05 · GDT vida ── */}
      <Section id="gdt-torneo" num="05" title="Gran DT durante el torneo">
        <p className="pgu-p">
          Una vez definitivo, el universo principal vive al ritmo de las{" "}
          <strong>ventanas de cambios mensuales</strong>:
        </p>
        <ol className="pgu-steps">
          <li>
            En el detalle del universo, <strong>abrir la ventana</strong>{" "}
            eligiendo el mes y una fecha objetivo. El primer mes del torneo
            está vedado (se juega con el plantel del draft) y los meses ya
            usados no se repiten.
          </li>
          <li>
            Cada participante hace hasta <strong>2 cambios a ciegas</strong> —
            o aprieta "Confirmar sin cambios" para avisar que pasa.
          </li>
          <li>
            <strong>Cerrar la ventana</strong>: se aplican los cambios. Si 4+
            eligieron al mismo entrante, se quema y hay rondas de re-elección
            (misma mecánica del draft).
          </li>
          <li>
            Al converger se crean los planteles del mes de{" "}
            <strong>todos</strong> — quien no tocó nada replica el suyo tal
            cual. El que salió queda vedado hasta el mes siguiente.
          </li>
        </ol>
        <p className="pgu-p">
          Para las situaciones fuera de libreto hay{" "}
          <strong>tres herramientas de excepción</strong>, cada una con su
          caso de uso — elegir la correcta es la decisión importante:
        </p>
        <ul className="pgu-list">
          <li>
            <strong>Bloqueo</strong> (card Planteles vigentes) — para una{" "}
            <strong>transferencia real</strong> a mitad de mes u otra
            inconsistencia sancionable: el slot bloqueado{" "}
            <strong>vale 0</strong> mientras dure. Es reversible en cualquier
            momento.
          </li>
          <li>
            <strong>Corrección</strong> — para un <strong>error de datos
            del pool</strong> (posición o club mal cargados): el afectado
            repone gratis solo los slots inconsistentes, sin gastar cambios.
            Es one-shot: al guardar se consume.
          </li>
          <li>
            <strong>Reapertura</strong> — para el <strong>participante que se
            colgó</strong> con sus cambios: hace los que le queden viendo lo
            ya revelado (castigo suave: elige de un mercado más chico).
            También one-shot — guardar la consume, incluso sin cambios.
          </li>
        </ul>
        <Alert hard>
          Transferencia a mitad de mes = <strong>editar el club del jugador
          en el pool</strong>. Jamás crear un jugador nuevo: el duplicado deja
          un fantasma en los planteles que lo tienen. Al editar, el sistema
          lista los impactos sobre los planteles vigentes y sugiere bloqueos o
          desbloqueos — leer esos avisos antes de cerrar la pantalla.
        </Alert>
      </Section>

      {/* ── 06 · Crear fecha ── */}
      <Section id="crear-fecha" num="06" title="Crear y abrir una fecha">
        <ol className="pgu-steps">
          <li>
            <strong>Fechas → Nueva fecha</strong>: torneo, mes, número (se
            prellena con el siguiente) y el{" "}
            <strong>deadline de pronósticos</strong>.
          </li>
          <li>
            En el editor, armar los <strong>duelos</strong> de la fecha: todos
            los participantes, sin repetir.
          </li>
          <li>
            Cargar los ítems de <strong>Prode Argentina</strong> y{" "}
            <strong>Prode Resto del Mundo</strong>. Por el{" "}
            <strong>carrito del catálogo</strong> (elegir liga, tildar
            partidos y setear los puntos L-E-V en la misma selección) o a
            mano (partido manual — con kickoff obligatorio — o pregunta).
          </li>
          <li>
            Elegir el <strong>universo GDT</strong> con el que se juega la
            fecha.
          </li>
          <li>
            <strong>Abrir fecha</strong>: valida deadline futuro, duelos
            completos y al menos un ítem en cada desafío; manda el mail de
            apertura a los participantes vinculados.
          </li>
        </ol>
        <Alert>
          El <strong>kickoff de cada partido es obligatorio</strong> y no es
          decorativo: la reapertura para rezagados (sección 07) bloquea los
          partidos ya empezados usando exactamente ese dato. Un kickoff mal
          cargado deja entrar pronósticos a partidos ya jugados.
        </Alert>
        <Alert>
          El deadline es <strong>único por fecha</strong> y cierra los
          pronósticos. El cierre de cambios GDT del grupo se maneja aparte con
          la fecha objetivo de la ventana (sección 05) — conviene que sea
          anterior.
        </Alert>
      </Section>

      {/* ── 07 · Fecha viva ── */}
      <Section id="fecha-viva" num="07" title="Fecha abierta y en juego">
        <h3 className="pgu-subhead">Mientras está abierta</h3>
        <ul className="pgu-list">
          <li>
            La fecha sigue <strong>100% editable</strong> aunque ya haya
            pronósticos cargados. Un ítem borrado{" "}
            <strong>descarta los pronósticos</strong> que tenía; un ítem nuevo
            aparece "sin pronosticar" para todos.
          </li>
          <li>
            Por eso existe el botón <strong>Notificar cambios</strong>: manda
            un mail manual a los participantes. No es automático a propósito —
            el admin decide qué cambio amerita aviso, y una sesión de
            correcciones no spamea a nadie.
          </li>
          <li>
            Criterio: una corrección menor (kickoff, typo, puntos) se edita
            in-place; si el partido cambió tanto que es otro,{" "}
            <strong>borrarlo y crear uno nuevo</strong> para que los picks
            viejos se descarten.
          </li>
          <li>
            Lo automático corre solo: <strong>recordatorios a las 24 h y 3
            h</strong> del deadline (solo a quienes les falta pronosticar), y
            al vencer el deadline la fecha pasa sola a{" "}
            <strong>En juego</strong> con su mail de cierre.
          </li>
        </ul>
        <h3 className="pgu-subhead">Mientras está en juego</h3>
        <ul className="pgu-list">
          <li>
            El tablero <strong>Carga de pronósticos</strong> muestra quién
            cargó qué. Si alguien se colgó, <strong>Reabrir carga</strong> en
            su fila: el rezagado solo puede completar los partidos que{" "}
            <strong>todavía no empezaron</strong>, no ve los pronósticos
            ajenos hasta guardar, y su guardado consume la reapertura.
          </li>
          <li>
            Cargar los <strong>resultados</strong> de los partidos a medida
            que terminan y <strong>arbitrar las preguntas</strong> (correcta /
            incorrecta por participante). Un partido suspendido se{" "}
            <strong>anula</strong>: queda visible pero nadie cobra, ni pick ni
            bonus.
          </li>
          <li>
            Cargar los <strong>puntajes GDT</strong> progresivamente (la
            tabla va por club, como el diario). Un mini-duelo se define recién
            cuando ambos lados tienen valor; el que{" "}
            <strong>no jugó lleva 0 explícito</strong> — el sistema nunca
            asume. El bloqueado vale 0 solo, sin cargarle nada.
          </li>
          <li>
            Los participantes ven los <strong>parciales en vivo</strong> en el
            tablero de la fecha — todo lo que se carga acá impacta al
            instante.
          </li>
        </ul>
      </Section>

      {/* ── 08 · Consolidar ── */}
      <Section id="consolidar" num="08" title="Consolidar la fecha">
        <p className="pgu-p">
          La consolidación es <strong>siempre manual</strong> y es el momento
          de la verdad: escribe los puntos definitivos de los duelos, mueve la
          tabla del torneo y manda el mail personalizado de resultados a cada
          participante.
        </p>
        <ul className="pgu-list">
          <li>
            El botón exige la carga <strong>completa</strong>: cada partido
            con resultado o anulado, cada pregunta arbitrada, cada jugador GDT
            no bloqueado con puntaje. Nada se resuelve por omisión — el propio
            botón lista qué falta.
          </li>
          <li>
            La card muestra la <strong>preview de cada duelo</strong> (sumas
            por desafío, ganador, bonus) antes de confirmar. Los números
            definitivos son idénticos a los parciales que todos venían viendo.
          </li>
          <li>
            ¿Error detectado después? <strong>Reabrir para corregir</strong>:
            la fecha vuelve a En juego, se corrige el resultado / arbitraje /
            puntaje y se re-consolida. La re-consolidación{" "}
            <strong>vuelve a mandar el mail</strong> de resultados.
          </li>
        </ul>
        <Alert hard>
          Si después de consolidar una fecha se <strong>bloqueó</strong> un
          jugador GDT, no reabrirla directamente: el bloqueo se aplicaría
          retroactivamente a una fecha ya jugada. El orden correcto es{" "}
          <strong>desbloquear → re-consolidar → volver a bloquear</strong>.
        </Alert>
        <Alert>
          Hay plata real en juego (la liquidación del grupo): consolidar
          recién cuando los resultados estén confirmados. Para dudas de último
          minuto está la anulación, no la consolidación apurada.
        </Alert>
      </Section>

      {/* ── 09 · Cierres ── */}
      <Section
        id="cierres"
        num="09"
        title="Cierres automáticos y fin del torneo"
      >
        <ul className="pgu-list">
          <li>
            Los <strong>honores del mes</strong> (la comida del top 4, el
            organizador que aporta el último) se sellan{" "}
            <strong>solos</strong>: al abrir la primera fecha del mes
            siguiente (o consolidar una de un mes posterior) el sistema cierra
            el mes anterior y publica la card en Inicio. No hay botón — solo
            verificar que la card aparezca.
          </li>
          <li>
            Los <strong>desempates son automáticos</strong> y en cadena:
            puntos → puntos sin bonus → mini-duelos GDT → Prode Argentina →
            Prode Resto del Mundo → alfabético. La tabla{" "}
            <strong>nunca comparte puestos</strong>; ante igualdad de puntos,
            el orden que muestra el sitio es el válido.
          </li>
          <li>
            Con el semestre terminado y todas las fechas consolidadas,{" "}
            <strong>Finalizar</strong> el torneo desde el índice de Torneos.
            Queda en solo lectura y pasa al historial de la sección pública.
          </li>
        </ul>
      </Section>
    </div>
  );
};

export default ProdeGuide;
