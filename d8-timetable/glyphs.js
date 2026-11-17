/* d8-timetable: drawn filled glyphs (resources + phone nav). All use currentColor. */
window.GLYPHS = (function () {
  const svg = (inner, label) => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"${label ? ` data-glyph="${label}"` : ""}>${inner}</svg>`;
  return {
    // resources
    wood: svg(`<path d="M3 8h13a3.5 3.5 0 0 1 0 7H3z"/><ellipse cx="17" cy="11.5" rx="4" ry="4.5"/><ellipse cx="17" cy="11.5" rx="1.6" ry="1.9" fill="#1d2725" opacity=".55"/><path d="M3 15.5h11l-1.6 3H3z" opacity=".7"/>`, "wood"),
    iron: svg(`<path d="M6 7h12l3 10H3z"/><path d="M8.2 9h7.6l.9 3H7.3z" fill="#1d2725" opacity=".35"/>`, "iron"),
    electricity: svg(`<path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6z"/>`, "electricity"),
    coin: svg(`<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6.5" fill="#1d2725" opacity=".35"/><path d="M11 7h2v10h-2z"/><path d="M9 9.5h6v2H9zM9 12.5h6v2H9z" opacity=".9"/>`, "coin"),
    badge: svg(`<path d="M12 2 20 5v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="m12 7 1.5 3.2 3.5.4-2.6 2.4.7 3.5L12 14.8l-3.1 1.7.7-3.5L7 10.6l3.5-.4z" fill="#1d2725" opacity=".5"/>`, "badge"),
    crystal: svg(`<path d="M12 1.5 20 7v10l-8 5.5L4 17V7z"/><path d="M12 1.5v21M4 7l8 5 8-5M12 12l8 5M12 12 4 17" stroke="#1d2725" stroke-opacity=".45" stroke-width="1.2" fill="none"/>`, "crystal"),
    clock: svg(`<path d="M9 1.5h6v2H9z"/><circle cx="12" cy="13" r="9"/><circle cx="12" cy="13" r="6.8" fill="#1d2725" opacity=".45"/><path d="M11.2 8h1.6v5.4l3.3 2-.8 1.4-4.1-2.5z"/><path d="m18.6 4.6 1.8 1.8-1.6 1.6-1.8-1.8z"/>`, "clock"),
    // phone nav
    hq: svg(`<path d="M5 2h14v14l-7 6-7-6z"/><path d="M7.5 4.5h9v10.3L12 19.3 7.5 14.8z" fill="#1d2725" opacity=".35"/>`),
    season: svg(`<path d="M12 2a10 10 0 1 0 10 10h-3a7 7 0 1 1-7-7z"/><circle cx="12" cy="12" r="3.2"/><path d="M15 2.5 21.5 9l-2 .6L14.4 4.5z"/>`),
    tips: svg(`<path d="M4 3h7v18H4zM13 3h7v18h-7z"/><path d="M6 6h3v1.6H6zM6 9h3v1.6H6zM15 6h3v1.6h-3z" fill="#1d2725" opacity=".5"/>`),
    tools: svg(`<path d="M4 2h16v20H4z"/><path d="M6.5 4.5h11v4h-11z" fill="#1d2725" opacity=".5"/><circle cx="8.5" cy="12.5" r="1.4" fill="#1d2725" opacity=".6"/><circle cx="12" cy="12.5" r="1.4" fill="#1d2725" opacity=".6"/><circle cx="15.5" cy="12.5" r="1.4" fill="#1d2725" opacity=".6"/><circle cx="8.5" cy="17" r="1.4" fill="#1d2725" opacity=".6"/><circle cx="12" cy="17" r="1.4" fill="#1d2725" opacity=".6"/><circle cx="15.5" cy="17" r="1.4" fill="#1d2725" opacity=".6"/>`),
    planner: svg(`<path d="M3 20 8 4l5 3 4-3 4 16-8-3z"/><path d="M8 7.5 6.3 18l5.7-2V9.5z" fill="#1d2725" opacity=".45"/><circle cx="16.5" cy="10" r="2.2" fill="#1d2725" opacity=".55"/>`)
  };
})();
