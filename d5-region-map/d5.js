/* d5 Region Map: home (the season map). Data from window.HQ; shell from window.D5. */
(function () {
  "use strict";
  const { $, el, h, esc, phone, remain } = D5;

  // Which camp is ours: sample placement, declared in the footnote. Mirrors the whole holdings layout.
  const camps = { DGF: "west", GIR: "east" };
  const facing = { west: "east", east: "west" };
  const mirror = x => 800 - x;

  // Holdings read from the crystal calculator preset so the map and the settlement figure agree.
  const preset = HQ.calculators.crystals.preset;
  const spots = {
    regular: [[92, 336], [128, 404], [92, 476], [146, 546], [70, 520], [120, 300]],
    boosted: [[178, 318], [184, 398], [176, 470]],
    passes: [[224, 300], [224, 384], [224, 468]],
    posts: [[66, 242], [118, 592], [58, 410]],
    hq: [104, 196], enemyHq: [696, 196],
    settlement: [150, 452], invasion: [604, 430]
  };

  const now0 = Date.now();
  const events = HQ.season.sample.events.map(e => ({ ...e, at: now0 + e.inMinutes * 60000 }));
  const onMap = { settlement: 1, invasion: 1 };
  const whenText = {
    settlement: "Monday 00:00 server time", battle: "Thursday 12:00 server time, one hour",
    invasion: "Sunday, server time", bgb: "Saturday 20:00 server time"
  };

  let A = null;

  function tick() {
    document.querySelectorAll("[data-at]").forEach(n => {
      const r = remain(+n.dataset.at);
      n.innerHTML = (r.d ? `${r.d}<small>d</small> ` : "") + r.text;
    });
  }

  /* ---------- map ---------- */
  function drawMarkers() {
    const g = $("#markers"); g.innerHTML = "";
    const ours = camps[A.tag];
    const P = ([x, y]) => ours === "west" ? [x, y] : [mirror(x), y];
    const k = phone() ? 1.45 : 1;
    const use = (id, [x, y], w0, h0, attrs = {}) => { const w = w0 * k, hgt = h0 * k; g.append(el("use", { href: id, x: x - w / 2, y: y - hgt / 2, width: w, height: hgt, ...attrs })); };
    spots.regular.slice(0, preset.regularCount).forEach(p => use("#sym-mine", P(p), 22, 22));
    spots.boosted.slice(0, preset.boostedCount).forEach(p => use("#sym-boost", P(p), 28, 28));
    spots.passes.slice(0, preset.passCount).forEach(p => use("#sym-pass", P(p), 18, 22));
    spots.posts.forEach(p => use("#sym-post", P(p), 14, 14));

    const [hx, hy] = P(spots.hq);
    const hq = el("g", { class: "hq" });
    hq.append(el("use", { href: "#sym-pennant", x: hx - 19, y: hy - 24, width: 38, height: 48, style: "--pennant: var(--ally)" }));
    hq.append(el("text", { class: "hq-tag", x: hx, y: hy - 2 }, A.tag));
    const nameX = ours === "west" ? hx + 26 : hx - 26, anchor = ours === "west" ? "start" : "end";
    hq.append(el("text", { class: "hq-name", x: nameX, y: hy - 4, "text-anchor": anchor }, "HQ"));
    hq.append(el("text", { class: "hq-name hq-r5", x: nameX, y: hy + 14, "text-anchor": anchor }, A.r5));
    g.append(hq);
    const [ex, ey] = P(spots.enemyHq);
    g.append(el("use", { href: "#sym-pennant", x: ex - 15, y: ey - 20, width: 30, height: 38, style: "--pennant: var(--rust)" }));

    // Supply route: dashed line from our HQ past the holdings to our nearest Pass.
    const r = $("#route"); r.innerHTML = "";
    const pts = [spots.hq, [70, 250], [80, 330], [150, 372], spots.passes[1]].map(P).map(p => p.join(",")).join(" ");
    r.append(el("polyline", { points: pts }));

    $("#lbl-west-sub").textContent = ours === "west" ? "Our camp" : "Facing camp";
    $("#lbl-east-sub").textContent = ours === "east" ? "Our camp" : "Facing camp";

    const ev = $("#events"); ev.innerHTML = "";
    let n = 0;
    events.filter(e => onMap[e.kind]).forEach(e => {
      n += 1;
      const [x, y] = P(spots[e.kind]);
      const grp = el("g", { class: "ev", tabindex: "0", role: "button", "data-ev": e.kind, "aria-label": `${e.name}, marker ${n}` });
      grp.append(el("circle", { class: "hit", cx: x, cy: y, r: 54 }));
      grp.append(el("circle", { class: "dot", cx: x, cy: y, r: 17 }));
      grp.append(el("text", { x, y: y + 7 }, String(n)));
      grp.addEventListener("click", () => select(e.kind));
      grp.addEventListener("keydown", k => { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); select(e.kind); } });
      ev.append(grp);
    });
  }

  // A card hangs on the physical side of the map its marker sits on; on phones everything stacks in number order.
  function placeCards() {
    const ours = camps[A.tag];
    const cards = [...document.querySelectorAll(".hang .tag")].sort((a, b) => a.dataset.n - b.dataset.n);
    cards.forEach(card => {
      const side = phone() ? "left" : ((card.dataset.ev === "settlement") === (ours === "west") ? "left" : "right");
      card.dataset.side = side;
      $(`#hang-${side}`).append(card);
    });
    requestAnimationFrame(drawLeaders);
  }

  function drawCards() {
    $("#hang-left").innerHTML = ""; $("#hang-right").innerHTML = "";
    const crystals = HQ.calculators.crystals.calc(preset);
    let n = 0;
    events.filter(e => onMap[e.kind]).forEach(e => {
      n += 1;
      const li = h("li", "tag"); li.dataset.n = n; li.dataset.ev = e.kind; li.tabIndex = 0;
      const note = e.kind === "settlement"
        ? `<b>${esc(HQ.amount(crystals.total))} Aberrant Crystals</b> expected from ${preset.regularCount} Mining Sites, ${preset.boostedCount} boosted and ${preset.passCount} Passes we hold.`
        : `${esc(e.note)}. Same-camp holdings stay protected.`;
      const act = e.kind === "settlement" ? `<p class="act"><a class="btn" href="./calc.html#crystals">Estimate crystals</a></p>` : "";
      li.innerHTML = `<h3>${esc(e.name)}</h3><p class="when">${esc(whenText[e.kind] || e.when)}</p>
        <span class="count" data-at="${e.at}" aria-live="off"></span>
        <p class="note">${note}</p>${act}`;
      li.addEventListener("click", ev => { if (!ev.target.closest("a")) select(e.kind); });
      li.addEventListener("keydown", k => { if (k.key === "Enter" && k.target === li) select(e.kind); });
      $("#hang-left").append(li);
    });
    const bgb = events.find(x => x.kind === "bgb");
    $("#nb-when").textContent = whenText.bgb;
    $("#nb-count").dataset.at = bgb.at;
    const off = $("#offmap"); off.innerHTML = "";
    const mg = events.find(x => x.kind === "battle");
    const li = h("li");
    li.innerHTML = `<h3>${esc(mg.name)}</h3><p class="when">${esc(whenText.battle)}. Location not yet confirmed in the pre-release client.</p><span class="count" data-at="${mg.at}"></span>`;
    off.append(li);
    tick();
    placeCards();
  }

  function drawLeaders() {
    const svg = $("#leaders"); svg.innerHTML = "";
    if (phone()) return;
    const stage = svg.getBoundingClientRect();
    document.querySelectorAll(".hang .tag").forEach(card => {
      const m = $(`.ev[data-ev="${card.dataset.ev}"] .dot`); if (!m) return;
      const mr = m.getBoundingClientRect(), cr = card.getBoundingClientRect();
      const left = card.dataset.side === "left";
      const x1 = mr.left + mr.width / 2 - stage.left, y1 = mr.top + mr.height / 2 - stage.top;
      const x2 = (left ? cr.right : cr.left) - stage.left, y2 = cr.top + 30 - stage.top;
      const bend = left ? x2 + 36 : x2 - 36;
      svg.append(el("polyline", { points: `${x1},${y1} ${bend},${y2} ${x2},${y2}`, fill: "none", stroke: "var(--bone)", "stroke-width": "1.5", "stroke-opacity": ".8" }));
      svg.append(el("circle", { cx: x1, cy: y1, r: 3 }));
    });
  }

  function select(kind) {
    const ours = camps[A.tag];
    document.querySelectorAll(".is-hot").forEach(n => n.classList.remove("is-hot"));
    const card = $(`.tag[data-ev="${kind}"]`), mark = $(`.ev[data-ev="${kind}"]`);
    if (!card) return;
    const was = card.dataset.hot === "1";
    document.querySelectorAll(".hang .tag").forEach(t => { t.dataset.hot = "0"; });
    if (was) return;
    card.dataset.hot = "1"; card.classList.add("is-hot"); mark && mark.classList.add("is-hot");
    $(`#r-${kind === "settlement" ? ours : facing[ours]}`).classList.add("is-hot");
    if (phone()) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /* ---------- diplomacy, command ---------- */
  function portraitStyle(i) {
    if (A.tag === "DGF") {
      if (i === "r5") return `background-image:url(${A.art.sprite});background-size:400% 300%;background-position:0% 0%`;
      if (A.r4[i] === "Nínna") return `background-image:url(${A.art.ninna})`;
      const cell = i + 1, col = cell % 4, row = Math.floor(cell / 4);
      return `background-image:url(${A.art.sprite});background-size:400% 300%;background-position:${col * 100 / 3}% ${row * 50}%`;
    }
    if (i === "r5") return `background-image:url(${A.art.r5Portrait})`;
    const src = A.art.portraits[A.r4[i]];
    return src ? `background-image:url(${src})` : "";
  }

  function renderAlliance(a) {
    A = a;
    document.title = `${A.name}: season map`;
    $("#nap-n").textContent = A.nap.number; $("#nap-note").textContent = A.nap.note;
    $("#allies").innerHTML = A.allies.map(t => `<li><svg viewBox="0 0 44 56" aria-hidden="true"><use href="#sym-pennant"></use></svg><b><bdi>${esc(t)}</bdi></b></li>`).join("");
    $("#interstate").innerHTML = A.interStateNap.length
      ? `<h3>Beyond this state</h3><ul class="states">${A.interStateNap.map(s => `<li><span class="st">${esc(s.state)}</span><bdi>${esc(s.alliance)}</bdi></li>`).join("")}</ul>` : "";
    $("#r5").innerHTML = `<div class="portrait" style="${portraitStyle("r5")}" role="img" aria-label="Portrait of ${esc(A.r5)}"></div><div class="who"><b><bdi>${esc(A.r5)}</bdi></b><span>R5 leader</span></div>`;
    $("#council").innerHTML = A.r4.map((name, i) => {
      const st = portraitStyle(i);
      return `<li>${st ? `<div class="portrait" style="${st}" role="img" aria-label="Portrait of ${esc(name)}"></div>` : `<div class="portrait empty" aria-hidden="true">R4</div>`}<bdi>${esc(name)}</bdi></li>`;
    }).join("");
    drawMarkers();
    drawCards();
  }

  /* ---------- boot ---------- */
  $("#season-name").textContent = HQ.season.name;
  $("#week-n").textContent = HQ.season.sample.week;
  $("#week-of").textContent = HQ.season.sample.weeks;
  $("#notice-text").textContent = HQ.season.notice;

  D5.onAlliance(renderAlliance);
  D5.onLang(() => requestAnimationFrame(drawLeaders));
  let wasPhone = phone();
  addEventListener("resize", () => { if (phone() !== wasPhone) { wasPhone = phone(); drawMarkers(); placeCards(); } else requestAnimationFrame(drawLeaders); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(drawLeaders));
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $("#stage").classList.add("anim");
    setTimeout(() => { $("#stage").classList.remove("anim"); drawLeaders(); }, 1150);
  }
  D5.mount("home");
  setInterval(tick, 1000);
})();
