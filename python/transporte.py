#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import dataclass, field
from typing import Dict, List, Optional

EPS = 1e-9
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATOS_POR_DEFECTO = os.path.join(RAIZ, "datos.json")

@dataclass
class Paso:
    numero: int
    fila: int
    columna: int
    origen: str
    destino: str
    cantidad: float
    costo_unitario: float
    nota: str = ""

    @property
    def subtotal(self) -> float:
        return self.cantidad * self.costo_unitario

@dataclass
class Resultado:
    metodo: str
    origenes: List[str]
    destinos: List[str]
    costos: List[List[float]]
    ofertas: List[float]
    demandas: List[float]
    asignacion: List[List[Optional[float]]]
    pasos: List[Paso] = field(default_factory=list)
    ajuste: Optional[Dict] = None

    @property
    def costo_total(self) -> float:
        return sum(p.subtotal for p in self.pasos)

    @property
    def celdas_requeridas(self) -> int:
        return len(self.origenes) + len(self.destinos) - 1

    def a_dict(self) -> Dict:
        return {
            "metodo": self.metodo,
            "origenes": self.origenes,
            "destinos": self.destinos,
            "asignacion": self.asignacion,
            "costoTotal": round(self.costo_total, 2),
            "celdasOcupadas": len(self.pasos),
            "celdasRequeridas": self.celdas_requeridas,
            "ajuste": self.ajuste,
            "pasos": [
                {
                    "numero": p.numero,
                    "origen": p.origen,
                    "destino": p.destino,
                    "cantidad": p.cantidad,
                    "costoUnitario": p.costo_unitario,
                    "subtotal": round(p.subtotal, 2),
                    "nota": p.nota,
                }
                for p in self.pasos
            ],
        }

def balancear(datos: Dict) -> Dict:
    origenes = list(datos["origenes"])
    destinos = list(datos["destinos"])
    costos = [list(fila) for fila in datos["costos"]]
    ofertas = [float(v) for v in datos["ofertas"]]
    demandas = [float(v) for v in datos["demandas"]]

    total_oferta, total_demanda = sum(ofertas), sum(demandas)
    ajuste = None

    if total_oferta > total_demanda + EPS:
        sobra = total_oferta - total_demanda
        destinos.append("Ficticio")
        demandas.append(sobra)
        for fila in costos:
            fila.append(0.0)
        ajuste = {"tipo": "destino", "cantidad": sobra}
    elif total_demanda > total_oferta + EPS:
        falta = total_demanda - total_oferta
        origenes.append("Ficticio")
        ofertas.append(falta)
        costos.append([0.0] * len(demandas))
        ajuste = {"tipo": "origen", "cantidad": falta}

    return {
        "origenes": origenes, "destinos": destinos, "costos": costos,
        "ofertas": ofertas, "demandas": demandas, "ajuste": ajuste,
    }

class _Tablero:

    def __init__(self, datos: Dict, metodo: str):
        b = balancear(datos)
        self.origenes = b["origenes"]
        self.destinos = b["destinos"]
        self.costos = b["costos"]
        self.ofertas = b["ofertas"]
        self.demandas = b["demandas"]
        self.ajuste = b["ajuste"]

        self.oferta_restante = list(self.ofertas)
        self.demanda_restante = list(self.demandas)
        self.asignacion = [[None] * len(self.destinos) for _ in self.origenes]
        self.filas_vivas = list(range(len(self.origenes)))
        self.columnas_vivas = list(range(len(self.destinos)))
        self.pasos: List[Paso] = []
        self.metodo = metodo

    @property
    def activo(self) -> bool:
        return bool(self.filas_vivas) and bool(self.columnas_vivas)

    def asignar(self, i: int, j: int, nota: str = "") -> Paso:
        cantidad = min(self.oferta_restante[i], self.demanda_restante[j])
        if cantidad < EPS:
            cantidad = 0.0

        self.asignacion[i][j] = cantidad
        self.oferta_restante[i] -= cantidad
        self.demanda_restante[j] -= cantidad

        fila_agotada = self.oferta_restante[i] <= EPS
        columna_agotada = self.demanda_restante[j] <= EPS
        if fila_agotada and columna_agotada:
            if len(self.filas_vivas) > 1:
                columna_agotada = False
            else:
                fila_agotada = False

        if fila_agotada:
            self.filas_vivas.remove(i)
        if columna_agotada:
            self.columnas_vivas.remove(j)

        paso = Paso(
            numero=len(self.pasos) + 1, fila=i, columna=j,
            origen=self.origenes[i], destino=self.destinos[j],
            cantidad=cantidad, costo_unitario=self.costos[i][j], nota=nota,
        )
        self.pasos.append(paso)
        return paso

    def resultado(self) -> Resultado:
        return Resultado(
            metodo=self.metodo, origenes=self.origenes, destinos=self.destinos,
            costos=self.costos, ofertas=self.ofertas, demandas=self.demandas,
            asignacion=self.asignacion, pasos=self.pasos, ajuste=self.ajuste,
        )

def _fmt(n: float) -> str:
    return str(int(round(n))) if abs(n - round(n)) < 1e-6 else "{:.2f}".format(n)

def esquina_noroeste(datos: Dict) -> Resultado:
    t = _Tablero(datos, "Esquina Noroeste")
    while t.activo:
        t.asignar(t.filas_vivas[0], t.columnas_vivas[0],
                  "Esquina superior izquierda disponible")
    return t.resultado()

def costo_minimo(datos: Dict) -> Resultado:
    t = _Tablero(datos, "Costo Mínimo")
    while t.activo:
        i, j = min(
            ((i, j) for i in t.filas_vivas for j in t.columnas_vivas),
            key=lambda c: t.costos[c[0]][c[1]],
        )
        t.asignar(i, j, "Celda de menor costo disponible ({})".format(_fmt(t.costos[i][j])))
    return t.resultado()

def _penalizacion(valores: List[float]) -> float:
    if len(valores) < 2:
        return 0.0
    a, b = sorted(valores)[:2]
    return b - a

def vogel(datos: Dict) -> Resultado:
    t = _Tablero(datos, "Aproximación de Vogel")

    while t.activo:
        if len(t.filas_vivas) == 1 or len(t.columnas_vivas) == 1:
            if len(t.filas_vivas) == 1:
                i = t.filas_vivas[0]
                j = min(t.columnas_vivas, key=lambda c: t.costos[i][c])
            else:
                j = t.columnas_vivas[0]
                i = min(t.filas_vivas, key=lambda f: t.costos[f][j])
            t.asignar(i, j, "Última fila o columna viva: se completa directamente")
            continue

        candidatos = []
        for i in t.filas_vivas:
            valor = _penalizacion([t.costos[i][j] for j in t.columnas_vivas])
            candidatos.append((valor, "fila", i, t.origenes[i]))
        for j in t.columnas_vivas:
            valor = _penalizacion([t.costos[i][j] for i in t.filas_vivas])
            candidatos.append((valor, "columna", j, t.destinos[j]))

        valor, tipo, indice, etiqueta = max(candidatos, key=lambda c: c[0])

        if tipo == "fila":
            i = indice
            j = min(t.columnas_vivas, key=lambda c: t.costos[i][c])
        else:
            j = indice
            i = min(t.filas_vivas, key=lambda f: t.costos[f][j])

        t.asignar(i, j, "Penalización mayor: {} en {}".format(_fmt(valor), etiqueta))

    return t.resultado()

METODOS = {
    "noroeste": esquina_noroeste,
    "minimo": costo_minimo,
    "vogel": vogel,
}

def resolver_todos(datos: Dict) -> List[Resultado]:
    return [esquina_noroeste(datos), costo_minimo(datos), vogel(datos)]

def imprimir(r: Resultado, unidad: str = "") -> None:
    ancho = max(14, max(len(o) for o in r.origenes) + 2)
    columnas = [d[:11] for d in r.destinos]

    print()
    print("=" * 72)
    print(r.metodo.upper())
    print("=" * 72)

    if r.ajuste:
        print("Se agregó un {} ficticio de {} unidades para balancear.".format(
            r.ajuste["tipo"], _fmt(r.ajuste["cantidad"])))
        print()

    encabezado = "".ljust(ancho) + "".join(c.rjust(12) for c in columnas) + "Oferta".rjust(10)
    print(encabezado)
    print("-" * len(encabezado))
    for i, origen in enumerate(r.origenes):
        fila = origen.ljust(ancho)
        for j in range(len(r.destinos)):
            v = r.asignacion[i][j]
            fila += ("·" if v is None else _fmt(v)).rjust(12)
        fila += _fmt(r.ofertas[i]).rjust(10)
        print(fila)
    pie = "Demanda".ljust(ancho) + "".join(_fmt(d).rjust(12) for d in r.demandas)
    pie += _fmt(sum(r.ofertas)).rjust(10)
    print("-" * len(encabezado))
    print(pie)

    print()
    print("Asignaciones en orden:")
    for p in r.pasos:
        print("  {:>2}. {} → {}".format(p.numero, p.origen, p.destino))
        print("      {} × {}{} = {}{:,.2f}   ({})".format(
            _fmt(p.cantidad), unidad, _fmt(p.costo_unitario),
            unidad, p.subtotal, p.nota))

    print()
    print("  Celdas básicas ocupadas: {} de {}".format(len(r.pasos), r.celdas_requeridas))
    print("  COSTO TOTAL: {}{:,.2f}".format(unidad, r.costo_total))

def cargar_datos(ruta: str) -> Dict:
    with open(ruta, encoding="utf-8") as fh:
        return json.load(fh)

def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser(description="Resuelve un modelo de transporte.")
    ap.add_argument("--datos", default=DATOS_POR_DEFECTO,
                    help="archivo JSON con el planteamiento (por defecto: datos.json)")
    ap.add_argument("--metodo", choices=sorted(METODOS) + ["todos"], default="todos",
                    help="método a aplicar (por defecto: todos)")
    ap.add_argument("--json", action="store_true",
                    help="imprime el resultado en JSON en lugar de tablas")
    args = ap.parse_args(argv)

    try:
        datos = cargar_datos(args.datos)
    except FileNotFoundError:
        print("No se encontró el archivo de datos: {}".format(args.datos), file=sys.stderr)
        return 1
    except json.JSONDecodeError as err:
        print("El archivo de datos no es JSON válido: {}".format(err), file=sys.stderr)
        return 1

    unidad = datos.get("unidad", "")
    resultados = resolver_todos(datos) if args.metodo == "todos" else [METODOS[args.metodo](datos)]

    if args.json:
        print(json.dumps([r.a_dict() for r in resultados], ensure_ascii=False, indent=2))
        return 0

    print()
    print(datos.get("titulo", "Modelo de transporte"))
    print("Oferta total: {}   Demanda total: {}   →   {}".format(
        _fmt(sum(datos["ofertas"])), _fmt(sum(datos["demandas"])),
        "balanceado" if abs(sum(datos["ofertas"]) - sum(datos["demandas"])) < EPS
        else "NO balanceado"))

    for r in resultados:
        imprimir(r, unidad)

    if len(resultados) > 1:
        mejor = min(resultados, key=lambda r: r.costo_total)
        print()
        print("=" * 72)
        print("RESUMEN")
        print("=" * 72)
        for r in resultados:
            marca = "  ← menor costo" if r is mejor else ""
            print("  {:<26} {}{:>12,.2f}{}".format(r.metodo, unidad, r.costo_total, marca))
        print()

    return 0

if __name__ == "__main__":
    raise SystemExit(main())
