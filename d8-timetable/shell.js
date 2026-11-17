/* d8-timetable shared shell: masthead, phone bar, language picker, mock pill, footer. Pages call Shell.mount(). */
window.Shell = (function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pennantCrop = {
    DGF: { art: "hero", size: "740% auto", pos: "82% 66%" },
    GIR: { art: "hero", size: "340% auto", pos: "93% 4%" }
  };
  const NAV = [
    ["home", "home.html", "HQ"], ["season", "#", "Season"], ["tips", "#", "Tips"], ["tools", "calc.html", "Calculators"], ["planner", "planner.html", "Planner"]
  ];
  let opts = {};

  function navLinks(page, cls) {
    return NAV.map(([key, href, label]) => {
      const soon = href === "#" ? ` data-soon="${label}"` : "";
      const cur = key === page ? ' aria-current="page"' : "";
      const glyph = cls === "bar-link" ? GLYPHS[key === "home" ? "hq" : key] : "";
      return `<a class="${cls}" href="${href}"${cur}${soon}>${glyph}<span data-nav="${key}">${label}</span></a>`;
    }).join("");
  }

  function mount(o) {
    opts = o;
    $("shell-top").innerHTML = `
      <header class="mast">
        <div class="wrap mast-in">
          <a class="pennant" href="home.html" id="pennant"><span class="pennant-art" id="pennant-art"></span><span class="pennant-tag" id="pennant-tag"></span></a>
          <div class="ident">
            ${o.page === "home" ? `<h1 class="name" id="alliance-name"></h1>` : `<p class="name" id="alliance-name"></p>`}
            <p class="motto" id="motto"></p>
          </div>
          <nav class="tabs" aria-label="Sections">${navLinks(o.page, "tab")}</nav>
          <div class="lang">
            <select id="lang" aria-label="Language"></select>
            <svg class="lang-chev" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 5l6 6 6-6z" fill="currentColor"/></svg>
          </div>
        </div>
        <div class="wrap"><p class="soon" id="soon" role="status" aria-live="polite"></p></div>
      </header>`;
    $("shell-foot").innerHTML = `
      <footer class="foot wrap">
        <p class="foot-brand" id="foot-brand"></p>
        <p>Unofficial Dark War: Survival community guide created by AI pilot Madkeewee.</p>
        <a href="#main">Back to top</a>
      </footer>
      <nav class="bar" aria-label="Sections">${navLinks(o.page, "bar-link")}</nav>
      <div class="mock" aria-label="Mock controls">Mock · Alliance:
        <button type="button" data-set-alliance="DGF">DGF</button> | <button type="button" data-set-alliance="GIR">GIR</button>
      </div>`;

    const sel = $("lang");
    sel.innerHTML = HQ.languages.map(([code, label]) => `<option value="${code}" lang="${code}">${esc(label)}</option>`).join("");
    sel.addEventListener("change", () => HQ.setLanguage(sel.value));

    document.addEventListener("hq:alliance", e => {
      const a = e.detail;
      document.title = `${a.brand}${o.title ? ": " + o.title : ""}`;
      $("alliance-name").innerHTML = `<bdi>${esc(a.name)}</bdi>`;
      $("pennant-tag").textContent = a.tag;
      $("pennant").setAttribute("aria-label", `${a.tag} HQ`);
      const crop = pennantCrop[a.tag];
      Object.assign($("pennant-art").style, { backgroundImage: `url('${a.art[crop.art]}')`, backgroundSize: crop.size, backgroundPosition: crop.pos });
      $("foot-brand").textContent = a.brand;
      setMotto(document.documentElement.lang);
      document.querySelectorAll("[data-set-alliance]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.setAlliance === a.tag)));
      if (o.render) o.render(a);
    });
    document.addEventListener("hq:lang", e => {
      const { code, nav } = e.detail;
      document.querySelectorAll("[data-nav]").forEach(el => { el.textContent = nav[el.dataset.nav] || el.textContent; });
      sel.value = code;
      setMotto(code);
      if (o.lang) o.lang(code, nav);
    });
    document.addEventListener("click", e => {
      const soon = e.target.closest("[data-soon]");
      if (soon) {
        e.preventDefault();
        const msg = `${soon.dataset.soon}: coming in the full build.`;
        const row = soon.closest(".row");
        if (row) {
          let out = row.querySelector(".soon-row");
          if (!out) { out = document.createElement("span"); out.className = "soon-row"; out.setAttribute("role", "status"); row.querySelector(".what").append(out); }
          out.textContent = msg;
        } else {
          $("soon").textContent = msg;
          $("soon").scrollIntoView({ block: "nearest" });
        }
        return;
      }
      const sw = e.target.closest("[data-set-alliance]");
      if (sw) HQ.setAlliance(sw.dataset.setAlliance);
    });
    HQ.init();
  }

  function setMotto(code) {
    const a = HQ.alliances[HQ.currentAlliance()];
    $("motto").textContent = a.motto ? (HQ.motto[code] || a.motto) : "";
  }

  return { mount, esc };
})();
