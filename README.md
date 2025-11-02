## Resumen

`fsDocumentStructures` es una pequeña aplicación front-end para definir y administrar estructuras de documentos (tablas) y sus campos. Permite crear, editar y serializar la definición de tablas con sus respectivos campos, exportarlas a un formato compatible con Firestore y gestionarlas desde una interfaz con modales y tablas dinámicas.

## Estructura de carpetas

Raíz:
- `index.html` — Página principal que carga la UI.
- `README.md` — (este archivo) documentación del proyecto.

Carpeta `assets/`:
- `datatables/` — Configuración y traducciones para DataTables (`es-ES.json`).
- `sweetalert2/` — Integración con SweetAlert2 (`bootstrap-5.css`, `swal.js`).

Carpeta `js/`:
- `app.js` — Inicialización de la aplicación, DataTables y exposición de variables globales compartidas.
- `backend.js` — Modelos principales: `dataDocument`, `field`, `fieldList` y helpers para serialización/deserialización.
- `utilities.js` — Utilidades de UI y helpers reutilizables (p. ej. renderizado de filas).
- `forms.js` — Lógica de los formularios y modales (crear/editar tablas y campos).
- `firebase/`:
	- `firebaseCRUD.js` — Abstracción de llamadas a Firestore (get/create/update/delete).
	- `firebaseService.js` — Inicialización / helpers de Firebase (si aplica).
	- `variablesMock.env.js` — Lugar para introducir (local) variables de configuración de Firebase en desarrollo.

## Funcionalidad principal

- Crear y editar definiciones de tablas (identificador, descripción, flags de visibilidad/privacidad/estado).
- Crear, editar, reordenar y eliminar campos de una tabla (tipo, nombre en ES/EN, longitud máxima, flags).
- Serializar la estructura a un objeto compatible con Firestore y guardar/recuperar mediante la capa `firebaseCRUD`.
- Interfaz basada en DataTables para listar tablas y campos, con modales para creación/edición y toasts/alerts con SweetAlert2.

## Arquitectura y decisiones

- Patrón: arquitectura modular basada en ES modules. Separación entre modelos (`backend.js`), UI y lógica de formularios (`forms.js`), inicialización y tablas (`app.js`) y persistencia (`firebase/*`).
- Separación de responsabilidades: cada archivo tiene una responsabilidad clara (modelo, presentación, persistencia). Se usan funciones exportadas y variables globales mínimas para compartir estado mutable entre módulos cuando es necesario.
- Dependencias principales:
	- DataTables (para tablas interactivas)
	- Bootstrap (componentes UI y modales)
	- SweetAlert2 (alertas y confirmaciones)
	- Firebase (opcional, para persistencia en Firestore)

Decisiones importantes:
- Se expusieron ciertas variables y funciones en `window` (p. ej. `window.currentTable`, `window.tableAddedFields`, `window.refreshDisplayTablesTable`) para evitar problemas de orden de carga entre módulos y facilitar la comunicación entre scripts que se cargan en el navegador sin bundler.
- Las estructuras de datos (clases `field` / `fieldList`) manejan la conversión a/desde objetos planos para facilitar el almacenamiento en Firestore.

## Cómo ejecutar

Requisitos mínimos: un navegador moderno y, para pruebas locales, un servidor estático o la extensión Live Server de VS Code. (Opcionalmente Node y Python si quiere usar un servidor simple).

1) Abrir con Live Server (recomendado):

	 - Instala la extensión "Live Server" en VS Code y abre `index.html` con "Open with Live Server".

2) Servidor estático con Python (si tienes Python instalado):

```powershell
cd C:\Alexis\CoderHouse\Javascript\DataStructures
python -m http.server 8000
# Abrir http://localhost:8000 en el navegador
```

3) Configurar Firebase (si vas a usar persistencia):

- Añade tus credenciales/local config en `js/firebase/variablesMock.env.js` o implementa un archivo equivalente con tus claves. No subas secretos al repositorio.

4) Abrir la app en el navegador y usar la interfaz para crear tablas y campos.

## Notas para desarrolladores

- Para revisar sintaxis rápida de archivos JS puedes usar:

```powershell
node --check js/backend.js
node --check js/forms.js
```

- Estructura de modelos:
	- `dataDocument` encapsula la tabla y delega la gestión de campos a `fieldList`.
	- `fieldList` actúa como un mapa/colección de instancias `field` y ofrece utilidades para serializar y reindexar.

- Si vas a modificar la persistencia con Firebase, prueba primero en un proyecto de prueba y añade variables de entorno locales.

## Sugerencias de mejora

- Añadir un bundler (Webpack, Vite) o convertir el proyecto a TypeScript para mejorar seguridad de tipos y modularidad.
- Añadir ESLint + Prettier para consistencia de estilo.
- Añadir unit tests (Jest/Mocha) para `fieldList` y `dataDocument` (operaciones add/edit/remove/move/serialize).
- Eliminar o reducir la dependencia de `window` exponiendo un entrypoint único que inicialice y pase dependencias (evitar variables globales compartidas).

## Licencia

Uso educativo y modificaciones personales permitidas. Este repositorio se comparte con finalidad didáctica: puedes estudiar, modificar y usar el código con fines educativos y personales, pero no sublicenciar ni comercializar el contenido sin permiso explícito del autor.

---

# fsDocumentStructures