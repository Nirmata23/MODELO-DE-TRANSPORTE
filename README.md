# GuateNet · Modelos de Transporte

Proyecto de Investigación de Operaciones. **GuateNet** es una distribuidora
mayorista de equipo de redes y telecomunicaciones —routers, switches, access
points, cable UTP, conectores RJ45, patch panels, racks y herramienta— que cada
semana despacha 150 cajas desde cinco centros de distribución por medio de seis
empresas de paquetería, y necesita repartirlas al menor costo posible.

Una sola dirección abre la **página principal**, y desde ahí los botones llevan
a cada ítem: la empresa, el planteamiento, los tres métodos de solución, la
comparación de resultados, una calculadora interactiva y la documentación con la
evidencia del procedimiento.

> GuateNet es una empresa ficticia creada para este ejercicio académico.

**Enlace del proyecto:** https://nirmata23.github.io/modelo-de-transporte/

---

## Qué contiene

| # | Ítem | Página |
|---|------|--------|
| 1 | La empresa | `empresa.html` |
| 2 | Planteamiento del problema | `planteamiento.html` |
| 3 | Esquina Noroeste | `esquina-noroeste.html` |
| 4 | Costo Mínimo | `costo-minimo.html` |
| 5 | Método de Vogel | `vogel.html` |
| 6 | Comparación de los tres métodos | `comparacion.html` |
| 7 | Calculadora interactiva | `calculadora.html` |
| 8 | Documentación y evidencia | `documentacion.html` |

## Resultados

El modelo tiene 5 centros de distribución y 6 empresas de paquetería, con oferta
y demanda de 150 cajas semanales cada una, por lo que está balanceado. Los tres métodos programados reproducen
exactamente los totales calculados a mano por el grupo:

| Método | A mano | Programa |
|---|---|---|
| Esquina Noroeste | Q 9,982.70 | Q 9,982.70 |
| Costo Mínimo | Q 8,450.35 | Q 8,450.35 |
| Aproximación de Vogel | Q 8,450.35 | Q 8,450.35 |

## Cómo está armado

```
index.html              página principal con los botones
empresa.html            …y una página por cada ítem
datos.json              la empresa, el catálogo, los centros y la matriz de costos
assets/css/estilos.css  estilos del sitio
assets/js/transporte.js los tres métodos en JavaScript
assets/js/galeria.js    galería que se llena sola desde GitHub
assets/js/empresa.js    ficha, catálogo y cifras de la empresa
assets/js/…             interfaz, calculadora y comparación
python/transporte.py    los tres métodos en Python
python/pruebas.py       comprobaciones contra las hojas de trabajo
imagenes/               las fotos del procedimiento, por sección
```

Nada está escrito a mano en el HTML: el catálogo, los centros de distribución,
las tarifas y los resultados salen todos de `datos.json` y se arman al cargar la
página. Para cambiar el problema —o la empresa entera— basta con editar ese
archivo, o usar la calculadora y pulsar **Descargar datos.json**.

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

Las páginas leen `datos.json`, así que hay que servirlas por HTTP. **Abrir
`index.html` con doble clic no funciona**: el navegador bloquea la lectura del
archivo de datos y las tablas salen vacías.

**Opción 1 — desde la terminal** (no requiere instalar nada):

```bash
python3 -m http.server 8000
# luego abrir http://localhost:8000
```

En Windows, si `python3` no existe, usar `py -m http.server 8000`.

**Opción 2 — desde Visual Studio Code:**

1. Abrir la carpeta del proyecto: *File → Open Folder…*
2. Instalar la extensión **Live Server** (de Ritwick Dey) desde el panel de
   extensiones.
3. Clic derecho sobre `index.html` → **Open with Live Server**.

Se abre solo en el navegador y se recarga cada vez que se guarda un archivo.

> Con Live Server las galerías cargan desde el repositorio publicado en GitHub.
> Si no hay internet, usan el respaldo `lista.json` de cada carpeta y las fotos
> se ven igual porque están incluidas en el proyecto.

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
