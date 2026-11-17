/* d8-timetable home: the event board, prep rows and roster board, from window.HQ. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = Shell.esc;
  const name = s => `<bdi>${esc(s)}</bdi>`;
  const kindArt = { bgb: "bgb", settlement: "territory", battle: "dinosaurs", invasion: "sideR" };
  const prep = {
    bgb: { href: "planner.html", label: "Open the plan" },
    settlement: { href: "calc.html#crystals", label: "Estimate crystals" },
    invasion: { href: "calc.html#capture", label: "Time a capture" },
    battle: { href: "#", label: "Season chapter", soon: "Season" }
  };
  const calcGlyph = { speedups: "clock", research: "badge", goal: "coin", crystals: "crystal", capture: "iron" };
  const calcOrder = ["speedups", "research", "goal", "crystals", "capture"];
  const targets = [];
  let ticker = null;

  const pad = n => String(n).padStart(2, "0");
  const digits = str => [...str].map(c => c === ":" ? `<span class="sep">:</span>` : `<span class="dig">${c}</span>`).join("");
  function renderTime(el, at) {
    const s = Math.max(0, Math.floor((at - Date.now()) / 1000));
    const d = Math.floor(s / 86400), hms = `${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
    el.innerHTML = `${d ? `<span class="dd">${d}d</span>` : ""}<span class="hms">${digits(hms)}</span>`;
    el.setAttribute("aria-label", `${d ? d + " days " : ""}${hms.replace(/:/g, " ")}`);
  }
  const tick = () => targets.forEach(t => renderTime(t.el, t.at));

  function eventRow(ev, a, i) {
    const p = prep[ev.kind];
    return `<li class="row ${i === 0 ? "row--next" : ""}" data-kind="${ev.kind}">
      <span class="tile" style="background-image:url('${a.art[kindArt[ev.kind]] || a.art.season}')" aria-hidden="true"></span>
      <div class="what"><h3 class="ev-name">${esc(ev.name)}</h3><p class="ev-when">${esc(ev.when)}</p><p class="ev-note">${esc(ev.note)}</p></div>
      <div class="time drop" role="timer" style="--delay:${0.08 * i}s" data-in="${ev.inMinutes}"></div>
      <a class="prep-btn" href="${p.href}" ${p.soon ? `data-soon="${p.soon}"` : ""}>${p.label}</a>
    </li>`;
  }

  function ruler() {
    const s = HQ.season.sample;
    const notes = { 3: "Guild opens", 10: "Lock" };
    $("ruler").setAttribute("aria-label", `Week ${s.week} of ${s.weeks}`);
    $("ruler").innerHTML = Array.from({ length: s.weeks }, (_, i) => {
      const w = i + 1;
      const cls = [w < s.week && "past", w === s.week && "now", w === 10 && "lock"].filter(Boolean).join(" ");
      return `<li class="wk ${cls}" ${w === s.week ? 'aria-current="true"' : ""}>
        ${w === s.week ? `<span class="label">Week ${w} of ${s.weeks}</span>` : ""}
        <span class="tick" aria-hidden="true"></span><span class="n">${w}</span>
        ${notes[w] ? `<span class="note">${notes[w]}</span>` : ""}
      </li>`;
    }).join("");
  }

  function portraitStyle(a, who) {
    if (a.tag === "GIR") return `background-image:url('${who === a.r5 ? a.art.r5Portrait : a.art.portraits[who]}')`;
    if (who === "Nínna") return `background-image:url('${a.art.ninna}')`;
    const cell = who === a.r5 ? 0 : a.r4.indexOf(who) + 1;
    return `background-image:url('${a.art.sprite}');background-position:${(cell % 4) * 100 / 3}% ${Math.floor(cell / 4) * 50}%`;
  }
  const isSprite = (a, who) => a.tag === "DGF" && who !== "Nínna";

  function render(a) {
    const s = HQ.season;
    $("state").textContent = s.sample.state;
    $("server-time").textContent = s.sample.serverTime;
    const step = s.timeline[1];
    $("season-step").innerHTML = `<b>Week ${s.sample.week} of ${s.sample.weeks}, ${esc(step.title.toLowerCase())}.</b> ${esc(step.text)}`;
    ruler();

    const events = [...s.sample.events].sort((x, y) => x.inMinutes - y.inMinutes);
    $("coming").innerHTML = events.map((ev, i) => eventRow(ev, a, i)).join("");
    targets.length = 0;
    const now = Date.now();
    document.querySelectorAll("#coming .time").forEach(el => targets.push({ el, at: now + Number(el.dataset.in) * 60000 }));
    tick();
    clearInterval(ticker);
    ticker = setInterval(tick, 1000);
    $("footnote").innerHTML = `<span>Event times on this board are sample data for the mock. Season rules follow ATLANTISHUB's v474 pre-release research of 13 November 2026. Confirm dates, rules and payouts in game before making alliance commitments.</span>`;

    $("prep-rows").innerHTML = `
      <li class="row"><span class="tile" style="background-image:url('${a.art.bgb}')" aria-hidden="true"></span>
        <div class="what"><h3 class="ev-name">Black Gold Battlefield planner</h3><p class="ev-note">Roster, Team A or Team B, 20 starters, and each pair's objective on the map. Copy the plan into alliance chat.</p></div>
        <a class="prep-btn" href="planner.html">Open the planner</a></li>
      ${calcOrder.map(k => {
        const c = HQ.calculators[k];
        return `<li class="row row--glyph"><span class="tile tile--glyph" aria-hidden="true">${GLYPHS[calcGlyph[k]]}</span>
          <div class="what"><h3 class="ev-name">${esc(c.title)}</h3><p class="ev-note">${esc(c.description)}</p></div>
          <a class="prep-btn btn--quiet" href="calc.html#${k}">Open</a></li>`;
      }).join("")}`;

    $("diplomacy").innerHTML = `
      <li class="row row--notile"><div class="what"><h4 class="ev-name">${esc(a.nap.note)}</h4><p class="ev-note">Check the pact before any fight.</p></div>
        <p class="edge">${a.nap.number}<small>NAP</small></p></li>
      <li class="row row--notile"><div class="what"><h4 class="ev-name">Allies</h4><ul class="tags">${a.allies.map(t => `<li>${name(t)}</li>`).join("")}</ul></div></li>
      ${a.interStateNap.map(n => `<li class="row row--notile"><div class="what"><h4 class="ev-name">${name(n.alliance)}</h4><p class="ev-note">Inter-state NAP</p></div><p class="edge">${esc(n.state)}<small>state</small></p></li>`).join("")}`;

    $("leaders").innerHTML = `
      <li class="row row--r5"><span class="tile ${isSprite(a, a.r5) ? "tile--sprite" : ""}" style="${portraitStyle(a, a.r5)}" aria-hidden="true"></span>
        <div class="what"><h4 class="ev-name">${name(a.r5)}</h4><p class="ev-note">R5 leader</p></div><p class="edge">R5<small>leader</small></p></li>
      <li class="row row--notile"><div class="what"><h4 class="ev-name">R4 council</h4>
        <ul class="council">${a.r4.map(w => `<li><span class="por ${isSprite(a, w) ? "por--sprite" : ""}" style="${portraitStyle(a, w)}" aria-hidden="true"></span>${name(w)}</li>`).join("")}</ul></div>
        <p class="edge">R4<small>${a.r4.length} on the council</small></p></li>`;
  }

  Shell.mount({ page: "home", render });
})();
