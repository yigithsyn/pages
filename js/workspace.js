import { markdownToHtml } from "./markdown.bundle.js";

// Workspaces (pages): one visible at a time, each with its own orientation
const pagesHost = document.getElementById("pages");
const orientationButtons = document.querySelectorAll("[data-orientation]");
const prevPage = document.getElementById("prevPage");
const nextPage = document.getElementById("nextPage");
const pageCounter = document.getElementById("pageCounter");
const deletePageBtn = document.getElementById("deletePage");
const STATE_KEY = "workspaces";
const FORMAT_VERSION = 2;
const SUPPORTED_VERSIONS = [1, 2];
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

// Sessions: each one holds a full workspace state plus a name, all kept in localStorage
const SESSIONS_KEY = "sessions";
const sessionNameInput = document.getElementById("sessionName");
const sessionList = document.getElementById("sessionList");
let sessions = [];
let currentSessionId = null;

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const emptyState = () => ({ version: FORMAT_VERSION, current: 0, pages: [{ orientation: "portrait", boxes: [] }] });

function persistSessions() {
    try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify({ currentId: currentSessionId, sessions }));
    } catch { /* storage unavailable or full: keep working in memory */ }
}

function saveState() {
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    const state = getState();
    if (JSON.stringify(state) === JSON.stringify(session.state)) return;
    session.state = state;
    session.updated = Date.now();
    persistSessions();
    renderSessionList();
}

function renderSessionList() {
    const items = [...sessions].sort((a, b) => b.updated - a.updated).map(s => {
        const li = document.createElement("div");
        li.className = "list-group-item list-group-item-action d-flex align-items-center gap-3 session-item";
        li.classList.toggle("active", s.id === currentSessionId);
        li.tabIndex = 0;
        li.setAttribute("role", "button");
        li.title = s.name || "Untitled";
        const icon = document.createElement("i");
        icon.className = "bi bi-file-earmark-text";
        icon.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.className = "sidebar-label session-name flex-grow-1 text-truncate";
        label.textContent = s.name || "Untitled";
        const del = document.createElement("button");
        del.type = "button";
        del.className = "btn-text btn-icon sidebar-label session-delete";
        del.title = "Delete session";
        del.setAttribute("aria-label", "Delete session");
        del.innerHTML = '<i class="bi bi-trash" aria-hidden="true"></i>';
        del.addEventListener("click", e => {
            e.stopPropagation();
            deleteSession(s.id);
        });
        li.append(icon, label, del);
        li.addEventListener("click", () => switchSession(s.id));
        li.addEventListener("keydown", e => {
            if (e.target === li && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                switchSession(s.id);
            }
        });
        return li;
    });
    sessionList.replaceChildren(...items);
}

function activateSession(id) {
    const session = sessions.find(s => s.id === id);
    currentSessionId = id;
    sessionNameInput.value = session.name;
    applyState(session.state);
    renderSessionList();
}

function switchSession(id) {
    if (id === currentSessionId) return;
    saveState();
    activateSession(id);
}

export function newSession() {
    saveState();
    const session = { id: newId(), name: "", updated: Date.now(), state: emptyState() };
    sessions.push(session);
    activateSession(session.id);
    sessionNameInput.focus();
}

function deleteSession(id) {
    const session = sessions.find(s => s.id === id);
    if (!session || !confirm(`"${session.name || "Untitled"}" oturumu silinsin mi?`)) return;
    sessions = sessions.filter(s => s.id !== id);
    if (!sessions.length) sessions.push({ id: newId(), name: "", updated: Date.now(), state: emptyState() });
    if (id === currentSessionId) activateSession([...sessions].sort((a, b) => b.updated - a.updated)[0].id);
    else { persistSessions(); renderSessionList(); }
}

sessionNameInput.addEventListener("input", () => {
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    session.name = sessionNameInput.value.trim();
    session.updated = Date.now();
    persistSessions();
    renderSessionList();
});

function loadSessions() {
    try {
        const data = JSON.parse(localStorage.getItem(SESSIONS_KEY));
        if (Array.isArray(data?.sessions)) {
            sessions = data.sessions.filter(s => s && typeof s.id === "string" && SUPPORTED_VERSIONS.includes(s.state?.version) && Array.isArray(s.state.pages) && s.state.pages.length)
                .map(s => ({ id: s.id, name: typeof s.name === "string" ? s.name : "", updated: s.updated || 0, state: s.state }));
            if (sessions.length) return sessions.some(s => s.id === data.currentId) ? data.currentId : sessions[0].id;
        }
    } catch { /* corrupt data: start fresh */ }
    // Migrate the legacy single-workspace state, if any
    sessions = [{ id: newId(), name: "", updated: Date.now(), state: loadState() ?? emptyState() }];
    return sessions[0].id;
}

export function downloadJson() {
    const blob = new Blob([JSON.stringify({ ...getState(), name: sessionNameInput.value.trim() }, null, 2)], { type: "application/json" });
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
        if (SUPPORTED_VERSIONS.includes(state?.version) && Array.isArray(state.pages) && state.pages.length) return state;
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
        if (!SUPPORTED_VERSIONS.includes(state?.version)) throw new Error("unsupported version");
        if (!Array.isArray(state.pages) || !state.pages.length) throw new Error("invalid");
        applyState(state);
        // v2 files carry the session name; v1 files have none
        if (typeof state.name === "string") {
            sessionNameInput.value = state.name;
            sessionNameInput.dispatchEvent(new Event("input"));
        }
    } catch {
        alert("Geçersiz JSON dosyası veya desteklenmeyen sürüm: içe aktarılamadı.");
    }
});

activateSession(loadSessions());
