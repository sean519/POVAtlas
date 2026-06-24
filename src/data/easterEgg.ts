// 🥚 Hidden easter egg: the "OC居委会 大本营" in Orange County, California.
//
// It only appears when someone zooms the map ALL THE WAY into Orange County,
// so regular visitors browsing the world never see it — but a friend who
// explores OC gets a fun surprise. Edit the names / emojis / cheers below to
// match your real OC居委会 crew.

export interface EggMember {
  name: string;
  emoji: string;
  /** A short line shown in a speech bubble when the avatar is tapped. */
  cheer: string;
}

/** Where the HQ marker sits (central Orange County, CA). */
export const OC_HQ = {
  lat: 33.7455,
  lng: -117.8677,
  title: "OC居委会 大本营",
  subtitle: "你发现了隐藏彩蛋! 🎉",
};

// Zoom in past this level AND have the map centered on OC to reveal the egg.
export const OC_TRIGGER = {
  minZoom: 9,
  latMin: 33.45,
  latMax: 33.95,
  lngMin: -118.15,
  lngMax: -117.45,
};

export const OC_ADULTS: EggMember[] = [
  { name: "大人 1", emoji: "🧔", cheer: "加油!" },
  { name: "大人 2", emoji: "🧑", cheer: "GOAL! ⚽" },
  { name: "大人 3", emoji: "👨", cheer: "冲鸭!" },
  { name: "大人 4", emoji: "👩", cheer: "Let's go!" },
  { name: "大人 5", emoji: "🧑‍🦱", cheer: "好球!" },
  { name: "大人 6", emoji: "👨‍🦰", cheer: "耶! 🎉" },
];

export const OC_KIDS: EggMember[] = [
  { name: "小将 1", emoji: "👦", cheer: "哇! ⚽" },
  { name: "小将 2", emoji: "👧", cheer: "射门!" },
  { name: "小将 3", emoji: "🧒", cheer: "嘿嘿~" },
  { name: "小将 4", emoji: "👶", cheer: "咯咯咯" },
  { name: "小将 5", emoji: "🧑‍🍼", cheer: "我也要踢!" },
  { name: "小将 6", emoji: "👦🏻", cheer: "耶!!" },
];
