import { sAlert, sToast } from "./swal.js"; // Importar la función salert desde swal.js
import { dataDocument, field, fieldList, readAllDocuments } from "./backend.js"; // Importar las clases desde backend.js
import {getDocuments, createDocument} from "./firebase/firebaseCRUD.js";
import { validarBotonesFormularios, agregarCampo } from "./formularios.js";

let editingTableCode = null;
let editingFieldCode = null;
const currentTable = {};
const currentField = {};

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
    fieldCreationModal.show();

    // Almacenar el formulario de creación de campo
    const fieldCreationForm = document.getElementById('fieldCreationForm');

    // Botón para abrir el modal de campos en modo agregar
    const addFieldBtn = document.getElementById('addFieldBtn');
    if (addFieldBtn) {
        addFieldBtn.addEventListener('click', function () {
            setFieldModalMode('add');
        });
    }
    // Botón para abrir el modal de tablas en modo agregar
    const addTableBtn = document.getElementById('addTableBtn');
    if (addTableBtn) {
        addTableBtn.addEventListener('click', function () {
            setTableModalMode('add');
        });
    }

    // Delegación de eventos para los botones de edición de campo y tabla
    document.getElementById('tableAddedFields').addEventListener('click', function (e) {
        if (e.target.closest('.btn-editField')) {
            const fieldCode = e.target.closest('.btn-editField').getAttribute('data-id');
            const fieldObj = patientsFieldList.fields[fieldCode];
            if (fieldObj) {
                setFieldModalMode('edit', fieldObj);
                var modal = new bootstrap.Modal(document.getElementById('fieldCreationModal'));
                modal.show();
            }
        }
        // Delegación de eventos para los botones de eliminación de campo
        if (e.target.closest('.btn-deleteField')) {
            const fieldCode = e.target.closest('.btn-deleteField').getAttribute('data-id');
            const fieldObj = patientsFieldList.fields[fieldCode];
            if (fieldObj) {
                console.log('Eliminar campo:', fieldObj);
                patientsFieldList.removeField(fieldCode);
                fieldToDatatable(patientsFieldList.fields, tableAddedFields);
                tableAddedFields.draw();
               // TODO: 
               // Agregar confirmación antes de eliminar
               // Usaremos la librería SweetAlert2
               // Reemplazar alert() por SweetAlert2 en todo el proyecto
            }
        }
    });
    
    document.getElementById('createdDisplayTables').addEventListener('click', function (e) {
        if (e.target.closest('.btn-editTable')) {
            const documentId = e.target.closest('.btn-editTable').getAttribute('data-id');
            const fieldObj = patientsFieldList.fields[fieldCode];
            if (fieldObj) {
                setFieldModalMode('edit', fieldObj);
                var modal = new bootstrap.Modal(document.getElementById('fieldCreationModal'));
                modal.show();
            }
        }
        // Delegación de eventos para los botones de eliminación de campo
        if (e.target.closest('.btn-deleteField')) {
            const fieldCode = e.target.closest('.btn-deleteField').getAttribute('data-id');
            const fieldObj = patientsFieldList.fields[fieldCode];
            if (fieldObj) {
                console.log('Eliminar campo:', fieldObj);
                patientsFieldList.removeField(fieldCode);
                fieldToDatatable(patientsFieldList.fields, tableAddedFields);
                tableAddedFields.draw();
               // TODO: 
               // Agregar confirmación antes de eliminar
               // Usaremos la librería SweetAlert2
               // Reemplazar alert() por SweetAlert2 en todo el proyecto
            }
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
        dataSrc: tableAddedFieldsDataRows
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
        const fieldCode = rowData[1];
        const fieldObj = patientsFieldList.fields[fieldCode];
        if (fieldObj) {
            // Actualiza el índice en el objeto
            fieldObj.index = change.newPosition;

            // Actualiza la fila en la tabla
            tableAddedFields.row(change.node).data([
                fieldObj.index,
                fieldObj.fieldCode,
                fieldObj.fieldDataType,
                fieldObj.fieldNameEs,
                fieldObj.isVisible ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
                fieldObj.isEditable ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
                fieldObj.isSearchable ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
                fieldObj.isAdminPrivative ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
                fieldObj.isEnabled ? `<input class="form-check-input" type="checkbox" checked disabled>` : `<input class="form-check-input" type="checkbox" disabled>`,
                `<button class="btn btn-sm btn-success btn-editField" data-id="${fieldObj.fieldCode}"><i class="bi bi-pencil-square"></i></button> <button class="btn btn-sm btn-danger btn-deleteField" data-id="${fieldObj.fieldCode}"><i class="bi bi-trash3-fill"></i></button>`
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
        modalTitle.textContent = 'Agregar campo';
        creationBtn.classList.remove('d-none');
        updateBtn.classList.add('d-none');
        fieldCreationForm.reset();
        editingFieldCode = null;
    } else if (mode === 'edit' && fieldData) {
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
    } else if (mode === 'edit' && fieldData) {
        modalTitle.textContent = 'Editar tabla';
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
    }
}



// Modal de confirmación Bootstrap para sobrescribir campo duplicado
let confirmOverwriteCallback = null;
function showConfirmOverwriteModal(onConfirm) {
    confirmOverwriteCallback = onConfirm;
    let fieldCreationModal = document.getElementById('fieldCreationModal');
    if (fieldCreationModal) {
        // Cerrar el modal de creación de campo si está abierto
        const modalInstance = bootstrap.Modal.getInstance(fieldCreationModal);
        if (modalInstance) modalInstance.toggle();
    }
    let confirmOverwriteModal = document.getElementById('confirmOverwriteModal');
    // Si el modal ya existe, no lo creamos de nuevo
    if (!confirmOverwriteModal) {
        confirmOverwriteModal = document.createElement('div');
        confirmOverwriteModal.innerHTML = `
                <div class="modal fade" id="confirmOverwriteModal" tabindex="-1" aria-labelledby="confirmOverwriteModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="confirmOverwriteModalLabel">Campo duplicado</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                Ya existe un campo con ese ID. ¿Deseas sobrescribirlo?
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-target="#fieldCreationModal" data-bs-toggle="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="confirmOverwriteBtn">Sobrescribir</button>
                            </div>
                        </div>
                    </div>
                </div>`;
        document.body.appendChild(confirmOverwriteModal);
    }
    var modal = new bootstrap.Modal(document.getElementById('confirmOverwriteModal'));
    modal.toggle();
    setTimeout(() => {
        document.getElementById('confirmOverwriteBtn').onclick = function () {
            modal.toggle();
            if (typeof confirmOverwriteCallback === 'function') confirmOverwriteCallback();
        };
    }, 100);
}

// Función para actualizar la tabla DataTable con los campos actuales
function fieldToDatatable(fieldsObj, dataTableInstance) {
    if (!dataTableInstance || typeof dataTableInstance.clear !== 'function' || typeof dataTableInstance.rows !== 'function') {
        console.error('El segundo argumento debe ser una instancia válida de DataTable.');
        return;
    }
    dataTableInstance.clear();

    // Ordenar los campos por índice antes de mapearlos
    const data = Object.values(fieldsObj).sort((a, b) => (a.index - b.index)).map(f => [
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
fieldCreationForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Evita el envío clásico del formulario
    agregarCampo();
})

// Pasamos los campos iniciales a la tabla DataTable
// fieldToDatatable(patientsMainTable.fields, tableAddedFields);

let response = await getDocuments('displayTables');
const docs = response.docs;

// Mapea cada doc a un array donde cada elemento es una celda
const dataRows = docs.map(doc => [
    doc.documentId,                  // ID del documento
    doc.tableDescriptionEs,          // Descripción (ES)
    doc.tableDescriptionEn,          // Description (EN)
    doc.isVisible ? 'Sí' : 'No',     // Visible
    doc.isAdminPrivative ? 'Sí' : 'No', // Solo admin
    doc.isEnabled ? 'Sí' : 'No',     // Habilitada
    `<button class="btn btn-primary btn-sm" data-id="${doc.documentId}">Editar</button>`
]);

// Inicializa el DataTable (si no se ha hecho antes), o usa clear() y rows.add() si ya existe.
$('#existingTablesTable').DataTable({
    destroy: true, // Para garantizar reinicio limpio si reutilizas el mismo id
    data: dataRows,
    columns: [
        { title: 'ID del documento' },
        { title: 'Descripción (ES)' },
        { title: 'Description (EN)' },
        { title: 'Visible' },
        { title: 'Solo admin' },
        { title: 'Habilitada' },
        { title: 'Acciones' }
    ]
});