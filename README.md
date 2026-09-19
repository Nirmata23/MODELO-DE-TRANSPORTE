# Modelos de Transporte

Sitio del proyecto de Investigación de Operaciones. Una sola dirección abre la
**página principal**, y desde ahí los botones llevan a cada ítem solicitado:
planteamiento, los tres métodos de solución, la comparación de resultados, una
calculadora interactiva y la documentación con la evidencia del procedimiento.

**Enlace del proyecto:** https://nirmata23.github.io/modelo-de-transporte/

---

## Qué contiene

| # | Ítem | Página |
|---|------|--------|
| 1 | Planteamiento del problema | `planteamiento.html` |
| 2 | Esquina Noroeste | `esquina-noroeste.html` |
| 3 | Costo Mínimo | `costo-minimo.html` |
| 4 | Método de Vogel | `vogel.html` |
| 5 | Comparación de los tres métodos | `comparacion.html` |
| 6 | Calculadora interactiva | `calculadora.html` |
| 7 | Documentación y evidencia | `documentacion.html` |

## Resultados

El problema tiene 5 orígenes y 6 destinos, con oferta y demanda de 150 unidades
cada una, por lo que está balanceado. Los tres métodos programados reproducen
exactamente los totales calculados a mano por el grupo:

| Método | A mano | Programa |
|---|---|---|
| Esquina Noroeste | Q 9,982.70 | Q 9,982.70 |
| Costo Mínimo | Q 8,450.35 | Q 8,450.35 |
| Aproximación de Vogel | Q 8,450.35 | Q 8,450.35 |

## Cómo está armado

```
index.html              página principal con los botones
planteamiento.html      …y una página por cada ítem
datos.json              el planteamiento: costos, ofertas y demandas
assets/css/estilos.css  estilos del sitio
assets/js/transporte.js los tres métodos en JavaScript
assets/js/galeria.js    galería que se llena sola desde GitHub
assets/js/…             interfaz, calculadora y comparación
python/transporte.py    los tres métodos en Python
python/pruebas.py       comprobaciones contra las hojas de trabajo
imagenes/               las fotos del procedimiento, por sección
```

Los números que se ven en el sitio no están escritos a mano en el HTML: se
calculan en el momento a partir de `datos.json`. Para cambiar el problema basta
con editar ese archivo —o usar la calculadora y pulsar **Descargar datos.json**—
y todas las páginas se actualizan solas.

## Agregar fotos

Sube la imagen a la carpeta de su sección y aparecerá sola, sin tocar código:

- `imagenes/esquina-noroeste/`
- `imagenes/costo-minimo/`
- `imagenes/vogel/`
- `imagenes/documentacion/`

Conviene numerar los archivos (`01-…`, `02-…`) porque el sitio los ordena por
nombre. Los detalles están en [`imagenes/LEEME.md`](imagenes/LEEME.md).

## Programa en Python

```bash
python3 python/transporte.py                 # resuelve con los tres métodos
python3 python/transporte.py --metodo vogel  # sólo un método
python3 python/transporte.py --json          # salida en JSON
python3 python/pruebas.py                    # comprobaciones
```

No necesita instalar nada: sólo Python 3.

## Ver el sitio en la computadora

Las páginas leen `datos.json`, así que hay que servirlas por HTTP (abrir el
archivo directamente con doble clic no funciona):

```bash
python3 -m http.server 8000
# luego abrir http://localhost:8000
```

## Publicar

En GitHub: **Settings → Pages → Source: Deploy from a branch**, rama `main`,
carpeta `/ (root)`. En un par de minutos queda publicado en la dirección de
arriba.

## Integrantes

| Nombre | Carné |
|---|---|
| Andy Giancarlo Choreque Gómez | 0910-24-9155 |
| Bryan David Ramírez Gutiérrez | 0910-24-8939 |
| Jefferson Emilio Gómez López | 0910-24-6598 |
| Kevin Daniel Quexel Sal | 0910-24-8217 |
| Maycol Alfredo Inay Ovalle | 0910-24-9760 |
