import { runOnDomReady } from './utilities.js';
import { inicializarBotonesFormularios, setFieldModalMode } from './forms.js';
import { dataDocument, field, fieldList, readAllDocuments } from './backend.js';
import { sAlert, sToast } from '../assets/sweetalert2/swal.js';

let editingTableCode = null;
let editingFieldCode = null;
let currentTable = new dataDocument();
let currentField = new field();
// FieldList temporal para la creación de nuevas tablas
let tableTempFieldList = new fieldList();
currentTable.fields = tableTempFieldList;
// Variables compartidas en window para que otros módulos (forms.js) puedan accederlas
window.currentTable = currentTable;
window.currentField = currentField;
window.tableTempFieldList = tableTempFieldList;
// DataTable para mostrar las tablas creadas
let createdDisplayTables;

// Crear la instancia de DataTable para las tablas creadas
createdDisplayTables = new DataTable('#createdDisplayTables', {
    layout: {
        topStart: null,
        topEnd: {
            search: {
                placeholder: 'Buscar aquí'
            }
        },
        bottomStart: null,
        bottom: ['pageLength', 'info', 'paging'],
        bottomEnd: null
    },
    responsive: true,
    paging: true,
    language: {
        url: './assets/datatables/es-ES.json',
    },
    data: [],
    columns: [
        { title: 'ID de la tabla' },
        { title: 'Descripción (ES)' },
        { title: 'Description (EN)' },
        { title: 'Visible' },
        { title: 'Solo admin' },
        { title: 'Habilitada' },
        { title: 'Acciones' }
    ],
    columnDefs: [
        // Centrar las columnas de checkboxes y acciones
        { className: "dt-center", targets: [3, 4, 5, 6] }
    ]
});
// Exponer la referencia de la tabla creada en window
window.createdDisplayTables = createdDisplayTables;

const tableAddedFields = new DataTable('#tableAddedFields', {
    layout: {
        topStart: null,
        topEnd: {
            search: {
                placeholder: 'Buscar aquí'
            }
        },
        bottomStart: null,
        bottom: ['pageLength', 'info', 'paging'],
        bottomEnd: null
    },
    responsive: true,
    paging: true,
    rowReorder: {
        dataSrc: 0
    },
    language: {
        url: './assets/datatables/es-ES.json',
    },
    columns: [
        { title: "Index" },
        { title: "ID" },
        { title: "Tipo" },
        { title: "Descripción (ES)" },
        { title: "Visible", sortable: false, searchable: false },
        { title: "Editable", sortable: false, searchable: false },
        { title: "Buscable" },
        { title: "Solo Admin", sortable: false, searchable: false },
        { title: "Habilitado", sortable: false, searchable: false },
        { title: "Acciones", sortable: false, searchable: false }
    ],
    columnDefs: [
        // Centrar las columnas de checkboxes y acciones
        { className: "dt-center", targets: [0, 4, 5, 6, 7, 8, 9] }
    ]
});

// Exponer la instancia de DataTable de campos al scope global para forms.js
window.tableAddedFields = tableAddedFields;



// Inicialización de la aplicación al cargar el DOM
runOnDomReady(async () => {
    inicializarBotonesFormularios();
    setFieldModalMode('add');

    // Almacenamos los formularios de creación de campo y tabla
    const fieldCreationForm = document.getElementById('fieldCreationForm');
    const tableCreationForm = document.getElementById('tableCreationForm');

    // Carga inicial de las tablas desde Firestore
    await refreshDisplayTablesTable();

    
});

/**
     * Maneja el evento de reordenamiento de filas en la tabla de campos añadidos.
     * Actualiza los índices de los campos en la instancia currentTable y refresca la tabla.
     * @param {DataTable} tableAddedFields - Instancia de DataTable que contiene los campos añadidos.
     * @returns {void}
     */
tableAddedFields.on('row-reorder', function (e, details) {
    if (!details.length) return;

    // Se modifican los índices en el objeto fieldList y se actualiza la tabla sin recargar todo
    details.forEach(change => {
        const rowData = tableAddedFields.row(change.node).data();
        editingFieldCode = rowData[1];
        currentField = currentTable.getField(editingFieldCode);
        if (currentField) {
            currentTable.fields.moveField(editingFieldCode, change.newPosition);

            // Actualiza la fila en la tabla
            tableAddedFields.row(change.node).data([
                currentField.index,
                currentField.fieldCode,
                currentField.fieldDataType,
                currentField.fieldNameEs,
                currentField.isVisible ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
                currentField.isEditable ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
                currentField.isSearchable ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
                currentField.isAdminPrivative ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
                currentField.isEnabled ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
                `<button class="btn btn-sm btn-success btn-editField" data-id="${currentField.fieldCode}"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm btn-danger btn-deleteField" data-id="${currentField.fieldCode}"><i class="bi bi-trash3-fill"></i></button>`
            ]);
        }
    });
    tableAddedFields.draw(false);
    sToast('success', 'Índices actualizados', 'Los índices de los campos han sido actualizados correctamente.');
});

/**
 * Refresca la tabla de tablas creadas con los datos más recientes de Firestore.
 * Esta función es exportada para que forms.js pueda llamarla después de crear/editar una tabla.
 * 
 * @returns {Promise<Array>} Array con los datos formateados para DataTable
 * @throws {Error} Si hay un error al obtener los datos o si la tabla no está inicializada
 */
export async function refreshDisplayTablesTable() {
    try {
        if (!createdDisplayTables) {
            throw new Error('La tabla no está inicializada');
        }

        const dataDisplayTables = await readAllDocuments('displayTables');
        if (!dataDisplayTables || !Array.isArray(dataDisplayTables)) {
            throw new Error('No se pudieron obtener los datos de las tablas');
        }

        const displayTablesDataRows = dataDisplayTables.map(doc => [
            doc.tableId,
            doc.tableDescriptionEs,
            doc.tableDescriptionEn,
            doc.isVisible ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
            doc.isAdminPrivative ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
            doc.isEnabled ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
            `<button class="btn btn-sm btn-success me-2 btn-editTable" data-id="${doc.documentId}"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm btn-danger btn-deleteTable" data-id="${doc.documentId}"><i class="bi bi-trash3-fill"></i></button>`
        ]);

        // Actualizar DataTable existente
        createdDisplayTables.clear();
        createdDisplayTables.rows.add(displayTablesDataRows);
        createdDisplayTables.draw();
        return displayTablesDataRows;
    } catch (error) {
        sToast('error', 'Error al refrescar la tabla', error.message);
        return [];
    }
}

// Hacer accesible la función desde window para que otros módulos no tengan que importarla
window.refreshDisplayTablesTable = refreshDisplayTablesTable;
