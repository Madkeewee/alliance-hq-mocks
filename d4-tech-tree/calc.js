/* d4-tech-tree calculators: chains of nodes; maths from HQ.calculators, rendered our way. */
(function () {
  "use strict";
  const { $, $$, esc, plate, ico, store } = D4;
  const CALC = HQ.calculators, dur = HQ.duration, amount = HQ.amount;
  const KEY = "d4-calc";
  const defaults = () => ({
    sp: { one: 0, five: 0, sixty: 0, extra: 0, d: 0, h: 0, m: 0 },
    rs: { steps: [[0, 0, 0, 0, 0, 0]], speed: 0, discount: 0, speedups: 0 },
    goal: { owned: 0, target: 0, rate: 0 },
    crystals: { regularCount: 0, regularPayout: 0, boostedCount: 0, boostedPayout: 0, passCount: 0, passPayout: 0 },
    capture: { progress: 0, full: 30 }
  });
  const presets = () => {
    const x = CALC.speedups.preset, r = CALC.research.preset;
    return {
      sp: { one: x.one, five: x.five, sixty: x.sixty, extra: x.extra, d: Math.floor(x.timer / 1440), h: Math.floor(x.timer % 1440 / 60), m: x.timer % 60 },
      rs: { steps: r.steps.map(s => [...s]), speed: r.speed, discount: r.discount, speedups: r.speedups },
      goal: { ...CALC.goal.preset }, crystals: { ...CALC.crystals.preset }, capture: { ...CALC.capture.preset }
    };
  };
  /* first visit shows the worked example so the chains carry real costs; after that, your own values */
  const st = Object.assign(defaults(), store.get(KEY, null) || presets());
  const save = () => store.set(KEY, st);
  const n = v => { const x = Math.floor(Number(String(v).replace(/[,\s]/g, ""))); return Number.isFinite(x) && x >= 0 ? Math.min(x, 1e12) : 0; };

  const RES = [["wood", "wood", "Wood"], ["iron", "iron", "Iron"], ["electricity", "electricity", "Electricity"], ["coin", "coin", "Coin"], ["badges", "badge", "Badges"], ["minutes", "clock", "Minutes"]];
  const field = (name, label, value, icon, extra = "") => `<label class="field"><span>${icon ? ico(icon) : ""}${esc(label)}</span><input name="${name}" inputmode="numeric" autocomplete="off" value="${value}"${extra}></label>`;

  /* menu */
  const MENU = [
    ["speedups", "clock", CALC.speedups.title, "Will my speedups cover this upgrade"],
    ["research", "gear", CALC.research.title, "Cost and time with your bonuses"],
    ["goal", "crystal", CALC.goal.title, "When a resource target lands"],
    ["crystals", "crystal", CALC.crystals.title, "Monday settlement forecast"],
    ["capture", "mines", CALC.capture.title, "Time a Mining Site capture"]
  ];
  const menu = $("#menu");
  menu.innerHTML = MENU.map(([id, icon, title, note]) => `<a href="#${id}" data-m="${id}">${plate(icon)}<span><b>${esc(title)}</b><small>${esc(note)}</small></span></a>`).join("") +
    `<a href="#external" data-m="external" class="ext">${plate("pin")}<span><b>ATLANTIS HUB tools</b><small>Ten deeper calculators, external</small></span></a>`;
  function setCurrent(id) { $$("a", menu).forEach(a => { if (a.dataset.m === id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); }); }
  menu.addEventListener("click", e => { const a = e.target.closest("a"); if (a) setCurrent(a.dataset.m); });
  setCurrent((location.hash || "#speedups").slice(1));

  /* panels */
  const panels = $("#panels");
  panels.innerHTML = `
    <section class="calc" id="speedups" aria-labelledby="spT">
      <h3 id="spT">${esc(CALC.speedups.title)}</h3>
      <p class="desc">${esc(CALC.speedups.description)}</p>
      <div class="feed sp-feed" style="--n:4">
        ${[["one", "1m", "1-minute items"], ["five", "5m", "5-minute items"], ["sixty", "1h", "1-hour items"], ["extra", "min", "Other speedups, minutes"]].map(([k, tag, label]) => `
        <div class="dn">${plate("clock", null, `${ico("clock")}<small>${tag}</small>`)}<span class="nl">${label}</span>
          <div class="stepper"><button type="button" data-step="${k}" data-d="-1" aria-label="Fewer ${label}">−</button><input name="${k}" inputmode="numeric" autocomplete="off" aria-label="${label}" value="${st.sp[k]}"><button type="button" data-step="${k}" data-d="1" aria-label="More ${label}">+</button></div>
        </div>`).join("")}
      </div>
      <div class="bus" style="--n:4"></div>
      <div class="feed sp-mid" style="--n:2">
        <div class="sumnode">${plate("clock")}<span class="nl">Speedups available</span><span class="val" id="spAvail">0m</span></div>
        <div class="tnode">${plate("hourglass")}<span class="nl">Remaining upgrade timer</span>
          <div class="dhm">${field("d", "days", st.sp.d)}${field("h", "hours", st.sp.h)}${field("m", "minutes", st.sp.m)}</div></div>
      </div>
      <div class="bus" style="--n:2"></div>
      <div class="sink"><div class="result" id="spResult"></div></div>
      <div class="actions"><button type="button" class="btn" data-preset="sp">Load example</button><button type="button" class="btn sec" data-reset="sp">Reset</button></div>
    </section>

    <section class="calc" id="research" aria-labelledby="rsT">
      <h3 id="rsT">${esc(CALC.research.title)}</h3>
      <p class="desc">${esc(CALC.research.description)}</p>
      <div class="rnode bonus">${plate("gear")}<div class="rbody"><div class="rhead"><b>Bonuses</b></div>
        <div class="fields three">${field("speed", "Research speed, %", st.rs.speed)}${field("discount", "Resource reduction, %", st.rs.discount)}${field("speedups", "Speedups available, minutes", st.rs.speedups, "clock")}</div>
        <p class="unit">The reduction applies to wood, iron, electricity and coin, never to badges.</p></div></div>
      <div class="link"><div class="cost" id="rsBonusNote"></div></div>
      <div id="steps"></div>
      <div class="link add"><div class="cost"><button type="button" class="btn sec" id="addStep">Add a step</button></div></div>
      <div class="rnode total">${plate("badge")}<div class="rbody"><div class="rhead"><b>Estimated cost</b></div><div class="totals" id="rsTotals"></div><p class="time-line" id="rsTime"></p></div></div>
      <div class="actions"><button type="button" class="btn" data-preset="rs">Load example</button><button type="button" class="btn sec" data-reset="rs">Reset</button></div>
    </section>

    <section class="calc compact" id="goal" aria-labelledby="goT">
      <h3 id="goT">${esc(CALC.goal.title)}</h3>
      <p class="desc">${esc(CALC.goal.description)}</p>
      <div class="rnode">${plate("crystal")}<div class="rbody"><div class="fields three">${field("owned", "In storage", st.goal.owned)}${field("target", "Target amount", st.goal.target)}${field("rate", "Net gain per hour", st.goal.rate)}</div><p class="out" id="goalOut"></p></div></div>
      <div class="actions"><button type="button" class="btn sec" data-preset="goal">Load example</button><button type="button" class="btn sec" data-reset="goal">Reset</button></div>
    </section>

    <section class="calc compact" id="crystals" aria-labelledby="crT">
      <h3 id="crT">${esc(CALC.crystals.title)}</h3>
      <p class="desc">${esc(CALC.crystals.description)}</p>
      <div class="rnode">${plate("crystal")}<div class="rbody"><div class="fields three">
        ${field("regularCount", "Regular Mines", st.crystals.regularCount, "mines")}${field("boostedCount", "Boosted Mines", st.crystals.boostedCount, "mines")}${field("passCount", "Passes", st.crystals.passCount, "gate")}
        ${field("regularPayout", "Crystals per regular Mine", st.crystals.regularPayout, "crystal")}${field("boostedPayout", "Crystals per boosted Mine", st.crystals.boostedPayout, "crystal")}${field("passPayout", "Crystals per Pass", st.crystals.passPayout, "crystal")}
      </div><p class="out" id="crOut"></p></div></div>
      <div class="actions"><button type="button" class="btn sec" data-preset="crystals">Load example</button><button type="button" class="btn sec" data-reset="crystals">Reset</button></div>
    </section>

    <section class="calc compact" id="capture" aria-labelledby="caT">
      <h3 id="caT">${esc(CALC.capture.title)}</h3>
      <p class="desc">${esc(CALC.capture.description)}</p>
      <div class="rnode">${plate("mines")}<div class="rbody"><div class="fields three">${field("progress", "Current camp progress, %", st.capture.progress)}${field("full", "Full capture time, minutes", st.capture.full, "clock")}</div><p class="out" id="caOut"></p></div></div>
      <div class="actions"><button type="button" class="btn sec" data-preset="capture">Load example</button><button type="button" class="btn sec" data-reset="capture">Reset</button></div>
    </section>

    <section class="calc" id="external" aria-labelledby="exT">
      <h3 id="exT">More calculators from ATLANTIS HUB</h3>
      <p class="desc">Deeper calculators live on atlantisdws.com. Each link opens in a new tab.</p>
      <div class="extlist">${HQ.externalTools.map(t => `<a href="${t.url}" target="_blank" rel="noopener">${plate("gear")}<span><b>${esc(t.title)}</b><small>${esc(t.note)}</small><span class="sr"> (opens in a new tab)</span></span></a>`).join("")}</div>
    </section>`;

  /* speedups */
  const sp = $("#speedups");
  const spIn = name => $(`input[name="${name}"]`, sp);
  function spCompute() {
    const v = { one: st.sp.one, five: st.sp.five, sixty: st.sp.sixty, extra: st.sp.extra, timer: st.sp.d * 1440 + st.sp.h * 60 + st.sp.m };
    const r = CALC.speedups.calc(v);
    $("#spAvail").textContent = dur(r.totalMinutes);
    const out = $("#spResult");
    if (!v.timer) {
      out.className = "result";
      out.innerHTML = `${plate("hourglass")}<div><div class="r-title">Enter the upgrade timer</div><p class="r-sub muted">Type the time left on the in-game timer as days, hours and minutes.</p></div>`;
      return;
    }
    const short = r.shortMinutes, pct = Math.round(r.covered * 100);
    const items = short ? `${amount(Math.ceil(short / 60))} more 1-hour items, or ${amount(Math.ceil(short / 5))} more 5-minute items` : "";
    out.className = `result ${short ? "is-short" : "is-ok"}`;
    out.innerHTML = `${plate(short ? "hourglass" : "clock")}<div>
      <div class="r-title">${short ? "Still needed" : "Timer covered"}</div>
      <div class="r-val">${short ? dur(short) : dur(r.totalMinutes - r.timerMinutes) + " spare"}</div>
      <p class="r-sub${short ? "" : " muted"}">${short ? items : `Your speedups cover the ${dur(r.timerMinutes)} timer.`}</p></div>
      <div class="cover"><span>${pct}% covered, ${dur(r.totalMinutes)} of ${dur(r.timerMinutes)}</span><div class="track"><i style="width:${pct}%"></i></div></div>`;
  }
  sp.addEventListener("input", e => { const i = e.target; if (i.name in st.sp) { st.sp[i.name] = n(i.value); save(); spCompute(); } });
  sp.addEventListener("click", e => {
    const b = e.target.closest("[data-step]"); if (!b) return;
    const k = b.dataset.step; st.sp[k] = Math.max(0, st.sp[k] + Number(b.dataset.d)); spIn(k).value = st.sp[k]; save(); spCompute();
  });
  function spFill() { Object.keys(st.sp).forEach(k => { const i = spIn(k); if (i) i.value = st.sp[k]; }); spCompute(); }

  /* research */
  const rs = $("#research"), stepsEl = $("#steps");
  const stepCost = s => {
    const c = RES.map(([k, icon, label], i) => `<span title="${label}">${ico(icon)}<b>${i === 5 ? dur(s[5]) : amount(s[i])}</b></span>`);
    return c.join("");
  };
  function renderSteps() {
    stepsEl.innerHTML = st.rs.steps.map((s, i) => `
      <div class="rnode step" data-i="${i}">${plate(null, null, `<b>${i + 1}</b>`)}<div class="rbody"><div class="rhead"><b>Step ${i + 1}</b>${st.rs.steps.length > 1 ? `<button type="button" data-rm="${i}">Remove</button>` : ""}</div>
        <div class="fields">${RES.map(([k, icon, label], j) => field(`s${i}_${j}`, label, s[j], icon)).join("")}</div></div></div>
      <div class="link"><div class="cost" data-cost="${i}">${stepCost(s)}</div></div>`).join("");
    rsCompute();
  }
  function rsCompute() {
    const r = CALC.research.calc({ steps: st.rs.steps, speed: st.rs.speed, discount: st.rs.discount, speedups: st.rs.speedups });
    $("#rsBonusNote").innerHTML = `<span>${st.rs.speed}% faster</span><span>${st.rs.discount}% cheaper</span><span>${ico("clock")}<b>${dur(st.rs.speedups)}</b> of speedups</span>`;
    $("#rsTotals").innerHTML = RES.slice(0, 5).map(([k, icon, label]) => `<div><span>${ico(icon)}${label}</span><b>${amount(r[k])}</b></div>`).join("");
    $("#rsTime").innerHTML = `Time <b>${dur(r.timeMinutes)}</b>, after speedups <b class="${r.afterMinutes ? "" : "ok"}">${dur(r.afterMinutes)}</b>`;
    st.rs.steps.forEach((s, i) => { const c = $(`[data-cost="${i}"]`, stepsEl); if (c) c.innerHTML = stepCost(s); });
  }
  rs.addEventListener("input", e => {
    const i = e.target; if (!i.name) return;
    const m = i.name.match(/^s(\d+)_(\d)$/);
    if (m) st.rs.steps[+m[1]][+m[2]] = n(i.value);
    else if (i.name in st.rs) st.rs[i.name] = n(i.value);
    save(); rsCompute();
  });
  rs.addEventListener("click", e => {
    const rm = e.target.closest("[data-rm]");
    if (rm) { st.rs.steps.splice(+rm.dataset.rm, 1); save(); renderSteps(); return; }
    if (e.target.closest("#addStep")) { st.rs.steps.push([0, 0, 0, 0, 0, 0]); save(); renderSteps(); $(`.step[data-i="${st.rs.steps.length - 1}"] input`, stepsEl).focus(); }
  });
  function rsFill() { ["speed", "discount", "speedups"].forEach(k => { $(`input[name="${k}"]`, rs).value = st.rs[k]; }); renderSteps(); }

  /* compact three */
  function goalCompute() {
    const r = CALC.goal.calc(st.goal);
    $("#goalOut").innerHTML = !r.remaining ? "Target reached." : r.etaMinutes == null ? `<b>${amount(r.remaining)}</b> still needed. Add a positive rate for an ETA.` : `<b>${amount(r.remaining)}</b> still needed, ETA <b>${dur(r.etaMinutes)}</b>.`;
  }
  function crCompute() {
    const r = CALC.crystals.calc(st.crystals);
    $("#crOut").innerHTML = `<b>${amount(r.total)}</b> estimated crystals at settlement. Regular Mines ${amount(r.regular)}, boosted Mines ${amount(r.boosted)}, Passes ${amount(r.passes)}.`;
  }
  function caCompute() {
    const r = CALC.capture.calc(st.capture);
    $("#caOut").innerHTML = `About <b>${dur(r.leftMinutes)}</b> of further uninterrupted control.`;
  }
  const compact = { goal: goalCompute, crystals: crCompute, capture: caCompute };
  Object.keys(compact).forEach(k => {
    const sec = $(`#${k}`);
    sec.addEventListener("input", e => { const i = e.target; if (i.name in st[k]) { st[k][i.name] = n(i.value); save(); compact[k](); } });
  });
  const fillCompact = k => { Object.keys(st[k]).forEach(f => { const i = $(`#${k} input[name="${f}"]`); if (i) i.value = st[k][f]; }); compact[k](); };

  /* presets and resets */
  panels.addEventListener("click", e => {
    const p = e.target.closest("[data-preset]"), r = e.target.closest("[data-reset]");
    if (!p && !r) return;
    const k = (p || r).dataset[p ? "preset" : "reset"];
    const src = p ? presets() : defaults();
    if (k === "sp") { Object.assign(st.sp, src.sp); save(); spFill(); }
    else if (k === "rs") { st.rs = src.rs; save(); rsFill(); }
    else { st[k] = src[k]; save(); fillCompact(k); }
  });

  spCompute(); renderSteps(); goalCompute(); crCompute(); caCompute();
  D4.shell({ page: "tools", art: "calculators" });
})();
