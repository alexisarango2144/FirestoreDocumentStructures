import { sAlert, sToast } from "./swal.js"; // Importar la función salert desde swal.js
import { dataDocument, field, fieldList, readAllDocuments } from "./backend.js"; // Importar las clases desde backend.js
import {getDocuments, createDocument} from "./firebase/firebaseCRUD.js";
import { validarBotonesFormularios, agregarCampo } from "./formularios.js";

validarBotonesFormularios();

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
        dataSrc: '0'
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

// Configuración de eventos
document.addEventListener('DOMContentLoaded', function () {
    setFieldModalMode('add');
    const fieldCreationModal = new bootstrap.Modal(document.getElementById('fieldCreationModal'));
    fieldCreationModal.show();

    // Almacenar el formulario de creación de campo
    const fieldCreationForm = document.getElementById('fieldCreationForm');

    // Botón para abrir el modal en modo agregar campo
    const addFieldBtn = document.getElementById('addFieldBtn');
    if (addFieldBtn) {
        addFieldBtn.addEventListener('click', function () {
            setFieldModalMode('add');
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


// Alternar entre modo agregar y editar campo en el modal
let editingFieldCode = null;
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
let editingTableCode = null;
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
});

// ***************************************************************
// *******      Data de ejemplo para "patientsMain"     **********
// ***************************************************************


let primerNombre = new field('primerNombre', 0, 'string', 'Primer Nombre', 'First Name', 50, true, true, true, false, true);
let segundoNombre = new field('segundoNombre', 1, 'string', 'Segundo Nombre', 'Second Name', 50, false, true, true, false, true);
let primerApellido = new field('primerApellido', 2, 'string', 'Primer Apellido', 'Last Name', 50, true, true, true, false, true);
let segundoApellido = new field('segundoApellido', 3, 'string', 'Segundo Apellido', 'Second Last Name', 50, false, true, true, false, true);
let tipoIdentificacion = new field('tipoIdentificacion', 4, 'string', 'Tipo de Identificación', 'Identification Type', 20, true, true, true, false, true);
let numeroIdentificacion = new field('numeroIdentificacion', 5, 'string', 'Número de Identificación', 'Identification Number', 20, true, true, true, false, true);
let fechaNacimiento = new field('fechaNacimiento', 6, 'date', 'Fecha de Nacimiento', 'Date of Birth', null, true, true, true, false, true);
let entidadResponsable = new field('entidadResponsable', 7, 'string', 'Entidad Responsable', 'Responsible Entity', 100, true, true, true, false, true);

let patientsFieldList = new fieldList();
patientsFieldList.addFields([primerNombre, segundoNombre, primerApellido, segundoApellido, tipoIdentificacion, numeroIdentificacion, fechaNacimiento, entidadResponsable]);

let patientsMainTable = new dataDocument('patientsMain', 'Pacientes', 'Patients', patientsFieldList.fields, true, true, true);

// Ejemplo de resultado de field structure()
console.log('Ejemplo de objeto generado por el constructor de field:');
console.log(entidadResponsable.structure());
console.log('Objeto en JSON: ' + JSON.stringify(entidadResponsable.structure(), null, 2));

// Ejemplo de resultado de dataDocument structure()
console.log('Ejemplo de objeto generado por el constructor de dataDocument:');
console.log(patientsMainTable.structure());
console.log('Objeto en JSON: ' + JSON.stringify(patientsMainTable.structure(), null, 2));

// Acceder a los datos
console.log('Descripción ES:', patientsMainTable.tableDescriptionEs);
console.log('Descripción EN:', patientsMainTable.tableDescriptionEn);
console.log('Campos:', Object.keys(patientsMainTable.fields));
console.log('Primer nombre (ES):', patientsMainTable.fields.primerNombre.value('es'));
console.log('Primer nombre (EN):', patientsMainTable.fields.primerNombre.value('en'));

console.log("Campos ordenados por índice:");
console.log(patientsMainTable.fields);


console.log("Nombre y clave de los campos ordenados:");
console.log(patientsMainTable.listFieldKeyNames());

// Pasamos los campos iniciales a la tabla DataTable
fieldToDatatable(patientsMainTable.fields, tableAddedFields);

let data = await getDocuments('displayTables');
console.log("Obtenido desde firestore:");
console.log(JSON.stringify(data));



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