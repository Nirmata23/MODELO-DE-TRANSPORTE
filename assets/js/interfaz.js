/* ===========================================================
   interfaz.js — piezas compartidas por todas las páginas:
   cambio de tema, carga de datos y dibujado de tablas.
   =========================================================== */
(function () {
  "use strict";

  var f = function (n) { return window.Transporte.formatear(n); };

  /* ---------- Tema claro / oscuro ---------- */
  function iniciarTema() {
    var guardado = null;
    try { guardado = localStorage.getItem("tema"); } catch (e) { /* modo privado */ }
    if (guardado) { document.documentElement.setAttribute("data-tema", guardado); }

    var boton = document.querySelector(".boton-tema");
    if (!boton) { return; }
    function pintarIcono() {
      var oscuro = document.documentElement.getAttribute("data-tema") === "oscuro" ||
        (!document.documentElement.getAttribute("data-tema") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      boton.textContent = oscuro ? "☀" : "☾";
      boton.setAttribute("aria-label", oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro");
    }
    pintarIcono();
    boton.addEventListener("click", function () {
      var actual = document.documentElement.getAttribute("data-tema");
      var nuevo;
      if (actual === "oscuro") { nuevo = "claro"; }
      else if (actual === "claro") { nuevo = "oscuro"; }
      else { nuevo = window.matchMedia("(prefers-color-scheme: dark)").matches ? "claro" : "oscuro"; }
      document.documentElement.setAttribute("data-tema", nuevo);
      try { localStorage.setItem("tema", nuevo); } catch (e) { /* modo privado */ }
      pintarIcono();
    });
  }

  /* ---------- Datos del problema ---------- */
  var promesaDatos = null;
  function cargarDatos() {
    if (!promesaDatos) {
      var base = document.body.getAttribute("data-base") || "";
      promesaDatos = fetch(base + "datos.json").then(function (r) {
        if (!r.ok) { throw new Error("No se pudo leer datos.json (" + r.status + ")"); }
        return r.json();
      });
    }
    return promesaDatos;
  }

  /* ---------- Tabla del planteamiento ---------- */
  function tablaPlanteamiento(d) {
    var u = d.unidad || "";
    var h = '<div class="tabla-scroll"><table class="matriz"><thead><tr><th>' +
      (d.rotuloOrigenes || "Origen") + "</th>";
    d.destinos.forEach(function (n) { h += "<th>" + n + "</th>"; });
    h += "<th>Oferta</th></tr></thead><tbody>";
    d.origenes.forEach(function (o, i) {
      h += "<tr><th>" + o + "</th>";
      d.costos[i].forEach(function (c) { h += "<td>" + u + f(c) + "</td>"; });
      h += "<td><strong>" + f(d.ofertas[i]) + "</strong></td></tr>";
    });
    h += "</tbody><tfoot><tr><th>Demanda</th>";
    d.demandas.forEach(function (dm) { h += "<td>" + f(dm) + "</td>"; });
    var total = d.ofertas.reduce(function (a, b) { return a + b; }, 0);
    h += "<td>" + f(total) + "</td></tr></tfoot></table></div>";
    return h;
  }

  /* ---------- Tabla de la solución ---------- */
  function tablaSolucion(r, unidad) {
    var u = unidad || "";
    var h = '<div class="tabla-scroll"><table class="matriz"><thead><tr><th>Origen</th>';
    r.destinos.forEach(function (n) { h += "<th>" + n + "</th>"; });
    h += "<th>Oferta</th></tr></thead><tbody>";
    r.origenes.forEach(function (o, i) {
      h += "<tr><th>" + o + "</th>";
      r.destinos.forEach(function (_, j) {
        var v = r.asignacion[i][j];
        if (v !== null && v > 0) {
          h += '<td class="asignada">' + f(v) +
               '<span class="costo-celda">' + u + f(r.costos[i][j]) + "</span></td>";
        } else if (v !== null) {
          // Celda básica degenerada: entra en la base aunque reciba cero unidades.
          h += '<td class="asignada cero" title="Celda básica con asignación cero (degeneración)">0' +
               '<span class="costo-celda">' + u + f(r.costos[i][j]) + "</span></td>";
        } else {
          h += '<td class="vacia">—<span class="costo-celda">' + u + f(r.costos[i][j]) + "</span></td>";
        }
      });
      h += "<td><strong>" + f(r.ofertas[i]) + "</strong></td></tr>";
    });
    h += "</tbody><tfoot><tr><th>Demanda</th>";
    r.demandas.forEach(function (dm) { h += "<td>" + f(dm) + "</td>"; });
    h += "<td>" + f(r.ofertas.reduce(function (a, b) { return a + b; }, 0)) + "</td></tr></tfoot></table></div>";
    return h;
  }

  /* ---------- Bitácora de asignaciones ---------- */
  function bitacora(r, unidad) {
    var u = unidad || "";
    var h = '<div class="bitacora">';
    r.pasos.forEach(function (p, k) {
      h += '<div class="paso-linea" style="animation-delay:' + (k * 70) + 'ms">' +
        '<div class="n">' + p.numero + "</div>" +
        '<div class="descripcion"><strong>' + p.origen + " → " + p.destino + "</strong>" +
        "<em>" + p.nota + "</em></div>" +
        '<div class="monto">' + f(p.cantidad) + " × " + u + f(p.costoUnitario) +
        " = " + u + p.subtotal.toFixed(2) + "</div></div>";
    });
    h += "</div>";
    return h;
  }

  /* ---------- Página de un método ---------- */
  function iniciarPaginaMetodo() {
    var cuerpo = document.body;
    var metodo = cuerpo.getAttribute("data-metodo");
    if (!metodo) { return; }

    var destinoTabla = document.getElementById("tabla-solucion");
    var destinoPasos = document.getElementById("bitacora");
    var destinoZ = document.getElementById("costo-total");
    var destinoPlanteamiento = document.getElementById("tabla-planteamiento");

    cargarDatos().then(function (d) {
      var r = window.Transporte[metodo](d);
      if (destinoPlanteamiento) { destinoPlanteamiento.innerHTML = tablaPlanteamiento(d); }
      if (destinoTabla) { destinoTabla.innerHTML = tablaSolucion(r, d.unidad); }
      if (destinoPasos) { destinoPasos.innerHTML = bitacora(r, d.unidad); }
      if (destinoZ) {
        destinoZ.innerHTML = '<span class="total-z">' + (d.unidad || "") +
          r.costoTotal.toFixed(2) + "</span>";
      }
      document.querySelectorAll("[data-celdas]").forEach(function (el) {
        el.textContent = r.celdasOcupadas + " de " + r.celdasRequeridas;
      });
    }).catch(function (err) {
      [destinoTabla, destinoPasos, destinoZ, destinoPlanteamiento].forEach(function (el) {
        if (el) {
          el.innerHTML = '<p class="aviso">No se pudieron cargar los datos: ' + err.message +
            ". Si abriste el archivo directamente desde el disco, publícalo o usa un servidor local.</p>";
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    iniciarTema();
    iniciarPaginaMetodo();
  });

  window.Interfaz = {
    cargarDatos: cargarDatos,
    tablaPlanteamiento: tablaPlanteamiento,
    tablaSolucion: tablaSolucion,
    bitacora: bitacora
  };
})();
