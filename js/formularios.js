import { sAlert } from "./swal.js";

export function validarBotonesFormularios() {
    // Botón para crear una nueva tabla
    let tableCreationBtn = document.getElementById('btnCrearTabla');
    if (!tableCreationBtn) {
        tableCreationBtn = document.createElement('button');
        tableCreationBtn.type = 'button';
        tableCreationBtn.className = 'btn btn-primary';
        tableCreationBtn.id = 'btnCrearTabla';
        tableCreationBtn.textContent = 'Crear tabla';
        tableCreationBtn.style.marginRight = '8px';
        const footer = document.querySelector('#tableCreationModal .modal-footer');
        footer.appendChild(tableCreationBtn);
    }
    tableCreationBtn.onclick = crearTabla;

    // Botón para actualizar cambios en una tabla existente
    let updateTableBtn = document.getElementById('btnActualizarTabla');
    if (!updateTableBtn) {
        updateTableBtn = document.createElement('button');
        updateTableBtn.type = 'button';
        updateTableBtn.className = 'btn btn-success';
        updateTableBtn.id = 'btnActualizarTabla';
        updateTableBtn.textContent = 'Guardar cambios';
        const footer = document.querySelector('#tableCreationModal .modal-footer');
        footer.appendChild(updateTableBtn, footer.firstChild.nextSibling);
    }
    updateTableBtn.onclick = guardarEdicionTabla;


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
}

function crearTabla(){

}

function guardarEdicionTabla(){

}


// Función para agregar o editar un campo
export async function agregarCampo() {
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
            fieldCreationForm.reset();
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
        fieldCreationForm.reset();
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('fieldCreationModal'));
        if (modal) modal.hide();
    }

    // Limpiar el formulario
    fieldCreationForm.reset();

    // Cerrar el modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('fieldCreationModal'));
    if (modal) modal.hide();
}

// Función para guardar los cambios al editar un campo
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
        sAlert('warning', 'Por favor, complete los campos obligatorios.',);
        return;
    }

    if(!currentTable) {
        sAlert('error', 'No se identificó la tabla actual.');
        return;
    }

    // Actualizar el campo existente
    currentTable.editField(editingFieldCode, new field(
        fieldCode,
        Object.keys(currentTable.fields).indexOf(editingFieldCode),
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
    // Actualizar la tabla DataTable con todos los campos actuales
    fieldToDatatable(currentTable.fields, tableAddedFields);
    tableAddedFields.draw();
    // Limpiar el formulario
    fieldCreationForm.reset();
    editingFieldCode = null;
    // Cerrar el modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('fieldCreationModal'));
    if (modal) modal.hide();
    setFieldModalMode('add');
}
