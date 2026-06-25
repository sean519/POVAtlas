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
    cheers: [
      "加油! 🔥",
      "GOAL!! ⚽",
      "厉害!!",
      "我们赢了! 🏆",
      "这波太燃了!",
      "全场MVP!",
      "稳稳拿捏! 👏",
      "起飞起飞! 🚀",
      "防守拉满!",
      "上大分! 📈",
    ],
  },
  {
    name: "Roy",
    emoji: "🧑",
    avatarUrl: "/avatars/Roy.png",
    cheers: [
      "必胜! ✊",
      "射门! 🥅",
      "Nice one! 👏",
      "冲!! 💪",
      "节奏带起来!",
      "今天状态在线!",
      "一脚定乾坤!",
      "太有画面了!",
      "稳住, 我们能赢!",
      "这球有东西!",
    ],
  },
  {
    name: "Han",
    emoji: "👨",
    avatarUrl: "/avatars/Han.png",
    cheers: [
      "太精彩了! 🌟",
      "Go go go!",
      "好球! ⚽",
      "哇哦!",
      "高光时刻!",
      "漂亮传球!",
      "这配合绝了!",
      "满分操作! 💯",
      "全队都在线!",
      "继续压上!",
    ],
  },
  {
    name: "Sharon",
    emoji: "👩",
    avatarUrl: "/avatars/Sharon.png",
    cheers: [
      "亮了! ✨",
      "耶! 🎉",
      "加油宝贝们!",
      "漂亮! 👏",
      "闪闪发光!",
      "今天超棒!",
      "给你们打call!",
      "爱你老己, 也爱球队!",
      "开心值拉满!",
      "全员小太阳! ☀️",
    ],
  },
  {
    name: "Emily",
    emoji: "🧑‍🦱",
    avatarUrl: "/avatars/Emily.png",
    cheers: [
      "We can do it! 💫",
      "太厉害了!",
      "冲鸭! 🦆",
      "Amazing! 🌺",
      "Teamwork wins!",
      "这波很顶!",
      "气氛组上线!",
      "每一脚都算数!",
      "相信自己!",
      "Let's gooooo!",
    ],
  },
  {
    name: "Clair",
    emoji: "👩‍🦰",
    avatarUrl: "/avatars/Clair.png",
    cheers: [
      "完美! 🌟",
      "Yes!! 🙌",
      "棒棒的!",
      "超级赞! ⭐",
      "好球好球!",
      "直接封神!",
      "快乐加倍!",
      "这就是默契!",
      "燃起来了!",
      "全场最闪亮!",
    ],
  },
];

export const OC_KIDS: EggMember[] = [
  {
    name: "Clark",
    emoji: "👦",
    avatarUrl: "/avatars/Clark.png",
    cheers: [
      "哇哦! ⚽",
      "我也要踢!",
      "GOAL! 🎯",
      "超帅!",
      "帅到起飞!",
      "这球太酷啦!",
      "我宣布你赢啦!",
      "冲冲冲!",
      "小小MVP!",
      "再来一个!",
    ],
  },
  {
    name: "Bradley",
    emoji: "🧒",
    avatarUrl: "/avatars/Bradley.png",
    cheers: [
      "耶!! 🎊",
      "射门! 💥",
      "太酷了!",
      "冲!",
      "进球进球!",
      "跑起来!",
      "给我看呆了!",
      "这也太会踢了!",
      "绝绝子!",
      "赢麻啦!",
    ],
  },
  {
    name: "Ryland",
    emoji: "👦🏻",
    avatarUrl: "/avatars/Ryland.png",
    cheers: [
      "哈哈嗨! 😄",
      "厉害厉害!",
      "踢! 踢!",
      "嗷嗷嗷!",
      "嘿嘿, 太强啦!",
      "满血开冲!",
      "这个球我喜欢!",
      "功夫机器人附体!",
      "哇塞哇塞!",
      "快乐进球机!",
    ],
  },
  {
    name: "Remi",
    emoji: "👧",
    avatarUrl: "/avatars/Remi.png",
    cheers: [
      "嘻嘻~ 🌸",
      "好玩好玩!",
      "耶~ ⭐",
      "咯咯咯~",
      "可爱又能踢!",
      "小花花加油!",
      "蹦起来啦!",
      "快乐值爆表!",
      "奶龙大笑级开心!",
      "一闪一闪进球啦!",
    ],
  },
  {
    name: "Lucas",
    emoji: "🧒🏻",
    avatarUrl: "/avatars/Lucas.png",
    cheers: [
      "我能行! 💪",
      "快点快点! 🏃",
      "哦哦哦!",
      "冲啊冲啊!",
      "速度拉满!",
      "像风一样!",
      "能量条满了!",
      "这个冲刺太帅!",
      "一路狂飙!",
      "进攻启动!",
    ],
  },
  {
    name: "Lawrence",
    emoji: "👶",
    avatarUrl: "/avatars/Lawrence.png",
    cheers: [
      "我最棒! 😎",
      "进球啦! 🎊",
      "耶耶耶!",
      "嗨嗨嗨!",
      "宝宝也来加油!",
      "小手拍拍!",
      "哇呀呀冲!",
      "全家都在欢呼!",
      "我的刀盾, 太强啦!",
      "快乐发射! 🚀",
    ],
  },
];
