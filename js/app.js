import { sAlert, sToast } from "./swal.js"; // Importar la función salert desde swal.js
import { dataDocument, field, fieldList, readAllDocuments } from "./backend.js"; // Importar las clases desde backend.js
import {getDocuments, getDocumentById, createDocument} from "./firebase/firebaseCRUD.js";
import { validarBotonesFormularios, agregarCampo, setActiveFieldContext } from "./formularios.js";

let editingTableCode = null;
let editingFieldCode = null;
let currentTable = {};
let currentField = {};
// FieldList temporal para la creación de nuevas tablas
let tableTempFieldList = new fieldList();

// Función para ejecutar una función cuando el DOM esté completamente cargado
function runOnDomReady(fn) {
    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            // Si ya cargó se ejecuta inmediatamente
            fn();
        }
    } catch (e) {
        console.error('Error registrando DOM ready handler:', e);
    }
}

runOnDomReady(function () {
    // Cuando el DOM esté listo, inicializamos la UI, eventos y variables
    validarBotonesFormularios();
    setFieldModalMode('add');
    const fieldCreationModal = new bootstrap.Modal(document.getElementById('fieldCreationModal'));

    // Almacenar el formulario de creación de campo
    const fieldCreationForm = document.getElementById('fieldCreationForm');
    const tableCreationForm = document.getElementById('tableCreationForm');

    // Botón para abrir el modal de campos en modo agregar
    const addFieldBtn = document.getElementById('addFieldBtn');
    if (addFieldBtn) {
        addFieldBtn.addEventListener('click', function () {
            // Preparar contexto para agregar campo: si no hay una tabla (creación nueva), usamos la temporal
            setActiveFieldContext(tableTempFieldList);
            // Limpiar cualquier edición previa
            const fieldModalEl = document.getElementById('fieldCreationModal');
            if (fieldModalEl) delete fieldModalEl.dataset.editing;
            setFieldModalMode('add');
        });
    }
    // Botón para abrir el modal de tablas en modo agregar
    const addTableBtn = document.getElementById('addTableBtn');
    if (addTableBtn) {
            addTableBtn.addEventListener('click', function () {
                setTableModalMode('add');
                tableCreationForm.reset();
                // Reiniciar la lista temporal de campos creando una nueva instancia
                tableTempFieldList = new fieldList();
                setActiveFieldContext(tableTempFieldList);
                fieldToDatatable(tableTempFieldList, tableAddedFields);
                tableAddedFields.draw();
            });
    }

    // Delegación de eventos para los botones de edición de campo y tabla
    document.getElementById('tableAddedFields').addEventListener('click', function (e) {
        if (e.target.closest('.btn-editField')) {
            e.preventDefault();
            e.stopPropagation();
            editingFieldCode = e.target.closest('.btn-editField').getAttribute('data-id');
            // Obtener la instancia de field desde fieldList
            const fieldInstance = currentTable.getField(editingFieldCode);
            if (fieldInstance) {
                currentField = fieldInstance;
                // Cerrar el modal de tabla primero (Ya que no se aplica el toggle directamente)
                const tableModalEl = document.getElementById('tableCreationModal');
                const tableModal = bootstrap.Modal.getInstance(tableModalEl);
                if (tableModal) {
                    // Marcamos que el modal de tabla debe reabrirse después de editar/crear campo
                    if (tableModalEl) tableModalEl.dataset.reopenAfterField = 'true';
                    tableModal.hide();
                }
                
                // Esperar un momento antes de abrir el nuevo modal
                setTimeout(() => {
                    // Marcar modal con el código del campo que se está editando
                    const fieldModalEl = document.getElementById('fieldCreationModal');
                    if (fieldModalEl) fieldModalEl.dataset.editing = currentField.fieldCode;
                    setFieldModalMode('edit', currentField);
                    const fieldModal = new bootstrap.Modal(document.getElementById('fieldCreationModal'));
                    fieldModal.show();
                }, 150);
            }
        }
        // Delegación de eventos para los botones de eliminación de campo
        if (e.target.closest('.btn-deleteField')) {
            e.preventDefault();
            e.stopPropagation();
            editingFieldCode = e.target.closest('.btn-deleteField').getAttribute('data-id');
            currentField = currentTable.getField(editingFieldCode);
            if (currentField) {
                console.log('Eliminar campo:', currentField);
                currentTable.removeField(editingFieldCode);
                fieldToDatatable(currentTable.fields, tableAddedFields);
                tableAddedFields.draw();
               // TODO: 
               // Agregar confirmación antes de eliminar
               // Usaremos la librería SweetAlert2
               // Reemplazar alert() por SweetAlert2 en todo el proyecto
            }
        }
    });
    
    document.getElementById('createdDisplayTables').addEventListener('click', async function (e) {
        if (e.target.closest('.btn-editTable')) {
            const documentId = e.target.closest('.btn-editTable').getAttribute('data-id');
            const tableData = await getDocumentById('displayTables', documentId);
            // Convertir a instancia de dataDocument
            currentTable = new dataDocument(
                tableData.tableId,
                tableData.tableDescriptionEs,
                tableData.tableDescriptionEn,
                tableData.fields,
                tableData.isVisible,
                tableData.isAdminPrivative,
                tableData.isEnabled,
                tableData.documentId || documentId
            );
            editingTableCode = currentTable.tableId;

            if (currentTable) {
                setTableModalMode('edit', currentTable);
                // Establecer la lista de campos del documento como contexto activo
                setActiveFieldContext(currentTable.fields);
                const tableModal = new bootstrap.Modal(document.getElementById('tableCreationModal'));
                fieldToDatatable(currentTable.fields, tableAddedFields);
                tableAddedFields.draw();
                tableModal.show();
            }
        }

        
        // Delegación de eventos para los botones de eliminación de campo
        if (e.target.closest('.btn-deleteField')) {
            editingFieldCode = e.target.closest('.btn-deleteField').getAttribute('data-id');
            currentField = currentTable.getField(editingFieldCode);
            if (currentField) {
                console.log('Eliminar campo:', currentField);
                currentTable.removeField(editingFieldCode);
                fieldToDatatable(currentTable.fields, tableAddedFields);
                tableAddedFields.draw();
               // TODO: 
               // Agregar confirmación antes de eliminar
               // Usaremos la librería SweetAlert2
               // Reemplazar alert() por SweetAlert2 en todo el proyecto
            }
        }
    });
    // Escuchar eventos de cambio en la lista de campos y refrescar la tabla
    document.addEventListener('fields-changed', (e) => {
        const fl = e.detail && e.detail.fieldList;
        if (fl) {
            fieldToDatatable(fl, tableAddedFields);
            tableAddedFields.draw();
        }
    });
});

// Obtenemos los datos de la base de datos
const dataDisplayTables = await readAllDocuments('displayTables');
const displayTablesDataRows = dataDisplayTables.map(doc => [
    doc.tableId,                  
    doc.tableDescriptionEs,          
    doc.tableDescriptionEn,          
    doc.isVisible ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
    doc.isAdminPrivative ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
    doc.isEnabled ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
    `<button class="btn btn-sm btn-success btn-editTable" data-id="${doc.documentId}"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm btn-danger btn-deleteTable" data-id="${doc.documentId}"><i class="bi bi-trash3-fill"></i></button>`
]);

const tableAddedFieldsDataRows = {};

// Inicialización y configuración de DataTables
const createdDisplayTables = new DataTable('#createdDisplayTables', {
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
        url: './datatables/es-ES.json',
    },
    data: displayTablesDataRows,
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
        url: './datatables/es-ES.json',
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

// Alternar entre modo agregar y editar campo en el modal
function setFieldModalMode(mode, fieldData = null) {
    const modalTitle = document.getElementById('fieldCreationModalLabel');
    const creationBtn = document.getElementById('btnCrearCampo');
    const updateBtn = document.getElementById('btnActualizarCampo');
    if (mode === 'add') {
        fieldCreationForm.reset();
        modalTitle.textContent = 'Agregar campo';
        creationBtn.classList.remove('d-none');
        updateBtn.classList.add('d-none');
        editingFieldCode = null;
        const fieldModalEl = document.getElementById('fieldCreationModal');
        if (fieldModalEl && fieldModalEl.dataset && fieldModalEl.dataset.editing) delete fieldModalEl.dataset.editing;
    } else if (mode === 'edit' && fieldData) {
        fieldCreationForm.reset();
        modalTitle.textContent = 'Modificar campo';
        creationBtn.classList.add('d-none');
        updateBtn.classList.remove('d-none');
        // Llenar los campos del formulario con fieldData
        document.getElementById('fieldId').value = fieldData.fieldCode;
        document.getElementById('fieldType').value = fieldData.fieldDataType;
        document.getElementById('fieldDescriptionEs').value = fieldData.fieldNameEs;
        document.getElementById('fieldDescriptionEn').value = fieldData.fieldNameEn || '';
        document.getElementById('fieldMaxLength').value = fieldData.fieldMaxLength || '';
        document.getElementById('fieldIsRequired').checked = !!fieldData.isRequired;
        document.getElementById('fieldIsVisible').checked = !!fieldData.isVisible;
        document.getElementById('fieldIsEditable').checked = !!fieldData.isEditable;
        document.getElementById('fieldIsSearchable').checked = !!fieldData.isSearchable;
        document.getElementById('fieldIsAdminOnly').checked = !!fieldData.isAdminPrivative;
        document.getElementById('fieldIsEnabled').checked = !!fieldData.isEnabled;
        editingFieldCode = fieldData.fieldCode;
        const fieldModalEl = document.getElementById('fieldCreationModal');
        if (fieldModalEl) fieldModalEl.dataset.editing = fieldData.fieldCode;
    }
}
// Alternar entre modo agregar y editar tabla en el modal
function setTableModalMode(mode, tableData = null) {
    const modalTitle = document.getElementById('tableCreationModalLabel');
    const creationBtn = document.getElementById('btnCrearTabla');
    const updateBtn = document.getElementById('btnActualizarTabla');
    if (mode === 'add') {
        modalTitle.textContent = 'Crear tabla';
        creationBtn.classList.remove('d-none');
        updateBtn.classList.add('d-none');
        tableCreationForm.reset();
        editingTableCode = null;
        // Borrar flag de edición si existe
        const tableModalEl = document.getElementById('tableCreationModal');
        if (tableModalEl && tableModalEl.dataset && tableModalEl.dataset.editing) delete tableModalEl.dataset.editing;
    } else if (mode === 'edit' && tableData) {
        modalTitle.textContent = 'Editar tabla';
        creationBtn.classList.add('d-none');
        updateBtn.classList.remove('d-none');
        // Llenar los campos del formulario con tableData
        document.getElementById('tableId').value = tableData.tableId;
        document.getElementById('tableDescriptionEs').value = tableData.tableDescriptionEs;
        document.getElementById('tableDescriptionEn').value = tableData.tableDescriptionEn || '';
        document.getElementById('tableIsVisible').checked = !!tableData.isVisible;
        document.getElementById('tableIsAdminPrivative').checked = !!tableData.isAdminPrivative;
        document.getElementById('tableIsEnabled').checked = !!tableData.isEnabled;
        editingTableCode = tableData.documentId;
        // Marcar el modal con el ID del documento que se está editando para que formularios.js lo use
        const tableModalEl = document.getElementById('tableCreationModal');
        if (tableModalEl) tableModalEl.dataset.editing = tableData.documentId;
    }
}

// Modal de confirmación Bootstrap para sobrescribir campo duplicado
let confirmOverwriteCallback = null;
function showConfirmOverwriteModal(onConfirm) {
    // Usamos SweetAlert (sAlert) para confirmar sobrescritura y evitar modales anidados de Bootstrap
    const fieldModalEl = document.getElementById('fieldCreationModal');
    // Si el modal de campo está abierto, lo ocultamos para mostrar la alerta
    const fieldModalInst = bootstrap.Modal.getInstance(fieldModalEl);
    if (fieldModalInst) fieldModalInst.hide();

    sAlert(
        'question',
        'Campo duplicado',
        'Ya existe un campo con ese ID. ¿Deseas sobrescribirlo?',
        'Sobrescribir',
        'Cancelar',
        null,
        () => {
            // Confirmar: ejecutar callback
            if (typeof onConfirm === 'function') onConfirm();
        },
        () => {
            // Cancelar: volver a abrir el modal de campo para continuar edición
            if (fieldModalEl) bootstrap.Modal.getOrCreateInstance(fieldModalEl).show();
        }
    );
}

// Función para actualizar la tabla DataTable con los campos actuales
function fieldToDatatable(fieldsObj, dataTableInstance) {
    if (!dataTableInstance || typeof dataTableInstance.clear !== 'function' || typeof dataTableInstance.rows !== 'function') {
        console.error('El segundo argumento debe ser una instancia válida de DataTable.');
        return;
    }
    dataTableInstance.clear();

    // Aceptar `fieldList`, array o objeto plano
    let fieldsArray;
    if (fieldsObj && typeof fieldsObj.returnFields === 'function') {
        fieldsArray = fieldsObj.returnFields();
    } else if (Array.isArray(fieldsObj)) {
        fieldsArray = fieldsObj;
    } else {
        fieldsArray = Object.values(fieldsObj || {});
    }

    // Ordenar los campos por índice antes de mapearlos
    const data = fieldsArray.sort((a, b) => (a.index - b.index)).map(f => [
        f.index,
        f.fieldCode,
        f.fieldDataType,
        f.fieldNameEs,
        f.isVisible ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
        f.isEditable ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
        f.isSearchable ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
        f.isAdminPrivative ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
        f.isEnabled ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
        `<button class="btn btn-sm btn-success btn-editField" data-id="${f.fieldCode}"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm btn-danger btn-deleteField" data-id="${f.fieldCode}"><i class="bi bi-trash3-fill"></i></button>`
    ]);
    dataTableInstance.rows.add(data);
    //dataTableInstance.draw();
}

// Manejar el envío del formulario de creación/edición de campo
document.getElementById('fieldCreationForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Evita el envío clásico del formulario
    agregarCampo();
});

// Pasamos los campos iniciales a la tabla DataTable
// fieldToDatatable(patientsMainTable.fields, tableAddedFields);

// let response = await getDocuments('displayTables');
// const docs = response.docs;

// Función para refrescar la tabla de tablas (expuesta para que formularios.js pueda llamarla)
export async function refreshDisplayTablesTable() {
    const dataDisplayTables = await readAllDocuments('displayTables');
    const displayTablesDataRows = dataDisplayTables.map(doc => [
        doc.tableId,                  
        doc.tableDescriptionEs,          
        doc.tableDescriptionEn,          
        doc.isVisible ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
        doc.isAdminPrivative ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
        doc.isEnabled ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
        `<button class="btn btn-sm btn-success btn-editTable" data-id="${doc.documentId}"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm btn-danger btn-deleteTable" data-id="${doc.documentId}"><i class="bi bi-trash3-fill"></i></button>`
    ]);

    // Actualizar DataTable existente
    createdDisplayTables.clear();
    createdDisplayTables.rows.add(displayTablesDataRows);
    createdDisplayTables.draw();
    return displayTablesDataRows;
}