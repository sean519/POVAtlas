// 🥚 Hidden easter egg: the "OC居委会 大本营" in Orange County, California.
//
// Only appears when the map is zoomed deep into OC — regular visitors never
// see it, but a friend who explores gets a fun surprise.

export interface EggMember {
  name: string;
  emoji: string;
  /** Multiple lines cycled randomly each tap, shown in a speech bubble. */
  cheers: string[];
}

/** Where the HQ marker sits (central Orange County, CA). */
export const OC_HQ = {
  lat: 33.7455,
  lng: -117.8677,
  title: "OC居委会 大本营",
  subtitle: "你发现了隐藏彩蛋! 🎉",
};

// Trigger: zoom in past this level AND centre the map on OC.
export const OC_TRIGGER = {
  minZoom: 9,
  latMin: 33.45,
  latMax: 33.95,
  lngMin: -118.15,
  lngMax: -117.45,
};

export const OC_ADULTS: EggMember[] = [
  {
    name: "Sean",
    emoji: "🧔",
    cheers: ["加油! 🔥", "GOAL!! ⚽", "厉害!!", "我们赢了! 🏆"],
  },
  {
    name: "Roy",
    emoji: "🧑",
    cheers: ["必胜! ✊", "射门! 🥅", "Nice one! 👏", "冲!! 💪"],
  },
  {
    name: "Han",
    emoji: "👨",
    cheers: ["太精彩了! 🌟", "Go go go!", "好球! ⚽", "哇哦!"],
  },
  {
    name: "Sharon",
    emoji: "👩",
    cheers: ["亮了! ✨", "耶! 🎉", "加油宝贝们!", "漂亮! 👏"],
  },
  {
    name: "Emily",
    emoji: "🧑‍🦱",
    cheers: ["We can do it! 💫", "太厉害了!", "冲鸭! 🦆", "Amazing! 🌺"],
  },
  {
    name: "Clair",
    emoji: "👩‍🦰",
    cheers: ["完美! 🌟", "Yes!! 🙌", "棒棒的!", "超级赞! ⭐"],
  },
];

export const OC_KIDS: EggMember[] = [
  {
    name: "Clark",
    emoji: "👦",
    cheers: ["哇哦! ⚽", "我也要踢!", "GOAL! 🎯", "超帅!"],
  },
  {
    name: "Bradley",
    emoji: "🧒",
    cheers: ["耶!! 🎊", "射门! 💥", "太酷了!", "冲!"],
  },
  {
    name: "Ryland",
    emoji: "👦🏻",
    cheers: ["哈哈嗨! 😄", "厉害厉害!", "踢! 踢!", "嗷嗷嗷!"],
  },
  {
    name: "Remi",
    emoji: "👧",
    cheers: ["嘻嘻~ 🌸", "好玩好玩!", "耶~ ⭐", "咯咯咯~"],
  },
  {
    name: "Lucas",
    emoji: "🧒🏻",
    cheers: ["我能行! 💪", "快点快点! 🏃", "哦哦哦!", "冲啊冲啊!"],
  },
  {
    name: "Lawrence",
    emoji: "👶",
    cheers: ["我最棒! 😎", "进球啦! 🎊", "耶耶耶!", "嗨嗨嗨!"],
  },
];
