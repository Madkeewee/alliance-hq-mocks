/* d5 Region Map: calculators. Maths from HQ.calculators; rendering is this direction's. */
(function () {
  "use strict";
  const { $, $$, h, esc } = D5;
  const C = HQ.calculators;
  const num = v => { const n = Number(String(v ?? "").replace(/[^\d.]/g, "")); return Number.isFinite(n) ? n : 0; };
  const store = (k, v) => { try { localStorage.setItem("d5-calc-" + k, JSON.stringify(v)); } catch (e) { /* storage may be unavailable */ } };
  const load = k => { try { return JSON.parse(localStorage.getItem("d5-calc-" + k)); } catch (e) { return null; } };
  const fmtTime = m => HQ.duration(m);

  /* ---------- rail (hub) ---------- */
  const order = [["speedups", "#sym-clock"], ["research", "#sym-badge"], ["goal", "#sym-scales"], ["crystals", "#sym-crystal"], ["capture", "#sym-mine"]];
  $("#rail").innerHTML = order.map(([id, sym]) => `<li><a href="#${id}" data-row="${id}"><svg aria-hidden="true"><use href="${sym}"/></svg><span class="rname-t">${esc(C[id].title)}</span><span class="rjob">${esc(C[id].description)}</span></a></li>`).join("");
  $("#external").innerHTML = HQ.externalTools.map(t => `<li><a href="${t.url}" target="_blank" rel="noopener">${esc(t.title)}<span>${esc(t.note)}</span><small class="sr">Opens in a new tab</small></a></li>`).join("");
  order.forEach(([id]) => { const d = $(`#${id} .lede`); if (d) d.textContent = C[id].description; });
  const sheets = order.map(([id]) => $("#" + id));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { $$("[data-row]").forEach(a => a.classList.toggle("is-current", a.dataset.row === e.target.id)); } });
  }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
  sheets.forEach(s => io.observe(s));
  $('[data-row="speedups"]').classList.add("is-current");
  $$("[data-row]").forEach(a => a.addEventListener("click", () => { $$("[data-row]").forEach(x => x.classList.remove("is-current")); a.classList.add("is-current"); }));

  /* ---------- speedup inventory ---------- */
  const sp = {
    read() {
      return { one: num($("#sp-one").value), five: num($("#sp-five").value), sixty: num($("#sp-sixty").value), extra: num($("#sp-extra").value),
        timer: num($("#sp-d").value) * 1440 + num($("#sp-h").value) * 60 + num($("#sp-m").value) };
    },
    write(v) {
      $("#sp-one").value = v.one; $("#sp-five").value = v.five; $("#sp-sixty").value = v.sixty; $("#sp-extra").value = v.extra;
      const t = v.timer || 0; $("#sp-d").value = Math.floor(t / 1440); $("#sp-h").value = Math.floor((t % 1440) / 60); $("#sp-m").value = t % 60;
    },
    render() {
      const v = sp.read(); store("speedups", v);
      const r = C.speedups.calc(v);
      $("#sp-avail").textContent = fmtTime(r.totalMinutes);
      $("#sp-timer").textContent = fmtTime(r.timerMinutes);
      $("#sp-short").textContent = fmtTime(r.shortMinutes);
      $("#sp-bar").style.inlineSize = `${r.timerMinutes ? Math.round(r.covered * 100) : 0}%`;
      $("#sp-result").classList.toggle("is-covered", !r.shortMinutes && r.timerMinutes > 0);
      $("#sp-result").classList.toggle("is-short", r.shortMinutes > 0);
      $("#sp-result").classList.toggle("is-empty", !r.timerMinutes);
      $(".terr").setAttribute("aria-label", `${Math.round(r.covered * 100)} percent of the timer covered`);
      let verdict;
      if (!r.timerMinutes) verdict = "Enter the upgrade timer to see what your speedups cover.";
      else if (!r.shortMinutes) verdict = `Covered. ${fmtTime(r.totalMinutes - r.timerMinutes)} of speedups left over.`;
      else {
        const hours = Math.ceil(r.shortMinutes / 60), fives = Math.ceil(r.shortMinutes / 5);
        verdict = `${Math.round(r.covered * 100)}% covered. ${hours} more 1-hour item${hours === 1 ? "" : "s"}, or ${HQ.amount(fives)} 5-minute items, would finish it.`;
      }
      $("#sp-verdict").textContent = verdict;
    }
  };
  $("#sp-form").addEventListener("input", sp.render);
  $$("#sp-form .step").forEach(b => b.addEventListener("click", () => {
    const input = b.parentElement.querySelector("input");
    input.value = Math.max(0, num(input.value) + Number(b.dataset.d)); sp.render();
  }));
  $("#sp-example").addEventListener("click", () => { sp.write(C.speedups.preset); sp.render(); });
  $("#sp-reset").addEventListener("click", () => { sp.write({ one: 0, five: 0, sixty: 0, extra: 0, timer: 0 }); sp.render(); });
  sp.write(load("speedups") || { one: 0, five: 0, sixty: 0, extra: 0, timer: 0 }); sp.render();

  /* ---------- research budget ---------- */
  const cols = ["wood", "iron", "electricity", "coin", "badges", "minutes"];
  const rs = {
    addStep(vals = [0, 0, 0, 0, 0, 0]) {
      const li = h("li", "step-row");
      const n = $("#rs-steps").children.length + 1;
      li.innerHTML = `<span class="step-n">${n}</span>` + cols.map((c, i) => `<label><span class="sr">${c} for step ${n}</span><svg aria-hidden="true"><use href="#sym-${c === "minutes" ? "clock" : c === "badges" ? "badge" : c}"/></svg><input data-c="${i}" inputmode="numeric" pattern="[0-9]*" value="${vals[i]}"></label>`).join("")
        + `<button type="button" class="remove" aria-label="Remove step ${n}">Remove</button>`;
      li.querySelector(".remove").addEventListener("click", () => { li.remove(); rs.renumber(); rs.render(); });
      $("#rs-steps").append(li);
    },
    renumber() { $$("#rs-steps .step-row").forEach((li, i) => { li.querySelector(".step-n").textContent = i + 1; li.querySelector(".remove").setAttribute("aria-label", `Remove step ${i + 1}`); }); },
    read() {
      const steps = $$("#rs-steps .step-row").map(li => $$("input", li).map(i => num(i.value)));
      return { steps, speed: num($("#rs-speed").value), discount: num($("#rs-discount").value), speedups: num($("#rs-speedups").value) };
    },
    write(v) {
      $("#rs-steps").innerHTML = ""; (v.steps && v.steps.length ? v.steps : [[0, 0, 0, 0, 0, 0]]).forEach(s => rs.addStep(s));
      $("#rs-speed").value = v.speed || 0; $("#rs-discount").value = v.discount || 0; $("#rs-speedups").value = v.speedups || 0;
    },
    render() {
      const v = rs.read(); store("research", v);
      const r = C.research.calc(v);
      const items = [["wood", "Wood", r.wood], ["iron", "Iron", r.iron], ["electricity", "Electricity", r.electricity], ["coin", "Coin", r.coin], ["badge", "Badges", r.badges]];
      $("#rs-req").innerHTML = items.map(([s, name, val]) => `<li><svg aria-hidden="true"><use href="#sym-${s}"/></svg><b>${esc(HQ.amount(val))}</b><span>${name}</span></li>`).join("");
      $("#rs-time").textContent = fmtTime(r.timeMinutes);
      $("#rs-after").textContent = fmtTime(r.afterMinutes);
      const empty = !v.steps.some(s => s.some(Boolean));
      $("#rs-verdict").textContent = empty ? "Enter at least one research step." :
        v.discount ? `Reduction of ${v.discount}% applied to wood, iron, electricity and coin, not to badges.` : "";
    }
  };
  $("#rs-form").addEventListener("input", rs.render);
  $("#rs-add").addEventListener("click", () => { rs.addStep(); rs.render(); $("#rs-steps li:last-child input").focus(); });
  $("#rs-example").addEventListener("click", () => { rs.write(C.research.preset); rs.render(); });
  $("#rs-reset").addEventListener("click", () => { rs.write({ steps: [] }); rs.render(); });
  rs.write(load("research") || { steps: [] }); rs.render();

  /* ---------- the compact three ---------- */
  function simple(id, prefix, fields, verdict) {
    const read = () => Object.fromEntries(fields.map(f => [f, num($(`#${prefix}-${f}`).value)]));
    const write = v => fields.forEach(f => { $(`#${prefix}-${f}`).value = v[f] ?? 0; });
    const render = () => { const v = read(); store(id, v); $(`#${prefix}-verdict`).textContent = verdict(C[id].calc(v), v); };
    $(`#${prefix}-form`).addEventListener("input", render);
    $(`#${prefix}-example`).addEventListener("click", () => { write(C[id].preset); render(); });
    write(load(id) || (id === "capture" ? { progress: 0, full: 30 } : {})); render();
  }
  simple("goal", "go", ["owned", "target", "rate"], (r, v) =>
    !v.target ? "Enter a target to see how long it takes." :
    !r.remaining ? "Target reached." :
    !v.rate ? `${HQ.amount(r.remaining)} still needed. Add a positive rate for an ETA.` :
    `${HQ.amount(r.remaining)} still needed. About ${fmtTime(r.etaMinutes)} at ${HQ.amount(v.rate)} per hour.`);
  simple("crystals", "cr", ["regularCount", "regularPayout", "boostedCount", "boostedPayout", "passCount", "passPayout"], r =>
    r.total ? `${HQ.amount(r.total)} Aberrant Crystals expected at Monday settlement: ${HQ.amount(r.regular)} from regular sites, ${HQ.amount(r.boosted)} from boosted sites, ${HQ.amount(r.passes)} from Passes.` : "Add the holdings you plan to keep through settlement.");
  simple("capture", "ca", ["progress", "full"], (r, v) =>
    v.progress >= 100 ? "Captured. Ownership locks until the next day." : `About ${fmtTime(r.leftMinutes)} of further uninterrupted control to finish the capture.`);

  D5.onAlliance(a => { document.title = `${a.name}: calculators`; });
  D5.onLang(() => { sp.render(); rs.render(); });
  D5.mount("tools");
})();
