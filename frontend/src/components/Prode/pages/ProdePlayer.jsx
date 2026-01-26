import { useParams } from "react-router-dom";

export default function ProdePlayer() {
  const { playerId } = useParams();

  return (
    <div style={{ padding: 24 }}>
      <h1>Prode — Jugador (WIP)</h1>
      <p>PlayerId: {playerId}</p>
    </div>
  );
}
