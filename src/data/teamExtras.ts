import type { StarPlayer } from "../types";

export interface TeamExtra {
  strength: number;
  starPlayers: StarPlayer[];
}

/**
 * Star players + strength ratings, keyed by team `fifaCode`.
 *
 * `fame` ranks players globally in the Players tab.
 * Bios are approximate; buzz lines are light and illustrative, not verified news.
 */
export const teamExtras: Record<string, TeamExtra> = {
  // ---- Group A ----
  MEX: {
    strength: 79,
    starPlayers: [
      {
        name: "Santiago Giménez",
        position: "Forward",
        fame: 74,
        note: "Sharp goal-scorer who stars in Europe for AC Milan.",
        age: 24,
        marital: "Single",
        children: 0,
        buzz: [
          "AC Milan's clinical finisher nicknamed 'Bebote'.",
          "Son of former Mexican defender Iván 'El Compás' Campeche.",
          "Became one of Serie A's most exciting young strikers.",
        ],
      },
      {
        name: "Edson Álvarez",
        position: "Midfielder",
        fame: 72,
        note: "Tough defensive midfielder and team leader.",
        age: 28,
        marital: "Single",
        children: 0,
        buzz: [
          "Known as 'El Machín' for his relentless tackling.",
          "A key figure in Mexico's defensive structure.",
          "One of the most sought-after midfielders from CONCACAF.",
        ],
      },
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
          "Won the Premier League Golden Boot in 2021-22.",
          "Hugely popular across Asia and a top sponsor draw.",
        ],
      },
    ],
  },
  CZE: {
    strength: 76,
    starPlayers: [
      {
        name: "Patrik Schick",
        position: "Forward",
        fame: 73,
        note: "Tall striker famous for spectacular long-range goals.",
        age: 30,
        marital: "Married",
        children: 1,
        buzz: [
          "Scored a jaw-dropping 50-yard lob against Scotland at Euro 2020.",
          "Won the Bundesliga title with Bayer Leverkusen in 2024.",
          "A technically gifted striker with an eye for the spectacular.",
        ],
      },
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
          "Born in a Ghanaian refugee camp, now a Canadian icon.",
          "One of the fastest players in world football.",
          "Also a popular gaming streamer off the pitch.",
        ],
      },
    ],
  },
  BIH: {
    strength: 74,
    starPlayers: [
      {
        name: "Edin Džeko",
        position: "Forward",
        fame: 76,
        note: "Legendary tall striker and the country's all-time top scorer.",
        age: 39,
        marital: "Married",
        children: 3,
        buzz: [
          "Bosnia's all-time top scorer — still playing into his late 30s.",
          "Played for top clubs including Man City, Roma, and Inter Milan.",
          "A national hero who put Bosnian football on the map.",
        ],
      },
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
      {
        name: "Granit Xhaka",
        position: "Midfielder",
        fame: 76,
        note: "Commanding captain who controls the game's tempo.",
        age: 33,
        marital: "Married to Leonita Lekaj",
        children: 2,
        buzz: [
          "Lifted the Bundesliga title as Leverkusen's captain in 2024.",
          "Transformed his career after a rocky spell at Arsenal.",
          "Switzerland's trusted leader and set-piece specialist.",
        ],
      },
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
      {
        name: "Rodrygo",
        position: "Forward",
        fame: 82,
        note: "Cool finisher who shines on the biggest stages.",
        age: 24,
        marital: "Single",
        children: 0,
        buzz: [
          "Known for scoring crucial Champions League goals for Real Madrid.",
          "A stylish, two-footed forward with excellent movement.",
          "Brazil's trusted second option behind Vinícius.",
        ],
      },
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
          "Famous for his blistering pace down the right wing.",
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
      {
        name: "Andrew Robertson",
        position: "Left-back",
        fame: 77,
        note: "Liverpool full-back known for non-stop running.",
        age: 32,
        marital: "Married",
        children: 2,
        buzz: [
          "Liverpool's relentless left-back and Scotland captain.",
          "Won every major trophy at Liverpool including the Premier League.",
          "Famous for his incredible work rate up and down the wing.",
        ],
      },
      {
        name: "Scott McTominay",
        position: "Midfielder",
        fame: 74,
        note: "Box-to-box midfielder with a knack for goals.",
        age: 29,
        marital: "Single",
        children: 0,
        buzz: [
          "Scored multiple last-minute goals to keep Scotland alive in qualifying.",
          "Made a bold career move to Napoli in Serie A.",
          "Transformed from squad player to national hero.",
        ],
      },
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
      {
        name: "Arda Güler",
        position: "Midfielder",
        fame: 80,
        note: "Young Real Madrid playmaker with a magical left foot.",
        age: 20,
        marital: "Single",
        children: 0,
        buzz: [
          "Scored a stunning long-range goal on his Euros debut at just 19.",
          "Real Madrid's next big thing — dubbed the 'Turkish Messi'.",
          "The whole world is watching to see how far he can go.",
        ],
      },
      {
        name: "Hakan Çalhanoğlu",
        position: "Midfielder",
        fame: 78,
        note: "Master of free-kicks and long passes.",
        age: 31,
        marital: "Divorced",
        children: 1,
        buzz: [
          "Inter Milan's deep-lying playmaker and free-kick specialist.",
          "One of Europe's best ball-playing midfielders.",
          "Moved from AC Milan to rivals Inter — fans will never forget.",
        ],
      },
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
      {
        name: "Florian Wirtz",
        position: "Midfielder",
        fame: 82,
        note: "Brilliant creator who sets up and scores goals.",
        age: 22,
        marital: "In a relationship",
        children: 0,
        buzz: [
          "Won Germany's first league title with Leverkusen — never been done by a team before without losing a game.",
          "Creative genius with an almost telepathic football brain.",
          "Expected to join a top European club very soon.",
        ],
      },
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
      {
        name: "Moisés Caicedo",
        position: "Midfielder",
        fame: 76,
        note: "Powerful Chelsea midfielder who covers every blade of grass.",
        age: 24,
        marital: "Single",
        children: 0,
        buzz: [
          "Transferred to Chelsea for a then Premier League record fee.",
          "Ecuador's midfield engine and a future global superstar.",
          "Famous for his combination of brute strength and technical skill.",
        ],
      },
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
      {
        name: "Cody Gakpo",
        position: "Forward",
        fame: 76,
        note: "Versatile Liverpool attacker with a powerful shot.",
        age: 26,
        marital: "In a relationship",
        children: 1,
        buzz: [
          "Scored three goals at the 2022 World Cup.",
          "Versatile enough to play winger or centre-forward.",
          "A rising superstar improving with every season at Liverpool.",
        ],
      },
    ],
  },
  JPN: {
    strength: 80,
    starPlayers: [
      {
        name: "Kaoru Mitoma",
        position: "Winger",
        fame: 78,
        note: "Dribbling wizard who studied the science of beating defenders.",
        age: 28,
        marital: "Single",
        children: 0,
        buzz: [
          "Wrote his university thesis on the biomechanics of dribbling.",
          "Brighton's most exciting attacker and one of the Premier League's best.",
          "Uses data and video analysis to make his game even sharper.",
        ],
      },
      {
        name: "Takefusa Kubo",
        position: "Forward",
        fame: 77,
        note: "Skilful playmaker nicknamed 'Japanese Messi'.",
        age: 23,
        marital: "Single",
        children: 0,
        buzz: [
          "Was a Barcelona youth-team product before joining Real Madrid.",
          "Now stars for Real Sociedad in La Liga.",
          "Known for his lightning dribbles and flair.",
        ],
      },
    ],
  },
  SWE: {
    strength: 77,
    starPlayers: [
      {
        name: "Alexander Isak",
        position: "Forward",
        fame: 80,
        note: "Elegant, deadly striker starring in the Premier League.",
        age: 26,
        marital: "Single",
        children: 0,
        buzz: [
          "Newcastle's star striker with some of the best touch in the league.",
          "One of the Premier League's most clinical finishers.",
          "Sweden's next Zlatan — with a very different, calmer style.",
        ],
      },
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
          "Famous for his pinpoint assists and vision.",
          "A respected leader for Belgium's golden generation.",
        ],
      },
      {
        name: "Romelu Lukaku",
        position: "Forward",
        fame: 81,
        note: "Big, strong striker and Belgium's record scorer.",
        age: 32,
        marital: "Single",
        children: 1,
        buzz: [
          "Belgium's all-time leading goal scorer.",
          "A physical powerhouse playing in Italy's Serie A.",
          "One of the most feared penalty-box strikers in world football.",
        ],
      },
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
          "Known for his charitable work back home.",
        ],
      },
    ],
  },
  IRI: {
    strength: 78,
    starPlayers: [
      {
        name: "Mehdi Taremi",
        position: "Forward",
        fame: 70,
        note: "Clever striker who plays for Inter Milan.",
        age: 33,
        marital: "Married",
        children: 2,
        buzz: [
          "Joined Inter Milan on a free transfer — a dream move.",
          "Scored a stunning bicycle-kick in the Champions League.",
          "Iran's most important forward for over a decade.",
        ],
      },
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
      {
        name: "Darwin Núñez",
        position: "Forward",
        fame: 79,
        note: "Fast, fearless striker who never stops running.",
        age: 26,
        marital: "Married",
        children: 1,
        buzz: [
          "Liverpool's electric striker signed for a club-record fee.",
          "Known for his raw pace and never-say-die attitude.",
          "A physical force who defenders hate facing.",
        ],
      },
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
      {
        name: "Sadio Mané",
        position: "Forward",
        fame: 82,
        note: "Senegal's hero who won them the 2021 Africa Cup.",
        age: 33,
        marital: "Married",
        children: 1,
        buzz: [
          "Led Senegal to their first-ever Africa Cup of Nations title.",
          "Former Liverpool and Bayern Munich star, now in Saudi Arabia.",
          "Famous for his incredible generosity — built a hospital in his home village.",
        ],
      },
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
      {
        name: "Julián Álvarez",
        position: "Forward",
        fame: 82,
        note: "Clever, hard-working striker who scores big goals.",
        age: 25,
        marital: "In a relationship",
        children: 0,
        buzz: [
          "Won the World Cup with Argentina in 2022 and scored in the final.",
          "Won the Golden Boot at the 2024 Copa America.",
          "Moved from Man City to Atlético Madrid to get more minutes.",
        ],
      },
    ],
  },
  DZA: {
    strength: 76,
    starPlayers: [
      {
        name: "Riyad Mahrez",
        position: "Winger",
        fame: 78,
        note: "Magical left foot and a Premier League title winner.",
        age: 35,
        marital: "Married",
        children: 3,
        buzz: [
          "Won four Premier League titles at Manchester City.",
          "Now plays in Saudi Arabia for Al-Ahli.",
          "Algeria's greatest ever player — a club and country legend.",
        ],
      },
    ],
  },
  AUT: {
    strength: 79,
    starPlayers: [
      {
        name: "David Alaba",
        position: "Defender",
        fame: 78,
        note: "Versatile Real Madrid star who can play anywhere at the back.",
        age: 33,
        marital: "Married",
        children: 1,
        buzz: [
          "Won almost every major trophy in Europe at Bayern and Real Madrid.",
          "Previously considered the best left-back in the world.",
          "Austria's most capped and beloved player of his generation.",
        ],
      },
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
      {
        name: "Bruno Fernandes",
        position: "Midfielder",
        fame: 83,
        note: "Creative captain who delivers assists and goals.",
        age: 31,
        marital: "Married to Ana Pinho",
        children: 2,
        buzz: [
          "Manchester United's captain and creative heartbeat.",
          "One of the Premier League's most prolific goal-creating midfielders.",
          "Known for his fiery passion and direct free-kick delivery.",
        ],
      },
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
          "An electric, fearless dribbler at Liverpool.",
          "Colombia's attacking spark and crowd favourite.",
          "Rose from humble beginnings in northern Colombia to world football.",
        ],
      },
      {
        name: "James Rodríguez",
        position: "Midfielder",
        fame: 80,
        note: "Playmaker who won the Golden Boot in 2014.",
        age: 34,
        marital: "Divorced",
        children: 1,
        buzz: [
          "Won the 2014 World Cup Golden Boot with 6 stunning goals.",
          "Still influential for Colombia — led them to the 2024 Copa America final.",
          "His famous volley vs. Uruguay is one of the greatest World Cup goals ever.",
        ],
      },
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
          "Star midfielder for Real Madrid wearing the iconic No. 5.",
          "His brother Jobe is also a rising professional footballer.",
          "Already one of the most complete midfielders in world football.",
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
          "Famous for his deep, pinpoint passing and leadership.",
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
      {
        name: "Mohammed Kudus",
        position: "Midfielder",
        fame: 76,
        note: "Dynamic, skilful attacker who can score from anywhere.",
        age: 25,
        marital: "Single",
        children: 0,
        buzz: [
          "West Ham's dynamic box-to-box forward and crowd favourite.",
          "Moved from Ajax to England's top flight and immediately shone.",
          "Ghana's most technically gifted player in a generation.",
        ],
      },
    ],
  },
  PAN: {
    strength: 72,
    starPlayers: [
      { name: "Adalberto Carrasquilla", position: "Midfielder", fame: 58, note: "Stylish midfielder who runs Panama's game." },
    ],
  },
};
