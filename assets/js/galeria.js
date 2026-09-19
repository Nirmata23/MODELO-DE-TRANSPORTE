/* ===========================================================
   galeria.js — muestra sola las imágenes de una carpeta.

   Pregunta a la API pública de GitHub qué archivos hay dentro de
   imagenes/<sección>/ y los pinta. Así, para agregar una foto sólo
   hay que subirla a esa carpeta del repositorio: no se toca código.

   Si la API no responde (sin internet, límite de peticiones, o el
   sitio abierto desde el disco), usa imagenes/<sección>/lista.json
   como respaldo.
   =========================================================== */
(function () {
  "use strict";

  var EXTENSIONES = /\.(jpe?g|png|gif|webp|avif|bmp)$/i;

  function ordenNatural(a, b) {
    return a.name.localeCompare(b.name, "es", { numeric: true, sensitivity: "base" });
  }

  /** "03-paso-3.jpg" -> "Paso 3" */
  function titulo(nombreArchivo) {
    return nombreArchivo
      .replace(EXTENSIONES, "")
      .replace(/^\d+[-_.\s]*/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^./, function (c) { return c.toUpperCase(); }) || nombreArchivo;
  }

  function desdeGitHub(seccion) {
    var c = window.CONFIG;
    var url = "https://api.github.com/repos/" + c.repositorio + "/contents/" +
              c.carpetaImagenes + "/" + seccion + "?ref=" + encodeURIComponent(c.rama);
    return fetch(url, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) {
        if (!r.ok) { throw new Error("GitHub respondió " + r.status); }
        return r.json();
      })
      .then(function (lista) {
        if (!Array.isArray(lista)) { throw new Error("Respuesta inesperada"); }
        return lista
          .filter(function (f) { return f.type === "file" && EXTENSIONES.test(f.name); })
          .sort(ordenNatural)
          .map(function (f) { return { url: f.download_url, nombre: f.name }; });
      });
  }

  function desdeListaLocal(seccion) {
    var base = window.CONFIG.carpetaImagenes + "/" + seccion + "/";
    return fetch(base + "lista.json")
      .then(function (r) {
        if (!r.ok) { throw new Error("sin lista.json"); }
        return r.json();
      })
      .then(function (nombres) {
        return nombres.sort(function (a, b) {
          return String(a).localeCompare(String(b), "es", { numeric: true });
        }).map(function (n) { return { url: base + n, nombre: n }; });
      });
  }

  /* ---------- Visor a pantalla completa ---------- */
  var visor = null, imagenes = [], indiceActual = 0;

  function crearVisor() {
    if (visor) { return visor; }
    visor = document.createElement("div");
    visor.className = "visor";
    visor.setAttribute("role", "dialog");
    visor.setAttribute("aria-modal", "true");
    visor.innerHTML =
      '<button class="cerrar" aria-label="Cerrar">&times;</button>' +
      '<button class="anterior" aria-label="Anterior">&#8249;</button>' +
      '<img alt="">' +
      '<button class="siguiente" aria-label="Siguiente">&#8250;</button>' +
      '<div class="visor-pie"></div>';
    document.body.appendChild(visor);

    visor.querySelector(".cerrar").addEventListener("click", cerrar);
    visor.querySelector(".anterior").addEventListener("click", function (e) {
      e.stopPropagation(); mover(-1);
    });
    visor.querySelector(".siguiente").addEventListener("click", function (e) {
      e.stopPropagation(); mover(1);
    });
    visor.addEventListener("click", function (e) { if (e.target === visor) { cerrar(); } });
    document.addEventListener("keydown", function (e) {
      if (!visor.classList.contains("abierto")) { return; }
      if (e.key === "Escape") { cerrar(); }
      if (e.key === "ArrowLeft") { mover(-1); }
      if (e.key === "ArrowRight") { mover(1); }
    });
    return visor;
  }

  function mostrar(i) {
    indiceActual = (i + imagenes.length) % imagenes.length;
    var img = imagenes[indiceActual];
    visor.querySelector("img").src = img.url;
    visor.querySelector("img").alt = titulo(img.nombre);
    visor.querySelector(".visor-pie").textContent =
      titulo(img.nombre) + "  ·  " + (indiceActual + 1) + " de " + imagenes.length;
  }

  function mover(paso) { mostrar(indiceActual + paso); }
  function cerrar() { visor.classList.remove("abierto"); document.body.style.overflow = ""; }

  function abrir(lista, i) {
    imagenes = lista;
    crearVisor().classList.add("abierto");
    document.body.style.overflow = "hidden";
    mostrar(i);
  }

  /* ---------- Render ---------- */
  function pintar(contenedor, lista, seccion) {
    if (!lista.length) {
      contenedor.innerHTML =
        '<div class="galeria-vacia">Todavía no hay imágenes en esta sección.<br>' +
        'Sube tus fotos a la carpeta <code>' + window.CONFIG.carpetaImagenes + "/" + seccion +
        '/</code> del repositorio y aparecerán aquí solas.</div>';
      return;
    }
    contenedor.className = "galeria";
    contenedor.innerHTML = "";
    lista.forEach(function (img, i) {
      var fig = document.createElement("figure");
      fig.innerHTML = '<img loading="lazy" alt="' + titulo(img.nombre) + '" src="' + img.url + '">' +
                      "<figcaption>" + titulo(img.nombre) + "</figcaption>";
      fig.addEventListener("click", function () { abrir(lista, i); });
      contenedor.appendChild(fig);
    });
  }

  function cargar(contenedor) {
    var seccion = contenedor.getAttribute("data-galeria");
    contenedor.innerHTML = '<p class="cargando">Cargando imágenes…</p>';
    desdeGitHub(seccion)
      .catch(function () { return desdeListaLocal(seccion); })
      .then(function (lista) { pintar(contenedor, lista, seccion); })
      .catch(function () { pintar(contenedor, [], seccion); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-galeria]").forEach(cargar);
  });
})();
