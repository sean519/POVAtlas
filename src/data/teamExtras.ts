import type { StarPlayer } from "../types";

export interface TeamExtra {
  /**
   * Rough overall strength rating (~50–95) loosely based on footballing
   * reputation / FIFA ranking. Used ONLY to compute a reference win-chance —
   * it is an estimate for learning, not a betting odds.
   */
  strength: number;
  starPlayers: StarPlayer[];
}

/**
 * Star players and strength ratings, keyed by team `fifaCode`.
 *
 * Kept separate from teams.ts so football-specific info is easy to update
 * without touching geography data. Player line-ups change often — refresh
 * these before a tournament.
 */
export const teamExtras: Record<string, TeamExtra> = {
  // Group A
  MEX: {
    strength: 79,
    starPlayers: [
      { name: "Santiago Giménez", position: "Forward", note: "Sharp goal-scorer who stars in Europe for AC Milan." },
      { name: "Edson Álvarez", position: "Midfielder", note: "Tough defensive midfielder and team leader." },
    ],
  },
  RSA: {
    strength: 72,
    starPlayers: [
      { name: "Percy Tau", position: "Forward", note: "Tricky attacker known for clever dribbling." },
    ],
  },
  KOR: {
    strength: 78,
    starPlayers: [
      { name: "Son Heung-min", position: "Forward", note: "Captain and superstar; one of Asia's greatest ever players." },
    ],
  },
  CZE: {
    strength: 76,
    starPlayers: [
      { name: "Patrik Schick", position: "Forward", note: "Tall striker famous for spectacular long-range goals." },
    ],
  },

  // Group B
  CAN: {
    strength: 76,
    starPlayers: [
      { name: "Alphonso Davies", position: "Left-back", note: "Lightning-fast Bayern Munich star, called the 'Roadrunner'." },
    ],
  },
  BIH: {
    strength: 74,
    starPlayers: [
      { name: "Edin Džeko", position: "Forward", note: "Legendary tall striker and the country's all-time top scorer." },
    ],
  },
  QAT: {
    strength: 74,
    starPlayers: [
      { name: "Akram Afif", position: "Forward", note: "Creative winger who led Qatar to two Asian Cup titles." },
    ],
  },
  SUI: {
    strength: 81,
    starPlayers: [
      { name: "Granit Xhaka", position: "Midfielder", note: "Commanding captain who controls the game's tempo." },
    ],
  },

  // Group C
  BRA: {
    strength: 92,
    starPlayers: [
      { name: "Vinícius Júnior", position: "Forward", note: "Electric Real Madrid winger with dazzling footwork." },
      { name: "Rodrygo", position: "Forward", note: "Cool finisher who shines on the biggest stages." },
    ],
  },
  MAR: {
    strength: 82,
    starPlayers: [
      { name: "Achraf Hakimi", position: "Right-back", note: "Speedy PSG defender who loves attacking." },
    ],
  },
  HTI: {
    strength: 66,
    starPlayers: [
      { name: "Frantzdy Pierrot", position: "Forward", note: "Powerful striker and Haiti's main goal threat." },
    ],
  },
  SCO: {
    strength: 75,
    starPlayers: [
      { name: "Andrew Robertson", position: "Left-back", note: "Liverpool captain-type known for non-stop running." },
      { name: "Scott McTominay", position: "Midfielder", note: "Box-to-box midfielder with a knack for goals." },
    ],
  },

  // Group D
  USA: {
    strength: 80,
    starPlayers: [
      { name: "Christian Pulisic", position: "Forward", note: "Captain America — the team's biggest attacking star at AC Milan." },
    ],
  },
  PAR: {
    strength: 73,
    starPlayers: [
      { name: "Miguel Almirón", position: "Winger", note: "Quick, hard-working winger with Premier League experience." },
    ],
  },
  AUS: {
    strength: 77,
    starPlayers: [
      { name: "Mathew Ryan", position: "Goalkeeper", note: "Reliable captain and shot-stopper for the Socceroos." },
    ],
  },
  TUR: {
    strength: 80,
    starPlayers: [
      { name: "Arda Güler", position: "Midfielder", note: "Young Real Madrid playmaker with a magical left foot." },
      { name: "Hakan Çalhanoğlu", position: "Midfielder", note: "Master of free-kicks and long passes." },
    ],
  },

  // Group E
  GER: {
    strength: 86,
    starPlayers: [
      { name: "Jamal Musiala", position: "Midfielder", note: "Bayern wonderkid who glides past defenders." },
      { name: "Florian Wirtz", position: "Midfielder", note: "Brilliant creator who sets up and scores goals." },
    ],
  },
  CUW: {
    strength: 65,
    starPlayers: [
      { name: "Leandro Bacuna", position: "Midfielder", note: "Experienced leader of tiny Curaçao's midfield." },
    ],
  },
  CIV: {
    strength: 78,
    starPlayers: [
      { name: "Sébastien Haller", position: "Forward", note: "Strong striker who scored the winner in the 2023 Africa Cup." },
    ],
  },
  ECU: {
    strength: 77,
    starPlayers: [
      { name: "Moisés Caicedo", position: "Midfielder", note: "Powerful Chelsea midfielder who covers every blade of grass." },
    ],
  },

  // Group F
  NED: {
    strength: 88,
    starPlayers: [
      { name: "Virgil van Dijk", position: "Defender", note: "Towering captain and one of the world's best defenders." },
      { name: "Cody Gakpo", position: "Forward", note: "Versatile Liverpool attacker with a powerful shot." },
    ],
  },
  JPN: {
    strength: 80,
    starPlayers: [
      { name: "Kaoru Mitoma", position: "Winger", note: "Dribbling wizard who studied the science of beating defenders." },
      { name: "Takefusa Kubo", position: "Forward", note: "Skilful playmaker nicknamed 'Japanese Messi'." },
    ],
  },
  SWE: {
    strength: 77,
    starPlayers: [
      { name: "Alexander Isak", position: "Forward", note: "Elegant, deadly striker starring in the Premier League." },
    ],
  },
  TUN: {
    strength: 74,
    starPlayers: [
      { name: "Hannibal Mejbri", position: "Midfielder", note: "Energetic midfielder full of fight and flair." },
    ],
  },

  // Group G
  BEL: {
    strength: 86,
    starPlayers: [
      { name: "Kevin De Bruyne", position: "Midfielder", note: "One of the greatest passers in the world." },
      { name: "Romelu Lukaku", position: "Forward", note: "Big, strong striker and Belgium's record scorer." },
    ],
  },
  EGY: {
    strength: 76,
    starPlayers: [
      { name: "Mohamed Salah", position: "Forward", note: "Liverpool superstar and Egypt's beloved 'Pharaoh'." },
    ],
  },
  IRI: {
    strength: 78,
    starPlayers: [
      { name: "Mehdi Taremi", position: "Forward", note: "Clever striker who plays for Inter Milan." },
    ],
  },
  NZL: {
    strength: 68,
    starPlayers: [
      { name: "Chris Wood", position: "Forward", note: "Tall, reliable striker and New Zealand's talisman." },
    ],
  },

  // Group H
  ESP: {
    strength: 91,
    starPlayers: [
      { name: "Lamine Yamal", position: "Winger", note: "Teenage Barcelona sensation already among the world's best." },
      { name: "Rodri", position: "Midfielder", note: "Ballon d'Or winner who controls the midfield." },
    ],
  },
  CPV: {
    strength: 68,
    starPlayers: [
      { name: "Ryan Mendes", position: "Forward", note: "Experienced attacker leading the tiny islands' charge." },
    ],
  },
  KSA: {
    strength: 72,
    starPlayers: [
      { name: "Salem Al-Dawsari", position: "Winger", note: "Scored the famous winner against Argentina in 2022." },
    ],
  },
  URU: {
    strength: 83,
    starPlayers: [
      { name: "Federico Valverde", position: "Midfielder", note: "Tireless Real Madrid engine with a rocket shot." },
      { name: "Darwin Núñez", position: "Forward", note: "Fast, fearless striker who never stops running." },
    ],
  },

  // Group I
  FRA: {
    strength: 94,
    starPlayers: [
      { name: "Kylian Mbappé", position: "Forward", note: "Captain and one of the fastest, deadliest players alive." },
    ],
  },
  SEN: {
    strength: 80,
    starPlayers: [
      { name: "Sadio Mané", position: "Forward", note: "Senegal's hero who won them the 2021 Africa Cup." },
    ],
  },
  IRQ: {
    strength: 71,
    starPlayers: [
      { name: "Aymen Hussein", position: "Forward", note: "Big striker and Iraq's go-to goal-getter." },
    ],
  },
  NOR: {
    strength: 81,
    starPlayers: [
      { name: "Erling Haaland", position: "Forward", note: "Goal machine — one of the most unstoppable strikers ever." },
    ],
  },

  // Group J
  ARG: {
    strength: 95,
    starPlayers: [
      { name: "Lionel Messi", position: "Forward", note: "Captain, World Cup winner, and a true football legend." },
      { name: "Julián Álvarez", position: "Forward", note: "Clever, hard-working striker who scores big goals." },
    ],
  },
  DZA: {
    strength: 76,
    starPlayers: [
      { name: "Riyad Mahrez", position: "Winger", note: "Magical left foot and a Premier League title winner." },
    ],
  },
  AUT: {
    strength: 79,
    starPlayers: [
      { name: "David Alaba", position: "Defender", note: "Versatile Real Madrid star who can play anywhere at the back." },
    ],
  },
  JOR: {
    strength: 70,
    starPlayers: [
      { name: "Mousa Al-Tamari", position: "Winger", note: "Speedy dribbler who lit up the 2023 Asian Cup." },
    ],
  },

  // Group K
  POR: {
    strength: 89,
    starPlayers: [
      { name: "Cristiano Ronaldo", position: "Forward", note: "Record-breaking legend and one of the greatest goal-scorers ever." },
      { name: "Bruno Fernandes", position: "Midfielder", note: "Creative captain who delivers assists and goals." },
    ],
  },
  COD: {
    strength: 73,
    starPlayers: [
      { name: "Yoane Wissa", position: "Forward", note: "Lively Premier League striker full of energy." },
    ],
  },
  UZB: {
    strength: 70,
    starPlayers: [
      { name: "Eldor Shomurodov", position: "Forward", note: "Tall striker and the face of Uzbekistan's rise." },
    ],
  },
  COL: {
    strength: 82,
    starPlayers: [
      { name: "Luis Díaz", position: "Winger", note: "Thrilling Liverpool winger who loves to take on defenders." },
      { name: "James Rodríguez", position: "Midfielder", note: "Playmaker who won the Golden Boot back in 2014." },
    ],
  },

  // Group L
  ENG: {
    strength: 90,
    starPlayers: [
      { name: "Jude Bellingham", position: "Midfielder", note: "All-action Real Madrid star who scores and creates." },
      { name: "Harry Kane", position: "Forward", note: "England's all-time top scorer and a clinical striker." },
    ],
  },
  CRO: {
    strength: 84,
    starPlayers: [
      { name: "Luka Modrić", position: "Midfielder", note: "Maestro midfielder and a former Ballon d'Or winner." },
    ],
  },
  GHA: {
    strength: 75,
    starPlayers: [
      { name: "Mohammed Kudus", position: "Midfielder", note: "Dynamic, skilful attacker who can score from anywhere." },
    ],
  },
  PAN: {
    strength: 72,
    starPlayers: [
      { name: "Adalberto Carrasquilla", position: "Midfielder", note: "Stylish midfielder who runs Panama's game." },
    ],
  },
};
