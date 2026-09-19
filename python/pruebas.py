#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprobaciones del solucionador.

Verifica dos cosas:
  1. Que los tres métodos reproducen los totales obtenidos a mano
     en las hojas de trabajo del grupo.
  2. Que las soluciones son factibles: respetan ofertas y demandas.

Uso:  python3 python/pruebas.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from transporte import (  # noqa: E402
    DATOS_POR_DEFECTO, cargar_datos, costo_minimo, esquina_noroeste, vogel,
)

TOLERANCIA = 0.005
fallos = []


def comprobar(condicion, descripcion, detalle=""):
    estado = "OK  " if condicion else "FALLA"
    print("  [{}] {}{}".format(estado, descripcion, ("  — " + detalle) if detalle and not condicion else ""))
    if not condicion:
        fallos.append(descripcion)


def factible(r, ofertas, demandas):
    """Comprueba que cada fila entrega su oferta y cada columna recibe su demanda."""
    for i, oferta in enumerate(ofertas):
        enviado = sum(v or 0 for v in r.asignacion[i])
        if abs(enviado - oferta) > TOLERANCIA:
            return False, "fila {} envía {} y su oferta es {}".format(i + 1, enviado, oferta)
    for j, demanda in enumerate(demandas):
        recibido = sum((r.asignacion[i][j] or 0) for i in range(len(ofertas)))
        if abs(recibido - demanda) > TOLERANCIA:
            return False, "columna {} recibe {} y su demanda es {}".format(j + 1, recibido, demanda)
    return True, ""


def main():
    datos = cargar_datos(DATOS_POR_DEFECTO)
    esperados = datos.get("resultadosEsperados", {})

    print()
    print("Comprobando el solucionador contra las hojas de trabajo")
    print("=" * 62)

    total_oferta = sum(datos["ofertas"])
    total_demanda = sum(datos["demandas"])
    comprobar(abs(total_oferta - total_demanda) < TOLERANCIA,
              "El problema está balanceado ({} = {})".format(total_oferta, total_demanda))

    print()
    for funcion in (esquina_noroeste, costo_minimo, vogel):
        r = funcion(datos)
        print("{}:".format(r.metodo))

        if r.metodo in esperados:
            esperado = esperados[r.metodo]
            comprobar(
                abs(r.costo_total - esperado) < TOLERANCIA,
                "Costo total Q{:,.2f} coincide con la hoja (Q{:,.2f})".format(
                    r.costo_total, esperado),
                "el programa calculó Q{:,.2f}".format(r.costo_total),
            )

        ok, detalle = factible(r, datos["ofertas"], datos["demandas"])
        comprobar(ok, "La solución respeta todas las ofertas y demandas", detalle)

        comprobar(
            len(r.pasos) == r.celdas_requeridas,
            "Ocupa {} celdas básicas (se requieren {})".format(len(r.pasos), r.celdas_requeridas),
        )

        recalculado = sum((r.asignacion[i][j] or 0) * r.costos[i][j]
                          for i in range(len(r.origenes))
                          for j in range(len(r.destinos)))
        comprobar(abs(recalculado - r.costo_total) < TOLERANCIA,
                  "El costo total cuadra al recalcularlo desde la matriz")
        print()

    # Un problema desbalanceado debe completarse con una línea ficticia.
    print("Problema desbalanceado (caso extra):")
    desbalanceado = {
        "origenes": ["A", "B"], "destinos": ["X", "Y"],
        "costos": [[4, 6], [5, 3]], "ofertas": [30, 40], "demandas": [20, 25],
    }
    r = costo_minimo(desbalanceado)
    comprobar(r.ajuste is not None and r.ajuste["tipo"] == "destino",
              "Se agrega un destino ficticio para absorber el excedente")
    comprobar(abs(r.ajuste["cantidad"] - 25) < TOLERANCIA,
              "El destino ficticio recibe 25 unidades")
    print()

    print("=" * 62)
    if fallos:
        print("RESULTADO: {} comprobación(es) fallaron.".format(len(fallos)))
        return 1
    print("RESULTADO: todas las comprobaciones pasaron.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
