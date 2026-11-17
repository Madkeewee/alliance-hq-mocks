/* d1-journal calculators. Maths from HQ.calculators; this file draws recipe cards and keeps values in localStorage. */
(function () {
  "use strict";
  const { $, esc, tearAll } = window.Journal;
  const C = HQ.calculators, dur = HQ.duration, amount = HQ.amount;
  const num = v => { const n = Number(String(v ?? "").replace(/[,\s]/g, "")); return Number.isFinite(n) && n >= 0 ? n : 0; };
  const whole = v => /^\d{0,13}$/.test(String(v ?? "").replace(/[,\s]/g, ""));
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable: values stay on the page only */ } };
  const load = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const row = (label, value, big) => `<div class="row ${big ? "big" : ""}"><span>${label}</span><span class="dots"></span><b>${value}</b></div>`;

  /* ---------- Speedup inventory ---------- */
  const sp = { one: $("#sp-one"), five: $("#sp-five"), sixty: $("#sp-sixty"), extra: $("#sp-extra"), d: $("#sp-d"), h: $("#sp-h"), m: $("#sp-m") };
  function spValues() {
    const v = {}; for (const k in sp) v[k] = num(sp[k].value);
    v.timer = v.d * 1440 + v.h * 60 + v.m; return v;
  }
  function spRender() {
    const v = spValues(), r = C.speedups.calc(v);
    const out = $("#spOut");
    const items = r.shortMinutes ? `${amount(Math.ceil(r.shortMinutes / 60))} more 1-hour items, or ${amount(Math.ceil(r.shortMinutes / 5))} more 5-minute items.` : "";
    out.innerHTML = [
      row("Speedups available", dur(r.totalMinutes)),
      row("Upgrade timer", r.timerMinutes ? dur(r.timerMinutes) : "not set"),
      r.timerMinutes ? row(r.shortMinutes ? "Still needed" : "Covered", r.shortMinutes ? dur(r.shortMinutes) : "yes", true) : "",
      r.timerMinutes ? `<p class="line ${r.shortMinutes ? "" : "ok"}">${r.shortMinutes ? `Covers ${Math.round(r.covered * 100)}% of the timer. ${items}` : "Your speedups cover the whole timer."}</p>` : `<p class="line">Enter the remaining timer to see what is still needed.</p>`
    ].join("");
    store("d1-calc-speedups", Object.fromEntries(Object.keys(sp).map(k => [k, sp[k].value])));
  }
  function spSet(vals) { for (const k in sp) if (k in vals) sp[k].value = vals[k]; spRender(); }
  $("#spForm").addEventListener("input", spRender);
  $("#spForm").addEventListener("click", e => {
    const b = e.target.closest(".step"); if (!b) return;
    const el = sp[b.dataset.for]; el.value = Math.max(0, num(el.value) + Number(b.dataset.step)); spRender();
  });
  $("#spExample").addEventListener("click", () => { const p = C.speedups.preset; spSet({ one: p.one, five: p.five, sixty: p.sixty, extra: p.extra, d: Math.floor(p.timer / 1440), h: Math.floor(p.timer % 1440 / 60), m: p.timer % 60 }); });
  $("#spReset").addEventListener("click", () => spSet({ one: 0, five: 0, sixty: 0, extra: 0, d: 0, h: 0, m: 0 }));
  const spSaved = load("d1-calc-speedups"); if (spSaved) spSet(spSaved); else $("#spExample").click();

  /* ---------- Research budget ---------- */
  const cols = ["wood", "iron", "electricity", "coin", "badges", "minutes"];
  const stepsEl = $("#steps");
  function addStep(values = ["", "", "", "", "", ""]) {
    const n = stepsEl.children.length + 1;
    const li = document.createElement("li");
    li.innerHTML = `<span class="n">${n}</span>` + cols.map((c, i) =>
      `<span class="f${i + 1}"><span class="fl">${c[0].toUpperCase() + c.slice(1)}</span><input class="inp" data-col="${i}" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="Step ${n} ${c}" value="${esc(values[i])}"></span>`).join("") +
      `<button type="button" class="rm" aria-label="Remove step ${n}">×</button>`;
    stepsEl.appendChild(li);
  }
  function renumber() { [...stepsEl.children].forEach((li, i) => { li.querySelector(".n").textContent = i + 1; li.querySelectorAll("input").forEach((inp, k) => inp.setAttribute("aria-label", `Step ${i + 1} ${cols[k]}`)); li.querySelector(".rm").setAttribute("aria-label", `Remove step ${i + 1}`); }); }
  function rsRender() {
    const lines = [...stepsEl.children];
    const err = $("#rsErr"), out = $("#rsOut");
    let bad = null;
    const steps = lines.map((li, i) => [...li.querySelectorAll("input")].map(inp => {
      const ok = whole(inp.value) && num(inp.value) <= 1e12; inp.setAttribute("aria-invalid", String(!ok)); if (!ok && bad === null) bad = i + 1; return num(inp.value);
    }));
    const speed = num($("#rs-speed").value), discount = num($("#rs-discount").value), speedups = num($("#rs-speedups").value);
    store("d1-calc-research", { steps: lines.map(li => [...li.querySelectorAll("input")].map(i => i.value)), speed: $("#rs-speed").value, discount: $("#rs-discount").value, speedups: $("#rs-speedups").value });
    if (!lines.length) { err.textContent = "Enter at least one research step."; out.innerHTML = ""; return; }
    if (bad) { err.textContent = `Line ${bad} needs six comma-separated whole numbers from 0 to 1 trillion.`; out.innerHTML = ""; return; }
    err.textContent = "";
    const r = C.research.calc({ steps, speed, discount, speedups });
    out.innerHTML = `<ul class="res-list">${[["wood", r.wood], ["iron", r.iron], ["electricity", r.electricity], ["coin", r.coin], ["badge", r.badges]].map(([k, v]) =>
      `<li><svg class="stamp" aria-hidden="true"><use href="#rs-${k}"/></svg><span><b>${amount(v)}</b>${k === "badge" ? "badges" : k}</span></li>`).join("")}</ul>` +
      row("Time", dur(r.timeMinutes)) + row("After speedups", dur(r.afterMinutes), true) +
      `<p class="line">${steps.length} step${steps.length === 1 ? "" : "s"}, ${discount}% off resources (badges are never reduced), ${speed}% research speed.</p>`;
  }
  $("#rsForm").addEventListener("input", rsRender);
  stepsEl.addEventListener("click", e => { const b = e.target.closest(".rm"); if (!b) return; b.closest("li").remove(); renumber(); rsRender(); });
  $("#rsAdd").addEventListener("click", () => { addStep(); renumber(); stepsEl.lastElementChild.querySelector("input").focus(); rsRender(); });
  function rsSet(v) {
    stepsEl.innerHTML = ""; (v.steps || []).forEach(s => addStep(s.map(String)));
    $("#rs-speed").value = v.speed; $("#rs-discount").value = v.discount; $("#rs-speedups").value = v.speedups; rsRender();
  }
  $("#rsExample").addEventListener("click", () => rsSet(C.research.preset));
  $("#rsReset").addEventListener("click", () => rsSet({ steps: [["", "", "", "", "", ""]], speed: 0, discount: 0, speedups: 0 }));
  const rsSaved = load("d1-calc-research"); rsSet(rsSaved && rsSaved.steps ? rsSaved : C.research.preset);

  /* ---------- the three small notes ---------- */
  function noteValues(form) { const v = {}; form.querySelectorAll("input").forEach(i => { v[i.name] = num(i.value); }); return v; }
  const notes = {
    goal(v) { const r = C.goal.calc(v); return r.remaining === 0 ? `Target reached.` : r.etaMinutes ? `${amount(r.remaining)} still needed<small>About ${dur(r.etaMinutes)} at ${amount(v.rate)} an hour.</small>` : `${amount(r.remaining)} still needed<small>Add a positive rate for an estimate.</small>`; },
    crystals(v) { const r = C.crystals.calc(v); return `${amount(r.total)} crystals at settlement<small>${amount(r.regular)} from regular Mines, ${amount(r.boosted)} from boosted Mines, ${amount(r.passes)} from Passes.</small>`; },
    capture(v) { const r = C.capture.calc(v); return `About ${dur(r.leftMinutes)} to hold<small>Uninterrupted control still needed from ${v.progress}% progress.</small>`; }
  };
  document.querySelectorAll(".note-card").forEach(f => {
    const render = () => { f.querySelector(".nc-out").innerHTML = notes[f.id](noteValues(f)); };
    f.addEventListener("input", render); render();
  });

  /* ---------- ATLANTIS HUB ---------- */
  $("#extList").innerHTML = HQ.externalTools.map(t =>
    `<li><a href="${t.url}" target="_blank" rel="noopener"><span><b>${esc(t.title)}</b><br><span>${esc(t.note)}</span></span><i>opens in a new tab</i></a></li>`).join("");

  document.addEventListener("hq:alliance", e => { $("#heroArt").src = e.detail.art.calculators; });
  HQ.init();
  tearAll();
})();
