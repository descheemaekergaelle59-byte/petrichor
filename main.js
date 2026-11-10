/* ==========================================================
   petrichor · landingspagina
   ========================================================== */

/* ----------------------------------------------------------
   MAILERLITE (manier A)
   Plak hier de action-URL uit je MailerLite-embedcode.
   Zoek in de embedcode naar:  <form action="https://assets.mailerlite.com/jsonp/....../subscribe"
   en kopieer alles tussen de aanhalingstekens.
   Zolang dit leeg is, toont het formulier enkel het bedankbericht (demo).
   ---------------------------------------------------------- */
const MAILERLITE_ACTION = "";

document.documentElement.classList.add("js");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Navigatie krijgt een achtergrond zodra je scrolt */
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* Secties zacht laten verschijnen */
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("is-visible"));
}

/* "Kies als staaltje" vult de keuze in het formulier in */
document.querySelectorAll("[data-geur]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const radio = document.querySelector(`input[name="fields[geur]"][value="${btn.dataset.geur}"]`);
    if (radio) radio.checked = true;
    document.getElementById("staaltje").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    setTimeout(() => document.getElementById("f-naam")?.focus({ preventScroll: true }), reduceMotion ? 0 : 700);
  });
});

/* Formulier */
const form = document.getElementById("staaltje-form");
if (form) {
  const errorBox = form.querySelector(".form__error");
  const thanks = document.getElementById("staaltje-bedankt");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const naam = form.querySelector("#f-naam");
    const email = form.querySelector("#f-email");
    const optin = form.querySelector('input[type="checkbox"]');
    let msg = "";

    [naam, email].forEach((i) => i.removeAttribute("aria-invalid"));
    if (!naam.value.trim()) { msg = "Vul je voornaam in."; naam.setAttribute("aria-invalid", "true"); }
    else if (!email.validity.valid || !email.value) { msg = "Vul een geldig e-mailadres in."; email.setAttribute("aria-invalid", "true"); }
    else if (!optin.checked) { msg = "Vink het vakje aan, dan mogen we je mailen."; }

    if (msg) { errorBox.textContent = msg; errorBox.hidden = false; return; }
    errorBox.hidden = true;

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Even geduld";

    if (MAILERLITE_ACTION) {
      try {
        await fetch(MAILERLITE_ACTION, { method: "POST", body: new FormData(form), mode: "no-cors" });
      } catch (err) {
        errorBox.textContent = "Er ging iets mis. Probeer het zo meteen opnieuw.";
        errorBox.hidden = false;
        button.disabled = false;
        button.textContent = "Schrijf me in";
        return;
      }
    }

    form.hidden = true;
    thanks.hidden = false;
    thanks.focus();
  });
}

/* Regen: trage druppels die over het 'glas' van de hero glijden */
const canvas = document.querySelector(".hero__rain");
if (canvas && !reduceMotion) {
  const ctx = canvas.getContext("2d");
  let w, h, dpr, drops = [];

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round((w * h) / 26000);
    drops = Array.from({ length: count }, () => newDrop(true));
  };
  const newDrop = (anywhere) => ({
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : -10,
    r: 1 + Math.random() * 2.6,
    v: 0.15 + Math.random() * 0.55,
    trail: []
  });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const tick = () => {
    if (visible) {
      ctx.clearRect(0, 0, w, h);
      drops.forEach((d, i) => {
        d.y += d.v * (d.r / 1.6);
        d.x += Math.sin(d.y / 40) * 0.08;
        d.trail.push([d.x, d.y]);
        if (d.trail.length > 26) d.trail.shift();

        // spoor
        ctx.beginPath();
        d.trail.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.strokeStyle = "rgba(255,255,255,.18)";
        ctx.lineWidth = d.r * 0.7;
        ctx.lineCap = "round";
        ctx.stroke();

        // druppel
        const g = ctx.createRadialGradient(d.x - d.r * .3, d.y - d.r * .4, 0, d.x, d.y, d.r * 1.4);
        g.addColorStop(0, "rgba(255,255,255,.95)");
        g.addColorStop(.5, "rgba(246,245,249,.45)");
        g.addColorStop(1, "rgba(116,83,162,.12)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 1.4, 0, Math.PI * 2); ctx.fill();

        if (d.y > h + 20) drops[i] = newDrop(false);
      });
    }
    requestAnimationFrame(tick);
  };

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(tick);
}
