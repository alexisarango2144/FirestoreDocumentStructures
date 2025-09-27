# FirestoreDocumentStructures

Este proyecto permite modelar y gestionar la estructura de documentos para bases de datos Firebase Firestore, facilitando la configuración de futuras "tablas" (colecciones de documentos) de manera visual y dinámica.

## Objetivo

Proveer una interfaz para definir, editar y visualizar la estructura de documentos Firestore, permitiendo:
- Crear y configurar campos con propiedades como tipo, longitud, visibilidad, buscabilidad, etc.
- Simular la estructura de colecciones y documentos antes de implementarlas en Firebase.
- Exportar la configuración para su uso en proyectos reales.

## Características
- Interfaz web con Bootstrap 5 y DataTables.js.
- Modal para agregar y editar campos de cada documento.
- Validación de unicidad de campos y confirmación de sobrescritura.
- Visualización en tabla de todos los campos y sus propiedades.
- Código modular y orientado a objetos (ES6).

## Estructura principal
- `index.html`: Interfaz principal y modales.
- `js/app.js`: Lógica de UI, eventos y renderizado.
- `js/backend.js`: Clases para modelar documentos y campos.
- `datatables/es-ES.json`: Traducción de DataTables.

## Uso
1. Clona el repositorio y abre `index.html` en tu navegador.
2. Usa el botón "Añadir campo" para definir los campos de tu documento.
3. Edita o elimina campos según necesidad.
4. Visualiza la estructura final antes de implementarla en Firestore.

## Ejemplo de estructura generada
```json
{
  "patientsMain": {
    "tableDescriptionEs": "Pacientes",
    "tableDescriptionEn": "Patients",
    "fields": {
      "primerNombre": {
        "fieldCode": "primerNombre",
        "index": 0,
        "fieldDataType": "string",
        "fieldNameEs": "Primer Nombre",
        "fieldNameEn": "First Name",
        "fieldMaxLength": 50,
        "isRequired": true,
        "isVisible": true,
        "isEditable": true,
        "isSearchable": false,
        "isAdminPrivative": true,
        "isEnabled": true
      },
      "segundoNombre": {
        "fieldCode": "segundoNombre",
        "index": 1,
        "fieldDataType": "string",
        "fieldNameEs": "Segundo Nombre",
        "fieldNameEn": "Second Name",
        "fieldMaxLength": 50,
        "isRequired": false,
        "isVisible": true,
        "isEditable": true,
        "isSearchable": false,
        "isAdminPrivative": true,
        "isEnabled": true
      },
      "primerApellido": {
        "fieldCode": "primerApellido",
        "index": 2,
        "fieldDataType": "string",
        "fieldNameEs": "Primer Apellido",
        "fieldNameEn": "Last Name",
        "fieldMaxLength": 50,
        "isRequired": true,
        "isVisible": true,
        "isEditable": true,
        "isSearchable": false,
        "isAdminPrivative": true,
        "isEnabled": true
      },
      ...
      "entidadResponsable": {
        "fieldCode": "entidadResponsable",
        "index": 7,
        "fieldDataType": "string",
        "fieldNameEs": "Entidad Responsable",
        "fieldNameEn": "Responsible Entity",
        "fieldMaxLength": 100,
        "isRequired": true,
        "isVisible": true,
        "isEditable": true,
        "isSearchable": false,
        "isAdminPrivative": true,
        "isEnabled": true
      }
    },
    "isVisible": true,
    "isAdminPrivative": true,
    "isEnabled": true
  }
}
```

## Autor
- @alexisarango2144

## Entrega para
- Curso JS de CoderHouse

## Licencia
MIT
