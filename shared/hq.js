/* Alliance HQ r2 mockups: shared data + logic (lead-owned; builders import, never edit). The calculators return structured values; render those your own way. The `text` strings are the legacy one-line output for reference only. planText() is the plain-text chat message, which is the real site format, so keep it.
 * Real values copied from the live DGF/GIR sites 2026-11-17 unless marked SAMPLE.
 * Usage: <script src="../shared/hq.js"></script>, then window.HQ.
 */
(function () {
  "use strict";

  const alliances = {
    DGF: {
      tag: "DGF", name: "The Dragonfly", brand: "DGF Alliance HQ", title: "The Dragonfly DGF",
      motto: "Alone we go faster, together we go farther.",
      nap: { number: 8, note: "Non-aggression pact" },
      allies: ["BDF", "DKDZ"],
      interStateNap: [{ state: "#440", alliance: "[F|L] Flame Lotus / ELT" }, { state: "#442", alliance: "DOT" }],
      r5: "The Hulk One S",
      r4: ["Jordaninkof", "Zé Chonas", "¥Catz¥", "Hu・Sylvana・Ik", "Superdruen", "Nίvjá", "紫禁之巔", "Fallon25", "Harley Quinn", "-Cookies", "Nínna"],
      art: {
        hero: "../assets/DGF/dragonfly-fortress.webp", season: "../assets/DGF/dinosaur-era.webp",
        territory: "../assets/DGF/season-territory.webp", ark: "../assets/DGF/season-ark.webp",
        dinosaurs: "../assets/DGF/season-dinosaurs.webp", tips: "../assets/DGF/survivor-field-manual.webp",
        calculators: "../assets/DGF/calculator-workshop.webp", planner: "../assets/DGF/commander-war-table.webp",
        bgb: "../assets/DGF/black-gold-desert.webp", map: "../assets/DGF/bgb-battlefield.jpg",
        banner: "../assets/DGF/dragonfly-banner.webp", room: "../assets/DGF/command-room.webp",
        scouts: "../assets/DGF/field-scouts.webp",
        sideL: "../assets/DGF/siege-left.webp", sideR: "../assets/DGF/siege-right.webp",
        // Portraits: 4x3 sprite sheet 384x288 (cells 96x96). r5 = cell 0; r4[i] = cell i+1 (row-major) for the first 10; Nínna has her own file.
        sprite: "../assets/DGF/dragonfly-council.webp", ninna: "../assets/DGF/ninna-portrait.webp"
      },
      // Existing skin (reference only — each direction proposes its own palette per alliance)
      legacy: { bg: "#171811", accent: "#e4c578", hero: "#2d2342" }
    },
    GIR: {
      tag: "GIR", name: "Invaders Grim", brand: "GIR Invaders Grim", title: "GIR Invaders Grim",
      motto: null,
      nap: { number: 8, note: "Non-aggression pact" },
      allies: ["AIK", "NeXS", "Elym", "KOD(434)", "ABYX(434)"],
      interStateNap: [],
      r5: "SpeedyTheGoose",
      r4: ["Blondie666", "Soile", "Jaiiaa", "OfÇhëllé", "Orbital Exorcist", "LittleMayhem", "• Hippo •", "Mamajbee", "Charlie Prince"],
      art: {
        hero: "../assets/GIR/grim-command-hero.jpg", season: "../assets/GIR/season-hero.jpg",
        territory: "../assets/GIR/season-territory.jpg", ark: "../assets/GIR/season-ark.jpg",
        dinosaurs: "../assets/GIR/season-dinosaurs.jpg", tips: "../assets/GIR/tips-art.jpg",
        calculators: "../assets/GIR/calculators-art.jpg", planner: "../assets/GIR/planner-art.jpg",
        bgb: "../assets/GIR/black-gold-art.jpg", map: "../assets/GIR/bgb-battlefield.jpg",
        sideL: "../assets/GIR/coral-siege-left.jpg", sideR: "../assets/GIR/coral-siege-right.jpg",
        r5Portrait: "../assets/GIR/speedythegoose.png",
        portraits: {
          "Blondie666": "../assets/GIR/portrait-blondie666.png", "Soile": "../assets/GIR/portrait-soile.png",
          "Jaiiaa": "../assets/GIR/portrait-jaiiaa.png", "OfÇhëllé": "../assets/GIR/portrait-ofchelle.png",
          "Orbital Exorcist": "../assets/GIR/portrait-orbital-exorcist.png", "LittleMayhem": "../assets/GIR/portrait-littlemayhem.png",
          "• Hippo •": "../assets/GIR/portrait-hippo.png", "Mamajbee": "../assets/GIR/portrait-mamajbee.png",
          "Charlie Prince": "../assets/GIR/portrait-charlie-prince.png"
        }
      },
      legacy: { bg: "#0b100b", accent: "#edcb76", hero: "#101810" }
    }
  };

  const season = {
    name: "Season 8: Dinosaur Era", short: "Dinosaur Era", game: "Dark War: Survival",
    notice: "Pre-release briefing — based on ATLANTISHUB's v474 client research from 13 November 2026. Confirm dates, rules, and payouts in game before making alliance commitments.",
    timeline: [
      { label: "Before Week 1", title: "Set the roster", text: "Matchmaking combines alliance groups of up to 200 survivors into four camps. The two strongest alliances in each state enter roster lock first." },
      { label: "Weeks 1–9", title: "Open the routes", text: "Start at a Level 1 Camp Outpost. East and West open first, then North and South. Secure connecting Outposts and Passes to reach the centre." },
      { label: "From Week 3", title: "Merchant Guild", text: "First battle Thursday 12:00 server time, one hour, repeating every seven days." },
      { label: "Week 10", title: "Fight for the Ark Core", text: "Mining Site and Pass ownership locks. The Ark Blockade Zone gives priority access toward the Forbidden Zone." }
    ],
    checklist: [
      { when: "Before roster lock", text: "Confirm eligible members, camp contacts and the server-time windows your R4s can cover." },
      { when: "Opening week", text: "Secure the first Camp Outpost, then plan a connected route to your first Mine and Pass." },
      { when: "Each week", text: "Track Mine and Pass ownership, boosted payouts, Sunday invasion exposure and Monday settlement." },
      { when: "From Week 3", text: "Confirm the Merchant Guild time and roster it separately so other objectives stay covered." },
      { when: "Before Week 10", text: "Decide which holdings to lock, who stages for the Ark Core and who stays on territory." }
    ],
    // SAMPLE live state — the real sites have none. Label as sample in mocks (small "sample data" tag is enough).
    sample: {
      week: 4, weeks: 10,
      events: [
        { name: "Weekly settlement", when: "Mon 00:00 server", inMinutes: 3540, kind: "settlement", note: "Aberrant Crystals pay out" },
        { name: "Merchant Guild", when: "Thu 12:00 server", inMinutes: 1620, kind: "battle", note: "One hour, weekly from Week 3" },
        { name: "Sunday invasion window", when: "Sun server time", inMinutes: 2580, kind: "invasion", note: "Enemy-camp targets open" },
        { name: "Black Gold Battlefield", when: "Sat 20:00 server", inMinutes: 1260, kind: "bgb", note: "Team A, 20 starters" }
      ],
      members: 98, memberCap: 100, serverTime: "13:24", state: "#441"
    }
  };

  const tips = [
    { title: "Know the rally plan", text: "Check the target, rally lead, and server time in alliance chat. Keep a teleport available when your group expects to move." },
    { title: "Keep the route connected", text: "Check adjacent Outposts and open Passes before spending an attempt. Coordinate with same-camp alliances on shared capture windows." },
    { title: "Plan around the reset", text: "Check crystal holdings before Monday settlement. Confirm the final sites and Passes to hold before the Week 10 lock." }
  ];

  const languages = [
    ["en", "English"], ["es", "Español"], ["pt", "Português"], ["fr", "Français"], ["de", "Deutsch"], ["ru", "Русский"],
    ["ar", "العربية"], ["id", "Bahasa Indonesia"], ["ko", "한국어"], ["ja", "日本語"], ["zh-Hans", "简体中文"], ["th", "ไทย"],
    ["vi", "Tiếng Việt"], ["tr", "Türkçe"]
  ];
  // Real translated nav labels (from the sites) — enough to demo a language switch incl. Arabic RTL.
  const nav = {
    en: { home: "HQ", season: "Season", tips: "Tips", tools: "Calculators", planner: "Planner" },
    es: { home: "HQ", season: "Temporada", tips: "Consejos", tools: "Calculadoras", planner: "Planificador" },
    de: { home: "HQ", season: "Saison", tips: "Tipps", tools: "Rechner", planner: "Planer" },
    ar: { home: "المقر", season: "الموسم", tips: "نصائح", tools: "الحاسبات", planner: "المخطط" },
    ja: { home: "HQ", season: "シーズン", tips: "ヒント", tools: "計算ツール", planner: "作戦プランナー" },
    ko: { home: "HQ", season: "시즌", tips: "팁", tools: "계산기", planner: "플래너" },
    "zh-Hans": { home: "HQ", season: "赛季", tips: "技巧", tools: "计算器", planner: "作战计划" },
    ru: { home: "HQ", season: "Сезон", tips: "Советы", tools: "Калькуляторы", planner: "Планировщик" }
  };
  const motto = { en: alliances.DGF.motto, es: "Solos vamos más rápido, juntos llegamos más lejos.", ar: "وحدنا نسير أسرع، ومعًا نصل أبعد." };

  /* ---------- formatting ---------- */
  const fmt = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
  const amount = v => fmt.format(v);
  const duration = minutes => {
    const total = Math.ceil(minutes);
    const d = Math.floor(total / 1440), h = Math.floor((total % 1440) / 60), m = total % 60;
    return [d && `${d}d`, h && `${h}h`, m && `${m}m`].filter(Boolean).join(" ") || "0m";
  };
  const compactCp = cp => cp >= 1e9 ? `${+(cp / 1e9).toFixed(2)}B` : cp >= 1e6 ? `${+(cp / 1e6).toFixed(1)}M` : amount(cp);

  /* ---------- calculators (exact logic of the live sites; return structured results) ---------- */
  const calculators = {
    speedups: {
      title: "Speedup inventory",
      description: "Total your speedups and compare them with the in-game timer for a planned upgrade.",
      fields: [
        { name: "one", label: "1-minute items", unitMinutes: 1 }, { name: "five", label: "5-minute items", unitMinutes: 5 },
        { name: "sixty", label: "1-hour items", unitMinutes: 60 }, { name: "extra", label: "Other speedups (total minutes)", unitMinutes: 1 },
        { name: "timer", label: "Remaining upgrade timer (minutes)" }
      ],
      preset: { one: 40, five: 25, sixty: 12, extra: 300, timer: 2880 },
      calc({ one = 0, five = 0, sixty = 0, extra = 0, timer = 0 }) {
        const total = one + five * 5 + sixty * 60 + extra;
        const short = Math.max(0, timer - total);
        return { totalMinutes: total, timerMinutes: timer, shortMinutes: short, covered: timer ? Math.min(1, total / timer) : 1,
          text: `Speedups available: ${duration(total)} · Still needed: ${duration(short)}` };
      } // preset → "Speedups available: 19h 45m · Still needed: 1d 4h 15m"
    },
    research: {
      title: "Research budget",
      description: "Add one research step per row using base values: wood, iron, electricity, coin, badges, time in minutes.",
      // Mocks should replace the CSV textarea with per-step rows; logic takes an array of steps.
      preset: { steps: [[1000, 500, 300, 2000, 5, 120], [2500, 1200, 800, 4500, 8, 300]], speed: 20, discount: 10, speedups: 100 },
      calc({ steps = [], speed = 0, discount = 0, speedups = 0 }) {
        const t = [0, 0, 0, 0, 0, 0];
        steps.forEach(s => s.forEach((v, i) => { t[i] += Number(v) || 0; }));
        const [wood, iron, electricity, coin, badges] = t.map((v, i) => i < 4 ? Math.ceil(v * (100 - discount) / 100) : v);
        const time = Math.ceil(t[5] * 100 / (100 + speed));
        const after = Math.max(0, time - speedups);
        return { wood, iron, electricity, coin, badges, timeMinutes: time, afterMinutes: after,
          text: `Estimated cost: ${amount(wood)} wood · ${amount(iron)} iron · ${amount(electricity)} electricity · ${amount(coin)} coin · ${amount(badges)} badges\nTime: ${duration(time)} · After speedups: ${duration(after)}` };
      } // preset → 3,150 wood · 1,530 iron · 990 electricity · 5,850 coin · 13 badges / 5h 50m · after 4h 10m
    },
    goal: {
      title: "Resource goal",
      description: "Estimate how long it will take to reach a resource target at a steady rate, such as Dino Scales per hour.",
      preset: { owned: 1200, target: 5000, rate: 150 },
      calc({ owned = 0, target = 0, rate = 0 }) {
        const remaining = Math.max(0, target - owned);
        if (!remaining) return { remaining: 0, text: "Target reached." };
        if (!rate) return { remaining, text: `${amount(remaining)} still needed. Add a positive rate for an ETA.` };
        const eta = remaining * 60 / rate;
        return { remaining, etaMinutes: eta, text: `${amount(remaining)} still needed · ETA ${duration(eta)}` };
      } // preset → 3,800 still needed · ETA 1d 1h 20m
    },
    crystals: {
      title: "Weekly crystal estimate",
      description: "Expected payouts for holdings you plan to keep through Monday settlement, including any active Abundant Effect.",
      preset: { regularCount: 4, regularPayout: 2500, boostedCount: 2, boostedPayout: 3750, passCount: 3, passPayout: 1200 },
      calc(v) {
        const parts = { regular: v.regularCount * v.regularPayout, boosted: v.boostedCount * v.boostedPayout, passes: v.passCount * v.passPayout };
        const total = parts.regular + parts.boosted + parts.passes;
        return { ...parts, total, text: `${amount(total)} estimated crystals at settlement.` };
      } // preset → 21,100
    },
    capture: {
      title: "Mining Site capture",
      description: "Estimate remaining control time at a steady capture rate. Default full-capture time (30 min) is from the pre-release guide.",
      preset: { progress: 35, full: 30 },
      calc({ progress = 0, full = 30 }) {
        const left = full * (100 - progress) / 100;
        return { leftMinutes: left, text: `About ${duration(left)} of further uninterrupted control.` };
      } // preset → About 20m
    }
  };

  const externalTools = [
    ["Research trees", "Prerequisites, time, resources and power", "research-calculator"],
    ["Red gear", "Promotion and breakthrough costs", "red-gear-calculator"],
    ["Exclusive weapons", "Fragments from your current star to your target", "exclusive-weapon-calculator"],
    ["Chips and resonance", "Copies, material and set progression", "chip-calculator"],
    ["Industrial buildings", "Precision Parts and Watch Tower requirements", "industrial-buildings"],
    ["Pets", "Food and breakthroughs", "pet-calculator"],
    ["Troop training", "Time, resources and power by tier", "training-center"],
    ["APC workshop", "Alloys and blueprints", "apc-workshop-calculator"],
    ["Boomers and Roamers", "Energy, rewards and earnings", "rally-planner"],
    ["Server time", "Convert events to your time zone", "server-time"]
  ].map(([title, note, slug]) => ({ title, note, url: `https://atlantisdws.com/${slug}` }));

  /* ---------- Black Gold Battlefield planner (exact live algorithm) ---------- */
  const objectives = [
    { id: "R1", name: "Oil Refinery 1", color: "#ffb473", x: 196, y: 153, timing: "Hold refinery" },
    { id: "R2", name: "Oil Refinery 2", color: "#f79b72", x: 451, y: 153, timing: "Hold refinery" },
    { id: "R3", name: "Oil Refinery 3", color: "#e9cd70", x: 111, y: 290, timing: "Hold refinery" },
    { id: "R4", name: "Oil Refinery 4", color: "#c9da78", x: 455, y: 290, timing: "Hold refinery" },
    { id: "R5", name: "Oil Refinery 5", color: "#e3ace8", x: 196, y: 412, timing: "Hold refinery" },
    { id: "R6", name: "Oil Refinery 6", color: "#f39cb4", x: 451, y: 412, timing: "Hold refinery" },
    { id: "H", name: "Hospital standby", color: "#a8df9c", x: 321, y: 492, timing: "Stage nearby until it opens" },
    { id: "M", name: "Military standby", color: "#ff9991", x: 475, y: 517, timing: "Stage nearby until it opens" }
  ];
  const floaterPin = { id: "F", name: "Floaters", color: "#a3d6ff", x: 345, y: 274, timing: "Stage near the Rare Earth Factory." };
  // Map: bgb-battlefield.jpg drawn into an SVG viewBox 0 0 560 535; pins use x/y above.
  const mapLabels = [
    { text: "Rare Earth Factory", x: 209, y: 337 }, { text: "Military", x: 23, y: 70 }, { text: "Hospital", x: 245, y: 109 },
    { text: "{TAG} HQ", x: 18, y: 493 }, { text: "Opposing HQ", x: 427, y: 78 }
  ];
  const duties = ["★ Primary alloy-ball carrier", "★ Backup alloy-ball carrier", "Carrier escort", "Carrier escort"];

  function readPower(input) {
    const m = String(input).trim().match(/^(\d+|\d{1,3}(?:,\d{3})+)(?:\.(\d+))?\s*([kmbgt])?$/i);
    if (!m) return NaN;
    const [, whole, frac, suf] = m;
    const scale = { k: 1e3, m: 1e6, b: 1e9, g: 1e9, t: 1e12 };
    const cp = Number(whole.replaceAll(",", "") + (frac ? "." + frac : "")) * (scale[suf?.toLowerCase()] ?? 1);
    return Number.isFinite(cp) && cp > 0 && cp <= 1e12 ? Math.round(cp) || NaN : NaN;
  }

  /** players: [{name, cp:number}] — exactly 20 starters. Returns {floaters, pairs:[{objective, members, cp}]} */
  function assign(players) {
    const ranked = [...players].sort((a, b) => b.cp - a.cp || a.name.localeCompare(b.name));
    const floaters = ranked.slice(0, 4).map((p, i) => ({ ...p, duty: duties[i] }));
    const d = ranked.slice(4);
    const pairs = objectives.map((o, i) => {
      const members = [d[i], d[d.length - 1 - i]];
      return { objective: o, members, cp: members.reduce((s, p) => s + p.cp, 0) };
    });
    return { floaters, pairs };
  }

  function planText(tag, team, plan) {
    const label = p => `${p.name} (${compactCp(p.cp)} CP)`;
    return [
      `${tag} BGB PLAN · Team ${team} · Lower-left start`,
      ...plan.pairs.map(({ objective: o, members }) => `${o.id} | ${o.name}: ${members.map(label).join(", ")}`),
      "F | Floaters",
      ...plan.floaters.map((p, i) => `Floater ${i + 1} · ${label(p)} — ${p.duty}`),
      "Hospital and Military pairs stage nearby and wait for their objectives to open. Floaters stage before alloy spawns. Floaters 3 and 4 escort the active carrier to HQ."
    ].join("\n");
  }

  // SAMPLE rosters (CP as typed by members). 20 starters + a few bench players per alliance.
  const rosterDGF = [
    ["Hulk", "520M"], ["Jordan", "509M"], ["Chonas", "498M"], ["Catz", "487M"], ["Sylvana", "476M"], ["Druen", "465M"],
    ["Nivja", "454M"], ["Zijin", "443M"], ["Fallon", "432M"], ["Harley", "421M"], ["Cookies", "410M"], ["Ninna", "399M"],
    ["Wren", "388M"], ["Tamsin", "377M"], ["Okoro", "366M"], ["Valka", "355M"], ["Brisk", "344M"], ["Ledger", "333M"],
    ["Moth", "322M"], ["Juno", "311M"], ["Ashgrove", "288M", false], ["Pike", "281M", false], ["Saffi", "266M", false]
  ];
  const rosterGIR = [
    ["SpeedyTheGoose", "1.21B"], ["Blondie666", "612M"], ["Orbital Exorcist", "598M"], ["Soile", "571M"], ["Jaiiaa", "540M"],
    ["OfÇhëllé", "533M"], ["LittleMayhem", "509M"], ["• Hippo •", "497M"], ["Mamajbee", "488M"], ["Charlie Prince", "470M"],
    ["Rook", "455M"], ["Kestrel", "442M"], ["Dune", "430M"], ["Marrow", "418M"], ["Quill", "404M"], ["Tansy", "391M"],
    ["Boone", "380M"], ["Vex", "362M"], ["Ollie", "350M"], ["Saga", "333M"], ["Grit", "301M", false], ["Lark", "290M", false]
  ];
  const roster = tag => (tag === "GIR" ? rosterGIR : rosterDGF)
    .map(([name, cpText, starter = true]) => ({ name, cpText, cp: readPower(cpText), starter }));

  /* ---------- skin + language helpers ---------- */
  // Skin: ?a=DGF|GIR (default DGF), persisted in localStorage "hq-mock-alliance"; sets <html data-alliance>.
  function currentAlliance() {
    const q = new URLSearchParams(location.search).get("a");
    const a = (q || localStorage.getItem("hq-mock-alliance") || "DGF").toUpperCase();
    return a === "GIR" ? "GIR" : "DGF";
  }
  function setAlliance(tag) {
    localStorage.setItem("hq-mock-alliance", tag);
    document.documentElement.dataset.alliance = tag;
    document.dispatchEvent(new CustomEvent("hq:alliance", { detail: alliances[tag] }));
  }
  function setLanguage(code) {
    document.documentElement.lang = code;
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    localStorage.setItem("hq-mock-lang", code);
    document.dispatchEvent(new CustomEvent("hq:lang", { detail: { code, nav: nav[code] || nav.en } }));
  }
  function init() {
    setAlliance(currentAlliance());
    setLanguage(localStorage.getItem("hq-mock-lang") || "en");
  }

  window.HQ = {
    alliances, season, tips, languages, nav, motto, calculators, externalTools,
    objectives, floaterPin, mapLabels, duties, readPower, assign, planText, roster,
    amount, duration, compactCp, currentAlliance, setAlliance, setLanguage, init
  };
})();
