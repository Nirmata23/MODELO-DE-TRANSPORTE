/* ===========================================================
   comparacion.js — resuelve el problema con los tres métodos
   y los muestra uno al lado del otro.
   =========================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var cont = document.getElementById("comparacion");
    if (!cont) { return; }

    window.Interfaz.cargarDatos().then(function (d) {
      var u = d.unidad || "";
      var resultados = window.Transporte.resolverTodos(d);
      var peor = Math.max.apply(null, resultados.map(function (r) { return r.costoTotal; }));

      var h = '<div class="resultados-grid">';
      resultados.forEach(function (r) {
        var ahorro = peor - r.costoTotal;
        h += '<div class="resumen-metodo' + (r.esMejor ? " mejor" : "") + '">' +
          "<h4>" + r.metodo + (r.esMejor ? '<span class="insignia">menor costo</span>' : "") + "</h4>" +
          '<div class="z">' + u + r.costoTotal.toFixed(2) + "</div>" +
          '<p style="margin:8px 0 0;font-size:.86rem;color:var(--texto-suave)">' +
          (ahorro > 0
            ? "Ahorra " + u + ahorro.toFixed(2) + " frente al método más caro."
            : "Es la solución inicial más cara.") +
          "<br>" + r.celdasOcupadas + " de " + r.celdasRequeridas + " celdas básicas.</p></div>";
      });
      h += "</div>";

      // Tabla resumen
      h += '<div class="panel" style="margin-top:20px"><h3>Cuadro comparativo</h3>' +
        '<div class="tabla-scroll"><table class="matriz"><thead><tr>' +
        "<th>Método</th><th>Costo total</th><th>Diferencia con el mejor</th><th>Celdas básicas</th>" +
        "</tr></thead><tbody>";
      var mejor = Math.min.apply(null, resultados.map(function (r) { return r.costoTotal; }));
      resultados.forEach(function (r) {
        var dif = r.costoTotal - mejor;
        h += "<tr><th>" + r.metodo + "</th>" +
          '<td class="' + (r.esMejor ? "asignada" : "") + '">' + u + r.costoTotal.toFixed(2) + "</td>" +
          "<td>" + (dif === 0 ? "—" : "+" + u + dif.toFixed(2)) + "</td>" +
          "<td>" + r.celdasOcupadas + " / " + r.celdasRequeridas + "</td></tr>";
      });
      h += "</tbody></table></div></div>";

      // Detalle de cada método
      resultados.forEach(function (r) {
        h += '<div class="panel"><h3>' + r.metodo + "</h3>" +
          window.Interfaz.tablaSolucion(r, u) +
          '<p style="margin:16px 0 0">Costo total: <span class="total-z">' + u +
          r.costoTotal.toFixed(2) + "</span></p></div>";
      });

      cont.innerHTML = h;
    }).catch(function (err) {
      cont.innerHTML = '<p class="aviso">No se pudieron cargar los datos: ' + err.message + "</p>";
    });
  });
})();
