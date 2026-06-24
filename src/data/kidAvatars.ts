/**
 * Hand-crafted SVG cartoon avatars for the six OC kids.
 * Each is a 120×120 circle-clipped portrait in Chinese New Year red outfit.
 * Distinctive features per child:
 *  - Clark   : oldest, yellow bg, neat confident look
 *  - Bradley  : green bg, energetic wide smile
 *  - Ryland   : purple bg, round glasses
 *  - Remi     : pink bg, two red pom-pom hair ties (her signature!)
 *  - Lucas    : blue bg, young round face
 *  - Lawrence : orange bg, toddler-chubby with big cheeks
 */

export const CLARK_SVG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
<defs><clipPath id="ck"><circle cx="60" cy="60" r="59"/></clipPath></defs>
<g clip-path="url(#ck)">
<rect width="120" height="120" fill="#FEF9C3"/>
<ellipse cx="60" cy="34" rx="28" ry="19" fill="#1A0A00"/>
<ellipse cx="33" cy="52" rx="8" ry="12" fill="#1A0A00"/>
<ellipse cx="87" cy="52" rx="8" ry="12" fill="#1A0A00"/>
<ellipse cx="31" cy="68" rx="5" ry="5.5" fill="#F0B89A"/>
<ellipse cx="89" cy="68" rx="5" ry="5.5" fill="#F0B89A"/>
<ellipse cx="60" cy="68" rx="27" ry="29" fill="#F5C5A3"/>
<path d="M45 58 Q51 55 57 58" stroke="#1A0A00" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<path d="M63 58 Q69 55 75 58" stroke="#1A0A00" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<ellipse cx="50.5" cy="64" rx="5" ry="5.5" fill="#1A0A00"/>
<ellipse cx="69.5" cy="64" rx="5" ry="5.5" fill="#1A0A00"/>
<circle cx="52" cy="62" r="1.6" fill="white"/>
<circle cx="71" cy="62" r="1.6" fill="white"/>
<ellipse cx="60" cy="73" rx="2.5" ry="2" fill="#D4946A"/>
<path d="M50 81 Q60 88 70 81" fill="none" stroke="#8B4513" stroke-width="2" stroke-linecap="round"/>
<path d="M18 97 Q38 88 60 89 Q82 88 102 97 L120 120 L0 120 Z" fill="#CC2929"/>
<path d="M54 89 L60 93 L66 89" stroke="#8B0000" stroke-width="1.5" fill="none"/>
</g></svg>`;

export const BRADLEY_SVG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
<defs><clipPath id="bd"><circle cx="60" cy="60" r="59"/></clipPath></defs>
<g clip-path="url(#bd)">
<rect width="120" height="120" fill="#DCFCE7"/>
<ellipse cx="60" cy="34" rx="28" ry="19" fill="#1A0A00"/>
<ellipse cx="33" cy="52" rx="8" ry="12" fill="#1A0A00"/>
<ellipse cx="87" cy="52" rx="8" ry="12" fill="#1A0A00"/>
<ellipse cx="31" cy="68" rx="5" ry="5.5" fill="#F0B89A"/>
<ellipse cx="89" cy="68" rx="5" ry="5.5" fill="#F0B89A"/>
<ellipse cx="60" cy="68" rx="27" ry="29" fill="#F5C5A3"/>
<ellipse cx="37" cy="76" rx="7" ry="5" fill="#FFB3AE" opacity="0.55"/>
<ellipse cx="83" cy="76" rx="7" ry="5" fill="#FFB3AE" opacity="0.55"/>
<path d="M44 56 Q51 53 58 56" stroke="#1A0A00" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<path d="M62 56 Q69 53 76 56" stroke="#1A0A00" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<ellipse cx="50.5" cy="63" rx="5.5" ry="6" fill="#1A0A00"/>
<ellipse cx="69.5" cy="63" rx="5.5" ry="6" fill="#1A0A00"/>
<circle cx="52" cy="61" r="1.7" fill="white"/>
<circle cx="71" cy="61" r="1.7" fill="white"/>
<ellipse cx="60" cy="73" rx="2.5" ry="2" fill="#D4946A"/>
<path d="M49 82 Q60 92 71 82" fill="none" stroke="#8B4513" stroke-width="2.2" stroke-linecap="round"/>
<path d="M18 97 Q38 88 60 89 Q82 88 102 97 L120 120 L0 120 Z" fill="#CC2929"/>
<path d="M54 89 L60 93 L66 89" stroke="#8B0000" stroke-width="1.5" fill="none"/>
</g></svg>`;

export const RYLAND_SVG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
<defs><clipPath id="ry"><circle cx="60" cy="60" r="59"/></clipPath></defs>
<g clip-path="url(#ry)">
<rect width="120" height="120" fill="#EDE9FE"/>
<ellipse cx="60" cy="34" rx="28" ry="19" fill="#1A0A00"/>
<ellipse cx="33" cy="52" rx="8" ry="12" fill="#1A0A00"/>
<ellipse cx="87" cy="52" rx="8" ry="12" fill="#1A0A00"/>
<ellipse cx="31" cy="68" rx="5" ry="5.5" fill="#F0B89A"/>
<ellipse cx="89" cy="68" rx="5" ry="5.5" fill="#F0B89A"/>
<ellipse cx="60" cy="68" rx="27" ry="29" fill="#F5C5A3"/>
<rect x="39" y="59" width="19" height="14" rx="5" fill="none" stroke="#6D51D8" stroke-width="2.5"/>
<rect x="62" y="59" width="19" height="14" rx="5" fill="none" stroke="#6D51D8" stroke-width="2.5"/>
<line x1="58" y1="66" x2="62" y2="66" stroke="#6D51D8" stroke-width="2.5"/>
<line x1="34" y1="63" x2="39" y2="63" stroke="#6D51D8" stroke-width="2"/>
<line x1="81" y1="63" x2="86" y2="63" stroke="#6D51D8" stroke-width="2"/>
<path d="M44 57 Q50.5 54 57 57" stroke="#1A0A00" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M63 57 Q69.5 54 76 57" stroke="#1A0A00" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<ellipse cx="48.5" cy="66" rx="4" ry="4.5" fill="#1A0A00"/>
<ellipse cx="71.5" cy="66" rx="4" ry="4.5" fill="#1A0A00"/>
<circle cx="50" cy="64.5" r="1.4" fill="white"/>
<circle cx="73" cy="64.5" r="1.4" fill="white"/>
<ellipse cx="60" cy="76" rx="2.5" ry="2" fill="#D4946A"/>
<path d="M50 83 Q60 90 70 83" fill="none" stroke="#8B4513" stroke-width="2" stroke-linecap="round"/>
<path d="M18 97 Q38 88 60 89 Q82 88 102 97 L120 120 L0 120 Z" fill="#CC2929"/>
<path d="M54 89 L60 93 L66 89" stroke="#8B0000" stroke-width="1.5" fill="none"/>
</g></svg>`;

export const REMI_SVG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
<defs><clipPath id="rm"><circle cx="60" cy="60" r="59"/></clipPath></defs>
<g clip-path="url(#rm)">
<rect width="120" height="120" fill="#FCE7F3"/>
<ellipse cx="33" cy="54" rx="7" ry="11" fill="#1A0A00"/>
<ellipse cx="87" cy="54" rx="7" ry="11" fill="#1A0A00"/>
<ellipse cx="60" cy="39" rx="26" ry="18" fill="#1A0A00"/>
<circle cx="40" cy="22" r="13" fill="#CC2929"/>
<circle cx="80" cy="22" r="13" fill="#CC2929"/>
<circle cx="36" cy="18" r="4.5" fill="rgba(255,255,255,0.35)"/>
<circle cx="76" cy="18" r="4.5" fill="rgba(255,255,255,0.35)"/>
<ellipse cx="31" cy="69" rx="5" ry="5.5" fill="#F0B89A"/>
<ellipse cx="89" cy="69" rx="5" ry="5.5" fill="#F0B89A"/>
<ellipse cx="60" cy="69" rx="27" ry="29" fill="#F5C5A3"/>
<ellipse cx="37" cy="77" rx="8.5" ry="6.5" fill="#FFB3AE" opacity="0.68"/>
<ellipse cx="83" cy="77" rx="8.5" ry="6.5" fill="#FFB3AE" opacity="0.68"/>
<path d="M44 59 Q50 56 56 59" stroke="#1A0A00" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M64 59 Q70 56 76 59" stroke="#1A0A00" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<ellipse cx="50" cy="66" rx="6" ry="6.5" fill="#1A0A00"/>
<ellipse cx="70" cy="66" rx="6" ry="6.5" fill="#1A0A00"/>
<circle cx="51.5" cy="64" r="2" fill="white"/>
<circle cx="71.5" cy="64" r="2" fill="white"/>
<line x1="46" y1="58.5" x2="44" y2="55" stroke="#1A0A00" stroke-width="1.3"/>
<line x1="50" y1="57.5" x2="50" y2="54" stroke="#1A0A00" stroke-width="1.3"/>
<line x1="54" y1="58.5" x2="56" y2="55" stroke="#1A0A00" stroke-width="1.3"/>
<line x1="66" y1="58.5" x2="65" y2="55" stroke="#1A0A00" stroke-width="1.3"/>
<line x1="70" y1="57.5" x2="70" y2="54" stroke="#1A0A00" stroke-width="1.3"/>
<line x1="74" y1="58.5" x2="76" y2="55" stroke="#1A0A00" stroke-width="1.3"/>
<ellipse cx="60" cy="76" rx="2.5" ry="2" fill="#D4946A"/>
<path d="M50 84 Q60 92 70 84" fill="none" stroke="#8B4513" stroke-width="2" stroke-linecap="round"/>
<path d="M18 97 Q38 88 60 89 Q82 88 102 97 L120 120 L0 120 Z" fill="#CC2929"/>
<path d="M54 89 L60 93 L66 89" stroke="#8B0000" stroke-width="1.5" fill="none"/>
</g></svg>`;

export const LUCAS_SVG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
<defs><clipPath id="lc"><circle cx="60" cy="60" r="59"/></clipPath></defs>
<g clip-path="url(#lc)">
<rect width="120" height="120" fill="#DBEAFE"/>
<ellipse cx="60" cy="34" rx="27" ry="19" fill="#1A0A00"/>
<ellipse cx="33" cy="52" rx="7.5" ry="12" fill="#1A0A00"/>
<ellipse cx="87" cy="52" rx="7.5" ry="12" fill="#1A0A00"/>
<ellipse cx="31" cy="68" rx="5" ry="5.5" fill="#F0B89A"/>
<ellipse cx="89" cy="68" rx="5" ry="5.5" fill="#F0B89A"/>
<ellipse cx="60" cy="68" rx="27" ry="30" fill="#F5C5A3"/>
<ellipse cx="38" cy="76" rx="7" ry="5.5" fill="#FFB3AE" opacity="0.55"/>
<ellipse cx="82" cy="76" rx="7" ry="5.5" fill="#FFB3AE" opacity="0.55"/>
<path d="M45 58 Q51 55 57 58" stroke="#1A0A00" stroke-width="1.7" fill="none" stroke-linecap="round"/>
<path d="M63 58 Q69 55 75 58" stroke="#1A0A00" stroke-width="1.7" fill="none" stroke-linecap="round"/>
<ellipse cx="50.5" cy="64" rx="5.5" ry="6" fill="#1A0A00"/>
<ellipse cx="69.5" cy="64" rx="5.5" ry="6" fill="#1A0A00"/>
<circle cx="52" cy="62" r="1.8" fill="white"/>
<circle cx="71" cy="62" r="1.8" fill="white"/>
<ellipse cx="60" cy="74" rx="2.5" ry="2" fill="#D4946A"/>
<path d="M50 82 Q60 90 70 82" fill="none" stroke="#8B4513" stroke-width="2" stroke-linecap="round"/>
<path d="M18 97 Q38 88 60 89 Q82 88 102 97 L120 120 L0 120 Z" fill="#CC2929"/>
<path d="M54 89 L60 93 L66 89" stroke="#8B0000" stroke-width="1.5" fill="none"/>
</g></svg>`;

export const LAWRENCE_SVG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
<defs><clipPath id="lw"><circle cx="60" cy="60" r="59"/></clipPath></defs>
<g clip-path="url(#lw)">
<rect width="120" height="120" fill="#FFEDD5"/>
<ellipse cx="60" cy="37" rx="22" ry="13" fill="#1A0A00"/>
<ellipse cx="31" cy="70" rx="6" ry="7" fill="#F0B89A"/>
<ellipse cx="89" cy="70" rx="6" ry="7" fill="#F0B89A"/>
<ellipse cx="60" cy="71" rx="31" ry="33" fill="#F5C5A3"/>
<ellipse cx="36" cy="81" rx="11" ry="8.5" fill="#FFB3AE" opacity="0.72"/>
<ellipse cx="84" cy="81" rx="11" ry="8.5" fill="#FFB3AE" opacity="0.72"/>
<path d="M43 60 Q50 57 57 60" stroke="#1A0A00" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M63 60 Q70 57 77 60" stroke="#1A0A00" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<ellipse cx="50" cy="68" rx="6" ry="6.5" fill="#1A0A00"/>
<ellipse cx="70" cy="68" rx="6" ry="6.5" fill="#1A0A00"/>
<circle cx="51.5" cy="66" r="2.1" fill="white"/>
<circle cx="71.5" cy="66" r="2.1" fill="white"/>
<circle cx="60" cy="79" r="3" fill="#D4946A"/>
<path d="M48 88 Q60 98 72 88" fill="none" stroke="#8B4513" stroke-width="2.5" stroke-linecap="round"/>
<path d="M18 100 Q38 91 60 92 Q82 91 102 100 L120 120 L0 120 Z" fill="#CC2929"/>
<path d="M54 92 L60 96 L66 92" stroke="#8B0000" stroke-width="1.5" fill="none"/>
</g></svg>`;
