// Parse amount and currency from URL and render summary
function getQuery() {
    const params = new URLSearchParams(window.location.search);
    return {
        amount: params.get("amount"),
        currency: params.get("currency") || "USD",
    };
}

// Dynamic Island (copied pattern from index)
function getIslandEl() { return document.getElementById("dynamicIsland"); }
function getIconSVG(type) {
    if (type === "success") {
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(22,163,74,0.25)"/><path d="M7 12.5l3 3 7-7" stroke="#16a34a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    if (type === "error") {
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(220,38,38,0.25)"/><path d="M8 8l8 8M16 8l-8 8" stroke="#dc2626" stroke-width="2.4" stroke-linecap="round"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(59,130,246,0.25)"/><path d="M7.5 12a3.5 3.5 0 015-5l1 1m2 4a3.5 3.5 0 01-5 5l-1-1" stroke="#3b82f6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function showIsland(type, title, desc, duration = 2400) {
    const el = getIslandEl();
    if (!el) return;
    const icon = el.querySelector(".island__icon");
    const t = el.querySelector(".island__title");
    const d = el.querySelector(".island__desc");

    el.classList.remove("island--success", "island--error", "island--info", "island--show");
    el.classList.add(`island--${type}`);
    icon.innerHTML = getIconSVG(type);
    t.textContent = title || "";
    d.textContent = desc || "";

    el.setAttribute("aria-hidden", "false");
    el.classList.add("island--show");

    clearTimeout(showIsland._timer);
    showIsland._timer = setTimeout(hideIsland, duration);
    el.onclick = hideIsland;
}
function hideIsland() {
    const el = getIslandEl();
    if (!el) return;
    el.classList.remove("island--show");
    el.setAttribute("aria-hidden", "true");
}

// Background animation (reuse same feel)
(function initAnimatedBackground() {
    const bgLayer = document.getElementById("bgLayer");
    if (!bgLayer) return;

    const COLORS = ["#0E21A0", "#4D2DB7", "#9D44C0", "#EC53B0", "#FFEF5F"];
    const NUM_CIRCLES = 19;

    const circles = [];
    const bounds = { width: window.innerWidth, height: window.innerHeight };

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function randInt(min, max) { return Math.floor(rand(min, max)); }

    function createCircle(i) {
        const color = COLORS[i % COLORS.length];
        const baseRadius = rand(220, Math.min(620, Math.max(bounds.width, bounds.height) * 1.9));
        const speed = rand(38, 226);
        const heading = rand(0, Math.PI * 2);
        const noiseFreq = rand(0.05, 0.18);
        const noisePhase = rand(0, Math.PI * 2);
        const breatheFreq = rand(0.08, 0.16);
        const breathePhase = rand(0, Math.PI * 5);
        const x = rand(0, bounds.width);
        const y = rand(0, bounds.height);
        const z = randInt(1, 5);

        const el = document.createElement("span");
        el.className = "circle";
        el.style.background = color;
        el.style.width = `${baseRadius * 2}px`;
        el.style.height = `${baseRadius * 2}px`;
        el.style.zIndex = String(z);

        bgLayer.appendChild(el);

        return { el, x, y, heading, speed, radius: baseRadius, noiseFreq, noisePhase, breatheFreq, breathePhase, age: 0, scale: 1 };
    }

    function updateBounds() {
        bounds.width = window.innerWidth;
        bounds.height = window.innerHeight;
    }

    function init() {
        updateBounds();
        for (let i = 0; i < NUM_CIRCLES; i++) {
            circles.push(createCircle(i));
        }
    }

    let lastTs = performance.now();

    function animate(ts) {
        const dt = (ts - lastTs) / 1000;
        lastTs = ts;

        for (const c of circles) {
            c.age += dt;
            const angleDrift = Math.sin(c.noisePhase + c.age * c.noiseFreq) * 0.12;
            c.heading += angleDrift * dt;

            c.x += Math.cos(c.heading) * c.speed * dt;
            c.y += Math.sin(c.heading) * c.speed * dt;

            if (c.x < -c.radius) c.x = bounds.width + c.radius;
            if (c.x > bounds.width + c.radius) c.x = -c.radius;
            if (c.y < -c.radius) c.y = bounds.height + c.radius;
            if (c.y > bounds.height + c.radius) c.y = -c.radius;

            const breathe = 1 + Math.sin(c.breathePhase + c.age * c.breatheFreq) * 0.055;
            c.el.style.transform = `translate(${c.x - c.radius}px, ${c.y - c.radius}px) scale(${breathe})`;
        }
        requestAnimationFrame(animate);
    }

    init();
    requestAnimationFrame(animate);
})();

// Simple validators
function luhnCheck(num) {
    const digits = String(num).replace(/\D+/g, "");
    let sum = 0, dbl = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let d = Number(digits[i]);
        if (dbl) { d *= 2; if (d > 9) d -= 9; }
        sum += d;
        dbl = !dbl;
    }
    return digits.length >= 12 && sum % 10 === 0;
}
// Add email field and enhance validation for expiry + email
function validExpiry(v) {
    const raw = String(v).trim();
    // Accept native month input (YYYY-MM)
    const monthFmt = raw.match(/^(\d{4})-(\d{2})$/);
    if (monthFmt) {
        const [, yearStr, monthStr] = monthFmt;
        const year = Number(yearStr);
        const month = Number(monthStr);
        if (month < 1 || month > 12) return false;
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth() + 1;
        if (year < curYear || (year === curYear && month < curMonth)) return false;
        return true;
    }
    // Fallback to MM/YY
    const match = raw.match(/^(\d{2})\s*\/\s*(\d{2,4})$/);
    if (!match) return false;
    let [_, mmStr, yyStr] = match;
    const mm = Number(mmStr);
    let yy = Number(yyStr);
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    const curYYYY = now.getFullYear();
    const curMM = now.getMonth() + 1;
    const fullYY = yyStr.length === 2 ? (2000 + yy) : yy;
    if (fullYY < curYYYY || (fullYY === curYYYY && mm < curMM)) return false;
    return true;
}

function validEmail(v) {
    const s = String(v).trim();
    // Simple, permissive email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// Bind inputs and helpers BEFORE use
const elName = document.getElementById("cardName");
const elNumber = document.getElementById("cardNumber");
const elExpiry = document.getElementById("cardExpiry");
const elCVC = document.getElementById("cardCVC");
const elEmail = document.getElementById("email");
const payBtn = document.getElementById("payBtn");
const statusEl = document.getElementById("status");

function nonEmpty(v) {
    return String(v).trim().length >= 2;
}
function validCVC(v) {
    const s = String(v).replace(/\D+/g, "");
    return s.length === 3 || s.length === 4;
}
function markError(el, hasError) {
    if (!el) return;
    el.classList.toggle("input--error", !!hasError);
}

function allValid() {
    return nonEmpty(elName.value)
        && luhnCheck(elNumber.value)
        && validExpiry(elExpiry.value)
        && validCVC(elCVC.value)
        && validEmail(elEmail.value);
}
function updatePayState() {
    payBtn.disabled = !allValid();
}
[elName, elNumber, elExpiry, elCVC, elEmail].forEach(el => el.addEventListener("input", () => {
    markError(el, false);
    updatePayState();
}));

// Handle Pay click
payBtn.addEventListener("click", async () => {
    const checks = [
        { el: elName,   ok: nonEmpty(elName.value),    msg: "Enter cardholder name" },
        { el: elNumber, ok: luhnCheck(elNumber.value), msg: "Invalid card number" },
        { el: elExpiry, ok: validExpiry(elExpiry.value), msg: "Invalid expiry (MM/YY)" },
        { el: elCVC,    ok: validCVC(elCVC.value),     msg: "Invalid CVC" },
        { el: elEmail,  ok: validEmail(elEmail.value), msg: "Invalid email address" },
    ];
    const bad = checks.find(c => !c.ok);
    if (bad) {
        markError(bad.el, true);
        setStatus(bad.msg, "err");
        showIsland("error", "Payment Error", bad.msg, 3000);
        bad.el.focus();
        return;
    }
    setStatus("Payment request accepted.", "ok");
    showIsland("success", "Payment Success", "The service will be available soon", 3200);
});
function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.classList.remove("status--ok", "status--err");
    if (type === "ok") statusEl.classList.add("status--ok");
    if (type === "err") statusEl.classList.add("status--err");
}

// On load: inject summary
// Populate header and charge summary from URL
(function initSummary() {
    const { amount, currency } = getQuery();
    console.log("the amount , " , amount , "the currency :" , currency);
    const sumEl = document.getElementById("orderSummary");
    const amtEl = document.getElementById("summaryAmount");
    const curEl = document.getElementById("summaryCurrency");

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
        sumEl.textContent = "Invalid amount in link";
        if (amtEl) amtEl.textContent = "—";
        if (curEl) curEl.textContent = "—";
        showIsland("error", "Invalid Link", "Amount is missing or invalid");
    } else {
        sumEl.textContent = `Pay ${amt.toFixed(2)} ${currency}`;
        if (amtEl) amtEl.textContent = amt.toFixed(2);
        if (curEl) curEl.textContent = currency || "USD";
    }
    updatePayState();
})();