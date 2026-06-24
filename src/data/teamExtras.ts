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
 * Star players + strength ratings, keyed by team `fifaCode`.
 *
 * Each player has a `fame` score (higher = more famous) used to rank the
 * Players tab, and the best-known players include approximate bio info
 * (age / marital status / children) plus a few light "buzz" lines.
 *
 * NOTE: bios are approximate and may be outdated; the buzz lines are light and
 * illustrative (for fun), not verified news. Refresh before a tournament.
 */
export const teamExtras: Record<string, TeamExtra> = {
  // ---- Group A ----
  MEX: {
    strength: 79,
    starPlayers: [
      { name: "Santiago Giménez", position: "Forward", fame: 74, note: "Sharp goal-scorer who stars in Europe for AC Milan." },
      { name: "Edson Álvarez", position: "Midfielder", fame: 72, note: "Tough defensive midfielder and team leader." },
    ],
  },
  RSA: {
    strength: 72,
    starPlayers: [
      { name: "Percy Tau", position: "Forward", fame: 64, note: "Tricky attacker known for clever dribbling." },
    ],
  },
  KOR: {
    strength: 78,
    starPlayers: [
      {
        name: "Son Heung-min",
        position: "Forward",
        fame: 88,
        note: "Captain and superstar; one of Asia's greatest ever players.",
        age: 33,
        marital: "Single",
        children: 0,
        buzz: [
          "Captain of South Korea and a global icon.",
          "Won the Premier League Golden Boot.",
          "Hugely popular across Asia and a big sponsor draw.",
        ],
      },
    ],
  },
  CZE: {
    strength: 76,
    starPlayers: [
      { name: "Patrik Schick", position: "Forward", fame: 73, note: "Tall striker famous for spectacular long-range goals." },
    ],
  },

  // ---- Group B ----
  CAN: {
    strength: 76,
    starPlayers: [
      {
        name: "Alphonso Davies",
        position: "Left-back",
        fame: 81,
        note: "Lightning-fast Bayern Munich star, called the 'Roadrunner'.",
        age: 25,
        marital: "In a relationship",
        children: 0,
        buzz: [
          "Born in a refugee camp, now a Canadian icon.",
          "One of the fastest players in world football.",
          "Also a popular gaming streamer.",
        ],
      },
    ],
  },
  BIH: {
    strength: 74,
    starPlayers: [
      { name: "Edin Džeko", position: "Forward", fame: 76, note: "Legendary tall striker and the country's all-time top scorer." },
    ],
  },
  QAT: {
    strength: 74,
    starPlayers: [
      { name: "Akram Afif", position: "Forward", fame: 66, note: "Creative winger who led Qatar to two Asian Cup titles." },
    ],
  },
  SUI: {
    strength: 81,
    starPlayers: [
      { name: "Granit Xhaka", position: "Midfielder", fame: 76, note: "Commanding captain who controls the game's tempo." },
    ],
  },

  // ---- Group C ----
  BRA: {
    strength: 92,
    starPlayers: [
      {
        name: "Vinícius Júnior",
        position: "Forward",
        fame: 93,
        note: "Electric Real Madrid winger with dazzling footwork.",
        age: 25,
        marital: "Single",
        children: 0,
        buzz: [
          "Real Madrid winger and Brazil's talisman.",
          "A leading voice against racism in football.",
          "Runs a foundation supporting kids back in Brazil.",
        ],
      },
      { name: "Rodrygo", position: "Forward", fame: 82, note: "Cool finisher who shines on the biggest stages." },
    ],
  },
  MAR: {
    strength: 82,
    starPlayers: [
      {
        name: "Achraf Hakimi",
        position: "Right-back",
        fame: 85,
        note: "Speedy PSG defender who loves attacking.",
        age: 27,
        children: 2,
        buzz: [
          "PSG right-back and Morocco superstar.",
          "Helped Morocco reach the 2022 World Cup semi-finals.",
          "Famous for his blistering pace down the wing.",
        ],
      },
    ],
  },
  HTI: {
    strength: 66,
    starPlayers: [
      { name: "Frantzdy Pierrot", position: "Forward", fame: 58, note: "Powerful striker and Haiti's main goal threat." },
    ],
  },
  SCO: {
    strength: 75,
    starPlayers: [
      { name: "Andrew Robertson", position: "Left-back", fame: 77, note: "Liverpool full-back known for non-stop running." },
      { name: "Scott McTominay", position: "Midfielder", fame: 74, note: "Box-to-box midfielder with a knack for goals." },
    ],
  },

  // ---- Group D ----
  USA: {
    strength: 80,
    starPlayers: [
      {
        name: "Christian Pulisic",
        position: "Forward",
        fame: 84,
        note: "Captain America — the team's biggest attacking star at AC Milan.",
        age: 27,
        marital: "In a relationship",
        children: 0,
        buzz: [
          "The face of US soccer at a home World Cup.",
          "Stars for AC Milan in Serie A.",
          "Has his own documentary and clothing line.",
        ],
      },
    ],
  },
  PAR: {
    strength: 73,
    starPlayers: [
      { name: "Miguel Almirón", position: "Winger", fame: 68, note: "Quick, hard-working winger with Premier League experience." },
    ],
  },
  AUS: {
    strength: 77,
    starPlayers: [
      { name: "Mathew Ryan", position: "Goalkeeper", fame: 64, note: "Reliable captain and shot-stopper for the Socceroos." },
    ],
  },
  TUR: {
    strength: 80,
    starPlayers: [
      { name: "Arda Güler", position: "Midfielder", fame: 80, note: "Young Real Madrid playmaker with a magical left foot." },
      { name: "Hakan Çalhanoğlu", position: "Midfielder", fame: 78, note: "Master of free-kicks and long passes." },
    ],
  },

  // ---- Group E ----
  GER: {
    strength: 86,
    starPlayers: [
      {
        name: "Jamal Musiala",
        position: "Midfielder",
        fame: 84,
        note: "Bayern wonderkid who glides past defenders.",
        age: 23,
        marital: "Single",
        children: 0,
        buzz: [
          "Bayern Munich's dribbling wizard.",
          "Born in Germany, raised in England — chose Germany.",
          "Nicknamed 'Bambi' for his elegant running style.",
        ],
      },
      { name: "Florian Wirtz", position: "Midfielder", fame: 82, note: "Brilliant creator who sets up and scores goals." },
    ],
  },
  CUW: {
    strength: 65,
    starPlayers: [
      { name: "Leandro Bacuna", position: "Midfielder", fame: 55, note: "Experienced leader of tiny Curaçao's midfield." },
    ],
  },
  CIV: {
    strength: 78,
    starPlayers: [
      { name: "Sébastien Haller", position: "Forward", fame: 70, note: "Strong striker who scored the winner in the 2023 Africa Cup." },
    ],
  },
  ECU: {
    strength: 77,
    starPlayers: [
      { name: "Moisés Caicedo", position: "Midfielder", fame: 76, note: "Powerful Chelsea midfielder who covers every blade of grass." },
    ],
  },

  // ---- Group F ----
  NED: {
    strength: 88,
    starPlayers: [
      {
        name: "Virgil van Dijk",
        position: "Defender",
        fame: 82,
        note: "Towering captain and one of the world's best defenders.",
        age: 34,
        marital: "Married",
        children: 2,
        buzz: [
          "Liverpool captain and a defensive wall.",
          "Leads the Netherlands at the back.",
          "Known for his calm, commanding presence.",
        ],
      },
      { name: "Cody Gakpo", position: "Forward", fame: 76, note: "Versatile Liverpool attacker with a powerful shot." },
    ],
  },
  JPN: {
    strength: 80,
    starPlayers: [
      { name: "Kaoru Mitoma", position: "Winger", fame: 78, note: "Dribbling wizard who studied the science of beating defenders." },
      { name: "Takefusa Kubo", position: "Forward", fame: 77, note: "Skilful playmaker nicknamed 'Japanese Messi'." },
    ],
  },
  SWE: {
    strength: 77,
    starPlayers: [
      { name: "Alexander Isak", position: "Forward", fame: 80, note: "Elegant, deadly striker starring in the Premier League." },
    ],
  },
  TUN: {
    strength: 74,
    starPlayers: [
      { name: "Hannibal Mejbri", position: "Midfielder", fame: 62, note: "Energetic midfielder full of fight and flair." },
    ],
  },

  // ---- Group G ----
  BEL: {
    strength: 86,
    starPlayers: [
      {
        name: "Kevin De Bruyne",
        position: "Midfielder",
        fame: 89,
        note: "One of the greatest passers in the world.",
        age: 34,
        marital: "Married to Michèle Lacroix",
        children: 3,
        buzz: [
          "A long-time Manchester City magician.",
          "Famous for his pinpoint assists.",
          "A respected leader for Belgium's golden generation.",
        ],
      },
      { name: "Romelu Lukaku", position: "Forward", fame: 81, note: "Big, strong striker and Belgium's record scorer." },
    ],
  },
  EGY: {
    strength: 76,
    starPlayers: [
      {
        name: "Mohamed Salah",
        position: "Forward",
        fame: 90,
        note: "Liverpool superstar and Egypt's beloved 'Pharaoh'.",
        age: 33,
        marital: "Married to Magi Salah",
        children: 2,
        buzz: [
          "Record-breaking Liverpool goal-scorer.",
          "A national hero across Egypt and Africa.",
          "Known for his charity work back home.",
        ],
      },
    ],
  },
  IRI: {
    strength: 78,
    starPlayers: [
      { name: "Mehdi Taremi", position: "Forward", fame: 70, note: "Clever striker who plays for Inter Milan." },
    ],
  },
  NZL: {
    strength: 68,
    starPlayers: [
      { name: "Chris Wood", position: "Forward", fame: 66, note: "Tall, reliable striker and New Zealand's talisman." },
    ],
  },

  // ---- Group H ----
  ESP: {
    strength: 91,
    starPlayers: [
      {
        name: "Lamine Yamal",
        position: "Winger",
        fame: 92,
        note: "Teenage Barcelona sensation already among the world's best.",
        age: 18,
        marital: "Single",
        children: 0,
        buzz: [
          "Teen phenomenon at FC Barcelona.",
          "Became the youngest scorer in Euros history.",
          "Wears the famous No. 10 for Spain.",
        ],
      },
      {
        name: "Rodri",
        position: "Midfielder",
        fame: 86,
        note: "Ballon d'Or winner who controls the midfield.",
        age: 29,
        marital: "In a relationship",
        children: 0,
        buzz: [
          "Won the 2024 Ballon d'Or.",
          "The anchor of Manchester City's midfield.",
          "Spain's metronome in the middle of the park.",
        ],
      },
    ],
  },
  CPV: {
    strength: 68,
    starPlayers: [
      { name: "Ryan Mendes", position: "Forward", fame: 55, note: "Experienced attacker leading the tiny islands' charge." },
    ],
  },
  KSA: {
    strength: 72,
    starPlayers: [
      { name: "Salem Al-Dawsari", position: "Winger", fame: 66, note: "Scored the famous winner against Argentina in 2022." },
    ],
  },
  URU: {
    strength: 83,
    starPlayers: [
      {
        name: "Federico Valverde",
        position: "Midfielder",
        fame: 83,
        note: "Tireless Real Madrid engine with a rocket shot.",
        age: 27,
        marital: "Married to Mina Bonino",
        children: 2,
        buzz: [
          "A box-to-box powerhouse for Real Madrid.",
          "Famous for his thunderous long-range goals.",
          "A leader of Uruguay's new generation.",
        ],
      },
      { name: "Darwin Núñez", position: "Forward", fame: 79, note: "Fast, fearless striker who never stops running." },
    ],
  },

  // ---- Group I ----
  FRA: {
    strength: 94,
    starPlayers: [
      {
        name: "Kylian Mbappé",
        position: "Forward",
        fame: 98,
        note: "Captain and one of the fastest, deadliest players alive.",
        age: 27,
        marital: "In a relationship",
        children: 0,
        buzz: [
          "Joined Real Madrid as their new galáctico.",
          "Captain of the France national team.",
          "Runs his own production company off the pitch.",
        ],
      },
    ],
  },
  SEN: {
    strength: 80,
    starPlayers: [
      { name: "Sadio Mané", position: "Forward", fame: 82, note: "Senegal's hero who won them the 2021 Africa Cup." },
    ],
  },
  IRQ: {
    strength: 71,
    starPlayers: [
      { name: "Aymen Hussein", position: "Forward", fame: 56, note: "Big striker and Iraq's go-to goal-getter." },
    ],
  },
  NOR: {
    strength: 81,
    starPlayers: [
      {
        name: "Erling Haaland",
        position: "Forward",
        fame: 95,
        note: "Goal machine — one of the most unstoppable strikers ever.",
        age: 25,
        marital: "In a relationship",
        children: 1,
        buzz: [
          "A relentless goal machine for Manchester City.",
          "Signed a long-term contract extension.",
          "Known for his unusual recovery and sleep routines.",
        ],
      },
    ],
  },

  // ---- Group J ----
  ARG: {
    strength: 95,
    starPlayers: [
      {
        name: "Lionel Messi",
        position: "Forward",
        fame: 99,
        note: "Captain, World Cup winner, and a true football legend.",
        age: 38,
        marital: "Married to Antonela Roccuzzo",
        children: 3,
        buzz: [
          "Leads Inter Miami in MLS after his European career.",
          "Captained Argentina to the 2022 World Cup title.",
          "One of the most followed athletes on the planet.",
        ],
      },
      { name: "Julián Álvarez", position: "Forward", fame: 82, note: "Clever, hard-working striker who scores big goals." },
    ],
  },
  DZA: {
    strength: 76,
    starPlayers: [
      { name: "Riyad Mahrez", position: "Winger", fame: 78, note: "Magical left foot and a Premier League title winner." },
    ],
  },
  AUT: {
    strength: 79,
    starPlayers: [
      { name: "David Alaba", position: "Defender", fame: 78, note: "Versatile Real Madrid star who can play anywhere at the back." },
    ],
  },
  JOR: {
    strength: 70,
    starPlayers: [
      { name: "Mousa Al-Tamari", position: "Winger", fame: 60, note: "Speedy dribbler who lit up the 2023 Asian Cup." },
    ],
  },

  // ---- Group K ----
  POR: {
    strength: 89,
    starPlayers: [
      {
        name: "Cristiano Ronaldo",
        position: "Forward",
        fame: 98,
        note: "Record-breaking legend and one of the greatest goal-scorers ever.",
        age: 41,
        marital: "With partner Georgina Rodríguez",
        children: 5,
        buzz: [
          "Stars for Al-Nassr in Saudi Arabia.",
          "The all-time top scorer in men's international football.",
          "Among the most followed people on Earth.",
        ],
      },
      { name: "Bruno Fernandes", position: "Midfielder", fame: 83, note: "Creative captain who delivers assists and goals." },
    ],
  },
  COD: {
    strength: 73,
    starPlayers: [
      { name: "Yoane Wissa", position: "Forward", fame: 64, note: "Lively Premier League striker full of energy." },
    ],
  },
  UZB: {
    strength: 70,
    starPlayers: [
      { name: "Eldor Shomurodov", position: "Forward", fame: 60, note: "Tall striker and the face of Uzbekistan's rise." },
    ],
  },
  COL: {
    strength: 82,
    starPlayers: [
      {
        name: "Luis Díaz",
        position: "Winger",
        fame: 80,
        note: "Thrilling winger who loves to take on defenders.",
        age: 29,
        marital: "Married",
        children: 2,
        buzz: [
          "An electric, fearless dribbler.",
          "Colombia's attacking spark.",
          "Rose from humble beginnings in northern Colombia.",
        ],
      },
      { name: "James Rodríguez", position: "Midfielder", fame: 80, note: "Playmaker who won the Golden Boot back in 2014." },
    ],
  },

  // ---- Group L ----
  ENG: {
    strength: 90,
    starPlayers: [
      {
        name: "Jude Bellingham",
        position: "Midfielder",
        fame: 94,
        note: "All-action Real Madrid star who scores and creates.",
        age: 22,
        marital: "Single",
        children: 0,
        buzz: [
          "Star midfielder for Real Madrid.",
          "Wears the iconic No. 5 shirt.",
          "His brother Jobe is also a professional footballer.",
        ],
      },
      {
        name: "Harry Kane",
        position: "Forward",
        fame: 90,
        note: "England's all-time top scorer and a clinical striker.",
        age: 32,
        marital: "Married to Katie Goodland",
        children: 4,
        buzz: [
          "Bayern Munich striker and England captain.",
          "England's all-time leading scorer.",
          "Famous for his deep, pinpoint passing.",
        ],
      },
    ],
  },
  CRO: {
    strength: 84,
    starPlayers: [
      {
        name: "Luka Modrić",
        position: "Midfielder",
        fame: 86,
        note: "Maestro midfielder and a former Ballon d'Or winner.",
        age: 40,
        marital: "Married to Vanja Bosnić",
        children: 3,
        buzz: [
          "Won the 2018 Ballon d'Or.",
          "Croatia's most-capped player ever.",
          "Still pulling the strings in midfield at 40.",
        ],
      },
    ],
  },
  GHA: {
    strength: 75,
    starPlayers: [
      { name: "Mohammed Kudus", position: "Midfielder", fame: 76, note: "Dynamic, skilful attacker who can score from anywhere." },
    ],
  },
  PAN: {
    strength: 72,
    starPlayers: [
      { name: "Adalberto Carrasquilla", position: "Midfielder", fame: 58, note: "Stylish midfielder who runs Panama's game." },
    ],
  },
};
