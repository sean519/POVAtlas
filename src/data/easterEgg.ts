// 🥚 Hidden easter egg: the "OC居委会 大本营" in Orange County, California.
//
// Only appears when the map is zoomed deep into OC — regular visitors never
// see it, but a friend who explores gets a fun surprise.

export interface EggMember {
  name: string;
  emoji: string;
  /** Cartoon avatar image URL (served from /public/avatars); falls back to emoji. */
  avatarUrl?: string;
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
    avatarUrl: "/avatars/Sean.png",
    cheers: ["加油! 🔥", "GOAL!! ⚽", "厉害!!", "我们赢了! 🏆"],
  },
  {
    name: "Roy",
    emoji: "🧑",
    avatarUrl: "/avatars/Roy.png",
    cheers: ["必胜! ✊", "射门! 🥅", "Nice one! 👏", "冲!! 💪"],
  },
  {
    name: "Han",
    emoji: "👨",
    avatarUrl: "/avatars/Han.png",
    cheers: ["太精彩了! 🌟", "Go go go!", "好球! ⚽", "哇哦!"],
  },
  {
    name: "Sharon",
    emoji: "👩",
    avatarUrl: "/avatars/Sharon.png",
    cheers: ["亮了! ✨", "耶! 🎉", "加油宝贝们!", "漂亮! 👏"],
  },
  {
    name: "Emily",
    emoji: "🧑‍🦱",
    avatarUrl: "/avatars/Emily.png",
    cheers: ["We can do it! 💫", "太厉害了!", "冲鸭! 🦆", "Amazing! 🌺"],
  },
  {
    name: "Clair",
    emoji: "👩‍🦰",
    avatarUrl: "/avatars/Clair.png",
    cheers: ["完美! 🌟", "Yes!! 🙌", "棒棒的!", "超级赞! ⭐"],
  },
];

export const OC_KIDS: EggMember[] = [
  {
    name: "Clark",
    emoji: "👦",
    avatarUrl: "/avatars/Clark.png",
    cheers: ["哇哦! ⚽", "我也要踢!", "GOAL! 🎯", "超帅!"],
  },
  {
    name: "Bradley",
    emoji: "🧒",
    avatarUrl: "/avatars/Bradley.png",
    cheers: ["耶!! 🎊", "射门! 💥", "太酷了!", "冲!"],
  },
  {
    name: "Ryland",
    emoji: "👦🏻",
    avatarUrl: "/avatars/Ryland.png",
    cheers: ["哈哈嗨! 😄", "厉害厉害!", "踢! 踢!", "嗷嗷嗷!"],
  },
  {
    name: "Remi",
    emoji: "👧",
    avatarUrl: "/avatars/Remi.png",
    cheers: ["嘻嘻~ 🌸", "好玩好玩!", "耶~ ⭐", "咯咯咯~"],
  },
  {
    name: "Lucas",
    emoji: "🧒🏻",
    avatarUrl: "/avatars/Lucas.png",
    cheers: ["我能行! 💪", "快点快点! 🏃", "哦哦哦!", "冲啊冲啊!"],
  },
  {
    name: "Lawrence",
    emoji: "👶",
    avatarUrl: "/avatars/Lawrence.png",
    cheers: ["我最棒! 😎", "进球啦! 🎊", "耶耶耶!", "嗨嗨嗨!"],
  },
];
