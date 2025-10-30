import { sAlert, sToast } from "./swal.js";
import { field, fieldList, dataDocument } from "./backend.js";
import { createDocument, updateDocument } from "./firebase/firebaseCRUD.js";
import { refreshDisplayTablesTable } from "./app.js";

// Contexto activo (se establece desde app.js cuando se abre el modal de tabla)
let activeFieldList = null; // instancia de fieldList

/**
 * Establece el fieldList activo donde se agregarán/editarán campos.
 * @param {fieldList} fl
 */
export function setActiveFieldContext(fl) {
    activeFieldList = fl;
}

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

async function crearTabla(){
    // Obtener el fieldList activo
    if (!activeFieldList) {
        sAlert('error', 'No hay campos definidos para la nueva tabla.');
        return;
    }
    // Valores del formulario
    const tableId = document.getElementById('tableId').value.trim();
    const tableDescriptionEs = document.getElementById('tableDescriptionEs').value.trim();
    const tableDescriptionEn = document.getElementById('tableDescriptionEn').value.trim();
    const isVisible = document.getElementById('tableIsVisible').checked;
    const isAdminPrivative = document.getElementById('tableIsAdminPrivative').checked;
    const isEnabled = document.getElementById('tableIsEnabled').checked;

    if (!tableId || !tableDescriptionEs) {
        sAlert('warning', 'Por favor complete los campos obligatorios de la tabla.');
        return;
    }

    // Construir el objeto plano para enviar a Firebase
    const data = {
        tableId,
        tableDescriptionEs,
        tableDescriptionEn,
        fields: (activeFieldList && typeof activeFieldList.toObject === 'function') ? activeFieldList.toObject() : {},
        isVisible,
        isAdminPrivative,
        isEnabled
    };

    try {
        const resp = await createDocument(data, 'displayTables');
        sToast('success', 'Tabla creada', 'La tabla fue creada correctamente.');
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('tableCreationModal'));
        if (modal) modal.hide();
        // Refrescar la tabla de forma dinámica
        await refreshDisplayTablesTable();
        return resp;
    } catch (e) {
        sAlert('error', 'Error creando la tabla', e && e.message ? e.message : 'Ocurrió un error');
        console.log('Error en crearTabla:', e);
    }
}

async function guardarEdicionTabla(){
    // Obtener el documentId desde el dataset del modal (establecido por app.js)
    const tableModalEl = document.getElementById('tableCreationModal');
    const documentId = tableModalEl && tableModalEl.dataset && tableModalEl.dataset.editing ? tableModalEl.dataset.editing : null;
    if (!documentId) {
        sAlert('error', 'No se encontró el ID de la tabla a actualizar.');
        return;
    }

    // Valores del formulario
    const tableId = document.getElementById('tableId').value.trim();
    const tableDescriptionEs = document.getElementById('tableDescriptionEs').value.trim();
    const tableDescriptionEn = document.getElementById('tableDescriptionEn').value.trim();
    const isVisible = document.getElementById('tableIsVisible').checked;
    const isAdminPrivative = document.getElementById('tableIsAdminPrivative').checked;
    const isEnabled = document.getElementById('tableIsEnabled').checked;

    if (!tableId || !tableDescriptionEs) {
        sAlert('warning', 'Por favor complete los campos obligatorios de la tabla.');
        return;
    }

    const data = {
        tableId,
        tableDescriptionEs,
        tableDescriptionEn,
        fields: (activeFieldList && typeof activeFieldList.toObject === 'function') ? activeFieldList.toObject() : {},
        isVisible,
        isAdminPrivative,
        isEnabled
    };

    try {
        const resp = await updateDocument(data, 'displayTables', documentId);
        sToast('success', 'Tabla actualizada', 'Los cambios fueron guardados correctamente.');
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('tableCreationModal'));
        if (modal) modal.hide();
        // Refrescar la tabla de forma dinámica
        await refreshDisplayTablesTable();
        return resp;
    } catch (e) {
        sAlert('error', 'Error actualizando la tabla', e && e.message ? e.message : 'Ocurrió un error');
        console.log('Error en guardarEdicionTabla:', e);
    }
}


// Prevenir submit nativo del formulario de campos
document.getElementById('fieldCreationForm').addEventListener('submit', e => {
    e.preventDefault();
    return false;
});

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
        sAlert('warning', 'Por favor, complete los campos obligatorios.', 'ID del campo, tipo y descripción en español son requeridos.');
        return;
    }

    // Usar el fieldList activo establecido por app.js
    if (!activeFieldList) {
        sAlert('error', 'No hay una tabla activa para agregar campos.');
        return;
    }

    // Validar si ya existe un campo con el mismo fieldCode
    if (activeFieldList.getField(fieldCode)) {
        // Usar SweetAlert via sAlert para confirmar sobrescritura
        sAlert(
            'question',
            'Campo duplicado',
            'Ya existe un campo con ese ID. ¿Deseas sobrescribirlo?',
            'Sobrescribir',
            'Cancelar',
            null,
            () => {
                // confirmCallback: sobrescribir
                activeFieldList.editField(fieldCode, new field(
                    fieldCode,
                    activeFieldList.listFieldKeys().indexOf(fieldCode),
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
                // Notificar a la UI que los campos cambiaron
                document.dispatchEvent(new CustomEvent('fields-changed', { detail: { fieldList: activeFieldList } }));
                document.getElementById('fieldCreationForm').reset();
                sToast('success', 'Campo sobrescrito', 'El campo fue sobrescrito correctamente.');
                // Cerrar el modal y reabrir la tabla si corresponde
                setTimeout(() => {
                    const fieldModalEl = document.getElementById('fieldCreationModal');
                    const modal = bootstrap.Modal.getInstance(fieldModalEl);
                    if (modal) modal.hide();
                    const tableModalEl = document.getElementById('tableCreationModal');
                    if (tableModalEl && tableModalEl.dataset && tableModalEl.dataset.reopenAfterField) {
                        delete tableModalEl.dataset.reopenAfterField;
                        bootstrap.Modal.getOrCreateInstance(tableModalEl).show();
                    }
                }, 300);
            },
            () => {
                // cancelCallback: reabrir modal de campo si se canceló la confirmación
                const fieldModalEl = document.getElementById('fieldCreationModal');
                if (fieldModalEl) bootstrap.Modal.getOrCreateInstance(fieldModalEl).show();
            }
        );
        return;
    }

    // Crear el nuevo campo y agregarlo
    const nuevoCampo = new field(
        fieldCode,
        activeFieldList.listFieldKeys().length,
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
    activeFieldList.addField(nuevoCampo);
    // Notificar a la UI que los campos cambiaron
    document.dispatchEvent(new CustomEvent('fields-changed', { detail: { fieldList: activeFieldList } }));
    // Limpiar el formulario
    document.getElementById('fieldCreationForm').reset();
    sToast('success', 'Campo agregado', 'El campo fue agregado correctamente a la tabla.');
    
    // Cerrar el modal después de un breve delay para que se vea el toast
    setTimeout(() => {
        const fieldModalEl = document.getElementById('fieldCreationModal');
        const modal = bootstrap.Modal.getInstance(fieldModalEl);
        if (modal) modal.hide();
        // Reabrir modal de tabla si fue ocultado por app.js
        const tableModalEl = document.getElementById('tableCreationModal');
        if (tableModalEl && tableModalEl.dataset && tableModalEl.dataset.reopenAfterField) {
            delete tableModalEl.dataset.reopenAfterField;
            bootstrap.Modal.getOrCreateInstance(tableModalEl).show();
        }
    }, 300);
}

// Función para guardar los cambios al editar un campo
function guardarEdicionCampo() {
    // Obtener el editingFieldCode desde el dataset del modal (establecido por app.js)
    const editingFieldCode = document.getElementById('fieldCreationModal').dataset.editing;
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

    if (!activeFieldList) {
        sAlert('error', 'No se identificó la tabla actual.');
        return;
    }

    // Actualizar el campo existente
    activeFieldList.editField(editingFieldCode, new field(
        fieldCode,
        activeFieldList.listFieldKeys().indexOf(editingFieldCode),
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
    // Notificar a la UI que los campos cambiaron
    document.dispatchEvent(new CustomEvent('fields-changed', { detail: { fieldList: activeFieldList } }));
        // Limpiar el formulario
    document.getElementById('fieldCreationForm').reset();
    sToast('success', 'Campo actualizado', 'El campo fue modificado correctamente.');
    
    // Cerrar el modal después de un breve delay para que se vea el toast
    setTimeout(() => {
        const fieldModalEl = document.getElementById('fieldCreationModal');
        const modal = bootstrap.Modal.getInstance(fieldModalEl);
        if (modal) modal.hide();
        // Limpiar flag editing del modal después de cerrar
        delete document.getElementById('fieldCreationModal').dataset.editing;
        // Reabrir modal de tabla si fue ocultado por app.js
        const tableModalEl = document.getElementById('tableCreationModal');
        if (tableModalEl && tableModalEl.dataset && tableModalEl.dataset.reopenAfterField) {
            delete tableModalEl.dataset.reopenAfterField;
            bootstrap.Modal.getOrCreateInstance(tableModalEl).show();
        }
    }, 300);
}
