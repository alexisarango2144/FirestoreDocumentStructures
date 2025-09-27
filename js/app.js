// Abrir el modal de creación de campo al cargar la página en modo agregar
window.addEventListener('DOMContentLoaded', function () {
    setFieldModalMode('add');
    const fieldCreationModal = new bootstrap.Modal(document.getElementById('fieldCreationModal'));
    fieldCreationModal.show();
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
        document.getElementById('fieldCreationForm').reset();
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


const tableAddedFields = new DataTable('#tableAddedFields', {
    layout: {
        topStart: null,
        topEnd: 'search',
        bottomStart: 'info',
        bottomEnd: 'paging'
    },
    responsive: true,
    paging: true,
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


function fieldToDatatable(fieldsObj, dataTableInstance) {
    if (!dataTableInstance || typeof dataTableInstance.clear !== 'function' || typeof dataTableInstance.rows !== 'function') {
        console.error('El segundo argumento debe ser una instancia válida de DataTable.');
        return;
    }
    const data = Object.values(fieldsObj).map(f => [
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
    dataTableInstance.clear();
    dataTableInstance.rows.add(data);
    dataTableInstance.draw();
}


// Data de ejemplo para "patientsMain"
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

// Pasamos los campos iniciales a la tabla DataTable
fieldToDatatable(patientsMainTable.fields, tableAddedFields);


// Ejemplo de resultado
console.log('Ejemplo de objeto generado por el constructor de field:');
console.log(entidadResponsable.structure());
console.log(JSON.stringify(entidadResponsable.structure(), null, 2));

// Ejemplo de resultado
console.log('Ejemplo de objeto generado por el constructor de dataDocument:');
console.log(patientsMainTable.structure());
console.log(JSON.stringify(patientsMainTable.structure(), null, 2));


// Acceder a los datos
console.log('Descripción ES:', patientsMainTable.tableDescriptionEs);
console.log('Descripción EN:', patientsMainTable.tableDescriptionEn);
console.log('Campos:', Object.keys(patientsMainTable.fields));
console.log('Primer nombre (ES):', patientsMainTable.fields.primerNombre.value('es'));
console.log('Primer nombre (EN):', patientsMainTable.fields.primerNombre.value('en'));

console.log("Campos ordenados por índice:");
console.log(patientsMainTable.fields);

const fieldCreationForm = document.getElementById('fieldCreationForm');
fieldCreationForm.addEventListener('submit', function (event) {
    event.preventDefault(); // Evita el envío clásico del formulario
    agregarCampo();
});

function agregarCampo() {
    // Obtener valores del formulario
    const fieldCode = document.getElementById('fieldId').value.trim();
    const fieldDataType = document.getElementById('fieldType').value;
    const fieldNameEs = document.getElementById('fieldDescriptionEs').value.trim();
    const fieldNameEn = document.getElementById('fieldDescriptionEn').value.trim();
    const fieldMaxLength = document.getElementById('fieldMaxLength').value ? parseInt(document.getElementById('fieldMaxLength').value) : null;
    const isRequired = document.getElementById('fieldIsRequired').checked;
    const isVisible = document.getElementById('fieldIsVisible').checked;
    const isEditable = document.getElementById('fieldIsEditable').checked;
    const isSearchable = document.getElementById('fieldIsSearchable').checked;
    const isAdminPrivative = document.getElementById('fieldIsAdminOnly').checked;
    const isEnabled = document.getElementById('fieldIsEnabled').checked;

    // Validación básica
    if (!fieldCode || !fieldDataType || !fieldNameEs) {
        alert('Por favor, complete los campos obligatorios.');
        return;
    }



    // Validar si ya existe un campo con el mismo fieldCode
    if (patientsFieldList.fields[fieldCode]) {
        showConfirmOverwriteModal(function () {
            patientsFieldList.editField(fieldCode, new field(
                fieldCode,
                Object.keys(patientsFieldList.fields).indexOf(fieldCode),
                fieldDataType,
                fieldNameEs,
                fieldNameEn,
                fieldMaxLength,
                isRequired,
                isVisible,
                isEditable,
                isSearchable,
                isAdminPrivative,
                isEnabled
            ));
            fieldToDatatable(patientsFieldList.fields, tableAddedFields);
            document.getElementById('fieldCreationForm').reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('fieldCreationModal'));
            if (modal) modal.hide();
        });
        return;
    } else {
        // Crear el nuevo campo y agregarlo
        const nuevoCampo = new field(
            fieldCode,
            Object.keys(patientsFieldList.fields).length,
            fieldDataType,
            fieldNameEs,
            fieldNameEn,
            fieldMaxLength,
            isRequired,
            isVisible,
            isEditable,
            isSearchable,
            isAdminPrivative,
            isEnabled
        );
        patientsFieldList.addField(nuevoCampo);
        // Actualizar la tabla DataTable SOLO aquí, con todos los campos actuales
        fieldToDatatable(patientsFieldList.fields, tableAddedFields);
        // Limpiar el formulario
        document.getElementById('fieldCreationForm').reset();
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('fieldCreationModal'));
        if (modal) modal.hide();
    }

    // Limpiar el formulario
    document.getElementById('fieldCreationForm').reset();

    // Cerrar el modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('fieldCreationModal'));
    if (modal) modal.hide();
}

// Asignar eventos a los botones del modal y a los botones de edición de campo
document.addEventListener('DOMContentLoaded', function () {
    // Botón para abrir el modal en modo agregar campo
    const addFieldBtn = document.getElementById('addFieldBtn');
    if (addFieldBtn) {
        addFieldBtn.addEventListener('click', function() {
            setFieldModalMode('add');
        });
    }
    // Botón para crear un nuevo campo
    let creationBtn = document.getElementById('btnCrearCampo');
    if (!creationBtn) {
        creationBtn = document.createElement('button');
        creationBtn.type = 'button';
        creationBtn.className = 'btn btn-primary';
        creationBtn.id = 'btnCrearCampo';
        creationBtn.textContent = 'Crear campo';
        creationBtn.style.marginRight = '8px';
        const footer = document.querySelector('#fieldCreationModal .modal-footer');
        footer.appendChild(creationBtn);
    }
    creationBtn.onclick = agregarCampo;

    // Botón para actualizar cambios en un campo existente
    let updateBtn = document.getElementById('btnActualizarCampo');
    if (!updateBtn) {
        updateBtn = document.createElement('button');
        updateBtn.type = 'button';
        updateBtn.className = 'btn btn-success';
        updateBtn.id = 'btnActualizarCampo';
        updateBtn.textContent = 'Guardar cambios';
        const footer = document.querySelector('#fieldCreationModal .modal-footer');
        footer.appendChild(updateBtn, footer.firstChild.nextSibling);
    }
    updateBtn.onclick = guardarEdicionCampo;

    // Delegación de eventos para los botones de edición de campo
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
    });
});

function guardarEdicionCampo() {
    if (!editingFieldCode) return;
    // Obtener valores del formulario
    const fieldCode = document.getElementById('fieldId').value.trim();
    const fieldDataType = document.getElementById('fieldType').value;
    const fieldNameEs = document.getElementById('fieldDescriptionEs').value.trim();
    const fieldNameEn = document.getElementById('fieldDescriptionEn').value.trim();
    const fieldMaxLength = document.getElementById('fieldMaxLength').value ? parseInt(document.getElementById('fieldMaxLength').value) : null;
    const isRequired = document.getElementById('fieldIsRequired').checked;
    const isVisible = document.getElementById('fieldIsVisible').checked;
    const isEditable = document.getElementById('fieldIsEditable').checked;
    const isSearchable = document.getElementById('fieldIsSearchable').checked;
    const isAdminPrivative = document.getElementById('fieldIsAdminOnly').checked;
    const isEnabled = document.getElementById('fieldIsEnabled').checked;

    // Validación básica
    if (!fieldCode || !fieldDataType || !fieldNameEs) {
        alert('Por favor, complete los campos obligatorios.');
        return;
    }

    // Actualizar el campo existente
    patientsFieldList.editField(editingFieldCode, new field(
        fieldCode,
        Object.keys(patientsFieldList.fields).indexOf(editingFieldCode),
        fieldDataType,
        fieldNameEs,
        fieldNameEn,
        fieldMaxLength,
        isRequired,
        isVisible,
        isEditable,
        isSearchable,
        isAdminPrivative,
        isEnabled
    ));
    fieldToDatatable(patientsFieldList.fields, tableAddedFields);
    document.getElementById('fieldCreationForm').reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('fieldCreationModal'));
    if (modal) modal.hide();
    setFieldModalMode('add');
}



