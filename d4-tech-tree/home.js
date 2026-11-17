/* d4-tech-tree home: the season as a node tree with the current node lit. Data and logic come from ../shared/hq.js. */
(function () {
  "use strict";
  const { $, $$, esc, reduced, phone, plate, ico, drawWires, humanWhen, insignia } = D4;

  /* season data from hq.js */
  const S = HQ.season, T = S.timeline, C = S.checklist, EV = S.sample.events, TIPS = HQ.tips;
  const ev = kind => EV.find(e => e.kind === kind);
  const serverTime = HQ.externalTools.find(t => /server-time/.test(t.url));

  const TIERS = [
    { n: "I", label: T[0].label, d: 1, p: 1 },
    { n: "II", label: T[1].label, d: 2, p: 4 },
    { n: "III", label: `${T[2].label}, weekly`, d: 3, p: 8 },
    { n: "IV", label: T[3].label, d: 4, p: 12 }
  ];
  const guide = { text: "Read the season guide", soon: true };
  const bgb = ev("bgb");
  const NODES = [
    { id: "roster", tier: 0, state: "done", icon: "people", label: T[0].title, d: [1, 2], p: 2,
      text: T[0].text,
      facts: [["Camps", "Four, formed from alliance groups of up to 200 survivors"], ["Lock order", "The two strongest alliances in each state lock first"], ["Leadership", C[0].text]],
      actions: [{ text: "Open the planner", href: "planner.html" }, guide] },
    { id: "bgb", tier: 0, state: "open", event: true, icon: "derrick", label: bgb.name, when: humanWhen(bgb.when), kind: "bgb", branch: true, d: [1, 4], p: 3,
      text: "Save the alliance roster, update each player's strongest march CP, and select 20 starters for Team A or Team B.",
      facts: [["Starts", humanWhen(bgb.when)], ["Lineup", bgb.note], ["Roles", "Six refinery pairs, Hospital and Military standby, four floaters"]],
      actions: [{ text: "Open the planner", href: "planner.html" }, { text: "Convert to your time zone", href: serverTime.url, ext: true, sec: true }] },
    { id: "outpost", tier: 1, state: "done", icon: "tower", label: "Camp Outpost", d: [2, 2], p: 5,
      text: T[1].text,
      facts: [["First capture", "A two-minute truce"], ["Neutral outposts", "Merits for NPC guards defeated and durability damage"], ["Opening week", C[1].text]],
      actions: [{ text: "Speedup inventory", href: "calc.html#speedups" }, { text: "Research budget", href: "calc.html#research", sec: true }] },
    { id: "mines", tier: 1, state: "current", icon: "mines", label: "Mines and Passes", sub: `Now, week ${S.sample.week}`, d: [2, 3], p: 6,
      text: "Secure connecting Outposts and Passes to reach the centre. Mining Sites and Passes pay Aberrant Crystals at every Monday settlement.",
      facts: [["Capture", "About 30 minutes of uninterrupted control"], ["War attempts", "One pool shared by Mining Sites and Passes"], ["Each week", C[2].text]],
      actions: [{ text: "Mining Site capture", href: "calc.html#capture" }, { text: "Weekly crystal estimate", href: "calc.html#crystals" }] },
    { id: "dino", tier: 1, state: "open", icon: "crystal", label: "Dino Scales", sub: "Antiviral Spore", branch: true, d: [2, 5], p: 7,
      text: "Antiviral Spore upgrades with Dino Scales and raises the level cap by 20. Dinosaur Boss and Dinosaur Rescue are where the scales come from.",
      facts: [["Rate", "Set your Dino Scales per hour in the Resource goal calculator"], ["Rescue", "Shareable location, worth calling in alliance chat"]],
      actions: [{ text: "Resource goal", href: "calc.html#goal" }, guide] },
    { id: "guild", tier: 2, state: "open", icon: "scales", label: ev("battle").name, when: humanWhen(ev("battle").when), kind: "battle", branch: true, d: [3, 2], p: 9,
      text: T[2].text,
      facts: [["Window", "One hour, every seven days"], ["Leadership", C[3].text]],
      actions: [{ text: "Convert to your time zone", href: serverTime.url, ext: true }, { text: "Open the planner", href: "planner.html", sec: true }] },
    { id: "invasion", tier: 2, state: "open", icon: "swords", label: ev("invasion").name, when: humanWhen(ev("invasion").when), kind: "invasion", branch: true, d: [3, 4], p: 10,
      text: "Enemy-camp targets open on Sundays. Same-camp holdings stay protected, and Advanced Teleporters move your group.",
      facts: [["Before you march", TIPS[0].text]],
      actions: [{ text: "Keep the route connected", soon: true }, guide] },
    { id: "settlement", tier: 2, state: "open", icon: "hourglass", label: ev("settlement").name, when: humanWhen(ev("settlement").when), kind: "settlement", branch: true, d: [3, 5], p: 11,
      text: "Aberrant Crystals from Mining Sites and Passes pay out at 00:00 server time every Monday.",
      facts: [["Abundant Effect", "New Level 2 and 3 Mining Sites, first two outputs"], ["Before the reset", TIPS[2].text]],
      actions: [{ text: "Weekly crystal estimate", href: "calc.html#crystals" }, guide] },
    { id: "blockade", tier: 3, state: "locked", icon: "gate", label: "Ark Blockade Zone", d: [4, 3], p: 13,
      text: T[3].text,
      facts: [["Before Week 10", C[4].text]],
      actions: [guide] },
    { id: "core", tier: 3, state: "locked", icon: "core", label: "Ark Core", d: [4, 4], p: 14,
      text: "The final Core contest takes place in the Forbidden Zone. A separate crew stages for the Core while the rest hold territory.",
      facts: [["Priority", "The Ark Blockade Zone gives first-camp access toward the Forbidden Zone"]],
      actions: [{ text: "Open the planner", href: "planner.html", sec: true }, guide] }
  ];
  const EDGES = [["roster", "bgb"], ["roster", "outpost"], ["outpost", "mines"], ["mines", "dino"], ["mines", "guild"], ["mines", "invasion"], ["mines", "settlement"], ["mines", "blockade"], ["blockade", "core"]];
  const MAIN = new Set(["roster>outpost", "outpost>mines"]);
  const byId = Object.fromEntries(NODES.map(n => [n.id, n]));

  /* tree */
  const tree = $("#tree");
  function renderTree() {
    tree.innerHTML = `<svg class="wires" aria-hidden="true"></svg>` +
      TIERS.map((t, i) => `<div class="tier" style="--dr:${t.d};--pr:${t.p}"><span class="num">${t.n}</span><span class="tl">${esc(t.label)}</span></div>` +
        (i ? `<div class="rule" style="--dr:${t.d}"></div>` : "")).join("") +
      NODES.map(n => `<button type="button" class="node is-${n.state}${n.event ? " is-event" : ""}${n.branch ? " branch" : ""}${n.kind ? " has-timer" : ""}" data-id="${n.id}" aria-pressed="false" style="--dr:${n.d[0]};--dc:${n.d[1]};--pr:${n.p}">
          ${plate(n.icon, n.state)}
          <span class="nt"><span class="nl">${esc(n.label)}</span>${n.when ? `<span class="nw">${esc(n.when)}</span>` : n.sub ? `<span class="nw">${esc(n.sub)}</span>` : ""}</span>
          ${n.kind ? `<span class="timer" data-timer="${n.kind}">00:00:00</span>` : ""}
        </button>`).join("");
    $$(".node", tree).forEach(b => b.addEventListener("click", () => select(b.dataset.id)));
  }
  function drawTree() {
    const pairs = EDGES.map(([a, b]) => [$(`.node[data-id="${a}"] .plate`, tree), $(`.node[data-id="${b}"] .plate`, tree), `${a}>${b}`]);
    return drawWires(tree, pairs, (a, b, key) => {
      const child = byId[key.split(">")[1]];
      return (child.state === "locked" ? "w-off" : child.event ? "w-brass" : "w-on") + (MAIN.has(key) ? " w-main" : "");
    });
  }
  let armed = false;
  function arm() { /* the signature moment: the path powers up, then the current node lights */
    if (armed) return; armed = true;
    const svg = drawTree();
    if (reduced || !svg) return;
    tree.classList.add("arming");
    const mains = $$(".w-main", svg);
    mains.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      mains.forEach((p, i) => { p.style.transitionDelay = `${.15 + i * .45}s`; p.style.strokeDashoffset = 0; });
      setTimeout(() => { tree.classList.remove("arming"); }, 1150);
      setTimeout(() => { mains.forEach(p => { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; p.style.transitionDelay = ""; }); }, 1900);
    }));
  }

  /* selected node detail */
  const detail = $("#detail");
  function select(id) {
    const n = byId[id];
    $$(".node", tree).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
    const act = a => a.soon ? `<a class="btn sec" href="#" data-soon>${esc(a.text)}</a>` :
      `<a class="btn${a.sec ? " sec" : ""}" href="${a.href}"${a.ext ? ' target="_blank" rel="noopener"' : ""}>${esc(a.text)}${a.ext ? '<span class="sr"> (opens in a new tab)</span>' : ""}</a>`;
    detail.innerHTML = `<div class="d-head"><span class="node is-${n.state}${n.event ? " is-event" : ""}" aria-hidden="true">${plate(n.icon, n.state)}</span><div><h3>${esc(n.label)}</h3><p class="d-tier">${esc(TIERS[n.tier].label)}${n.when ? `, ${esc(n.when)}` : ""}</p></div></div>
      <p class="d-text">${esc(n.text)}</p>
      <dl class="d-facts">${n.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      <div class="d-actions">${n.actions.map(act).join("")}</div>`;
  }

  /* diplomacy and council */
  function portrait(a, i, name) {
    if (a.tag === "DGF") {
      if (name === "Nínna") return `<span class="plate-in portrait" style="background-image:url('${a.art.ninna}')"></span>`;
      const cell = i < 0 ? 0 : i + 1, col = cell % 4, row = Math.floor(cell / 4);
      return `<span class="plate-in portrait sprite" style="background-image:url('${a.art.sprite}');background-position:${col * 100 / 3}% ${row * 50}%"></span>`;
    }
    const src = i < 0 ? a.art.r5Portrait : a.art.portraits[name];
    return src ? `<span class="plate-in portrait" style="background-image:url('${src}')"></span>` : `<span class="plate-in portrait"><span class="init">${esc(name.replace(/^[^\p{L}\p{N}]+/u, "").slice(0, 1) || "?")}</span></span>`;
  }
  const diplo = $("#diplo"), council = $("#council");
  function renderAlliance(a) {
    diplo.innerHTML = `<svg class="wires" aria-hidden="true"></svg>
      <div class="hub"><span class="plate-wrap"><span class="plate"><span class="plate-in"><b>${a.nap.number}</b><small>NAP</small></span></span></span><span class="hub-note">${esc(a.nap.note)}</span></div>
      <div class="rows">
        <div class="drow"><span class="rh">Allies</span><span class="tags">${a.allies.map(t => `<span class="tag"><bdi>${esc(t)}</bdi></span>`).join("")}</span></div>
        ${a.interStateNap.length ? `<div class="drow"><span class="rh">Inter-state NAP</span><span class="tags">${a.interStateNap.map(n => `<span class="tag state"><b>${esc(n.state)}</b><bdi>${esc(n.alliance)}</bdi></span>`).join("")}</span></div>` : ""}
      </div>`;
    const per = phone.matches ? 4 : 6, strips = [];
    a.r4.forEach((n, i) => { (strips[Math.floor(i / per)] ||= []).push(`<div class="r4"><span class="plate-wrap"><span class="plate">${portrait(a, i, n)}</span></span><span class="name"><bdi>${esc(n)}</bdi></span></div>`); });
    council.innerHTML = `<span class="spine" aria-hidden="true"></span><div class="r5"><span class="plate-wrap"><span class="plate">${portrait(a, -1, a.r5)}</span></span><div><h3 class="r5-name"><bdi>${esc(a.r5)}</bdi></h3><p>R5 leader</p></div></div>
      <div class="r4wrap">${strips.map(s => `<div class="r4strip">${s.join("")}</div>`).join("")}</div>`;
    sizeSpine();
    drawDiplo();
  }
  phone.addEventListener("change", () => renderAlliance(HQ.alliances[document.documentElement.dataset.alliance]));
  function sizeSpine() {
    const strips = $$(".r4strip", council), spine = $(".spine", council);
    if (!strips.length || !spine) return;
    spine.style.height = `${strips[strips.length - 1].offsetTop - 96 + 1}px`;
  }
  function drawDiplo() {
    const hub = $(".hub .plate", diplo);
    if (!hub) return;
    drawWires(diplo, $$(".rh", diplo).map(rh => [hub, rh, "d"]), () => "w-on");
  }

  /* static copy from hq.js */
  $("#seasonName").textContent = S.name;
  $("#weekLine").textContent = `Week ${S.sample.week} of ${S.sample.weeks}`;
  $("#footnote").innerHTML = `Event times and the week count are sample values; the alliance sites carry no live schedule yet. <b>Pre-release briefing.</b> ${esc(S.notice.replace(/^Pre-release briefing — (\w)/, (_, c) => c.toUpperCase()))}`;

  renderTree();
  select("mines");
  D4.shell({
    page: "home", art: "hero",
    onAlliance: renderAlliance,
    onLang: () => requestAnimationFrame(() => { drawTree(); drawDiplo(); })
  }).then(() => { arm(); drawDiplo(); });
  new ResizeObserver(() => { if (armed && !tree.classList.contains("arming")) drawTree(); drawDiplo(); sizeSpine(); }).observe(tree);
})();
