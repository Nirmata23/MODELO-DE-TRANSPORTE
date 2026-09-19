# Cómo agregar imágenes al sitio

Cada carpeta de aquí corresponde a una sección de la página. Para que una foto
aparezca **no hay que tocar código**: basta con subirla a la carpeta que le toca.

| Carpeta | Dónde aparece |
|---|---|
| `esquina-noroeste/` | Página *Esquina Noroeste* |
| `costo-minimo/` | Página *Costo Mínimo* |
| `vogel/` | Página *Método de Vogel* |
| `documentacion/` | Página *Documentación y evidencia* |

## Subirlas desde el navegador

1. Entra a la carpeta en GitHub.
2. Botón **Add file → Upload files**.
3. Arrastra las fotos y pulsa **Commit changes**.
4. Espera un minuto y recarga la página: ya aparecen.

## Nombres de archivo

El sitio ordena las imágenes por nombre y arma el título a partir de él,
quitando el número del inicio y cambiando los guiones por espacios:

- `01-paso-1.jpg` → se muestra como **Paso 1**
- `02-tabla-final.jpg` → se muestra como **Tabla final**

Por eso conviene numerarlas: `01-…`, `02-…`, `03-…`

Formatos aceptados: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.avif`, `.bmp`

## Sobre `lista.json`

En cada carpeta hay un `lista.json`. Es sólo un **respaldo** para cuando la API
de GitHub no responde. El sitio lee primero la carpeta real, así que si subes
una foto nueva y no actualizas ese archivo, igual se ve. Si quieres mantenerlo
al día, agrega el nombre del archivo nuevo a la lista.
