/* ===========================================================
   empresa.js — arma las tablas de la ficha de la empresa
   (catálogo, centros de distribución y paqueterías) a partir
   de datos.json, para que nada quede escrito a mano en el HTML.
   =========================================================== */
(function () {
  "use strict";

  var f = function (n) { return window.Transporte.formatear(n); };

  function quetzales(n) {
    return "Q " + n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function tablaCatalogo(d) {
    var h = '<div class="tabla-scroll"><table class="matriz"><thead><tr>' +
      "<th>Código</th><th>Producto</th><th>Categoría</th>" +
      "<th>Precio mayorista</th><th>Unidades por caja</th></tr></thead><tbody>";
    d.catalogo.forEach(function (p) {
      h += "<tr><th style=\"font-family:var(--mono);font-size:.82rem\">" + p.codigo + "</th>" +
        '<td style="text-align:left">' + p.producto + "</td>" +
        "<td>" + p.categoria + "</td>" +
        "<td>" + quetzales(p.precio) + "</td>" +
        "<td>" + p.porCaja + "</td></tr>";
    });
    h += "</tbody></table></div>";
    return h;
  }

  function tablaCentros(d) {
    var h = '<div class="tabla-scroll"><table class="matriz"><thead><tr>' +
      "<th>Centro</th><th>Sede</th><th>Zona que abastece</th>" +
      "<th>Cajas por " + (d.periodo || "semana") + "</th></tr></thead><tbody>";
    d.origenes.forEach(function (o, i) {
      var det = (d.detalleOrigenes || [])[i] || {};
      h += "<tr><th>" + o + "</th>" +
        '<td style="text-align:left">' + (det.sede || "—") + "</td>" +
        '<td style="text-align:left;white-space:normal;min-width:230px">' + (det.cobertura || "—") + "</td>" +
        "<td><strong>" + f(d.ofertas[i]) + "</strong></td></tr>";
    });
    h += "</tbody><tfoot><tr><th>Total</th><td></td><td></td><td><strong>" +
      f(d.ofertas.reduce(function (a, b) { return a + b; }, 0)) +
      "</strong></td></tr></tfoot></table></div>";
    return h;
  }

  function tablaPaqueterias(d) {
    var h = '<div class="tabla-scroll"><table class="matriz"><thead><tr>' +
      "<th>Empresa</th><th>Cobertura</th><th>Capacidad contratada por " +
      (d.periodo || "semana") + "</th></tr></thead><tbody>";
    d.destinos.forEach(function (n, j) {
      var det = (d.detalleDestinos || [])[j] || {};
      h += "<tr><th>" + n + "</th>" +
        '<td style="text-align:left;white-space:normal;min-width:260px">' + (det.cobertura || "—") + "</td>" +
        "<td><strong>" + f(d.demandas[j]) + "</strong></td></tr>";
    });
    h += "</tbody><tfoot><tr><th>Total</th><td></td><td><strong>" +
      f(d.demandas.reduce(function (a, b) { return a + b; }, 0)) +
      "</strong></td></tr></tfoot></table></div>";
    return h;
  }

  function notasCostos(d) {
    var h = '<ul style="margin:0;padding-left:20px">';
    d.origenes.forEach(function (o, i) {
      var det = (d.detalleOrigenes || [])[i] || {};
      if (det.nota) { h += "<li><strong>" + o + ".</strong> " + det.nota + "</li>"; }
    });
    h += "</ul>";
    return h;
  }

  /* Cifras que resumen la operación, para la portada. */
  function pintarCifras(contenedor, d) {
    var totalCajas = d.ofertas.reduce(function (a, b) { return a + b; }, 0);
    var mejor = Math.min.apply(null, window.Transporte.resolverTodos(d).map(function (r) {
      return r.costoTotal;
    }));
    var cifras = [
      [String(d.origenes.length), "Centros de distribución"],
      [String(d.destinos.length), "Empresas de paquetería"],
      [String(totalCajas), "Cajas por " + (d.periodo || "semana")],
      [quetzales(mejor), "Costo semanal óptimo"]
    ];
    contenedor.innerHTML = cifras.map(function (c) {
      return '<div class="cifra"><div class="valor">' + c[0] +
             '</div><div class="rotulo">' + c[1] + "</div></div>";
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var cifras = document.getElementById("cifras");
    if (cifras) {
      window.Interfaz.cargarDatos()
        .then(function (d) { pintarCifras(cifras, d); })
        .catch(function () { cifras.remove(); });
    }

    if (!document.getElementById("catalogo")) { return; }

    window.Interfaz.cargarDatos().then(function (d) {
      var e = d.empresa || {};

      var ficha = document.getElementById("ficha");
      if (ficha) {
        ficha.innerHTML =
          '<div class="tabla-scroll"><table class="matriz"><tbody>' +
          "<tr><th>Razón social</th><td style=\"text-align:left\">" + (e.razonSocial || e.nombre) + "</td></tr>" +
          "<tr><th>Giro</th><td style=\"text-align:left;white-space:normal\">" + (e.giro || "—") + "</td></tr>" +
          "<tr><th>Sede</th><td style=\"text-align:left\">" + (e.sede || "—") + "</td></tr>" +
          "<tr><th>En operación desde</th><td style=\"text-align:left\">" + (e.fundacion || "—") + "</td></tr>" +
          "<tr><th>Clientes</th><td style=\"text-align:left;white-space:normal\">" + (e.clientes || "—") + "</td></tr>" +
          "<tr><th>Centros de distribución</th><td style=\"text-align:left\">" + d.origenes.length + "</td></tr>" +
          "<tr><th>Empresas de paquetería</th><td style=\"text-align:left\">" + d.destinos.length + "</td></tr>" +
          "<tr><th>Volumen despachado</th><td style=\"text-align:left\">" +
            d.ofertas.reduce(function (a, b) { return a + b; }, 0) + " cajas por " +
            (d.periodo || "semana") + "</td></tr>" +
          "</tbody></table></div>";
      }

      var desc = document.getElementById("descripcion-empresa");
      if (desc) {
        desc.textContent = e.descripcion || "";
        desc.classList.remove("cargando");
      }

      document.getElementById("catalogo").innerHTML = tablaCatalogo(d);
      document.getElementById("centros").innerHTML = tablaCentros(d);
      document.getElementById("paqueterias").innerHTML = tablaPaqueterias(d);

      var notas = document.getElementById("notas-costos");
      if (notas) { notas.innerHTML = notasCostos(d); }
    }).catch(function (err) {
      document.getElementById("catalogo").innerHTML =
        '<p class="aviso">No se pudieron cargar los datos: ' + err.message + "</p>";
    });
  });
})();
