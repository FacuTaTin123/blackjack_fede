import { useState, useEffect } from "react";
import "./App.css";

export default function Blackjack() {
  const [mazoId, setMazoId] = useState("");
  const [manoJugador, setManoJugador] = useState([]);
  const [manoDealer, setManoDealer] = useState([]);
  const [puntosJugador, setPuntosJugador] = useState(0);
  const [puntosDealer, setPuntosDealer] = useState(0);
  const [estado, setEstado] = useState("inicio");
  const [mensaje, setMensaje] = useState("");

  const api = "https://deckofcardsapi.com/api/deck";

  const valorCarta = (carta) => {
    if (!carta) return 0;
    if (carta.value === "ACE") return 11;
    if (["KING", "QUEEN", "JACK"].includes(carta.value)) return 10;
    return parseInt(carta.value) || 10;
  };

  const calcularPuntos = (mano) => {
    if (!mano || mano.length === 0) return 0;
    let total = 0;
    let ases = 0;
    mano.forEach((carta) => {
      total += valorCarta(carta);
      if (carta.value === "ACE") ases++;
    });
    while (total > 21 && ases > 0) {
      total -= 10;
      ases--;
    }
    return total;
  };

  const iniciarJuego = () => {
    setEstado("cargando");
    setManoJugador([]);
    setManoDealer([]);
    setMensaje("");

    fetch(`${api}/new/shuffle/?deck_count=1`)
      .then((res) => res.json())
      .then((data) => {
        setMazoId(data.deck_id);
        return fetch(`${api}/${data.deck_id}/draw/?count=4`);
      })
      .then((res) => res.json())
      .then((cartas) => {
        const jugador = [cartas.cards[0], cartas.cards[2]];
        const dealer = [cartas.cards[1], cartas.cards[3]];

        setManoJugador(jugador);
        setManoDealer(dealer);

        const ptsJ = calcularPuntos(jugador);
        const ptsD = calcularPuntos(dealer);
        setPuntosJugador(ptsJ);
        setPuntosDealer(ptsD);

        if (ptsJ === 21) {
          setMensaje("nashe alto blackjack");
          setEstado("fin");
        } else {
          setEstado("jugando");
        }
      })
      .catch((err) => {
        console.error("Error al iniciar:", err);
        setMensaje("Error al cargar el juego");
        setEstado("inicio");
      });
  };

  const pedir = () => {
    fetch(`${api}/${mazoId}/draw/?count=1`)
      .then((res) => res.json())
      .then((data) => {
        const nuevaMano = [...manoJugador, data.cards[0]];
        setManoJugador(nuevaMano);
        const pts = calcularPuntos(nuevaMano);
        setPuntosJugador(pts);

        if (pts > 21) {
          setMensaje("te requete pasaste");
          setEstado("fin");
        }
      });
  };

  const plantarse = () => {
    let manoActual = [...manoDealer];
    let pts = calcularPuntos(manoActual);

    const jugarDealer = () => {
      if (pts >= 17) {
        terminarJuego(pts);
        return;
      }

      fetch(`${api}/${mazoId}/draw/?count=1`)
        .then((res) => res.json())
        .then((data) => {
          manoActual.push(data.cards[0]);
          setManoDealer(manoActual);
          pts = calcularPuntos(manoActual);
          setPuntosDealer(pts);
          setTimeout(jugarDealer, 600);
        });
    };

    const terminarJuego = (puntosFinal) => {
      if (puntosFinal > 21) setMensaje("mortal, se paso el dealer");
      else if (puntosFinal > puntosJugador) setMensaje("chomazo perdiste");
      else if (puntosFinal < puntosJugador) setMensaje("buenardopolis ganaste");
      else setMensaje("EMPATE");
      setEstado("fin");
    };

    jugarDealer();
  };

  return (
    <div className="blackjack-container">
      <h2 className="blackjack-title">BLACKJACK</h2>

      {estado === "inicio" && (
        <button onClick={iniciarJuego} className="btn-jugar">
          JUGAR
        </button>
      )}


      {["jugando", "fin"].includes(estado) && (
        <>
          <div className="mano-dealer">
            <h3>dealer</h3>
            <p className="puntos">
              {estado === "jugando" && manoDealer[0]
                ? calcularPuntos([manoDealer[0]])
                : puntosDealer}
            </p>
            <div className="cartas-grid">
              {manoDealer.map((carta, i) => (
                <img
                  key={i}
                  src={
                    estado === "jugando" && i === 1
                      ? "https://deckofcardsapi.com/static/img/back.png"
                      : carta.image
                  }
                  alt="carta"
                  className="carta-img"
                />
              ))}
            </div>
          </div>

          <div className="mano-jugador">
            <h3>vos</h3>
            <p className="puntos">{puntosJugador}</p>
            <div className="cartas-grid">
              {manoJugador.map((carta, i) => (
                <img
                  key={i}
                  src={carta.image}
                  alt="carta"
                  className="carta-img"
                />
              ))}
            </div>
          </div>

          {estado === "jugando" && (
            <div className="botones">
              <button onClick={pedir} className="btn-accion">
                pedir
              </button>
              <button onClick={plantarse} className="btn-accion">
                quedarse
              </button>
            </div>
          )}

          {mensaje && <h3 className="resultado">{mensaje}</h3>}

          {estado === "fin" && (
            <button onClick={iniciarJuego} className="btn-jugar">
              otra vez
            </button>
          )}
        </>
      )}
    </div>
  );
}