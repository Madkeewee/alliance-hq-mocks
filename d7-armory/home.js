/* d7 Armory Grid: home. Primary slot + secondary slots, blueprint schematics, armory tiles, council, diplomacy. */
(function () {
  "use strict";
  const { esc, $, pict, store } = D7;

  // Route, stat rows and schematic per kind. Rules from the season guide in hq.js; nothing invented.
  const KIND = {
    bgb: { cta: "Open the BGB plan", href: "planner.html",
      rows: (e) => [["Server time", e.when.replace(" server", "")], ["Format", e.note], ["Start", "Lower-left HQ"]] },
    settlement: { cta: "Estimate this week's crystals", href: "calc.html#crystals",
      rows: (e) => [["Server time", e.when.replace(" server", "")], ["Pays", e.note], ["From", "Mines and Passes you hold"]] },
    battle: { cta: "Read the Merchant Guild rules", href: "#", soon: true,
      rows: (e) => [["Server time", e.when.replace(" server", "")], ["Length", "One hour"], ["Repeats", e.note.replace("One hour, ", "").replace(/^w/, "W")]] },
    invasion: { cta: "Time a Mining Site capture", href: "calc.html#capture",
      rows: (e) => [["Server time", e.when.replace(" server time", "")], ["Opens", e.note], ["Protected", "Same-camp holdings"]] }
  };
  const KIND_LABEL = { bgb: "Alliance event", settlement: "Weekly settlement", battle: "Guild battle", invasion: "Invasion window" };

  /* ---------- schematics (blueprint line-work from real data) ---------- */
  const dots = (id) => `<defs><pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="rgba(232,228,216,.22)"/></pattern></defs>`;
  function schematicBGB(tag) {
    const pins = [...HQ.objectives, HQ.floaterPin];
    const labels = HQ.mapLabels.map((l) => ({ ...l, text: l.text.replace("{TAG}", tag) }));
    return `<svg class="wide" viewBox="0 0 560 420" role="img" aria-label="Schematic of the Black Gold Battlefield objectives">${dots("d1")}
      <rect width="560" height="420" fill="url(#d1)"/>
      <rect x="8" y="8" width="544" height="404" class="bp-line"/>
      <rect x="12" y="360" width="96" height="48" class="bp-fill"/><text x="60" y="391" class="bp-text" text-anchor="middle">${esc(tag)} HQ</text>
      <rect x="400" y="14" width="146" height="48" class="bp-fill"/><text x="473" y="45" class="bp-text" text-anchor="middle">Opposing HQ</text>
      <polygon points="300,255 330,235 360,255 360,290 330,310 300,290" class="bp-fill"/>
      <text x="330" y="330" class="bp-text small" text-anchor="middle">Rare Earth Factory</text>
      <path d="M345 215 L96 360" class="bp-line dash"/>
      ${pins.map((p) => { const y = p.y * .76; return `<circle cx="${p.x}" cy="${y}" r="21" fill="${p.color}" stroke="${"#1C211F"}" stroke-width="2"/><text x="${p.x}" y="${y}" class="bp-text" text-anchor="middle" dominant-baseline="central" fill="#1C211F" style="fill:#1C211F;font-weight:800">${p.id}</text>`; }).join("")}
      <text x="24" y="66" class="bp-text small">M and H pairs stage and wait. F stages near the factory.</text>
    </svg>`;
  }
  function schematicSettlement() {
    const box = (x, y, t) => `<rect x="${x}" y="${y}" width="86" height="40" class="bp-fill"/><text x="${x + 43}" y="${y + 25}" class="bp-text" text-anchor="middle">${t}</text>`;
    return `<svg viewBox="0 0 400 200" role="img" aria-label="Schematic of weekly crystal settlement">${dots("d2")}
      <rect width="400" height="200" fill="url(#d2)"/>
      ${box(16, 20, "Mining Site")}${box(16, 80, "Mining Site")}${box(16, 140, "Pass")}
      <path d="M102 40 H160 V100 H200 M102 100 H200 M102 160 H160 V100" class="bp-line"/>
      <path d="M200 100 H250" class="bp-line dash"/>
      <path d="M262 150 L250 100 L272 62 L292 100z" class="bp-den"/><path d="M296 150 L290 110 L312 80 L330 118z" class="bp-den" opacity=".7"/>
      <text x="290" y="178" class="bp-text" text-anchor="middle">Aberrant Crystals</text>
      <text x="290" y="30" class="bp-text small" text-anchor="middle">Settles Monday 00:00 server</text>
      <text x="290" y="46" class="bp-text small" text-anchor="middle">Abundant Effect on new L2 and L3 sites</text>
    </svg>`;
  }
  function schematicBattle() {
    const ticks = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; const r1 = 62, r2 = i % 3 ? 70 : 74; return `<line x1="${120 + Math.sin(a) * r1}" y1="${100 - Math.cos(a) * r1}" x2="${120 + Math.sin(a) * r2}" y2="${100 - Math.cos(a) * r2}" class="bp-line"/>`; }).join("");
    return `<svg viewBox="0 0 400 200" role="img" aria-label="Schematic of the Merchant Guild battle window">${dots("d3")}
      <rect width="400" height="200" fill="url(#d3)"/>
      <circle cx="120" cy="100" r="76" class="bp-line"/>${ticks}
      <path d="M120 100 L120 24 A76 76 0 0 1 158 34 Z" class="bp-den" opacity=".8"/>
      <line x1="120" y1="100" x2="120" y2="36" class="bp-line" style="stroke-width:3"/><circle cx="120" cy="100" r="4" fill="#E8E4D8"/>
      <text x="230" y="70" class="bp-text">Thursday 12:00 server time</text>
      <text x="230" y="92" class="bp-text small">One hour, then every seven days</text>
      <text x="230" y="110" class="bp-text small">Available from Week 3</text>
      <text x="230" y="150" class="bp-text small">Roster it separately so other</text>
      <text x="230" y="166" class="bp-text small">objectives stay covered</text>
    </svg>`;
  }
  function schematicInvasion() {
    const camp = (x, y, t) => `<rect x="${x}" y="${y}" width="84" height="44" class="bp-fill"/><text x="${x + 42}" y="${y + 27}" class="bp-text" text-anchor="middle">${t}</text>`;
    return `<svg viewBox="0 0 400 200" role="img" aria-label="Schematic of the Sunday invasion window">${dots("d4")}
      <rect width="400" height="200" fill="url(#d4)"/>
      ${camp(118, 8, "North camp")}${camp(118, 148, "South camp")}${camp(8, 78, "West camp")}${camp(228, 78, "East camp")}
      <circle cx="160" cy="100" r="18" class="bp-fill"/><text x="160" y="104" class="bp-text small" text-anchor="middle">Ark</text>
      <path d="M92 100 H140 M180 100 H228 M160 52 V82 M160 118 V148" class="bp-line"/>
      <path d="M50 78 C 50 40, 110 30, 160 30 S 270 40, 270 78" class="bp-line dash"/>
      <polygon points="270,78 262,66 278,66" class="bp-den"/>
      <text x="330" y="40" class="bp-text">Sunday</text>
      <text x="330" y="58" class="bp-text small">Enemy-camp targets open</text>
      <text x="330" y="74" class="bp-text small">Same-camp holdings protected</text>
      <text x="330" y="150" class="bp-text small">Advanced Teleporters</text>
      <text x="330" y="166" class="bp-text small">move you between camps</text>
    </svg>`;
  }
  const SCHEMATIC = { bgb: (t) => schematicBGB(t), settlement: schematicSettlement, battle: schematicBattle, invasion: schematicInvasion };

  /* ---------- state ---------- */
  let A = D7.A;
  let events = [];
  let selected = 0;
  const loadedAt = Date.now();

  /* ---------- render ---------- */
  function renderShell() {
    document.documentElement.style.setProperty("--hero", `url("${A.art.hero}")`);
    $("tag").textContent = A.tag;
    $("name").textContent = A.name;
    document.title = `${A.brand}. Alliance HQ (d7 Armory Grid)`;
    renderMotto();
    $("seasonLine").textContent = `${HQ.season.name}, week ${HQ.season.sample.week} of ${HQ.season.sample.weeks}`;
    const [head, rest] = HQ.season.notice.split(" — ");
    $("caveat").innerHTML = `<i aria-hidden="true"></i><span><strong>${esc(head)}.</strong> ${esc(rest.charAt(0).toUpperCase() + rest.slice(1))}</span>`;
    $("foot").innerHTML = D7.footer(`<p class="footnote">Event times on this page are sample values for the mockup. The live sites carry no schedule yet; confirm every window in game.</p>`);
  }
  function renderMotto() {
    const lang = D7.lang;
    $("motto").textContent = A.motto ? (A.tag === "DGF" && HQ.motto[lang] ? HQ.motto[lang] : A.motto) : "";
  }
  function renderEvents() {
    events = [...HQ.season.sample.events].sort((a, b) => a.inMinutes - b.inMinutes).map((e) => ({ ...e, target: loadedAt + e.inMinutes * 60000 }));
    renderPrimary(false);
    renderSecondaries();
  }
  function renderPrimary(animate) {
    const e = events[selected];
    const k = KIND[e.kind];
    const box = $("primary");
    box.className = `primary plate on-art den-${e.kind}${animate && !matchMedia("(prefers-reduced-motion: reduce)").matches ? " swap" : ""}`;
    box.innerHTML = `<div class="in">
      <p class="p-kind">${pict(e.kind)}${selected === 0 ? "Next event" : "Coming up"}</p>
      <h3 class="p-title">${esc(e.name)}</h3>
      <p class="p-when">${esc(e.when)}</p>
      <div class="p-count"><span class="num count" data-target="${e.target}" role="timer"></span><small>until it starts</small></div>
      <figure class="schematic">${SCHEMATIC[e.kind](A.tag)}</figure>
      <dl class="p-stats">
        ${k.rows(e).map(([l, v]) => `<div><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join("")}
        <a class="btn" href="${k.href}" ${k.soon ? 'data-soon="1"' : ""}>${esc(k.cta)}</a>
      </dl>
    </div>`;
    D7.tick();
  }
  function renderSecondaries() {
    $("secondaries").innerHTML = events.map((e, i) => i === selected ? "" : `
      <li><button type="button" class="cell den-${e.kind}" data-i="${i}" aria-label="Show ${esc(e.name)}">
        <span class="in">
          <span class="cell-name">${esc(e.name)}</span>
          ${pict(e.kind)}
          <span class="cell-when">${esc(e.when)}</span>
          <span class="cell-count count" data-target="${e.target}" role="timer"></span>
        </span></button></li>`).join("");
    D7.tick();
  }
  function renderTiles() {
    const w = HQ.season.sample;
    const tiles = [
      ["Calculators", "Speedups, research, crystals, capture time, resource goals", `${Object.keys(HQ.calculators).length} tools`, "calc.html", A.art.calculators, "big", "var(--brass)"],
      ["Planner", "Black Gold Battlefield roster, assignments and map", `${HQ.objectives.length + 1} objectives, 20 starters`, "planner.html", A.art.planner, "big", "var(--rust)"],
      ["Season", HQ.season.name, `Week ${w.week} of ${w.weeks}`, "#", A.art.season, "small soon", "var(--moss)"],
      ["Tips", "Rally plan, connected routes, the Monday reset", `${HQ.tips.length} tips`, "#", A.art.tips, "small soon", "var(--crystal)"]
    ];
    $("tiles").innerHTML = tiles.map(([name, note, den, href, img, cls, col]) => `
      <li class="${cls.includes("big") ? "tile-big" : ""}"><a class="tile ${cls}" href="${href}" ${cls.includes("soon") ? 'data-soon="1"' : ""} style="--den:${col}">
        <span class="in"><img src="${img}" alt=""><span class="tile-den">${esc(den)}</span>
          <span class="tile-name">${esc(name)}</span><span class="tile-note">${esc(note)}</span></span></a></li>`).join("");
    document.querySelectorAll("#tiles > li").forEach((li) => { li.style.display = "contents"; });
  }
  function portraitStyle(i, name) {
    if (A.tag === "GIR") return `background-image:url('${i < 0 ? A.art.r5Portrait : A.art.portraits[name]}')`;
    if (name === "Nínna") return `background-image:url('${A.art.ninna}')`;
    const cell = i + 1, col = cell % 4, row = Math.floor(cell / 4);
    return `background-image:url('${A.art.sprite}');background-size:400% 300%;background-position:${(col / 3) * 100}% ${(row / 2) * 100}%`;
  }
  function renderCouncil() {
    $("councilNote").textContent = `One R5 and ${A.r4.length} R4 officers`;
    $("r5").innerHTML = `<div class="in"><span class="portrait" style="${portraitStyle(-1, A.r5)}" role="img" aria-label="Portrait of ${esc(A.r5)}"></span>
      <div><span class="rank">R5</span><div class="who"><bdi>${esc(A.r5)}</bdi></div><div class="role">Alliance leader</div></div></div>`;
    $("r4").innerHTML = A.r4.map((n, i) => `
      <li><figure class="pcell"><span class="frame"><span class="portrait" style="${portraitStyle(i, n)}" role="img" aria-label="Portrait of ${esc(n)}"></span></span>
        <figcaption><bdi>${esc(n)}</bdi></figcaption></figure></li>`).join("");
  }
  function renderDiplo() {
    const inter = A.interStateNap.length ? `
      <div class="dl"><h3>Inter-state non-aggression</h3><ul class="inter" role="list">${A.interStateNap.map((x) => `
        <li><span class="state">${esc(x.state)}<small>state</small></span><bdi>${esc(x.alliance)}</bdi></li>`).join("")}</ul></div>` : "";
    $("diplo").innerHTML = `
      <div class="nap plate"><div class="in"><span class="num">${A.nap.number}</span><span class="lbl">NAP</span><span class="sub">${esc(A.nap.note)}</span></div></div>
      <div>
        <div class="dl"><h3>Allies</h3><ul class="tags" role="list">${A.allies.map((t) => `<li class="tagcell"><bdi>${esc(t)}</bdi></li>`).join("")}</ul></div>
        ${inter}
      </div>`;
  }
  function renderAll() { renderShell(); renderEvents(); renderTiles(); renderCouncil(); renderDiplo(); }

  document.addEventListener("click", (ev) => {
    const cell = ev.target.closest(".cell[data-i]");
    if (!cell) return;
    selected = Number(cell.dataset.i);
    renderPrimary(true); renderSecondaries();
    $("primary").focus?.();
  });
  document.addEventListener("d7:alliance", (e) => { A = e.detail; selected = 0; renderAll(); });
  document.addEventListener("d7:lang", renderMotto);
})();
