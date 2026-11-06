// Interacciones del prototipo · La Primavera

// Terreno base de los mapas (se reutiliza en todas las pantallas con mapa)
const TERRAIN = `
  <img src="assets/map/zona-forestal-1.svg" width="270" height="270" style="left:-48px;top:-40px" alt="">
  <img src="assets/map/zona-forestal-2.svg" width="210" height="310" style="left:271px;top:54px" alt="">
  <img src="assets/map/zona-forestal-3.svg" width="270" height="280" style="left:-65px;top:302px" alt="">
  <img src="assets/map/bosque-denso.svg" width="145" height="150" style="left:18px;top:24px" alt="">
  <img src="assets/map/curvas-de-nivel.svg" width="450.428" height="543.487" style="left:-15px;top:-10px" alt="">
  <img src="assets/map/arroyo-estacional.svg" width="429.318" height="261.26" style="left:-7.2px;top:171.4px" alt="">
  <img src="assets/map/vialidad-de-acceso.svg" width="429.285" height="158.437" style="left:-13.2px;top:331.7px" alt="">
  <img src="assets/map/borde-de-vialidad.svg" width="423.768" height="162.787" style="left:-10px;top:329.6px" alt="">
  <img src="assets/map/red-de-senderos.png" width="392.04" height="415.821" style="left:22.3px;top:-10.5px" alt="">`;
document.querySelectorAll("[data-terrain]").forEach((layer) => layer.insertAdjacentHTML("afterbegin", TERRAIN));

// Barras de navegación inferior por perfil.
// Cada pestaña: [clave, etiqueta, destino, ícono, ícono activo]
const TABBARS = {
  rescatista: [
    ["inicio", "Inicio", "#inicio-rescatista", "house", "house-active"],
    ["mapa", "Mapa", "#mapa", "map", "map-active"],
    ["incidentes", "Incidentes", "#incidentes", "triangle-alert", "triangle-alert-active"],
    ["perfil", "Perfil", "#perfil", "user-round", "user-round-active"],
  ],
  coordinador: [
    ["resumen", "Resumen", "#dashboard", "layout-dashboard", "layout-dashboard-active"],
    ["zonas", "Zonas", "#zonas", "map", "map-active"],
    ["brigadas", "Brigadas", "#brigadas", "users-nav", "users-nav-active"],
    ["informes", "Informes", "#reportes", "file-chart-column", "file-chart-column-active"],
  ],
  admin: [
    ["inicio", "Inicio", "#inicio-admin", "house", "house-active"],
    ["incidentes", "Incidentes", "#admin-incidentes", "clipboard-list-nav", "clipboard-list-nav-active"],
    ["usuarios", "Usuarios", "#admin-usuarios", "users-nav", "users-nav-active"],
    ["ajustes", "Ajustes", "#admin-roles", "settings-2", "settings-2-active"],
  ],
};
document.querySelectorAll("[data-tabbar]").forEach((nav) => {
  const tabs = TABBARS[nav.dataset.tabbar];
  nav.innerHTML =
    tabs
      .map(([key, label, href, icon, activeIcon]) => {
        const active = key === nav.dataset.active;
        return `<a href="${href}" class="tabbar__item${active ? " is-active" : ""}">
          <img src="assets/icons/${active ? activeIcon : icon}.svg" width="22" height="22" alt="">${label}</a>`;
      })
      .join("") + '<span class="tabbar__home"></span>';
});

// Zoom del mapa operativo
document.querySelectorAll("[data-map]").forEach((map) => {
  const layer = map.querySelector("[data-map-layer]");
  let scale = 1;
  map.querySelectorAll("[data-zoom]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.zoom;
      if (action === "in") scale = Math.min(scale + 0.25, 2.5);
      if (action === "out") scale = Math.max(scale - 0.25, 0.75);
      if (action === "reset") scale = 1;
      layer.style.transform = `scale(${scale})`;
    });
  });
});

// Chips de filtro (selección única)
document.querySelectorAll("[data-chips]").forEach((group) => {
  group.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    group.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c === chip));
  });
});

// Búsqueda en la lista de incidentes
const search = document.querySelector("[data-incident-search]");
if (search) {
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    document.querySelectorAll("[data-incident]").forEach((card) => {
      card.hidden = q !== "" && !card.textContent.toLowerCase().includes(q);
    });
  });
}

// Selector de severidad
const severityHints = {
  baja: "Baja: sin riesgo para personas, atención programada.",
  media: "Media: requiere verificación, sin riesgo inmediato confirmado.",
  alta: "Alta: riesgo inmediato para personas o el bosque.",
};
const severity = document.querySelector("[data-severity]");
const severityHint = document.querySelector("[data-severity-hint]");
if (severity) {
  severity.addEventListener("click", (e) => {
    const option = e.target.closest(".severity__option");
    if (!option) return;
    severity.querySelectorAll(".severity__option").forEach((o) => o.classList.toggle("is-active", o === option));
    severityHint.textContent = severityHints[option.dataset.level];
  });
}

// Adjuntar evidencia
const fileInput = document.querySelector("[data-file-input]");
const fileHint = document.querySelector("[data-file-hint]");
if (fileInput) {
  fileInput.addEventListener("change", () => {
    const files = [...fileInput.files].slice(0, 3);
    fileHint.textContent = files.length
      ? files.map((f) => f.name).join(", ")
      : "Opcional · Hasta 3 archivos de 10 MB";
  });
}

// Formulario de registro
const form = document.querySelector("[data-report-form]");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    location.hash = "#registro-correcto";
  });
  form.querySelector("[data-save-draft]").addEventListener("click", () => {
    alert("Borrador guardado.");
  });
}

// Actualizar estado del incidente
const statuses = [
  ["En atención", "tag--info"],
  ["En sitio", "tag--warning"],
  ["Resuelto", "tag--success"],
];
const statusTag = document.querySelector("[data-status]");
const updateBtn = document.querySelector("[data-update-status]");
if (statusTag && updateBtn) {
  let i = 0;
  updateBtn.addEventListener("click", () => {
    statusTag.classList.remove(statuses[i][1]);
    i = (i + 1) % statuses.length;
    statusTag.textContent = statuses[i][0];
    statusTag.classList.add(statuses[i][1]);
  });
}

// Añadir avance a la cronología
const addEvent = document.querySelector("[data-add-event]");
const timeline = document.querySelector("[data-timeline]");
if (addEvent && timeline) {
  addEvent.addEventListener("click", () => {
    const title = prompt("Título del avance:");
    if (!title) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const event = document.createElement("div");
    event.className = "timeline__event";
    event.innerHTML = `<span class="timeline__time">${time}</span><div><p class="timeline__title"></p><p class="timeline__desc">Registrado desde la app.</p></div>`;
    event.querySelector(".timeline__title").textContent = title;
    timeline.prepend(event);
  });
}

// Inicio de sesión
const loginForm = document.querySelector("[data-login-form]");
if (loginForm) {
  const password = loginForm.querySelector("[data-password]");
  loginForm.querySelector("[data-toggle-password]").addEventListener("click", () => {
    password.type = password.type === "password" ? "text" : "password";
  });
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    location.hash = "#inicio-rescatista";
  });
}

// Asignación de brigada
const assignForm = document.querySelector("[data-assign-form]");
if (assignForm) {
  const brigade = assignForm.querySelector("[data-assign-brigade]");
  const label = assignForm.querySelector("[data-assign-label]");
  brigade.addEventListener("change", () => (label.textContent = `Asignar misión a ${brigade.value}`));
  assignForm.addEventListener("submit", (e) => {
    e.preventDefault();
    alert(`Misión asignada a la brigada ${brigade.value}.`);
  });
}

// Sincronización
const syncBtn = document.querySelector("[data-sync]");
if (syncBtn) {
  syncBtn.addEventListener("click", () => {
    document.querySelectorAll("[data-sync-list] .pending__item").forEach((item) => item.classList.add("is-synced"));
    document.querySelector("[data-sync-count]").textContent = "0 cambios";
    document.querySelector("[data-sync-title]").textContent = "Conectado";
    document.querySelector("[data-sync-subtitle]").textContent = "Todos los cambios se enviaron.";
  });
}

// Generar reporte
const reportGenerator = document.querySelector("[data-report-generator]");
if (reportGenerator) {
  reportGenerator.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Reporte PDF generado (demostración).");
  });
}

// Matriz de permisos: dibuja ✓ / − a partir de data-perms ("110" = RES sí, COO sí, ADM no)
document.querySelectorAll("[data-perms]").forEach((row) => {
  [...row.dataset.perms].forEach((p) => {
    row.insertAdjacentHTML(
      "beforeend",
      p === "1"
        ? '<span><img src="assets/icons/circle-check-17.svg" width="17" height="17" alt="Permitido"></span>'
        : '<span><img src="assets/icons/minus-17.svg" width="17" height="17" alt="No permitido"></span>'
    );
  });
});

// Seleccionar todos los registros
const selectAll = document.querySelector("[data-select-all]");
if (selectAll) {
  selectAll.addEventListener("change", () => {
    document.querySelectorAll("[data-select-item]").forEach((cb) => (cb.checked = selectAll.checked));
  });
}

// Búsqueda de usuarios
const userSearch = document.querySelector("[data-user-search]");
if (userSearch) {
  userSearch.addEventListener("input", () => {
    const q = userSearch.value.trim().toLowerCase();
    document.querySelectorAll("[data-user]").forEach((card) => {
      card.hidden = q !== "" && !card.textContent.toLowerCase().includes(q);
    });
  });
}
