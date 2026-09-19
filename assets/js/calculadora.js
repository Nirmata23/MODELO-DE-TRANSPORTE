/* ===========================================================
   calculadora.js — permite cambiar la matriz y volver a
   resolver el problema con los tres métodos.
   =========================================================== */
(function () {
  "use strict";

  var datos = null;
  var f = function (n) { return window.Transporte.formatear(n); };

  function num(id) { return parseFloat(document.getElementById(id).value) || 0; }

  function dibujarEditor() {
    var cont = document.getElementById("editor");
    var u = datos.unidad || "";
    var h = '<div class="tabla-scroll"><table class="matriz editable"><thead><tr><th>' +
      (datos.rotuloOrigenes || "Origen") + "</th>";
    datos.destinos.forEach(function (n, j) {
      h += '<th><input class="etiqueta-texto" id="d-' + j + '" value="' + n + '"></th>';
    });
    h += "<th>Oferta</th></tr></thead><tbody>";
    datos.origenes.forEach(function (o, i) {
      h += '<tr><th><input class="etiqueta-texto" id="o-' + i + '" value="' + o + '"></th>';
      datos.costos[i].forEach(function (c, j) {
        h += '<td><input type="number" step="0.01" min="0" id="c-' + i + "-" + j +
             '" value="' + c + '" aria-label="Costo ' + o + " a " + datos.destinos[j] + '"></td>';
      });
      h += '<td><input type="number" step="1" min="0" id="of-' + i + '" value="' +
           datos.ofertas[i] + '" aria-label="Oferta de ' + o + '"></td></tr>';
    });
    h += "</tbody><tfoot><tr><th>Demanda</th>";
    datos.demandas.forEach(function (dm, j) {
      h += '<td><input type="number" step="1" min="0" id="dm-' + j + '" value="' + dm +
           '" aria-label="Demanda de ' + datos.destinos[j] + '"></td>';
    });
    h += '<td id="celda-totales"></td></tr></tfoot></table></div>';
    cont.innerHTML = h;
    cont.querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("input", function () { leerEditor(); pintarTotales(); });
    });
    pintarTotales();
  }

  function leerEditor() {
    datos.origenes = datos.origenes.map(function (_, i) {
      return document.getElementById("o-" + i).value || "Origen " + (i + 1);
    });
    datos.destinos = datos.destinos.map(function (_, j) {
      return document.getElementById("d-" + j).value || "Destino " + (j + 1);
    });
    datos.costos = datos.costos.map(function (fila, i) {
      return fila.map(function (_, j) { return num("c-" + i + "-" + j); });
    });
    datos.ofertas = datos.ofertas.map(function (_, i) { return num("of-" + i); });
    datos.demandas = datos.demandas.map(function (_, j) { return num("dm-" + j); });
  }

  function pintarTotales() {
    var to = datos.ofertas.reduce(function (a, b) { return a + b; }, 0);
    var td = datos.demandas.reduce(function (a, b) { return a + b; }, 0);
    var celda = document.getElementById("celda-totales");
    if (celda) { celda.innerHTML = "<strong>" + f(to) + " / " + f(td) + "</strong>"; }
    var aviso = document.getElementById("aviso-balance");
    if (!aviso) { return; }
    if (Math.abs(to - td) < 1e-9) {
      aviso.className = "aviso";
      aviso.style.display = "none";
    } else {
      aviso.style.display = "";
      aviso.innerHTML = "<strong>Problema no balanceado:</strong> la oferta total (" + f(to) +
        ") y la demanda total (" + f(td) + ") no coinciden. Al resolver se agregará " +
        (to > td ? "un destino" : "un origen") + " ficticio con costo 0 por " +
        f(Math.abs(to - td)) + " unidades.";
    }
  }

  function resolver() {
    leerEditor();
    var resultados = window.Transporte.resolverTodos(datos);
    var u = datos.unidad || "";
    var cont = document.getElementById("resultados");
    var h = '<div class="resultados-grid">';
    resultados.forEach(function (r) {
      h += '<div class="resumen-metodo' + (r.esMejor ? " mejor" : "") + '">' +
        "<h4>" + r.metodo + (r.esMejor ? '<span class="insignia">menor costo</span>' : "") + "</h4>" +
        '<div class="z">' + u + r.costoTotal.toFixed(2) + "</div>" +
        "<p style=\"margin:6px 0 0;font-size:.85rem;color:var(--texto-suave)\">" +
        r.celdasOcupadas + " de " + r.celdasRequeridas + " celdas básicas</p></div>";
    });
    h += "</div>";

    resultados.forEach(function (r) {
      h += '<div class="panel" style="margin-top:18px"><h3>' + r.metodo + "</h3>" +
        window.Interfaz.tablaSolucion(r, u) +
        '<h4 style="margin-bottom:10px">Asignaciones en orden</h4>' +
        window.Interfaz.bitacora(r, u) +
        '<p style="margin-top:14px">Costo total <span class="total-z">' + u +
        r.costoTotal.toFixed(2) + "</span></p></div>";
    });
    cont.innerHTML = h;
    cont.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function descargar() {
    leerEditor();
    // Se conserva todo lo demás del archivo (empresa, catálogo, detalles)
    // y sólo se reemplaza lo que se editó en la tabla.
    var copia = JSON.parse(JSON.stringify(datos));
    copia.origenes = datos.origenes;
    copia.destinos = datos.destinos;
    copia.costos = datos.costos;
    copia.ofertas = datos.ofertas;
    copia.demandas = datos.demandas;
    delete copia.resultadosEsperados;
    var blob = new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "datos.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function agregarFila() {
    leerEditor();
    datos.origenes.push("Origen " + (datos.origenes.length + 1));
    datos.costos.push(datos.destinos.map(function () { return 0; }));
    datos.ofertas.push(0);
    dibujarEditor();
  }

  function agregarColumna() {
    leerEditor();
    datos.destinos.push("Destino " + (datos.destinos.length + 1));
    datos.costos.forEach(function (fila) { fila.push(0); });
    datos.demandas.push(0);
    dibujarEditor();
  }

  function quitarFila() {
    if (datos.origenes.length <= 2) { return; }
    leerEditor();
    datos.origenes.pop(); datos.costos.pop(); datos.ofertas.pop();
    dibujarEditor();
  }

  function quitarColumna() {
    if (datos.destinos.length <= 2) { return; }
    leerEditor();
    datos.destinos.pop(); datos.demandas.pop();
    datos.costos.forEach(function (fila) { fila.pop(); });
    dibujarEditor();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("editor")) { return; }
    window.Interfaz.cargarDatos().then(function (d) {
      datos = JSON.parse(JSON.stringify(d));
      dibujarEditor();
      resolver();
      document.getElementById("btn-resolver").addEventListener("click", resolver);
      document.getElementById("btn-restablecer").addEventListener("click", function () {
        datos = JSON.parse(JSON.stringify(d));
        dibujarEditor();
        resolver();
      });
      document.getElementById("btn-descargar").addEventListener("click", descargar);
      document.getElementById("btn-mas-fila").addEventListener("click", agregarFila);
      document.getElementById("btn-menos-fila").addEventListener("click", quitarFila);
      document.getElementById("btn-mas-columna").addEventListener("click", agregarColumna);
      document.getElementById("btn-menos-columna").addEventListener("click", quitarColumna);
    }).catch(function (err) {
      document.getElementById("editor").innerHTML =
        '<p class="aviso">No se pudieron cargar los datos: ' + err.message + "</p>";
    });
  });
})();
