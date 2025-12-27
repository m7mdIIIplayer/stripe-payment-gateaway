const amountInput = document.getElementById("amount");
const createBtn = document.getElementById("createBtn");
const copyBtn = document.getElementById("copyBtn");
const linkOutput = document.getElementById("paymentLink");
const statusEl = document.getElementById("status");
const currencySelect = document.getElementById("currency");

let lastLink = "";
const URL = 'https://stripe-payment-gateaway.vercel.app/checkout.html';

// Dynamic Island helpers
function getIslandEl() {
    return document.getElementById("dynamicIsland");
}
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

    // Tap to dismiss
    el.onclick = hideIsland;
}
function hideIsland() {
    const el = getIslandEl();
    if (!el) return;
    el.classList.remove("island--show");
    el.setAttribute("aria-hidden", "true");
}

// Validation
function isValidAmount(value) {
    const n = parseFloat(value);
    return Number.isFinite(n) && n > 0;
}
function updateCreateButtonState() {
    const valid = isValidAmount(amountInput.value);
    createBtn.disabled = !valid || createBtn.classList.contains("btn--loading");
    const help = document.getElementById("amountHelp");
    if (!amountInput.value) {
        help.textContent = "";
    } else if (!valid) {
        help.textContent = "Enter a positive amount (e.g., 19.99).";
    } else {
        help.textContent = "";
    }
}
amountInput.addEventListener("input", updateCreateButtonState);

// Loading state
function setLoading(loading) {
    if (loading) {
        createBtn.classList.add("btn--loading");
        createBtn.textContent = "Creating...";
        createBtn.disabled = true;
    } else {
        createBtn.classList.remove("btn--loading");
        createBtn.textContent = "Create Payment Link";
        updateCreateButtonState();
    }
}

// Mock API call (replace with your real fetch later)
// Replace mockCreatePaymentLink to use the new URL (and include currency)
function mockCreatePaymentLink(amount, currency) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const ok = true;
            if (!ok) {
                reject(new Error("Failed to create payment link."));
                return;
            }
            const amt = Number(amount).toFixed(2);
            const link = `${URL}?amount=${encodeURIComponent(amt)}&currency=${encodeURIComponent(currency || 'USD')}`;
            resolve({ link });
        }, 1500);
    });
}

// Create handler
async function handleCreate() {
    const value = amountInput.value;
    if (!isValidAmount(value)) {
        setStatus("Please enter a valid positive amount.", "err");
        return;
    }
    setStatus("", "");
    setLoading(true);
    copyBtn.disabled = true;
    linkOutput.value = "";
    lastLink = "";

    try {
        // When you swap to the real API, include currency:
        // const res = await fetch("YOUR_API_ENDPOINT", {
        //   method: "POST",
        //   body: JSON.stringify({ amount: Number(value), currency })
        // });
        // const data = await res.json();

        const currency = currencySelect?.value || "USD";
        const { link } = await mockCreatePaymentLink(value, currency);

        lastLink = link;
        linkOutput.value = link;
        copyBtn.disabled = false;
        setStatus("Payment link created successfully.", "ok");
        showIsland("success", "Link Created", "Ready to copy");
    } catch (err) {
        setStatus(err?.message || "Something went wrong.", "err");
        showIsland("error", "Creation Failed", err?.message || "Please try again");
    } finally {
        setLoading(false);
    }
}

// Copy handler
async function handleCopy() {
    if (!lastLink) {
        setStatus("Create a link first.", "err");
        return;
    }
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(lastLink);
        } else {
            const temp = document.createElement("textarea");
            temp.value = lastLink;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand("copy");
            document.body.removeChild(temp);
        }
        setStatus("Link copied to clipboard.", "ok");
        showIsland("info", "Link Copied", "Paste anywhere");
    } catch {
        setStatus("Unable to copy link.", "err");
        showIsland("error", "Copy Failed", "Clipboard unavailable");
    }
}

function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.classList.remove("status--ok", "status--err");
    if (type === "ok") statusEl.classList.add("status--ok");
    if (type === "err") statusEl.classList.add("status--err");
}

// Wire up
createBtn.addEventListener("click", handleCreate);
copyBtn.addEventListener("click", handleCopy);

// Initialize
updateCreateButtonState();

// Top-level payment logic remains unchanged.
// Animated background circles: randomized properties, smooth motion, edge wrapping
(function initAnimatedBackground() {
    const bgLayer = document.getElementById("bgLayer");
    if (!bgLayer) return;

    const COLORS = ["#0E21A0", "#4D2DB7", "#9D44C0", "#EC53B0", "#FFEF5F"];
    const NUM_CIRCLES = 19; // Increase for denser flow; at least covers 5 base colors

    const circles = [];
    const bounds = { width: window.innerWidth, height: window.innerHeight };

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }
    function randInt(min, max) {
        return Math.floor(rand(min, max));
    }

    function createCircle(i) {
        // Ensure first 5 use the provided palette deterministically, then randomize
        const color = COLORS[i % COLORS.length];

        // Base radius favors large, soft blobs; tuned for blur=350px
        const baseRadius = rand(220, Math.min(620, Math.max(bounds.width, bounds.height) * 1.9));
        // Speed in px/sec for gentle motion
        const speed = rand(38, 226);
        // Random heading (direction), with slow drift parameters
        const heading = rand(0, Math.PI * 2);
        const noiseFreq = rand(0.05, 0.18); // slow angle drift
        const noisePhase = rand(0, Math.PI * 2);

        // Breathing (size oscillation) params
        const breatheFreq = rand(0.08, 0.16);
        const breathePhase = rand(0, Math.PI * 5);

        // Start position anywhere on screen
        const x = rand(0, bounds.width);
        const y = rand(0, bounds.height);

        const z = randInt(1, 5); // Layer depth 1..5 for subtle stacking

        const el = document.createElement("span");
        el.className = "circle";
        el.style.background = color;
        el.style.width = `${baseRadius * 2}px`;
        el.style.height = `${baseRadius * 2}px`;
        el.style.zIndex = String(z);

        bgLayer.appendChild(el);

        return {
            el,
            x,
            y,
            heading,
            speed,
            radius: baseRadius,
            noiseFreq,
            noisePhase,
            breatheFreq,
            breathePhase,
            age: 0,
            scale: 1
        };
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
        const dt = Math.min((ts - lastTs) / 1000, 0.05); // cap delta to avoid jumps
        lastTs = ts;

        for (const c of circles) {
            c.age += dt;

            // Gentle heading drift for organic trajectory
            const drift = Math.sin(c.age * c.noiseFreq + c.noisePhase) * 0.25; // radians/sec
            c.heading += drift * dt;

            // Velocity from heading and speed
            const vx = Math.cos(c.heading) * c.speed;
            const vy = Math.sin(c.heading) * c.speed;

            // Update position
            c.x += vx * dt;
            c.y += vy * dt;

            // Breathing scale for gradual size transitions
            c.scale = 0.85 + 0.35 * Math.sin(c.age * c.breatheFreq + c.breathePhase);

            const r = c.radius * c.scale;

            // Edge wrapping: seamless flow across all sides
            if (c.x - r > bounds.width) c.x = -r;
            if (c.x + r < 0) c.x = bounds.width + r;
            if (c.y - r > bounds.height) c.y = -r;
            if (c.y + r < 0) c.y = bounds.height + r;

            // Translate to center the circle at (x,y) and apply scale
            c.el.style.transform = `translate3d(${c.x - c.radius}px, ${c.y - c.radius}px, 0) scale(${c.scale})`;
        }

        requestAnimationFrame(animate);
    }

    window.addEventListener("resize", updateBounds);

    init();
    requestAnimationFrame(animate);
})();

// Wire up existing payment actions and init state
createBtn.addEventListener("click", handleCreate);
copyBtn.addEventListener("click", handleCopy);

// Initialize
updateCreateButtonState();

