import { useCallback, useMemo, useState } from "react";

// tikka voi olla single, double tai triple
export type Multiplier = 1 | 2 | 3;

// pelaajan tila X01-peleissä: jäljellä oleva pistemäärä
export interface DartThrow {
  value: number; // 0-20 or 25 bullille
  multiplier: Multiplier; // 1, 2, 3
}
// pelaajan id ja nimi
export interface Player {
  id: string;
  name: string;
}

// turn kuvaa yhden pelaajan vuoron.
export interface Turn<TPlayerState> {
  playerId: string;           // kuka pelaaja
  darts: DartThrow[];         // mitä tikkoja heitettiin
  beforeState: TPlayerState[];  // pelaajien tilanne ennen vuoroa
  afterState: TPlayerState[]; // pelaajien tilanne vuoron jälkeen
  busted?: boolean;           // oliko vuoro bust (palauttaa edelliseen tilaan)
  finished?: boolean;         // oliko vuoro voittava (pelaaja saavutti vaaditun pistemäärän)
}

export interface DartsGameConfig<TPlayerState> {
  players: Player[];
  initialPlayerState: (player: Player) => TPlayerState;

  /**
   * Callataan jokaiselle heitetylle tikalle.
   * pitää päivittää pelaajaan statsit ja flägit kuten bust ja finish.
   */
  applyThrow: (params: {
    dart: DartThrow;
    currentPlayer: Player;
    currentPlayerIndex: number;
    playerStates: TPlayerState[];
    turnDarts: DartThrow[];
  }) => {
    playerStates: TPlayerState[];
    busted?: boolean;
    finished?: boolean;
  };

  /**
   * vaihtoehtoinen validointi ennen tikan soveltamista.
   */
  isValidThrow?: (dart: DartThrow) => boolean;

  /**
   * Maksimi tikkojen heiton määrä. yleensä 3.
   */
  dartsPerTurn?: number;

  /**
   * vaihtoehtoinen voittajan tunnistaja.
   */
  getWinner?: (params: {
    players: Player[];
    playerStates: TPlayerState[];
  }) => string | null; // palauttaa voittajan id:n tai null jos ei vielä voittajaa
}
// hookin palauttama objekti, joka sisältää pelin tilan ja toiminnot
export interface UseDartsGameReturn<TPlayerState> {
  players: Player[];
  playerStates: TPlayerState[];
  currentPlayer: Player;
  currentPlayerIndex: number;
  currentTurnDarts: DartThrow[];
  turns: Turn<TPlayerState>[];
  winnerId: string | null;
  isGameOver: boolean;

  throwDart: (dart: DartThrow) => void;
  endTurn: () => void;
  undo: () => void;
  reset: () => void;
}
// päähook, joka hallinnoi pelin tilaa ja logiikkaa. parametrina config, joka määrittelee pelin säännöt ja logiikan.
export function useDartsGame<TPlayerState>(
  config: DartsGameConfig<TPlayerState>
): UseDartsGameReturn<TPlayerState> {
  const {
    players,
    initialPlayerState,
    applyThrow,
    isValidThrow,
    dartsPerTurn = 3,
    getWinner,
  } = config;
// funktio, joka luo pelaajien tilat alussa. Käytetään uudestaan undo-toiminnossa.
  const createInitialStates = useCallback(
    () => players.map((player) => initialPlayerState(player)),
    [players, initialPlayerState]
  );
// hookin tila
  const [playerStates, setPlayerStates] = useState<TPlayerState[]>(createInitialStates);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentTurnDarts, setCurrentTurnDarts] = useState<DartThrow[]>([]);
  const [turns, setTurns] = useState<Turn<TPlayerState>[]>([]);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const currentPlayer = players[currentPlayerIndex];
  const isGameOver = winnerId !== null;
// lopeta vuoro ja siirry seuraavan pelaaja.
  const endTurn = useCallback(() => {
    if (isGameOver) return;

    setCurrentTurnDarts([]);
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
  }, [isGameOver, players.length]);
// heitä tikka. tarkista validiteetti, päivitä tila applyThrow-funktion avulla, tallenna vuoron data turns-taulukkoon ja tarkista voittaja.
  const throwDart = useCallback(
    (dart: DartThrow) => {
      if (isGameOver) return;
// tarkista tikka validiksi ennen kuin sovelletaan sitä peliin
      if (isValidThrow && !isValidThrow(dart)) {
        return;
      }

      const beforeState = structuredClone(playerStates);
      const updatedTurnDarts = [...currentTurnDarts, dart];
// sovelletaan tikka peliin ja saadaan uusi tila, sekä tieto onko tikka aiheuttanut bustin tai finishin
      const result = applyThrow({
        dart,
        currentPlayer,
        currentPlayerIndex,
        playerStates: structuredClone(playerStates),
        turnDarts: updatedTurnDarts,
      });

      const nextStates = result.playerStates;
      const busted = !!result.busted;
      const finished = !!result.finished;

      setPlayerStates(nextStates);
      setCurrentTurnDarts(updatedTurnDarts);
// luo vuoron snapshot, joka tallennetaan turns-taulukkoon, jos vuoro päättyy bustiin, finishiin tai tikkojen maksimimäärään.
      const turnSnapshot: Turn<TPlayerState> = {
        playerId: currentPlayer.id,
        darts: updatedTurnDarts,
        beforeState,
        afterState: structuredClone(nextStates),
        busted,
        finished,
      };

      const reachedTurnLimit = updatedTurnDarts.length >= dartsPerTurn;
// vuoro päättyy, jos saavutetaan tikkojen maksimimäärä, tai jos tikka aiheuttaa bustin tai finishin
      if (busted || finished || reachedTurnLimit) {
        setTurns((prev) => [...prev, turnSnapshot]);

        let detectedWinner: string | null = null;

        if (finished) {
          detectedWinner = currentPlayer.id;
        } else if (getWinner) {
          detectedWinner =
            getWinner({
              players,
              playerStates: nextStates,
            }) ?? null;
        }

        if (detectedWinner) {
          setWinnerId(detectedWinner);
          setCurrentTurnDarts([]);
          return;
        }
// siirry seuraavaan pelaajaan, jos ei vielä voittajaa. resetataan tikat seuraavaa vuoroa varten.
        setCurrentTurnDarts([]);
        setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
      }
    },
    [
      isGameOver,
      isValidThrow,
      playerStates,
      currentTurnDarts,
      applyThrow,
      currentPlayer,
      currentPlayerIndex,
      dartsPerTurn,
      getWinner,
      players,
    ]
  );
// undo-toiminto, joka peruuttaa viimeisimmän tikkaamisen. jos tikkoja on heitetty vuoron aikana, peruutetaan viimeisin tikka. jos vuoro on tyhjä, peruutetaan edellinen vuoro kokonaisuudessaan.
  const undo = useCallback(() => {
    if (currentTurnDarts.length > 0) {
      /**
       * jälleenrakennetaan nykyinen tilanne ilman viimeisintä tikkaa. Tämä on helpompaa kuin yrittää "peruuttaa" tikkaa, koska tikkojen vaikutus peliin voi olla monimutkainen (esim. bust tai finish), eikä applyThrow välttämättä ole helposti käännettävissä
       */
      const previousDarts = currentTurnDarts.slice(0, -1);
      let rebuiltStates = createInitialStates();

      for (const savedTurn of turns) {
        rebuiltStates = structuredClone(savedTurn.afterState);
      }

      for (const dart of previousDarts) {
        const result = applyThrow({
          dart,
          currentPlayer,
          currentPlayerIndex,
          playerStates: structuredClone(rebuiltStates),
          turnDarts: previousDarts,
        });
        rebuiltStates = result.playerStates;
      }

      setPlayerStates(rebuiltStates);
      setCurrentTurnDarts(previousDarts);
      setWinnerId(null);
      return;
    }

    if (turns.length === 0) return;
// perutaan edellinen vuoro kokonaisuudessaan
    const updatedTurns = turns.slice(0, -1);
    const lastTurn = turns[turns.length - 1];

    setTurns(updatedTurns);
    setPlayerStates(structuredClone(lastTurn.beforeState));
    setCurrentPlayerIndex(players.findIndex((p) => p.id === lastTurn.playerId));
    setCurrentTurnDarts([]);
    setWinnerId(null);
  }, [
    currentTurnDarts,
    turns,
    applyThrow,
    currentPlayer,
    currentPlayerIndex,
    createInitialStates,
    players,
  ]);
// reset-toiminto, joka palauttaa pelin alkuun. tyhjentää pelaajien tilat, vuorot ja voittajan.
  const reset = useCallback(() => {
    setPlayerStates(createInitialStates());
    setCurrentPlayerIndex(0);
    setCurrentTurnDarts([]);
    setTurns([]);
    setWinnerId(null);
  }, [createInitialStates]);

  return useMemo(
    () => ({
      players,
      playerStates,
      currentPlayer,
      currentPlayerIndex,
      currentTurnDarts,
      turns,
      winnerId,
      isGameOver,
      throwDart,
      endTurn,
      undo,
      reset,
    }),
    [
      players,
      playerStates,
      currentPlayer,
      currentPlayerIndex,
      currentTurnDarts,
      turns,
      winnerId,
      isGameOver,
      throwDart,
      endTurn,
      undo,
      reset,
    ]
  );
}