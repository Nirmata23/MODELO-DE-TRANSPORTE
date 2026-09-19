(function (global) {
  "use strict";

  var EPS = 1e-9;

  function copiarMatriz(m) {
    return m.map(function (fila) { return fila.slice(); });
  }

  function balancear(datos) {
    var costos = copiarMatriz(datos.costos);
    var origenes = datos.origenes.slice();
    var destinos = datos.destinos.slice();
    var ofertas = datos.ofertas.slice();
    var demandas = datos.demandas.slice();

    var totalOferta = ofertas.reduce(function (a, b) { return a + b; }, 0);
    var totalDemanda = demandas.reduce(function (a, b) { return a + b; }, 0);
    var ajuste = null;

    if (totalOferta > totalDemanda + EPS) {

      var sobra = totalOferta - totalDemanda;
      destinos.push("Ficticio");
      demandas.push(sobra);
      costos.forEach(function (fila) { fila.push(0); });
      ajuste = { tipo: "destino", cantidad: sobra };
    } else if (totalDemanda > totalOferta + EPS) {

      var falta = totalDemanda - totalOferta;
      origenes.push("Ficticio");
      ofertas.push(falta);
      costos.push(demandas.map(function () { return 0; }));
      ajuste = { tipo: "origen", cantidad: falta };
    }

    return {
      origenes: origenes, destinos: destinos,
      costos: costos, ofertas: ofertas, demandas: demandas,
      ajuste: ajuste,
      balanceadoOriginalmente: ajuste === null
    };
  }

  function asignar(estado, i, j, nota) {
    var cantidad = Math.min(estado.ofertaRestante[i], estado.demandaRestante[j]);
    if (cantidad <= EPS && estado.pasos.length > 0) {

      cantidad = 0;
    }

    estado.asignacion[i][j] = cantidad;
    estado.ofertaRestante[i] -= cantidad;
    estado.demandaRestante[j] -= cantidad;

    var costoUnitario = estado.costos[i][j];
    var subtotal = cantidad * costoUnitario;
    estado.costoTotal += subtotal;

    var filaAgotada = estado.ofertaRestante[i] <= EPS;
    var columnaAgotada = estado.demandaRestante[j] <= EPS;
    if (filaAgotada && columnaAgotada) {
      if (estado.filasVivas.length > 1) { filaAgotada = true; columnaAgotada = false; }
      else { filaAgotada = false; columnaAgotada = true; }
    }
    if (filaAgotada) {
      estado.filasVivas = estado.filasVivas.filter(function (f) { return f !== i; });
    }
    if (columnaAgotada) {
      estado.columnasVivas = estado.columnasVivas.filter(function (c) { return c !== j; });
    }

    var paso = {
      numero: estado.pasos.length + 1,
      i: i, j: j,
      origen: estado.origenes[i],
      destino: estado.destinos[j],
      cantidad: cantidad,
      costoUnitario: costoUnitario,
      subtotal: subtotal,
      nota: nota || "",
      tachaFila: filaAgotada,
      tachaColumna: columnaAgotada,
      ofertaRestante: estado.ofertaRestante.slice(),
      demandaRestante: estado.demandaRestante.slice()
    };
    estado.pasos.push(paso);
    return paso;
  }

  function crearEstado(datos) {
    var b = balancear(datos);
    var filas = b.costos.length;
    var columnas = b.costos[0].length;
    return {
      origenes: b.origenes, destinos: b.destinos, costos: b.costos,
      ofertas: b.ofertas, demandas: b.demandas, ajuste: b.ajuste,
      balanceadoOriginalmente: b.balanceadoOriginalmente,
      ofertaRestante: b.ofertas.slice(),
      demandaRestante: b.demandas.slice(),
      asignacion: b.costos.map(function () {
        return new Array(columnas).fill(null);
      }),
      filasVivas: Array.from({ length: filas }, function (_, i) { return i; }),
      columnasVivas: Array.from({ length: columnas }, function (_, j) { return j; }),
      pasos: [],
      costoTotal: 0
    };
  }

  function empaquetar(estado, metodo) {
    return {
      metodo: metodo,
      origenes: estado.origenes,
      destinos: estado.destinos,
      costos: estado.costos,
      ofertas: estado.ofertas,
      demandas: estado.demandas,
      asignacion: estado.asignacion,
      pasos: estado.pasos,
      costoTotal: estado.costoTotal,
      ajuste: estado.ajuste,
      balanceadoOriginalmente: estado.balanceadoOriginalmente,
      celdasOcupadas: estado.pasos.length,
      celdasRequeridas: estado.costos.length + estado.costos[0].length - 1
    };
  }

  function esquinaNoroeste(datos) {
    var e = crearEstado(datos);
    var guarda = 0;
    while (e.filasVivas.length > 0 && e.columnasVivas.length > 0 && guarda++ < 10000) {
      var i = e.filasVivas[0];
      var j = e.columnasVivas[0];
      asignar(e, i, j, "Esquina superior izquierda disponible");
    }
    return empaquetar(e, "Esquina Noroeste");
  }

  function costoMinimo(datos) {
    var e = crearEstado(datos);
    var guarda = 0;
    while (e.filasVivas.length > 0 && e.columnasVivas.length > 0 && guarda++ < 10000) {
      var mejorI = -1, mejorJ = -1, mejorCosto = Infinity;
      e.filasVivas.forEach(function (i) {
        e.columnasVivas.forEach(function (j) {
          if (e.costos[i][j] < mejorCosto - EPS) {
            mejorCosto = e.costos[i][j]; mejorI = i; mejorJ = j;
          }
        });
      });
      if (mejorI < 0) { break; }
      asignar(e, mejorI, mejorJ,
        "Celda de menor costo disponible (" + formatear(mejorCosto) + ")");
    }
    return empaquetar(e, "Costo Mínimo");
  }

  function dosMenores(valores) {
    var ordenados = valores.slice().sort(function (a, b) { return a - b; });
    if (ordenados.length === 0) { return null; }
    if (ordenados.length === 1) { return [ordenados[0], ordenados[0]]; }
    return [ordenados[0], ordenados[1]];
  }

  function vogel(datos) {
    var e = crearEstado(datos);
    var guarda = 0;

    while (e.filasVivas.length > 0 && e.columnasVivas.length > 0 && guarda++ < 10000) {
      if (e.filasVivas.length === 1 || e.columnasVivas.length === 1) {

        var iU = e.filasVivas[0], jU = e.columnasVivas[0];
        if (e.filasVivas.length === 1) {
          jU = e.columnasVivas.reduce(function (mejor, j) {
            return e.costos[iU][j] < e.costos[iU][mejor] ? j : mejor;
          }, e.columnasVivas[0]);
        } else {
          iU = e.filasVivas.reduce(function (mejor, i) {
            return e.costos[i][jU] < e.costos[mejor][jU] ? i : mejor;
          }, e.filasVivas[0]);
        }
        asignar(e, iU, jU, "Última fila o columna viva: se completa directamente");
        continue;
      }

      var penalizaciones = [];
      e.filasVivas.forEach(function (i) {
        var par = dosMenores(e.columnasVivas.map(function (j) { return e.costos[i][j]; }));
        penalizaciones.push({ tipo: "fila", indice: i, valor: par[1] - par[0] });
      });
      e.columnasVivas.forEach(function (j) {
        var par = dosMenores(e.filasVivas.map(function (i) { return e.costos[i][j]; }));
        penalizaciones.push({ tipo: "columna", indice: j, valor: par[1] - par[0] });
      });

      var mayor = penalizaciones.reduce(function (a, b) {
        return b.valor > a.valor + EPS ? b : a;
      }, penalizaciones[0]);

      var i2, j2;
      if (mayor.tipo === "fila") {
        i2 = mayor.indice;
        j2 = e.columnasVivas.reduce(function (mejor, j) {
          return e.costos[i2][j] < e.costos[i2][mejor] ? j : mejor;
        }, e.columnasVivas[0]);
      } else {
        j2 = mayor.indice;
        i2 = e.filasVivas.reduce(function (mejor, i) {
          return e.costos[i][j2] < e.costos[mejor][j2] ? i : mejor;
        }, e.filasVivas[0]);
      }

      var etiqueta = mayor.tipo === "fila" ? e.origenes[mayor.indice] : e.destinos[mayor.indice];
      var paso = asignar(e, i2, j2,
        "Penalización mayor: " + formatear(mayor.valor) + " en " + etiqueta);
      paso.penalizaciones = penalizaciones.map(function (p) {
        return {
          tipo: p.tipo, valor: p.valor,
          etiqueta: p.tipo === "fila" ? e.origenes[p.indice] : e.destinos[p.indice]
        };
      });
    }
    return empaquetar(e, "Aproximación de Vogel");
  }

  function formatear(n) {
    if (Math.abs(n - Math.round(n)) < 1e-6) { return String(Math.round(n)); }
    return n.toFixed(2);
  }

  function resolverTodos(datos) {
    var resultados = [esquinaNoroeste(datos), costoMinimo(datos), vogel(datos)];
    var minimo = Math.min.apply(null, resultados.map(function (r) { return r.costoTotal; }));
    resultados.forEach(function (r) { r.esMejor = Math.abs(r.costoTotal - minimo) < 1e-6; });
    return resultados;
  }

  var api = {
    balancear: balancear,
    esquinaNoroeste: esquinaNoroeste,
    costoMinimo: costoMinimo,
    vogel: vogel,
    resolverTodos: resolverTodos,
    formatear: formatear
  };

  if (typeof module !== "undefined" && module.exports) { module.exports = api; }
  global.Transporte = api;
})(typeof window !== "undefined" ? window : globalThis);
