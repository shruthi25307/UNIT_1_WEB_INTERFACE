/* ============================================================
   State
   ============================================================ */

let notes    = JSON.parse(localStorage.getItem("nw_notes"))   || [];
let folders  = JSON.parse(localStorage.getItem("nw_folders")) || [];
let settings = JSON.parse(localStorage.getItem("nw_settings")) || {
  theme: "light",
  defaultBackground: "color:default",
  density: "comfortable",
  notifications: true,
  profile: { name: "Your name", email: "", bio: "", avatar: "", memberSince: Date.now() }
};
if(!settings.profile) settings.profile = { name:"Your name", email:"", bio:"", avatar:"", memberSince: Date.now() };
if(!settings.profile.memberSince) settings.profile.memberSince = Date.now();
if(!settings.defaultBackground) settings.defaultBackground = "color:default";
if(settings.notifications === undefined) settings.notifications = true;

let checklistDraft = [];
let runningTimers  = {};

const FOLDER_COLORS = ["#d9822b","#3a6b5c","#c0503a","#5a67d8","#8854d0","#20b09c","#c2a83e"];

const BG_COLORS   = ["default","coral","peach","sand","sage","fog","storm","dusk","blossom"];
const BG_PATTERNS = ["grid","dots","stripes","waves","confetti","marble"];

function save(){
  localStorage.setItem("nw_notes", JSON.stringify(notes));
  localStorage.setItem("nw_folders", JSON.stringify(folders));
  localStorage.setItem("nw_settings", JSON.stringify(settings));
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

function escapeHtml(str){
  return (str||"").replace(/[&<>"']/g, m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

/* ============================================================
   Icons
   ============================================================ */

const ICONS = {
  all:      '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M4 10h16M10 10v10"/></svg>',
  pinned:   '<svg viewBox="0 0 24 24"><path d="M12 2l1.8 5.6H20l-4.6 3.4 1.8 5.6L12 13.2 6.8 16.6l1.8-5.6L4 7.6h6.2z"/></svg>',
  checklist:'<svg viewBox="0 0 24 24"><path d="M4 6h4M4 12h4M4 18h4"/><path d="M11 6h9M11 12h9M11 18h9"/></svg>',
  timer:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>',
  archive:  '<svg viewBox="0 0 24 24"><path d="M3 4h18v4H3z"/><path d="M5 8v12h14V8M10 12h4"/></svg>',
  trash:    '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
  menu:     '<svg viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  search:   '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  theme:    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>',
  edit:     '<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
  restore:  '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 109-9M3 4v8h8"/></svg>',
};

/* ============================================================
   Page config
   ============================================================ */

const NAV_ITEMS = [
  { id:"home",       href:"index.html",       label:"All notes",    icon:ICONS.all },
  { id:"pinned",     href:"pinned.html",      label:"Pinned",       icon:ICONS.pinned },
  { id:"checklists", href:"checklists.html",  label:"Checklists",   icon:ICONS.checklist },
  { id:"timers",     href:"timers.html",      label:"Study timers", icon:ICONS.timer },
  { id:"archive",    href:"archive.html",     label:"Archive",      icon:ICONS.archive },
  { id:"trash",      href:"trash.html",       label:"Trash",        icon:ICONS.trash },
];

const PAGE_TITLES = {
  home:"All notes", pinned:"Pinned", checklists:"Checklists",
  timers:"Study timers", archive:"Archive", trash:"Trash", folder:"Folder"
};

const LIST_PAGES = ["home","pinned","checklists","timers","archive","trash","folder"];

/* ============================================================
   Theme
   ============================================================ */

function applyTheme(){
  let effective = settings.theme;
  if(effective === "auto"){
    effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", effective);
  document.querySelectorAll("#themeSegmented button").forEach(b=>{
    b.classList.toggle("active", b.dataset.theme === settings.theme);
  });
}

/* ============================================================
   Sidebar
   ============================================================ */

function counts(){
  const active = notes.filter(n=>!n.trashed && !n.archived);
  return {
    pinned: active.filter(n=>n.pinned).length,
    checklist: active.filter(n=>n.type==="checklist").length,
    timer: active.filter(n=>n.type==="timer").length,
    archive: notes.filter(n=>n.archived && !n.trashed).length,
    trash: notes.filter(n=>n.trashed).length,
  };
}

function renderSidebar(activePage){
  const params = new URLSearchParams(location.search);
  const activeFolderId = activePage === "folder" ? params.get("id") : null;
  const c = counts();
  const badgeFor = { pinned:c.pinned, checklists:c.checklist, timers:c.timer, archive:c.archive, trash:c.trash };

  const navHtml = NAV_ITEMS.map(item=>{
    const badge = badgeFor[item.id];
    return `
      <a class="nav-item ${activePage===item.id ? "active":""}" href="${item.href}">
        ${item.icon}
        <span>${item.label}</span>
        ${badge ? `<span class="nav-badge">${badge}</span>` : ""}
      </a>`;
  }).join("");

  const foldersHtml = folders.length ? folders.map(f=>`
    <div class="folder-item">
      <a class="nav-item ${activePage==="folder" && activeFolderId===f.id ? "active":""}" href="folder.html?id=${f.id}">
        <span class="folder-dot" style="background:${f.color}"></span>
        <span>${escapeHtml(f.name)}</span>
      </a>
      <button class="folder-remove" data-remove-folder="${f.id}" title="Delete folder">✕</button>
    </div>
  `).join("") : `<p class="folders-empty">No folders yet</p>`;

  const initials = (settings.profile.name || "A").trim().charAt(0).toUpperCase();
  const avatarHtml = settings.profile.avatar
    ? `<img src="${settings.profile.avatar}" alt="">`
    : initials;

  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = `
    <a class="brand" href="index.html">
      <span class="brand-mark">N</span>
      <span class="brand-name">Notewell</span>
    </a>

    <nav class="nav-group">${navHtml}</nav>

    <div class="nav-divider"></div>

    <div class="folders-head">
      <span>Folders</span>
      <button id="newFolderBtn" title="New folder">+</button>
    </div>
    <nav class="nav-group folders-list" id="foldersList">${foldersHtml}</nav>

    <div class="sidebar-bottom">
      <a class="nav-item ${activePage==="settings" ? "active":""}" href="settings.html">
        ${ICONS.settings}
        <span>Settings</span>
      </a>
      <a class="profile-chip ${activePage==="profile" ? "active":""}" href="profile.html">
        <span class="avatar">${avatarHtml}</span>
        <span class="profile-info">
          <strong>${escapeHtml(settings.profile.name || "Your name")}</strong>
          <small>View profile</small>
        </span>
      </a>
    </div>
  `;

  sidebar.querySelectorAll("[data-remove-folder]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      e.preventDefault(); e.stopPropagation();
      const id = btn.dataset.removeFolder;
      if(!confirm("Delete this folder? Notes inside will become unfiled.")) return;
      folders = folders.filter(f=>f.id !== id);
      notes.forEach(n=>{ if(n.folder === id) n.folder = ""; });
      save();
      if(activePage === "folder" && activeFolderId === id){
        location.href = "index.html";
      } else {
        renderSidebar(activePage);
      }
    });
  });

  document.getElementById("newFolderBtn").addEventListener("click", openFolderModal);
}

/* ============================================================
   Topbar
   ============================================================ */

function renderTopbar(activePage){
  const showSearch = LIST_PAGES.includes(activePage);
  const title = activePage === "settings" ? "Settings" : activePage === "profile" ? "Profile" : (PAGE_TITLES[activePage] || "");

  const topbar = document.getElementById("topbar");
  topbar.innerHTML = `
    <button class="icon-btn only-mobile" id="menuToggle" aria-label="Menu">${ICONS.menu}</button>
    ${showSearch ? `
      <div class="search-wrap">
        ${ICONS.search}
        <input type="text" id="search" placeholder="Search notes...">
      </div>
    ` : `<h1 class="topbar-title">${title}</h1>`}
    <button class="icon-btn" id="themeToggle" title="Toggle theme">${ICONS.theme}</button>
  `;

  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  document.getElementById("menuToggle").addEventListener("click", ()=>{
    sidebar.classList.add("open");
    overlay.classList.add("show");
  });
  overlay.addEventListener("click", ()=>{
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });

  document.getElementById("themeToggle").addEventListener("click", ()=>{
    const order = ["light","dark","auto"];
    settings.theme = order[(order.indexOf(settings.theme)+1) % order.length];
    save(); applyTheme();
  });
}

/* ============================================================
   Background picker (shared by composer + edit modal + settings)
   ============================================================ */

function bgPopoverInner(){
  return `
    <div class="bg-popover-label">Colors</div>
    <div class="bg-swatch-grid">
      ${BG_COLORS.map(c=>`<button type="button" class="bg-swatch" data-c="${c}" title="${c}"></button>`).join("")}
    </div>
    <div class="bg-popover-label">Backgrounds</div>
    <div class="bg-swatch-grid">
      ${BG_PATTERNS.map(p=>`<button type="button" class="bg-swatch" data-p="${p}" title="${p}"></button>`).join("")}
    </div>
  `;
}

function createBgPicker(container, initial, onChange){
  container.innerHTML = `
    <button type="button" class="bg-trigger" title="Background"></button>
    <div class="bg-popover">${bgPopoverInner()}</div>
  `;
  const trigger = container.querySelector(".bg-trigger");
  const popover = container.querySelector(".bg-popover");
  let current = initial || "color:default";

  function paintTrigger(){
    trigger.removeAttribute("data-bg-color");
    trigger.removeAttribute("data-bg-pattern");
    const [type, val] = current.split(":");
    if(type === "color") trigger.dataset.bgColor = val;
    else trigger.dataset.bgPattern = val;
  }
  function paintSwatches(){
    popover.querySelectorAll(".bg-swatch").forEach(sw=>{
      const match = (sw.dataset.c && current === `color:${sw.dataset.c}`) ||
                    (sw.dataset.p && current === `pattern:${sw.dataset.p}`);
      sw.classList.toggle("active", match);
    });
  }

  trigger.addEventListener("click", (e)=>{
    e.stopPropagation();
    document.querySelectorAll(".bg-popover.show").forEach(p=>{ if(p!==popover) p.classList.remove("show"); });
    popover.classList.toggle("show");
  });
  document.addEventListener("click", (e)=>{
    if(!container.contains(e.target)) popover.classList.remove("show");
  });
  popover.querySelectorAll(".bg-swatch").forEach(sw=>{
    sw.addEventListener("click", ()=>{
      current = sw.dataset.c ? `color:${sw.dataset.c}` : `pattern:${sw.dataset.p}`;
      paintTrigger(); paintSwatches();
      onChange(current);
      popover.classList.remove("show");
    });
  });

  paintTrigger(); paintSwatches();
  return {
    get: ()=>current,
    set: (v)=>{ current = v || "color:default"; paintTrigger(); paintSwatches(); }
  };
}

function applyBgToElement(el, bgString){
  el.removeAttribute("data-bg-color");
  el.removeAttribute("data-bg-pattern");
  if(!bgString) return;
  const [type, val] = bgString.split(":");
  if(type === "color" && val !== "default") el.dataset.bgColor = val;
  if(type === "pattern") el.dataset.bgPattern = val;
}

/* ============================================================
   Folder modal (shared, injected once, present on every page)
   ============================================================ */

function injectFolderModal(){
  if(document.getElementById("folderBackdrop")) return;
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="modal-backdrop" id="folderBackdrop">
      <div class="modal">
        <h2>New folder</h2>
        <label class="field-label">Folder name</label>
        <input type="text" id="folderName" placeholder="e.g. Physics revision">
        <label class="field-label">Color</label>
        <div class="dot-picker" id="folderDotPicker"></div>
        <div class="modal-actions">
          <button class="btn-ghost" id="closeFolder">Cancel</button>
          <button class="btn-primary" id="saveFolder">Create</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div.firstElementChild);

  document.getElementById("closeFolder").addEventListener("click", closeFolderModal);
  document.getElementById("folderBackdrop").addEventListener("click", (e)=>{
    if(e.target.id === "folderBackdrop") closeFolderModal();
  });
  document.getElementById("saveFolder").addEventListener("click", ()=>{
    const name = document.getElementById("folderName").value.trim();
    if(!name) return;
    const color = document.querySelector("#folderDotPicker button.active")?.dataset.color || FOLDER_COLORS[0];
    folders.push({ id: uid(), name, color });
    save();
    closeFolderModal();
    renderSidebar(document.body.dataset.page);
    const sel = document.getElementById("cFolder");
    if(sel) populateFolderSelect(sel);
  });
}

let pickedFolderColor = FOLDER_COLORS[0];
function openFolderModal(){
  document.getElementById("folderName").value = "";
  pickedFolderColor = FOLDER_COLORS[folders.length % FOLDER_COLORS.length];
  const wrap = document.getElementById("folderDotPicker");
  wrap.innerHTML = "";
  FOLDER_COLORS.forEach(c=>{
    const b = document.createElement("button");
    b.type = "button";
    b.style.background = c;
    b.dataset.color = c;
    b.className = c === pickedFolderColor ? "active" : "";
    b.addEventListener("click", ()=>{
      wrap.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
    });
    wrap.appendChild(b);
  });
  document.getElementById("folderBackdrop").classList.add("show");
}
function closeFolderModal(){
  document.getElementById("folderBackdrop").classList.remove("show");
}

function populateFolderSelect(sel){
  const currentVal = sel.value;
  sel.innerHTML = '<option value="">No folder</option>' +
    folders.map(f=>`<option value="${f.id}">${escapeHtml(f.name)}</option>`).join("");
  sel.value = currentVal;
}

/* ============================================================
   Edit modal (injected on list pages)
   ============================================================ */

function injectEditModal(){
  if(document.getElementById("editModalBackdrop")) return;
  const div = document.createElement("div");
  div.innerHTML = `<div class="modal-backdrop" id="editModalBackdrop"><div class="modal" id="editModal"></div></div>`;
  document.body.appendChild(div.firstElementChild);
  document.getElementById("editModalBackdrop").addEventListener("click", (e)=>{
    if(e.target.id === "editModalBackdrop") closeEditModal();
  });
}

function openEditModal(note, refreshFn){
  const backdrop = document.getElementById("editModalBackdrop");
  const modal = document.getElementById("editModal");

  let fieldsHtml = "";
  if(note.type === "text"){
    fieldsHtml = `<textarea id="editContent" style="min-height:120px;border:1px solid var(--border);border-radius:8px;padding:10px;width:100%;background:var(--paper);">${escapeHtml(note.content||"")}</textarea>`;
  } else if(note.type === "checklist"){
    fieldsHtml = `<div id="editCheckRows" class="check-rows"></div><button type="button" class="add-item-btn" id="editAddRow">+ Add item</button>`;
  } else if(note.type === "timer"){
    fieldsHtml = `
      <label class="field-label">Session length (minutes)</label>
      <input type="number" id="editDuration" min="1" max="180" value="${Math.round(note.duration/60)}">
    `;
  }

  modal.innerHTML = `
    <h2>Edit note</h2>
    <label class="field-label">Title</label>
    <input type="text" id="editTitle" value="${escapeHtml(note.title||"")}">
    <div style="margin-top:14px;">${fieldsHtml}</div>
    <label class="field-label">Folder</label>
    <select id="editFolder"><option value="">No folder</option>${folders.map(f=>`<option value="${f.id}" ${f.id===note.folder?"selected":""}>${escapeHtml(f.name)}</option>`).join("")}</select>
    <label class="field-label">Background</label>
    <div id="editBgPicker" style="position:relative;display:inline-block;"></div>
    <div class="modal-actions">
      <button class="btn-ghost" id="cancelEdit">Cancel</button>
      <button class="btn-primary" id="saveEdit">Save</button>
    </div>
  `;

  const bgPicker = createBgPicker(document.getElementById("editBgPicker"), note.background, ()=>{});

  let editDraft = note.type === "checklist" ? note.items.map(i=>({...i})) : null;
  if(note.type === "checklist"){
    const renderEditRows = ()=>{
      const wrap = document.getElementById("editCheckRows");
      wrap.innerHTML = "";
      editDraft.forEach(row=>{
        const r = document.createElement("div");
        r.className = "check-row";
        r.innerHTML = `
          <input type="checkbox" ${row.done ? "checked":""}>
          <input type="text" value="${escapeHtml(row.text)}">
          <button type="button" class="remove-row">✕</button>
        `;
        const [chk, txt, del] = r.querySelectorAll("input, button");
        chk.addEventListener("change", ()=> row.done = chk.checked);
        txt.addEventListener("input", ()=> row.text = txt.value);
        del.addEventListener("click", ()=>{
          editDraft = editDraft.filter(x=>x.id !== row.id);
          renderEditRows();
        });
        wrap.appendChild(r);
      });
    };
    renderEditRows();
    document.getElementById("editAddRow").addEventListener("click", ()=>{
      editDraft.push({ id: uid(), text:"", done:false });
      renderEditRows();
    });
  }

  document.getElementById("cancelEdit").addEventListener("click", closeEditModal);
  document.getElementById("saveEdit").addEventListener("click", ()=>{
    note.title = document.getElementById("editTitle").value.trim();
    note.folder = document.getElementById("editFolder").value;
    note.background = bgPicker.get();

    if(note.type === "text"){
      note.content = document.getElementById("editContent").value.trim();
    } else if(note.type === "checklist"){
      note.items = editDraft.filter(r=>r.text.trim() !== "");
    } else if(note.type === "timer"){
      const mins = Math.max(1, parseInt(document.getElementById("editDuration").value)||25);
      note.duration = mins*60;
      if(!note.running){ note.remaining = mins*60; note.completed = false; }
    }

    save(); closeEditModal(); refreshFn();
  });

  backdrop.classList.add("show");
}
function closeEditModal(){
  document.getElementById("editModalBackdrop").classList.remove("show");
}

/* ============================================================
   List pages (home / pinned / checklists / timers / archive / trash / folder)
   ============================================================ */

function renderListPage(page){
  const params = new URLSearchParams(location.search);
  const folderId = page === "folder" ? params.get("id") : null;
  const folderObj = folderId ? folders.find(f=>f.id===folderId) : null;
  const pageTitle = page === "folder" ? (folderObj ? folderObj.name : "Folder") : PAGE_TITLES[page];

  const content = document.getElementById("pageContent");
  content.innerHTML = `
    ${page === "home" ? composerHtml() : `<h1 class="page-title">${escapeHtml(pageTitle)}</h1>`}
    <section id="notes-container" class="notes-grid"></section>
    <p class="empty-state" id="emptyState">Nothing here yet.</p>
  `;

  if(page === "home") wireComposer();

  const search = document.getElementById("search");
  const refresh = ()=>renderNotesGrid(page, folderId);
  if(search) search.addEventListener("input", refresh);

  refresh();
}

function composerHtml(){
  return `
    <section class="composer" id="composer">
      <div class="composer-tabs">
        <button type="button" class="tab active" data-type="text">Note</button>
        <button type="button" class="tab" data-type="checklist">Checklist</button>
        <button type="button" class="tab" data-type="timer">Study timer</button>
      </div>

      <input type="text" id="cTitle" placeholder="Title" class="composer-title">

      <textarea id="cContent" placeholder="Take a note..." class="composer-field field-text active"></textarea>

      <div class="composer-field field-checklist">
        <div class="check-rows" id="checkRows"></div>
        <button type="button" class="add-item-btn" id="addCheckRow">+ Add item</button>
      </div>

      <div class="composer-field field-timer">
        <label class="timer-label">Session length (minutes)</label>
        <input type="number" id="cDuration" min="1" max="180" value="25">
      </div>

      <div class="composer-row">
        <div class="composer-options">
          <div id="cBgPicker" style="position:relative;"></div>
          <select id="cFolder"></select>
        </div>
        <div class="composer-actions">
          <button type="button" class="btn-ghost" id="cancelComposer">Cancel</button>
          <button type="button" class="btn-primary" id="addNoteBtn">Add</button>
        </div>
      </div>
    </section>
  `;
}

function wireComposer(){
  let currentType = "text";
  checklistDraft = [];

  document.querySelectorAll(".tab").forEach(tab=>{
    tab.addEventListener("click", ()=>{
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");
      currentType = tab.dataset.type;
      document.querySelectorAll(".composer-field").forEach(f=>f.classList.remove("active"));
      document.querySelector(`.field-${currentType}`).classList.add("active");
      if(currentType === "checklist" && checklistDraft.length === 0) addCheckRow();
    });
  });

  document.getElementById("addCheckRow").addEventListener("click", ()=>addCheckRow());
  function addCheckRow(text=""){
    checklistDraft.push({ id: uid(), text, done:false });
    renderCheckRows();
  }
  function renderCheckRows(){
    const wrap = document.getElementById("checkRows");
    wrap.innerHTML = "";
    checklistDraft.forEach(row=>{
      const r = document.createElement("div");
      r.className = "check-row";
      r.innerHTML = `
        <input type="checkbox" ${row.done ? "checked":""}>
        <input type="text" placeholder="List item" value="${escapeHtml(row.text)}">
        <button type="button" class="remove-row">✕</button>
      `;
      const [chk, txt, del] = r.querySelectorAll("input, button");
      chk.addEventListener("change", ()=> row.done = chk.checked);
      txt.addEventListener("input", ()=> row.text = txt.value);
      del.addEventListener("click", ()=>{
        checklistDraft = checklistDraft.filter(x=>x.id !== row.id);
        renderCheckRows();
      });
      wrap.appendChild(r);
    });
  }

  const bgPicker = createBgPicker(document.getElementById("cBgPicker"), settings.defaultBackground, ()=>{});
  populateFolderSelect(document.getElementById("cFolder"));

  function resetComposer(){
    document.getElementById("cTitle").value = "";
    document.getElementById("cContent").value = "";
    document.getElementById("cDuration").value = 25;
    document.getElementById("cFolder").value = "";
    bgPicker.set(settings.defaultBackground);
    checklistDraft = [];
    renderCheckRows();
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.querySelector('.tab[data-type="text"]').classList.add("active");
    document.querySelectorAll(".composer-field").forEach(f=>f.classList.remove("active"));
    document.querySelector(".field-text").classList.add("active");
    currentType = "text";
  }

  document.getElementById("cancelComposer").addEventListener("click", resetComposer);

  document.getElementById("addNoteBtn").addEventListener("click", ()=>{
    const title = document.getElementById("cTitle").value.trim();
    const folder = document.getElementById("cFolder").value;
    const background = bgPicker.get();

    let note = { id: uid(), type: currentType, title, background, folder,
                 pinned:false, archived:false, trashed:false, createdAt: Date.now() };

    if(currentType === "text"){
      const content = document.getElementById("cContent").value.trim();
      if(!title && !content) return;
      note.content = content;
    } else if(currentType === "checklist"){
      const items = checklistDraft.filter(r=>r.text.trim() !== "");
      if(!title && items.length === 0) return;
      note.items = items;
    } else if(currentType === "timer"){
      const mins = Math.max(1, parseInt(document.getElementById("cDuration").value) || 25);
      if(!title) note.title = "Study session";
      note.duration = mins * 60;
      note.remaining = mins * 60;
      note.running = false;
      note.completed = false;
    }

    notes.unshift(note);
    save();
    resetComposer();
    renderSidebar("home");
    renderNotesGrid("home", null);
  });
}

function matchesQuery(n, q){
  if(!q) return true;
  const hay = (n.title + " " + (n.content||"") + " " + (n.items||[]).map(i=>i.text).join(" ")).toLowerCase();
  return hay.includes(q);
}

function getFilteredNotes(page, folderId){
  const searchEl = document.getElementById("search");
  const q = searchEl ? searchEl.value.toLowerCase() : "";

  return notes.filter(n=>{
    if(page === "trash") return n.trashed && matchesQuery(n,q);
    if(n.trashed) return false;

    if(page === "archive"){ if(!n.archived) return false; }
    else { if(n.archived) return false; }

    if(page === "pinned" && !n.pinned) return false;
    if(page === "checklists" && n.type !== "checklist") return false;
    if(page === "timers" && n.type !== "timer") return false;
    if(page === "folder" && n.folder !== folderId) return false;

    return matchesQuery(n,q);
  }).sort((a,b)=> (b.pinned - a.pinned) || (b.createdAt - a.createdAt));
}

function renderNotesGrid(page, folderId){
  const container = document.getElementById("notes-container");
  const empty = document.getElementById("emptyState");
  if(!container) return;
  container.innerHTML = "";
  container.classList.toggle("compact", settings.density === "compact");

  const list = getFilteredNotes(page, folderId);
  empty.classList.toggle("show", list.length === 0);

  list.forEach(note=>{
    container.appendChild(buildNoteCard(note, page, folderId));
  });

  renderSidebar(document.body.dataset.page);
}

function formatTime(sec){
  sec = Math.max(0, sec);
  const m = Math.floor(sec/60).toString().padStart(2,"0");
  const s = Math.floor(sec%60).toString().padStart(2,"0");
  return `${m}:${s}`;
}

function buildNoteCard(note, page, folderId){
  const div = document.createElement("div");
  div.className = "note";
  applyBgToElement(div, note.background);

  const folderObj = folders.find(f=>f.id === note.folder);
  const refresh = ()=>renderNotesGrid(page, folderId);

  let bodyHtml = "";
  if(note.type === "text"){
    bodyHtml = `<p>${escapeHtml(note.content || "")}</p>`;
  } else if(note.type === "checklist"){
    const done = note.items.filter(i=>i.done).length;
    const pct = note.items.length ? Math.round(done/note.items.length*100) : 0;
    bodyHtml = `
      <div class="note-checklist">
        ${note.items.map(i=>`
          <label class="note-check-row ${i.done ? "done":""}">
            <input type="checkbox" data-item="${i.id}" ${i.done ? "checked":""}>
            <span>${escapeHtml(i.text)}</span>
          </label>
        `).join("")}
      </div>
      <div class="checklist-progress"><span style="width:${pct}%"></span></div>
    `;
  } else if(note.type === "timer"){
    const pct = note.duration ? note.remaining / note.duration : 0;
    const circumference = 2 * Math.PI * 27;
    const offset = circumference * (1 - pct);
    bodyHtml = `
      <div class="timer-block">
        <div class="timer-ring">
          <svg viewBox="0 0 64 64">
            <circle class="bg" cx="32" cy="32" r="27"></circle>
            <circle class="fg" cx="32" cy="32" r="27"
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
          </svg>
          <span class="time-label">${formatTime(note.remaining)}</span>
        </div>
        <div>
          <div class="timer-controls">
            <button type="button" data-timer-action="toggle" title="${note.running ? 'Pause':'Start'}">${note.running ? "⏸" : "▶"}</button>
            <button type="button" data-timer-action="reset" title="Reset">↺</button>
          </div>
          <div class="timer-status">${note.completed ? "Session complete" : (note.running ? "Focusing…" : "Paused")}</div>
        </div>
      </div>
    `;
  }

  div.innerHTML = `
    <div class="note-top">
      ${note.title ? `<h3>${escapeHtml(note.title)}</h3>` : `<span></span>`}
      <button type="button" class="pin-btn ${note.pinned ? "pinned":""}" data-action="pin" title="Pin">
        ${ICONS.pinned}
      </button>
    </div>
    ${bodyHtml}
    ${folderObj ? `<span class="folder-tag"><span class="folder-dot" style="background:${folderObj.color}"></span>${escapeHtml(folderObj.name)}</span>` : ""}
    <div class="note-actions">
      ${!note.trashed ? `
        <button type="button" data-action="edit" title="Edit">${ICONS.edit}</button>
        <button type="button" data-action="archive" title="${note.archived ? "Unarchive":"Archive"}">${ICONS.archive}</button>
      ` : `
        <button type="button" data-action="restore" title="Restore">${ICONS.restore}</button>
      `}
      <button type="button" class="delete-btn" data-action="${note.trashed ? "delete-forever" : "trash"}" title="${note.trashed ? "Delete forever" : "Move to trash"}">${ICONS.trash}</button>
    </div>
  `;

  div.querySelectorAll("[data-item]").forEach(chk=>{
    chk.addEventListener("click", (e)=>{
      e.stopPropagation();
      const item = note.items.find(i=>i.id === chk.dataset.item);
      item.done = chk.checked;
      save(); refresh();
    });
  });

  const toggleBtn = div.querySelector('[data-timer-action="toggle"]');
  if(toggleBtn) toggleBtn.addEventListener("click", (e)=>{ e.stopPropagation(); toggleTimer(note.id, refresh); });
  const resetBtn = div.querySelector('[data-timer-action="reset"]');
  if(resetBtn) resetBtn.addEventListener("click", (e)=>{
    e.stopPropagation();
    stopTimerInterval(note.id);
    note.remaining = note.duration;
    note.running = false;
    note.completed = false;
    save(); refresh();
  });

  div.querySelector('[data-action="pin"]').addEventListener("click", (e)=>{
    e.stopPropagation(); note.pinned = !note.pinned; save(); refresh();
  });
  const editBtn = div.querySelector('[data-action="edit"]');
  if(editBtn) editBtn.addEventListener("click", (e)=>{ e.stopPropagation(); openEditModal(note, refresh); });
  const archiveBtn = div.querySelector('[data-action="archive"]');
  if(archiveBtn) archiveBtn.addEventListener("click", (e)=>{
    e.stopPropagation(); note.archived = !note.archived; save(); refresh();
  });
  const restoreBtn = div.querySelector('[data-action="restore"]');
  if(restoreBtn) restoreBtn.addEventListener("click", (e)=>{
    e.stopPropagation(); note.trashed = false; save(); refresh();
  });
  const trashBtn = div.querySelector('[data-action="trash"]');
  if(trashBtn) trashBtn.addEventListener("click", (e)=>{
    e.stopPropagation(); stopTimerInterval(note.id); note.trashed = true; save(); refresh();
  });
  const deleteForeverBtn = div.querySelector('[data-action="delete-forever"]');
  if(deleteForeverBtn) deleteForeverBtn.addEventListener("click", (e)=>{
    e.stopPropagation();
    if(!confirm("Delete this note permanently?")) return;
    notes = notes.filter(n=>n.id !== note.id);
    save(); refresh();
  });

  return div;
}

/* ============================================================
   Timers
   ============================================================ */

function toggleTimer(id, refresh){
  const note = notes.find(n=>n.id === id);
  if(!note) return;
  note.running = !note.running;

  if(note.running){
    runningTimers[id] = setInterval(()=>{
      note.remaining -= 1;
      if(note.remaining <= 0){
        note.remaining = 0;
        note.running = false;
        note.completed = true;
        stopTimerInterval(id);
        save(); refresh();
        notifySessionComplete(note);
        return;
      }
      refresh();
    }, 1000);
  } else {
    stopTimerInterval(id);
  }
  save(); refresh();
}
function stopTimerInterval(id){
  if(runningTimers[id]){ clearInterval(runningTimers[id]); delete runningTimers[id]; }
}
function notifySessionComplete(note){
  if(settings.notifications && window.Notification && Notification.permission === "granted"){
    new Notification("Study session complete", { body: note.title || "Time's up!" });
  } else {
    alert(`"${note.title || "Study session"}" is complete. Nice work!`);
  }
}

/* ============================================================
   Settings page
   ============================================================ */

function renderSettingsPage(){
  const content = document.getElementById("pageContent");
  content.innerHTML = `
    <div class="page-content">
      <div class="page-header">
        <h1>Settings</h1>
        <p>Customize how Notewell looks and behaves.</p>
      </div>

      <div class="card">
        <h2>Appearance</h2>
        <p class="card-sub">Choose how Notewell looks on this device.</p>
        <div class="setting-row">
          <div><strong>Theme</strong><p>Light, dark, or match your system.</p></div>
          <div class="segmented" id="themeSegmented">
            <button data-theme="light">Light</button>
            <button data-theme="dark">Dark</button>
            <button data-theme="auto">Auto</button>
          </div>
        </div>
        <div class="setting-row">
          <div><strong>Grid density</strong><p>Adjust how compact your notes grid feels.</p></div>
          <div class="segmented" id="densitySegmented">
            <button data-density="comfortable">Comfortable</button>
            <button data-density="compact">Compact</button>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Note backgrounds</h2>
        <p class="card-sub">Pick the default color or image background new notes start with, just like Keep.</p>
        <div class="setting-row">
          <div><strong>Default background</strong><p>Applied automatically to new notes.</p></div>
          <div id="settingsBgPicker" style="position:relative;"></div>
        </div>
      </div>

      <div class="card">
        <h2>Notifications</h2>
        <p class="card-sub">Get notified when a study timer finishes.</p>
        <div class="setting-row">
          <div><strong>Timer alerts</strong><p>Requires browser notification permission.</p></div>
          <div class="toggle ${settings.notifications ? "on":""}" id="notifToggle"></div>
        </div>
      </div>

      <div class="card">
        <h2>Your data</h2>
        <p class="card-sub">Everything is stored locally in this browser.</p>
        <div class="data-actions">
          <button class="btn-ghost" id="exportData">Export as JSON</button>
          <label class="btn-ghost" style="cursor:pointer;">
            Import JSON
            <input type="file" id="importData" accept="application/json" style="display:none;">
          </label>
          <button class="btn-danger" id="clearNotes">Clear all notes</button>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll("#themeSegmented button").forEach(b=>{
    b.classList.toggle("active", b.dataset.theme === settings.theme);
    b.addEventListener("click", ()=>{ settings.theme = b.dataset.theme; save(); applyTheme(); });
  });

  document.querySelectorAll("#densitySegmented button").forEach(b=>{
    b.classList.toggle("active", b.dataset.density === settings.density);
    b.addEventListener("click", ()=>{
      settings.density = b.dataset.density;
      document.querySelectorAll("#densitySegmented button").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      save();
    });
  });

  createBgPicker(document.getElementById("settingsBgPicker"), settings.defaultBackground, (val)=>{
    settings.defaultBackground = val; save();
  });

  const notifToggle = document.getElementById("notifToggle");
  notifToggle.addEventListener("click", async ()=>{
    if(!settings.notifications && window.Notification && Notification.permission !== "granted"){
      await Notification.requestPermission();
    }
    settings.notifications = !settings.notifications;
    notifToggle.classList.toggle("on", settings.notifications);
    save();
  });

  document.getElementById("exportData").addEventListener("click", ()=>{
    const blob = new Blob([JSON.stringify({ notes, folders, settings }, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "notewell-backup.json"; a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importData").addEventListener("change", (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const data = JSON.parse(reader.result);
        if(data.notes) notes = data.notes;
        if(data.folders) folders = data.folders;
        if(data.settings) settings = data.settings;
        save();
        alert("Data imported successfully.");
        renderSettingsPage();
        renderSidebar("settings");
      } catch(err){
        alert("That file couldn't be read as valid Notewell JSON.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("clearNotes").addEventListener("click", ()=>{
    if(!confirm("This will permanently delete all notes. Continue?")) return;
    notes = [];
    save();
    renderSidebar("settings");
  });
}

/* ============================================================
   Profile page
   ============================================================ */

function renderProfilePage(){
  const p = settings.profile;
  const active = notes.filter(n=>!n.trashed);
  const stats = {
    total: active.filter(n=>!n.archived).length,
    pinned: active.filter(n=>n.pinned).length,
    folders: folders.length,
    studyMinutes: Math.round(active.filter(n=>n.type==="timer").reduce((sum,n)=> sum + (n.duration - n.remaining), 0) / 60),
  };
  const memberSince = new Date(p.memberSince).toLocaleDateString(undefined, { month:"long", year:"numeric" });

  const content = document.getElementById("pageContent");
  content.innerHTML = `
    <div class="page-content">
      <div class="page-header">
        <h1>Your profile</h1>
        <p>Member since ${memberSince}</p>
      </div>

      <div class="card">
        <div class="avatar-row">
          <div class="avatar-big" id="avatarBig">${p.avatar ? `<img src="${p.avatar}" alt="">` : (p.name||"A").charAt(0).toUpperCase()}</div>
          <div class="avatar-actions">
            <label class="btn-ghost" style="cursor:pointer;">
              Change photo
              <input type="file" id="avatarInput" accept="image/*" style="display:none;">
            </label>
            <button class="btn-ghost" id="removeAvatar">Remove</button>
          </div>
        </div>

        <div class="field-grid">
          <div class="field-block">
            <label>Name</label>
            <input type="text" id="profileName" value="${escapeHtml(p.name||"")}">
          </div>
          <div class="field-block">
            <label>Email</label>
            <input type="email" id="profileEmail" value="${escapeHtml(p.email||"")}">
          </div>
          <div class="field-block full">
            <label>Bio</label>
            <textarea id="profileBio" placeholder="A short note about yourself">${escapeHtml(p.bio||"")}</textarea>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-primary" id="saveProfile">Save changes</button>
        </div>
      </div>

      <div class="card">
        <h2>Your activity</h2>
        <p class="card-sub">A quick look at what's in your workspace.</p>
        <div class="stat-grid">
          <div class="stat-card"><div class="num">${stats.total}</div><div class="label">Active notes</div></div>
          <div class="stat-card"><div class="num">${stats.pinned}</div><div class="label">Pinned</div></div>
          <div class="stat-card"><div class="num">${stats.folders}</div><div class="label">Folders</div></div>
          <div class="stat-card"><div class="num">${stats.studyMinutes}</div><div class="label">Study minutes</div></div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("avatarInput").addEventListener("change", (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 2*1024*1024){ alert("Please choose an image under 2MB."); return; }
    const reader = new FileReader();
    reader.onload = ()=>{
      settings.profile.avatar = reader.result;
      save();
      renderProfilePage();
      renderSidebar("profile");
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("removeAvatar").addEventListener("click", ()=>{
    settings.profile.avatar = "";
    save();
    renderProfilePage();
    renderSidebar("profile");
  });

  document.getElementById("saveProfile").addEventListener("click", ()=>{
    settings.profile.name = document.getElementById("profileName").value.trim() || "Your name";
    settings.profile.email = document.getElementById("profileEmail").value.trim();
    settings.profile.bio = document.getElementById("profileBio").value.trim();
    save();
    renderSidebar("profile");
    const btn = document.getElementById("saveProfile");
    const original = btn.textContent;
    btn.textContent = "Saved ✓";
    setTimeout(()=>{ btn.textContent = original; }, 1500);
  });
}

/* ============================================================
   Init
   ============================================================ */

function init(){
  const page = document.body.dataset.page;
  applyTheme();
  renderSidebar(page);
  renderTopbar(page);
  injectFolderModal();

  if(LIST_PAGES.includes(page)){
    injectEditModal();
    renderListPage(page);
  } else if(page === "settings"){
    renderSettingsPage();
  } else if(page === "profile"){
    renderProfilePage();
  }

  // any timer marked running from a previous session resumes paused, since intervals don't persist across reloads
  let changed = false;
  notes.forEach(n=>{ if(n.type === "timer" && n.running){ n.running = false; changed = true; } });
  if(changed) save();
}

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ()=>{
  if(settings.theme === "auto") applyTheme();
});

document.addEventListener("DOMContentLoaded", init);
