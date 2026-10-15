import { markdownToHtml } from "./markdown.bundle.js";

// Workspaces (pages): one visible at a time, each with its own orientation
const pagesHost = document.getElementById("pages");
const orientationButtons = document.querySelectorAll("[data-orientation]");
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const pageCounter = document.getElementById("pageCounter");
const deletePageBtn = document.getElementById("deletePage");
const STATE_KEY = "workspaces";
const FORMAT_VERSION = 1;
const pages = [];
let current = 0;

function getState() {
    return {
        version: FORMAT_VERSION,
        current,
        pages: pages.map(p => ({
            orientation: p.classList.contains("landscape") ? "landscape" : "portrait",
            boxes: p.boxes.map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, text: b.text }))
        }))
    };
}

function saveState() {
    try {
        localStorage.setItem(STATE_KEY, JSON.stringify(getState()));
    } catch { /* storage unavailable or full: keep working in memory */ }
}

export function downloadJson() {
    const blob = new Blob([JSON.stringify(getState(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workspaces.json";
    a.click();
    URL.revokeObjectURL(url);
}

function loadState() {
    try {
        const state = JSON.parse(localStorage.getItem(STATE_KEY));
        if (state?.version === FORMAT_VERSION && Array.isArray(state.pages) && state.pages.length) return state;
    } catch { /* corrupt data: start fresh */ }
    return null;
}

export function setOrientation(orientation) {
    pages[current].classList.toggle("landscape", orientation === "landscape");
    renderOrientation();
    saveState();
}

function renderOrientation() {
    const orientation = pages[current].classList.contains("landscape") ? "landscape" : "portrait";
    orientationButtons.forEach(b => {
        const on = b.dataset.orientation === orientation;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on);
    });
}

function showPage(index) {
    current = index;
    pages.forEach((p, i) => p.hidden = i !== current);
    pageCounter.textContent = `${current + 1} / ${pages.length}`;
    prevPage.disabled = current === 0;
    nextPage.disabled = current === pages.length - 1;
    deletePageBtn.disabled = pages.length <= 1;
    pages.forEach((p, i) => p.setAttribute("aria-label", `Workspace ${i + 1}`));
    renderOrientation();
    saveState();
}

// Text boxes: geometry is stored as percentages of the page so it survives resizing/orientation changes
const pct = v => `${(v * 100).toFixed(3)}%`;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function createBox(page, data, edit) {
    const box = { x: 0, y: 0, w: 0.3, h: 0.12, text: "", ...data };
    const el = document.createElement("div");
    el.className = "text-box";
    page.boxes.push(box);
    page.append(el);

    const applyGeometry = () => {
        el.style.left = pct(box.x);
        el.style.top = pct(box.y);
        el.style.width = pct(box.w);
        el.style.height = pct(box.h);
    };
    // Pointer-drag helper shared by the resize and move handles; `update` gets the delta as a page fraction
    const makeDraggable = (handle, update) => {
        handle.addEventListener("pointerdown", e => {
            e.preventDefault(); // keep the textarea focused
            e.stopPropagation();
            handle.setPointerCapture(e.pointerId);
            const r = page.getBoundingClientRect();
            const start = { ...box }, sx = e.clientX, sy = e.clientY;
            const move = ev => {
                update(start, (ev.clientX - sx) / r.width, (ev.clientY - sy) / r.height);
                applyGeometry();
            };
            const up = () => {
                handle.removeEventListener("pointermove", move);
                handle.removeEventListener("pointerup", up);
                handle.removeEventListener("pointercancel", up);
                saveState();
            };
            handle.addEventListener("pointermove", move);
            handle.addEventListener("pointerup", up);
            handle.addEventListener("pointercancel", up);
        });
        handle.addEventListener("click", e => e.stopPropagation());
    };

    const handle = document.createElement("div");
    handle.className = "resize-handle";
    makeDraggable(handle, (s, dx, dy) => {
        box.w = clamp(s.w + dx, 0.05, 1 - box.x);
        box.h = clamp(s.h + dy, 0.03, 1 - box.y);
    });

    const mover = document.createElement("div");
    mover.className = "move-handle";
    mover.title = "Drag to move";
    mover.innerHTML = '<i class="bi bi-arrows-move" aria-hidden="true"></i>';
    makeDraggable(mover, (s, dx, dy) => {
        box.x = clamp(s.x + dx, 0, 1 - box.w);
        box.y = clamp(s.y + dy, 0, 1 - box.h);
    });

    function remove() {
        page.boxes.splice(page.boxes.indexOf(box), 1);
        el.remove();
        saveState();
    }

    function render() {
        el.classList.remove("editing");
        if (!box.text.trim()) return remove();
        const view = document.createElement("div");
        view.className = "rendered";
        view.innerHTML = markdownToHtml(box.text);
        el.replaceChildren(view, mover, handle);
        el.title = "Click to edit";
        saveState();
    }

    function editBox() {
        const ta = document.createElement("textarea");
        ta.value = box.text;
        ta.setAttribute("aria-label", "Markdown text");
        ta.placeholder = "Markdown…";
        el.classList.add("editing");
        el.title = "";
        el.replaceChildren(ta, mover, handle);
        ta.focus();
        ta.addEventListener("blur", () => {
            box.text = ta.value;
            render();
        });
        ta.addEventListener("keydown", e => { if (e.key === "Escape") ta.blur(); });
    }

    el.addEventListener("click", e => {
        e.stopPropagation();
        if (!el.classList.contains("editing") && !e.target.closest("a")) editBox();
    });

    applyGeometry();
    if (edit) editBox(); else render();
}

function createPage(orientation, boxes = []) {
    const page = document.createElement("div");
    page.className = "paper bg-body border";
    page.classList.toggle("landscape", orientation === "landscape");
    page.setAttribute("role", "region");
    page.setAttribute("aria-label", `Workspace ${pages.length + 1}`);
    page.boxes = [];
    // Clicking an empty spot opens a text box there
    page.addEventListener("click", e => {
        if (e.target !== page) return;
        const r = page.getBoundingClientRect();
        const w = 0.3, h = 0.12;
        createBox(page, {
            x: clamp((e.clientX - r.left) / r.width, 0, 1 - w),
            y: clamp((e.clientY - r.top) / r.height, 0, 1 - h),
            w, h
        }, true);
    });
    pagesHost.append(page);
    pages.push(page);
    if (Array.isArray(boxes)) boxes.forEach(b => b && typeof b.text === "string" && createBox(page, b, false));
}

export function addPage() {
    // New workspaces start with the current orientation
    createPage(pages[current]?.classList.contains("landscape") ? "landscape" : "portrait");
    showPage(pages.length - 1);
}

prevPage.addEventListener("click", () => showPage(current - 1));
nextPage.addEventListener("click", () => showPage(current + 1));
// Bootstrap's layered [hidden] rule beats any author style, so reveal every page while printing
addEventListener("beforeprint", () => pages.forEach(p => p.hidden = false));
addEventListener("afterprint", () => pages.forEach((p, i) => p.hidden = i !== current));
deletePageBtn.addEventListener("click", () => {
    if (pages.length <= 1 || !confirm(`Workspace ${current + 1} silinsin mi?`)) return;
    pages.splice(current, 1)[0].remove();
    showPage(Math.min(current, pages.length - 1));
});

function applyState(state) {
    pages.forEach(p => p.remove());
    pages.length = 0;
    state.pages.forEach(p => createPage(p?.orientation, p?.boxes));
    showPage(Math.min(Math.max(Number.isInteger(state.current) ? state.current : 0, 0), pages.length - 1));
}
const importInput = document.getElementById("importFile");
export function openImport() {
    importInput.click();
}

export function printPages() {
    window.print();
}

importInput.addEventListener("change", async () => {
    const file = importInput.files[0];
    importInput.value = "";
    if (!file) return;
    try {
        const state = JSON.parse(await file.text());
        if (state?.version !== FORMAT_VERSION) throw new Error("unsupported version");
        if (!Array.isArray(state.pages) || !state.pages.length) throw new Error("invalid");
        applyState(state);
    } catch {
        alert("Geçersiz JSON dosyası veya desteklenmeyen sürüm: içe aktarılamadı.");
    }
});

const saved = loadState();
if (saved) {
    applyState(saved);
} else {
    addPage();
}
