/* d2-command home: season, Time-left banners, Go plates, alliance, leadership. */
(function () {
  "use strict";
  const { $, el, svgUse } = D2;

  // Event kinds: band colour class, emblem, art key, and the one button whose colour is its job.
  const KIND = {
    bgb:        { cls: "k-bgb",        emblem: "ev-barrel", art: "bgb",       btn: { label: "Open the plan",     href: "planner.html",      cls: "btn-green" } },
    settlement: { cls: "k-settlement", emblem: "ic-crystal", art: "territory", btn: { label: "Estimate crystals", href: "calc.html#crystals", cls: "btn-brass" } },
    battle:     { cls: "k-battle",     emblem: "ev-swords", art: "ark",       btn: { label: "Season rules",      href: "#",                 cls: "btn-steel", soon: "Season guide" } },
    invasion:   { cls: "k-invasion",   emblem: "ev-skull",  art: "dinosaurs", btn: { label: "Season rules",      href: "#",                 cls: "btn-steel", soon: "Season guide" } }
  };
  const GO = [
    { key: "tools",   art: "calculators", href: "calc.html",    note: "Speedups, research, crystals, capture time", tag: "Open",  cls: "btn-green" },
    { key: "planner", art: "planner",     href: "planner.html", note: "Black Gold Battlefield roster and map",       tag: "Open",  cls: "btn-green" },
    { key: "season",  art: "season",      href: "#",            note: "Season 8 guide and alliance checklist",       tag: "Later", cls: "btn-steel", soon: "Season guide" },
    { key: "tips",    art: "tips",        href: "#",            note: "Before you march",                            tag: "Later", cls: "btn-steel", soon: "Tips" }
  ];
  const loaded = Date.now();
  const timers = [];

  function renderSeason() {
    const s = HQ.season;
    const now = s.timeline[1], next = s.timeline[3];
    $("#stageTitle").textContent = `${now.label}: ${now.title}`;
    $("#stageText").textContent = now.text.split(". ").slice(-1)[0];
    $("#stageNext").textContent = `${next.label}: ${next.text.split(". ")[0]}. ${next.title}.`;
    const n = s.notice.replace(/^Pre-release briefing — /, "");
    $("#noticeText").textContent = n.charAt(0).toUpperCase() + n.slice(1);
  }

  function renderEvents(a) {
    const list = $("#events");
    list.textContent = "";
    timers.length = 0;
    const events = [...HQ.season.sample.events].sort((x, y) => x.inMinutes - y.inMinutes);
    for (const ev of events) {
      const k = KIND[ev.kind] || KIND.battle;
      const li = el("li", `banner ${k.cls}`);
      const art = el("div", "banner-art");
      art.style.backgroundImage = `url("${a.art[k.art] || a.art.hero}")`;
      const head = el("div", "banner-head");
      const emblem = el("span", "emblem");
      emblem.append(svgUse(k.emblem));
      head.append(emblem, el("h3", null, ev.name));
      const wrap = el("div", "cd-wrap");
      wrap.append(el("span", null, "Time left"));
      const cd = el("time", "cd");
      wrap.append(cd);
      head.append(wrap);
      const body = el("div", "banner-body");
      const text = el("div", "banner-text");
      text.append(el("p", "when", ev.when.replace(/ server$/, " server time")));
      text.append(el("p", "note", ev.note));
      const btn = el("a", `btn ${k.btn.cls}`, k.btn.label);
      btn.href = k.btn.href;
      if (k.btn.soon) btn.dataset.soon = k.btn.soon;
      body.append(text, btn);
      li.append(art, head, body);
      list.append(li);
      timers.push({ node: cd, target: loaded + ev.inMinutes * 60000 });
    }
    tick();
  }
  const pad = (n) => String(n).padStart(2, "0");
  function tick() {
    const now = Date.now();
    for (const t of timers) {
      let s = Math.max(0, Math.floor((t.target - now) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400;
      const h = Math.floor(s / 3600); s -= h * 3600;
      const m = Math.floor(s / 60); s -= m * 60;
      const parts = [];
      if (d) parts.push(`<b class="d">${d}</b><small>d</small>`);
      parts.push(`<b>${pad(h)}</b><small>h</small>`, `<b>${pad(m)}</b><small>m</small>`, `<b>${pad(s)}</b><small>s</small>`);
      t.node.innerHTML = parts.join("");
      t.node.setAttribute("datetime", `PT${d * 24 + h}H${m}M${s}S`);
    }
  }
  setInterval(tick, 1000);

  function renderGo(a) {
    const grid = $("#go");
    grid.textContent = "";
    for (const g of GO) {
      const plate = el("a", "goplate");
      plate.href = g.href;
      plate.dataset.nav = g.key;
      if (g.soon) plate.dataset.soon = g.soon;
      plate.style.backgroundImage = `url("${a.art[g.art] || a.art.hero}")`;
      const text = el("span", "gotext");
      const word = el("b", null, HQ.nav.en[g.key]);
      word.dataset.nav = g.key;
      text.append(word, el("span", null, g.note));
      const tag = el("span", `gotag ${g.cls}`, g.tag);
      plate.append(text, tag);
      grid.append(plate);
    }
  }

  function renderAlliance(a) {
    $("#napNum").textContent = a.nap.number;
    $("#napTitle").textContent = `NAP ${a.nap.number}`;
    $("#napNote").textContent = a.nap.note;
    const allies = $("#allies");
    allies.textContent = "";
    for (const t of a.allies) { const li = el("li"); li.append(Object.assign(el("bdi"), { textContent: t })); allies.append(li); }
    const inter = $("#inter");
    inter.textContent = "";
    for (const n of a.interStateNap) {
      const li = el("li");
      li.append(el("b", null, n.state), Object.assign(el("bdi"), { textContent: n.alliance }));
      inter.append(li);
    }
    $("#interWell").hidden = !a.interStateNap.length;
  }

  // DGF: 4x3 sprite sheet, r5 = cell 0, r4[i] = cell i+1; Nínna has her own file. GIR: one file per person.
  function portraitStyle(a, i) {
    if (a.tag === "DGF") {
      const name = i == null ? null : a.r4[i];
      if (name === "Nínna") return { image: a.art.ninna, pos: "center", size: "cover" };
      const cell = i == null ? 0 : i + 1;
      return { image: a.art.sprite, pos: `${((cell % 4) * 100) / 3}% ${Math.floor(cell / 4) * 50}%`, size: "400% 300%" };
    }
    return { image: i == null ? a.art.r5Portrait : a.art.portraits[a.r4[i]], pos: "center", size: "cover" };
  }
  function applyPortrait(node, p) {
    node.style.backgroundImage = p.image ? `url("${p.image}")` : "none";
    node.style.backgroundPosition = p.pos;
    node.style.backgroundSize = p.size;
  }
  function renderLeaders(a) {
    $("#r5Name").textContent = a.r5;
    const r5 = $("#r5Portrait");
    applyPortrait(r5, portraitStyle(a, null));
    r5.setAttribute("aria-label", `Portrait of ${a.r5}`);
    const council = $("#council");
    council.textContent = "";
    a.r4.forEach((name, i) => {
      const li = el("li");
      const frame = el("span", "cframe");
      const p = el("span", "portrait portrait-c");
      p.setAttribute("role", "img"); p.setAttribute("aria-label", `Portrait of ${name}`);
      applyPortrait(p, portraitStyle(a, i));
      frame.append(p, svgUse("r4", "insignia insignia-r4", "R4"));
      const b = el("b"); b.append(Object.assign(el("bdi"), { textContent: name }));
      li.append(frame, b);
      council.append(li);
    });
  }

  $("#noticeClose").addEventListener("click", () => { $("#notice").hidden = true; });

  D2.onAlliance((a) => { renderSeason(); renderEvents(a); renderGo(a); renderAlliance(a); renderLeaders(a); });
  D2.start();
})();
