import type { Match } from "./txline";

// Training-mode catalogue: real World Cup national teams and well-known
// players as a form guide, with simulated (made-up, not live) odds and
// results so the scoring engine can be practiced against instantly and
// repeatedly, independent of TxLINE's real fixture list.

export const TRAINING_MATCHES: Match[] = [
  {
    id: "training-arg-bra",
    competition: "Training Mode",
    homeTeam: "Argentina",
    awayTeam: "Brazil",
    kickoffISO: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: "finished",
    homeScore: 2,
    awayScore: 1,
    odds: { home: 2.3, draw: 3.2, away: 2.7 },
    homeLoadout: ["Messi", "Di María", "Julián Álvarez"],
    awayLoadout: ["Neymar", "Vinícius Jr.", "Casemiro"],
    preview: [
      "Argentina go into this one full of confidence after a strong qualifying run, with Messi pulling the strings just off the front line.",
      "Brazil counter with real pace out wide — Vinícius Jr. has been the form player of the tournament and will look to isolate Argentina's right side.",
      "Both sides report a clean bill of health in training, though this fixture has history — expect a tightly-fought, niggly contest.",
    ],
  },
  {
    id: "training-fra-eng",
    competition: "Training Mode",
    homeTeam: "France",
    awayTeam: "England",
    kickoffISO: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    status: "finished",
    homeScore: 1,
    awayScore: 1,
    odds: { home: 2.5, draw: 3.0, away: 2.9 },
    homeLoadout: ["Mbappé", "Griezmann", "Tchouaméni"],
    awayLoadout: ["Kane", "Bellingham", "Foden"],
  },
  {
    id: "training-esp-ger",
    competition: "Training Mode",
    homeTeam: "Spain",
    awayTeam: "Germany",
    kickoffISO: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    status: "finished",
    homeScore: 3,
    awayScore: 1,
    odds: { home: 2.1, draw: 3.4, away: 3.3 },
    homeLoadout: ["Pedri", "Gavi", "Morata"],
    awayLoadout: ["Musiala", "Havertz", "Kimmich"],
  },
  {
    id: "training-por-ned",
    competition: "Training Mode",
    homeTeam: "Portugal",
    awayTeam: "Netherlands",
    kickoffISO: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(),
    status: "finished",
    homeScore: 0,
    awayScore: 2,
    odds: { home: 2.6, draw: 3.1, away: 2.6 },
    homeLoadout: ["Ronaldo", "Bruno Fernandes", "Bernardo Silva"],
    awayLoadout: ["Van Dijk", "Depay", "Gakpo"],
  },
  {
    id: "training-cro-mar",
    competition: "Training Mode",
    homeTeam: "Croatia",
    awayTeam: "Morocco",
    kickoffISO: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    status: "finished",
    homeScore: 1,
    awayScore: 2,
    odds: { home: 2.4, draw: 3.2, away: 2.9 },
    homeLoadout: ["Modrić", "Kovačić", "Perišić"],
    awayLoadout: ["Hakimi", "Ziyech", "En-Nesyri"],
  },
  {
    id: "training-bel-ita",
    competition: "Training Mode",
    homeTeam: "Belgium",
    awayTeam: "Italy",
    kickoffISO: new Date(Date.now() - 29 * 60 * 60 * 1000).toISOString(),
    status: "finished",
    homeScore: 2,
    awayScore: 2,
    odds: { home: 2.5, draw: 3.0, away: 2.9 },
    homeLoadout: ["De Bruyne", "Lukaku", "Doku"],
    awayLoadout: ["Chiesa", "Barella", "Donnarumma"],
  },
  {
    id: "training-uru-usa",
    competition: "Training Mode",
    homeTeam: "Uruguay",
    awayTeam: "USA",
    kickoffISO: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    status: "finished",
    homeScore: 1,
    awayScore: 0,
    odds: { home: 1.9, draw: 3.3, away: 4.2 },
    homeLoadout: ["Núñez", "Valverde", "Bentancur"],
    awayLoadout: ["Pulisic", "McKennie", "Weah"],
  },
  {
    id: "training-jpn-sen",
    competition: "Training Mode",
    homeTeam: "Japan",
    awayTeam: "Senegal",
    kickoffISO: new Date(Date.now() - 31 * 60 * 60 * 1000).toISOString(),
    status: "finished",
    homeScore: 2,
    awayScore: 0,
    odds: { home: 2.7, draw: 3.1, away: 2.5 },
    homeLoadout: ["Mitoma", "Kubo", "Endo"],
    awayLoadout: ["Mané", "Koulibaly", "Sarr"],
  },
];

// Implied win% from decimal odds, normalized so the three outcomes sum to 100.
export function impliedWinPct(match: Match): { home: number; draw: number; away: number } | null {
  if (!match.odds) return null;
  const raw = {
    home: 1 / match.odds.home,
    draw: 1 / match.odds.draw,
    away: 1 / match.odds.away,
  };
  const total = raw.home + raw.draw + raw.away;
  return {
    home: Math.round((raw.home / total) * 100),
    draw: Math.round((raw.draw / total) * 100),
    away: Math.round((raw.away / total) * 100),
  };
}
