/* d3-poster · calculators. Maths come from HQ.calculators; this file keeps inputs, persistence and rendering. */
(function () {
  "use strict";
  const { esc } = Poster;
  const C = HQ.calculators, $ = id => document.getElementById(id);
  const { amount, duration } = HQ;
  const num = v => { const n = Number(String(v ?? "").replace(/[,\s]/g, "")); return Number.isFinite(n) && n > 0 ? n : 0; };
  const pct = v => Math.round(v * 100);

  let store = {};
  try { store = JSON.parse(localStorage.getItem("d3-calc") || "{}") || {}; } catch (e) { store = {}; }
  const save = () => { try { localStorage.setItem("d3-calc", JSON.stringify(store)); } catch (e) { /* storage unavailable: the page still works for this visit */ } };

  function bind(form, state, onChange) {
    const inputs = [...form.querySelectorAll("input[data-k]")];
    const fill = () => inputs.forEach(i => { const v = state[i.dataset.k]; i.value = v === 0 || v == null ? "" : String(v); });
    inputs.forEach(i => i.addEventListener("input", () => { state[i.dataset.k] = num(i.value); save(); onChange(); }));
    fill();
    return fill;
  }

  /* ---------- speedup inventory (hero) ---------- */
  const spPreset = (() => { const p = C.speedups.preset; return { one: p.one, five: p.five, sixty: p.sixty, extra: p.extra, timerD: Math.floor(p.timer / 1440), timerH: Math.floor((p.timer % 1440) / 60), timerM: p.timer % 60 }; })();
  store.speedups = store.speedups || { ...spPreset };
  const sp = store.speedups;
  const spFill = bind($("spForm"), sp, renderSp);
  document.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.step; sp[k] = Math.max(0, (sp[k] || 0) + Number(b.dataset.d)); save(); spFill(); renderSp();
  }));
  $("spExample").addEventListener("click", () => { Object.assign(sp, spPreset); save(); spFill(); renderSp(); });
  $("spReset").addEventListener("click", () => { Object.keys(sp).forEach(k => { sp[k] = 0; }); save(); spFill(); renderSp(); $("sp-one").focus(); });

  function renderSp() {
    const timer = (sp.timerD || 0) * 1440 + (sp.timerH || 0) * 60 + (sp.timerM || 0);
    const r = C.speedups.calc({ one: sp.one || 0, five: sp.five || 0, sixty: sp.sixty || 0, extra: sp.extra || 0, timer });
    const total = r.totalMinutes, short = r.shortMinutes;
    let word, big, line, items = "";
    if (!timer) {
      word = "Available"; big = total ? duration(total) : "0m";
      line = "Enter the remaining upgrade timer to see what is still needed.";
    } else if (short > 0) {
      word = "Still needed"; big = duration(short);
      line = `Available ${duration(total)} of ${duration(timer)}. ${pct(r.covered)}% covered.`;
      items = `Or ${amount(Math.ceil(short / 60))} more 1-hour items, ${amount(Math.ceil(short / 5))} more 5-minute items, or ${amount(short)} more 1-minute items.`;
    } else {
      word = "To spare"; big = duration(total - timer);
      line = `Covered. Available ${duration(total)} of ${duration(timer)}.`;
    }
    $("spWord").textContent = word; $("spBig").textContent = big; $("spLine").textContent = line; $("spItems").textContent = items;
  }
  renderSp();

  /* ---------- research budget ---------- */
  const cols = [["wood", "Wood", "i-wood"], ["iron", "Iron", "i-iron"], ["electricity", "Electricity", "i-bolt"], ["coin", "Coin", "i-coin"], ["badges", "Badges", "i-badge"], ["minutes", "Minutes", "i-clock"]];
  const rsPreset = () => ({ steps: C.research.preset.steps.map(s => [...s]), speed: C.research.preset.speed, discount: C.research.preset.discount, speedups: C.research.preset.speedups });
  store.research = store.research || rsPreset();
  const rs = store.research;
  const rsFill = bind($("rsForm"), rs, renderRs);

  function renderSteps() {
    $("rsSteps").innerHTML = rs.steps.map((s, i) => `<li><div class="step-row"><span class="n">${i + 1}</span>${cols.map(([k, label, icon], j) =>
      `<label class="in"><span><svg aria-hidden="true"><use href="#${icon}"/></svg><span class="lbl">${label}</span></span><input data-step-row="${i}" data-col="${j}" inputmode="numeric" pattern="[0-9]*" value="${s[j] || ""}" aria-label="Step ${i + 1} ${label.toLowerCase()}"></label>`).join("")}
      <button type="button" class="rm" data-rm="${i}" ${rs.steps.length === 1 ? "disabled" : ""}>Remove</button></div></li>`).join("");
    $("rsSteps").querySelectorAll("input").forEach(i => i.addEventListener("input", () => { rs.steps[+i.dataset.stepRow][+i.dataset.col] = num(i.value); save(); renderRs(); }));
    $("rsSteps").querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", () => { rs.steps.splice(+b.dataset.rm, 1); save(); renderSteps(); renderRs(); }));
  }
  $("rsAdd").addEventListener("click", () => { rs.steps.push([0, 0, 0, 0, 0, 0]); save(); renderSteps(); renderRs(); $("rsSteps").querySelector(`[data-step-row="${rs.steps.length - 1}"]`).focus(); });
  $("rsExample").addEventListener("click", () => { Object.assign(rs, rsPreset()); save(); rsFill(); renderSteps(); renderRs(); });
  $("rsReset").addEventListener("click", () => { Object.assign(rs, { steps: [[0, 0, 0, 0, 0, 0]], speed: 0, discount: 0, speedups: 0 }); save(); rsFill(); renderSteps(); renderRs(); });

  function renderRs() {
    const r = C.research.calc({ steps: rs.steps, speed: rs.speed || 0, discount: rs.discount || 0, speedups: rs.speedups || 0 });
    const any = rs.steps.some(s => s.some(Boolean));
    $("rsBig").textContent = any ? duration(r.timeMinutes) : "0m";
    $("rsAfter").textContent = any ? `${duration(r.afterMinutes)} after speedups.` : "Enter at least one research step.";
    $("rsCost").innerHTML = cols.slice(0, 5).map(([k, label, icon]) => `<li><svg aria-hidden="true"><use href="#${icon}"/></svg><span class="v">${amount(r[k])}</span><span class="k">${label.toLowerCase()}</span></li>`).join("");
  }
  renderSteps(); renderRs();

  /* ---------- three compact calculators ---------- */
  store.goal = store.goal || { ...C.goal.preset };
  bind($("goForm"), store.goal, renderGo);
  function renderGo() {
    const r = C.goal.calc(store.goal);
    if (!r.remaining) { $("goBig").textContent = "Reached"; $("goLine").textContent = "Target reached."; return; }
    if (!r.etaMinutes) { $("goBig").textContent = amount(r.remaining); $("goLine").textContent = "still needed. Add a positive rate for a time."; return; }
    $("goBig").textContent = duration(r.etaMinutes);
    $("goLine").textContent = `${amount(r.remaining)} still needed at ${amount(store.goal.rate)} per hour.`;
  }
  renderGo();

  store.crystals = store.crystals || { ...C.crystals.preset };
  bind($("crForm"), store.crystals, renderCr);
  function renderCr() {
    const v = store.crystals, r = C.crystals.calc({ regularCount: v.regularCount || 0, regularPayout: v.regularPayout || 0, boostedCount: v.boostedCount || 0, boostedPayout: v.boostedPayout || 0, passCount: v.passCount || 0, passPayout: v.passPayout || 0 });
    $("crBig").textContent = amount(r.total);
    $("crLine").textContent = `estimated crystals at settlement: ${amount(r.regular)} from regular Mines, ${amount(r.boosted)} boosted, ${amount(r.passes)} from Passes.`;
  }
  renderCr();

  store.capture = store.capture || { ...C.capture.preset };
  bind($("caForm"), store.capture, renderCa);
  function renderCa() {
    const v = store.capture, r = C.capture.calc({ progress: Math.min(100, v.progress || 0), full: v.full || 30 });
    $("caBig").textContent = duration(r.leftMinutes);
    $("caLine").textContent = "of further uninterrupted control.";
  }
  renderCa();

  /* ---------- external tools ---------- */
  $("tools").innerHTML = HQ.externalTools.map(t => `<li><a href="${t.url}" target="_blank" rel="noopener"><span class="t">${esc(t.title)}</span><span class="d">${esc(t.note)}<span class="vh"> (opens atlantisdws.com in a new tab)</span></span></a></li>`).join("");

  save();
})();
