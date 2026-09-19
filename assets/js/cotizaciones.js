(function () {
  "use strict";

  var base = null;
  var datos = null;
  var seleccion = [];

  function f(n) { return window.Transporte.formatear(n); }

  function quetzales(n) {
    return "Q " + n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function matrizConTarifas() {
    return base.costos.map(function (fila) {
      return fila.map(function (c, j) {
        var factor = base.cotizaciones[j].modalidades[seleccion[j]].factor;
        return Math.round(c * factor * 100) / 100;
      });
    });
  }

  function esBase() {
    return seleccion.every(function (k) { return k === 0; });
  }

  function pintarCotizaciones() {
    var cont = document.getElementById("cotizaciones");
    var h = "";
    base.cotizaciones.forEach(function (c, j) {
      var tarifas = base.costos.map(function (fila) { return fila[j]; });
      var min = Math.min.apply(null, tarifas);
      var max = Math.max.apply(null, tarifas);

      h += '<div class="cotizacion"><header><h4>' + c.empresa + "</h4>" +
        '<span class="vigencia">' + c.vigencia + "</span></header>" +
        '<p class="base">' + c.resumen + "<br>Tarifa base por caja: " +
        quetzales(min) + " a " + quetzales(max) + " según el centro de distribución.</p>" +
        '<div class="modalidades">';

      c.modalidades.forEach(function (m, k) {
        var pct = Math.round((m.factor - 1) * 100);
        var texto = pct === 0 ? "base" : (pct > 0 ? "+" + pct + "%" : pct + "%");
        h += '<label class="modalidad' + (seleccion[j] === k ? " activa" : "") + '">' +
          '<input type="radio" name="mod-' + j + '" value="' + k + '"' +
          (seleccion[j] === k ? " checked" : "") + ">" +
          '<span><span class="nombre">' + m.nombre + "</span>" +
          '<span class="detalle">' + m.tiempo + " · " + m.nota + "</span></span>" +
          '<span class="ajuste' + (pct < 0 ? " baja" : "") + '">' + texto + "</span></label>";
      });

      h += "</div></div>";
    });
    cont.innerHTML = h;

    cont.querySelectorAll('input[type="radio"]').forEach(function (inp) {
      inp.addEventListener("change", function () {
        var j = parseInt(inp.name.split("-")[1], 10);
        seleccion[j] = parseInt(inp.value, 10);
        pintarCotizaciones();
        recalcular();
      });
    });
  }

  function pintarResumenSeleccion() {
    var cont = document.getElementById("resumen-cotizacion");
    var h = '<div class="tabla-scroll"><table class="matriz"><thead><tr>' +
      "<th>Empresa</th><th>Modalidad elegida</th><th>Tiempo de entrega</th>" +
      "<th>Ajuste</th><th>Tarifa por caja</th></tr></thead><tbody>";

    var costos = matrizConTarifas();
    base.cotizaciones.forEach(function (c, j) {
      var m = c.modalidades[seleccion[j]];
      var col = costos.map(function (fila) { return fila[j]; });
      var pct = Math.round((m.factor - 1) * 100);
      h += "<tr><th>" + c.empresa + "</th>" +
        '<td style="text-align:left">' + m.nombre + "</td>" +
        "<td>" + m.tiempo + "</td>" +
        "<td>" + (pct === 0 ? "base" : (pct > 0 ? "+" + pct + "%" : pct + "%")) + "</td>" +
        "<td>" + quetzales(Math.min.apply(null, col)) + " a " +
        quetzales(Math.max.apply(null, col)) + "</td></tr>";
    });
    h += "</tbody></table></div>";
    cont.innerHTML = h;
  }

  function pintarMatriz() {
    var cont = document.getElementById("matriz-cotizada");
    var costos = matrizConTarifas();
    var h = '<div class="tabla-scroll"><table class="matriz"><thead><tr><th>' +
      (base.rotuloOrigenes || "Origen") + "</th>";
    base.destinos.forEach(function (n) { h += "<th>" + n + "</th>"; });
    h += "<th>Oferta</th></tr></thead><tbody>";

    base.origenes.forEach(function (o, i) {
      h += "<tr><th>" + o + "</th>";
      costos[i].forEach(function (c, j) {
        var cambio = Math.abs(c - base.costos[i][j]) > 0.001;
        h += "<td" + (cambio ? ' class="asignada"' : "") + ">Q" + f(c) + "</td>";
      });
      h += "<td><strong>" + f(base.ofertas[i]) + "</strong></td></tr>";
    });

    h += "</tbody><tfoot><tr><th>Demanda</th>";
    base.demandas.forEach(function (dm) { h += "<td>" + f(dm) + "</td>"; });
    h += "<td>" + f(base.ofertas.reduce(function (a, b) { return a + b; }, 0)) +
      "</td></tr></tfoot></table></div>";
    cont.innerHTML = h;
  }

  function pintarEstado() {
    var cont = document.getElementById("estado-cotizacion");
    if (esBase()) {
      cont.className = "nota";
      cont.innerHTML = "<strong>Tarifas estándar.</strong> Esta es exactamente la matriz del " +
        "planteamiento original, la que se trabajó a mano en las hojas del grupo. " +
        "Cambia cualquier modalidad para cotizar otro escenario.";
    } else {
      cont.className = "aviso";
      var cambiadas = base.cotizaciones.filter(function (c, j) { return seleccion[j] !== 0; })
        .map(function (c, j) { return c.empresa; });
      cont.innerHTML = "<strong>Escenario modificado.</strong> Se cambió la modalidad de " +
        cambiadas.length + " empresa" + (cambiadas.length === 1 ? "" : "s") +
        ". Las celdas resaltadas en la matriz son las tarifas que ya no corresponden a la " +
        "cotización estándar.";
    }
  }

  function pintarResultados() {
    datos = JSON.parse(JSON.stringify(base));
    datos.costos = matrizConTarifas();

    var resultados = window.Transporte.resolverTodos(datos);
    var referencia = window.Transporte.resolverTodos(base);
    var mejorRef = Math.min.apply(null, referencia.map(function (r) { return r.costoTotal; }));
    var u = base.unidad || "";
    var cont = document.getElementById("resultados");

    var h = '<div class="resultados-grid">';
    resultados.forEach(function (r) {
      h += '<div class="resumen-metodo' + (r.esMejor ? " mejor" : "") + '">' +
        "<h4>" + r.metodo + (r.esMejor ? '<span class="insignia">menor costo</span>' : "") + "</h4>" +
        '<div class="z">' + u + r.costoTotal.toFixed(2) + "</div>" +
        '<p style="margin:6px 0 0;font-size:.85rem;color:var(--texto-suave)">' +
        r.celdasOcupadas + " de " + r.celdasRequeridas + " celdas básicas</p></div>";
    });
    h += "</div>";

    var mejor = Math.min.apply(null, resultados.map(function (r) { return r.costoTotal; }));
    var dif = mejor - mejorRef;
    h += '<div class="panel" style="margin-top:18px"><h3>Qué significa esta cotización</h3>' +
      "<p>Con las modalidades elegidas, el mejor costo semanal es <span class=\"total-z\">" +
      quetzales(mejor) + "</span>.</p>";
    if (Math.abs(dif) < 0.005) {
      h += "<p>Es el mismo costo que con las tarifas estándar.</p>";
    } else if (dif > 0) {
      h += "<p>Son <strong>" + quetzales(dif) + " más por semana</strong> que con las tarifas " +
        "estándar, es decir <strong>" + quetzales(dif * 52) + " al año</strong>. " +
        "Habría que ver si los tiempos de entrega lo justifican.</p>";
    } else {
      h += "<p>Son <strong>" + quetzales(-dif) + " menos por semana</strong> que con las tarifas " +
        "estándar, es decir <strong>" + quetzales(-dif * 52) + " de ahorro al año</strong>.</p>";
    }
    h += "</div>";

    resultados.forEach(function (r) {
      h += '<div class="panel"><h3>' + r.metodo + "</h3>" +
        window.Interfaz.tablaSolucion(r, u) +
        '<h4 style="margin-bottom:10px">Asignaciones en orden</h4>' +
        window.Interfaz.bitacora(r, u) +
        '<p style="margin-top:14px">Costo total <span class="total-z">' + u +
        r.costoTotal.toFixed(2) + "</span></p></div>";
    });

    cont.innerHTML = h;
  }

  function recalcular() {
    pintarEstado();
    pintarResumenSeleccion();
    pintarMatriz();
    pintarResultados();
  }

  function restablecer() {
    seleccion = base.destinos.map(function () { return 0; });
    pintarCotizaciones();
    recalcular();
  }

  function descargar() {
    var copia = JSON.parse(JSON.stringify(base));
    copia.costos = matrizConTarifas();
    copia.modalidadElegida = base.cotizaciones.map(function (c, j) {
      return { empresa: c.empresa, modalidad: c.modalidades[seleccion[j]].nombre };
    });
    delete copia.resultadosEsperados;
    var blob = new Blob([JSON.stringify(copia, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cotizacion.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("cotizaciones")) { return; }

    window.Interfaz.cargarDatos().then(function (d) {
      base = JSON.parse(JSON.stringify(d));
      seleccion = base.destinos.map(function () { return 0; });
      pintarCotizaciones();
      recalcular();
      document.getElementById("btn-estandar").addEventListener("click", restablecer);
      document.getElementById("btn-descargar-cotizacion").addEventListener("click", descargar);
    }).catch(function (err) {
      document.getElementById("cotizaciones").innerHTML =
        '<p class="aviso">No se pudieron cargar los datos: ' + err.message + "</p>";
    });
  });
})();
