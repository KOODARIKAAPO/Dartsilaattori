import { useDartsGame, DartThrow, Player } from "./useDartsGame";

export interface X01PlayerState {
  score: number;
}
// konfiguraatio X01-pelille, joka määrittelee säännöt ja logiikan tikkapelin 301/501:lle.
interface UseX01GameOptions {
  players: Player[];
  startingScore?: number; // 301, 501, jne.
  doubleOut?: boolean;
}
// apufunktio, joka laskee tikasta saatavan pistemäärän
function getDartScore(dart: DartThrow): number {
  return dart.value * dart.multiplier;
}
// apufunktio, joka tarkistaa onko tikka tupla-alueelta, mikä on oleellista double out -säännössä.
function isDouble(dart: DartThrow): boolean {
  return dart.multiplier === 2;
}
// päähook, joka käyttää useDartsGame-hookia ja määrittelee X01-pelin logiikan applyThrow-funktiossa. se käsittelee pisteiden laskun, bust- ja finish-tarkistukset sekä voittajan tunnistamisen.
export function useX01Game({
  players,
  startingScore = 501,
  doubleOut = false,
}: UseX01GameOptions) {
  return useDartsGame<X01PlayerState>({
    players,
    dartsPerTurn: 3,
    initialPlayerState: () => ({
      score: startingScore,
    }),
    isValidThrow: (dart) => {
      if (dart.value === 25) {
        return dart.multiplier === 1 || dart.multiplier === 2;
      }

      if (dart.value < 0 || dart.value > 20) return false;
      if (dart.multiplier < 1 || dart.multiplier > 3) return false;
      return true;
    },
    applyThrow: ({
      dart,
      currentPlayerIndex,
      playerStates,
      turnDarts,
    }) => {
      const nextStates = structuredClone(playerStates);
      const player = nextStates[currentPlayerIndex];
// lasketaan tikasta saatava pistemäärä ottaen huomioon aiemmin heitetyt tikat vuorossa, jotta voidaan tarkistaa bust-tilanne oikein.
      const turnStartScore =
        turnDarts.length === 1
          ? playerStates[currentPlayerIndex].score
          : (() => {
              const alreadyThrown = turnDarts.slice(0, -1);
              const currentScore = playerStates[currentPlayerIndex].score;
              const priorPoints = alreadyThrown.reduce(
                (sum, d) => sum + getDartScore(d),
                0
              );
              return currentScore + priorPoints;
            })();
// lasketaan uusi pistemäärä tikasta ja tarkistetaan onko se aiheuttanut bustin (pisteet alle nollan tai double out -säännön rikkominen) tai finishin (pisteet nollaan, mahdollisesti vaaten tuplaheiton).
      const newScore = player.score - getDartScore(dart);

      // Bust: alle nollaan menevä tulos
      if (newScore < 0) {
        player.score = turnStartScore;
        return {
          playerStates: nextStates,
          busted: true,
        };
      }

      // Bust: saavuttaa yksi piste, mutta double out vaaditaan.
      if (doubleOut && newScore === 1) {
        player.score = turnStartScore;
        return {
          playerStates: nextStates,
          busted: true,
        };
      }

      // Finish check
      if (newScore === 0) {
        if (doubleOut && !isDouble(dart)) {
          player.score = turnStartScore;
          return {
            playerStates: nextStates,
            busted: true,
          };
        }

        player.score = 0;
        return {
          playerStates: nextStates,
          finished: true,
        };
      }

      player.score = newScore;

      return {
        playerStates: nextStates,
      };
    },
// voittajan tunnistus, joka tarkistaa onko joku pelaajista saavuttanut nollan pistettä.
    getWinner: ({ players, playerStates }) => {
      const winnerIndex = playerStates.findIndex((p) => p.score === 0);
      return winnerIndex >= 0 ? players[winnerIndex].id : null;
    },
  });
}