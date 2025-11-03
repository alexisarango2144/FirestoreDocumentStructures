import { sAlert, sToast } from "../assets/sweetalert2/swal.js";
import { field, dataDocument, deleteTableById } from "./backend.js";
import { createDocument, updateDocument, getDocumentById } from "./firebase/firebaseCRUD.js";
import { fieldToDatatable } from "./utilities.js";

let editingFieldCode = null;
let editingTableCode = null;

/**
 * Prevenir el envío nativo de los formularios de campos y tablas.
 * Esto permite manejar el flujo de datos y validaciones por JS, evitando recarga de página.
 */
// Prevenir submit nativo del formulario de campos
document.getElementById('fieldCreationForm').addEventListener('submit', e => {
    e.preventDefault();
    return false;
});

document.getElementById('tableCreationForm').addEventListener('submit', e => {
    e.preventDefault();
    return false;
});

/**
 * Actualizar la tabla de campos añadidos cuando se notifique un cambio en los campos.
 *  Escuchar eventos de cambio en la lista de campos y refrescar la tabla
 */
document.addEventListener('fields-changed', (e) => {
    const fl = e.detail && e.detail.fieldList;
    if (fl) {
        // `tableAddedFields` puede ser una variable compartida desde `app.js` en `window`
        fieldToDatatable(fl, window.tableAddedFields);
        if (window.tableAddedFields && typeof window.tableAddedFields.draw === 'function') window.tableAddedFields.draw();
    }
});

/**
 * Crea los botones de los formularios de creación/edición de tablas y campos, y les asigna sus eventos onclick.
 * Si los botones ya existen, solo actualiza sus eventos.
 * Efectos secundarios: modifica el DOM y asigna handlers con sAlert.
 */
export function inicializarBotonesFormularios() {
    // Botón para crear una nueva tabla
    let tableCreationBtn = document.getElementById('btnCrearTabla');
    if (!tableCreationBtn) {
        tableCreationBtn = document.createElement('button');
        tableCreationBtn.type = 'button';
        tableCreationBtn.className = 'btn btn-primary me-2';
        tableCreationBtn.id = 'btnCrearTabla';
        tableCreationBtn.textContent = 'Crear tabla';
        const footer = document.querySelector('#tableCreationModal .modal-footer');
        footer.appendChild(tableCreationBtn);
    }
    tableCreationBtn.addEventListener('click', () => {
        sAlert(
            'question',
            '¿Deseas crear la tabla?',
            null,
            'Crear tabla',
            null,
            null,
            crearTabla,
            () => { return false }
        );
    });

    // Botón para actualizar cambios en una tabla existente
    let updateTableBtn = document.getElementById('btnActualizarTabla');
    if (!updateTableBtn) {
        updateTableBtn = document.createElement('button');
        updateTableBtn.type = 'button';
        updateTableBtn.className = 'btn btn-success d-none';
        updateTableBtn.id = 'btnActualizarTabla';
        updateTableBtn.textContent = 'Guardar cambios';
        const footer = document.querySelector('#tableCreationModal .modal-footer');
        footer.appendChild(updateTableBtn, footer.firstChild.nextSibling);
    }
    updateTableBtn.addEventListener('click', () => {
        actualizarTablaLocal();

        // Validar si hubo cambios comparando la estructura serializada (deep compare)
        try {
            const originalStruct = tableTempOriginalData ? JSON.stringify(tableTempOriginalData.structure() || {}) : null;
            const currentStruct = window.currentTable ? JSON.stringify(window.currentTable.structure() || {}) : null;
            if (originalStruct === currentStruct) {
                sAlert('info', 'No se detectaron cambios en la tabla.');
                return;
            }
        } catch (e) {
            // En caso de error al serializar, no bloqueamos la actualización — hacemos la petición
            console.warn('Error comparando estructuras de tabla:', e);
        }
        sAlert(
            'question',
            '¿Deseas guardar los cambios en la tabla?',
            null,
            'Guardar cambios',
            null,
            null,
            guardarEdicionTabla,
            () => { return false }
        );
    });

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
    creationBtn.addEventListener('click', () => sAlert(
        'question',
        '¿Desea crear el campo?',
        null,
        'Crear campo',
        null,
        null,
        agregarCampo,
        () => { return false }
    ));

    // Botón para actualizar cambios en un campo existente
    let updateBtn = document.getElementById('btnActualizarCampo');
    if (!updateBtn) {
        updateBtn = document.createElement('button');
        updateBtn.type = 'button';
        updateBtn.className = 'btn btn-success d-none';
        updateBtn.id = 'btnActualizarCampo';
        updateBtn.textContent = 'Guardar cambios';
        const footer = document.querySelector('#fieldCreationModal .modal-footer');
        footer.appendChild(updateBtn, footer.firstChild.nextSibling);
    }
    updateBtn.addEventListener('click', () => sAlert(
        'question',
        '¿Deseas guardar los cambios en el campo?',
        null,
        'Guardar cambios',
        null,
        null,
        guardarEdicionCampo,
        () => { return false }
    ));

    document.getElementById('createdDisplayTables').addEventListener('click', async function (e) {
        if (e.target.closest('.btn-editTable')) {
            const documentId = e.target.closest('.btn-editTable').getAttribute('data-id');
            const tableData = await getDocumentById('displayTables', documentId);
            // Convertir a instancia de dataDocument y almacenarla en tableTempOriginalData para validaciones posteriores
            tableTempOriginalData = new dataDocument(
                tableData.tableId,
                tableData.tableDescriptionEs,
                tableData.tableDescriptionEn,
                tableData.fields,
                tableData.isVisible,
                tableData.isAdminPrivative,
                tableData.isEnabled,
                tableData.documentId || documentId
            );
            // Creamos una copia separada para edición (window.currentTable) a partir de la estructura
            const origStruct = tableTempOriginalData.structure();
            window.currentTable = new dataDocument(
                origStruct.tableId,
                origStruct.tableDescriptionEs,
                origStruct.tableDescriptionEn,
                origStruct.fields || {},
                origStruct.isVisible,
                origStruct.isAdminPrivative,
                origStruct.isEnabled,
                origStruct.documentId || documentId
            );
            editingTableCode = window.currentTable.tableId;

            if (currentTable) {
                setTableModalMode('edit', currentTable);
                const tableModal = new bootstrap.Modal(document.getElementById('tableCreationModal'));
                fieldToDatatable(currentTable.fields, tableAddedFields);
                tableAddedFields.draw();
                tableModal.show();
            }
        }

        if (e.target.closest('.btn-deleteTable')) {
            const btn = e.target.closest('.btn-deleteTable');
            const documentId = btn.getAttribute('data-id');
            // Intentamos obtener el tableId desde la fila de la tabla en el DOM
            let tableIdDisplay = null;
            const row = btn.closest('tr');
            if (row) {
                const firstCell = row.querySelector('td, th');
                if (firstCell) tableIdDisplay = firstCell.textContent.trim();
            }
            const displayName = tableIdDisplay || documentId;

            // Confirmación usando sAlert; en la confirmación ejecutamos la eliminación
            sAlert(
                'warning',
                '¿Desea eliminar la tabla?',
                `Esta operación eliminará la tabla ${displayName} de forma irreversible.`,
                'Eliminar',
                null,
                'Cancelar',
                async () => {
                    // Ejecutar eliminación y refrescar la lista
                    const response = await deleteTableById(documentId);
                    if (response.ok) {
                        await refreshDisplayTablesTable();
                        sToast('success', 'Tabla eliminada', `La tabla ${displayName} fue eliminada correctamente.`);
                    } else {
                        sAlert('error', 'Ocurrió un error al eliminar la tabla');
                    }
                },
                () => {
                    // Cancel: no hacer nada
                    return false;
                }
            );
        }
    });

    document.getElementById('tableAddedFields').addEventListener('click', function (e) {
        if (e.target.closest('.btn-editField')) {
            e.preventDefault();
            e.stopPropagation();
            editingFieldCode = e.target.closest('.btn-editField').getAttribute('data-id');
            // Obtener la instancia de field desde fieldList (uso de window para variables compartidas)
            const fieldInstance = window.currentTable && typeof window.currentTable.getField === 'function' ? window.currentTable.getField(editingFieldCode) : null;
            if (fieldInstance) {
                window.currentField = fieldInstance;
                // Cerrar el modal de tabla primero (Ya que no se aplica el toggle directamente)
                const tableModalEl = document.getElementById('tableCreationModal');
                const tableModal = bootstrap.Modal.getInstance(tableModalEl);
                if (tableModal) {
                    tableModal.hide();
                }

                // Esperar un momento antes de abrir el nuevo modal
                setTimeout(() => {
                    // Marcar modal con el código del campo que se está editando
                    const fieldModalEl = document.getElementById('fieldCreationModal');
                    if (fieldModalEl) fieldModalEl.dataset.editing = window.currentField.fieldCode;
                    setFieldModalMode('edit', window.currentField);
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

            const fieldInstance = window.currentTable && typeof window.currentTable.getField === 'function' ? window.currentTable.getField(editingFieldCode) : null;

            if (fieldInstance) {
                sAlert(
                    'warning',
                    '¿Desea eliminar la el campo?',
                    `Esta operación eliminará el campo ${editingFieldCode} de forma irreversible.`,
                    'Eliminar',
                    null,
                    'Cancelar',
                    async () => {
                        try {
                            if (window.currentTable && typeof window.currentTable.removeField === 'function') window.currentTable.removeField(editingFieldCode);
                            sToast('success', 'Campo eliminado', `El campo ${editingFieldCode} fue eliminado correctamente.`);
                            fieldCreationForm.reset();
                            fieldToDatatable(window.currentTable.fields, window.tableAddedFields);
                            window.tableAddedFields.draw();
                        } catch (error) {
                            sAlert('error', 'Ocurrió un error al eliminar el campo');
                        }
                    },
                    () => {
                        // Cancel: no hacer nada
                        return false;
                    }
                );
            }
        }
    });
}

// Botón para abrir el modal de campos en modo agregar
const addFieldBtn = document.getElementById('addFieldBtn');
if (addFieldBtn) {
    addFieldBtn.addEventListener('click', function () {
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
    });
}

/**
 * Alterna entre modo agregar y editar campo en el modal de campos.
 * @param {'add'|'edit'} mode Modo del formulario: 'add' para agregar, 'edit' para editar.
 * @param {object|null} fieldData Información del campo a editar (objeto field) que se cargará en el formulario. Solo para modo 'edit'.
 */
export function setFieldModalMode(mode, fieldData = null) {
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

/**
 * Alterna entre modo agregar y editar tabla en el modal de tablas.
 * @param {'add'|'edit'} mode Modo del formulario: 'add' para agregar, 'edit' para editar.
 * @param {object|null} tableData Información de la tabla a editar (objeto dataDocument) que se cargará en el formulario. Solo para modo 'edit'.
 */
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

        // Reiniciar la tabla y lista temporal de campos creando una nueva instancia
        // Usar variables compartidas en window para evitar dependencias del orden de evaluación
        window.currentTable = new dataDocument();
        fieldToDatatable(currentTable.fields, window.tableAddedFields);
        if (window.tableAddedFields && typeof window.tableAddedFields.draw === 'function') window.tableAddedFields.draw();

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
        // Marcar el modal con el ID del documento que se está editando
        const tableModalEl = document.getElementById('tableCreationModal');
        if (tableModalEl) tableModalEl.dataset.editing = tableData.documentId;
    }
}

/**
 * Crea una nueva tabla en Firestore usando los datos del formulario y el fieldList activo.
 * Muestra alertas y toasts según el resultado.
 * @returns {Promise<object|undefined>} Respuesta de la API o undefined si hay error/validación.
 */
async function crearTabla() {
    // Obtener el fieldList activo
    if (!currentTable || !currentTable.fields || currentTable.fields.listFieldKeys().length === 0) {
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
    const data = new dataDocument(
        tableId,
        tableDescriptionEs,
        tableDescriptionEn,
        window.currentTable.fields.toObject() ?? {},
        isVisible,
        isAdminPrivative,
        isEnabled
    );


    try {
        const response = await createDocument(data, 'displayTables');
        sToast('success', 'Tabla creada', 'La tabla fue creada correctamente.');
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('tableCreationModal'));
        if (modal) modal.hide();
        // Refrescar la tabla de forma dinámica
        await refreshDisplayTablesTable();
        return response;
    } catch (e) {
        sAlert('error', 'Error creando la tabla', e && e.message ? e.message : 'Ocurrió un error');
    }
}

function actualizarTablaLocal() {
    // Valores del formulario
    const tableId = document.getElementById('tableId').value.trim();
    const tableDescriptionEs = document.getElementById('tableDescriptionEs').value.trim();
    const tableDescriptionEn = document.getElementById('tableDescriptionEn').value.trim();
    const isVisible = document.getElementById('tableIsVisible').checked;
    const isAdminPrivative = document.getElementById('tableIsAdminPrivative').checked;
    const isEnabled = document.getElementById('tableIsEnabled').checked;

    window.currentTable.tableId = tableId;
    window.currentTable.tableDescriptionEs = tableDescriptionEs
    window.currentTable.tableDescriptionEn = tableDescriptionEn
    window.currentTable.isVisible = isVisible
    window.currentTable.isAdminPrivative = isAdminPrivative
    window.currentTable.isEnabled = isEnabled
}

/**
 * Guarda los cambios al editar una tabla existente en Firestore usando los datos del formulario y el fieldList activo.
 * Muestra alertas y toasts según el resultado.
 * @returns {Promise<object|undefined>} Respuesta de la API o undefined si hay error/validación.
 */
async function guardarEdicionTabla() {
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
    if (!tableId || !tableDescriptionEs) {
        sAlert('warning', 'Por favor complete los campos obligatorios de la tabla.');
        return;
    }

    if (!currentTable || !currentTable.fields || currentTable.fields.listFieldKeys().length === 0) {
        sAlert('error', 'No hay campos definidos para la tabla.');
        return;
    }

    try {
        const response = await updateDocument(window.currentTable, 'displayTables', documentId);
        sToast('success', 'Tabla actualizada', 'Los cambios fueron guardados correctamente.');
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('tableCreationModal'));
        if (modal) modal.hide();
        // Refrescar la tabla de forma dinámica
        await refreshDisplayTablesTable();
        return response;
    } catch (e) {
        sAlert('error', 'Error actualizando la tabla', e && e.message ? e.message : 'Ocurrió un error');
    }
}

/**
 * Crea un nuevo campo en el fieldList activo usando los datos del formulario.
 * Si el campo existe, pregunta si se sobrescribe.
 * Muestra alertas y toasts según el resultado.
 * @returns {Promise<void>} No retorna valor útil.
 */
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
    if (!window.currentTable || !window.currentTable.fields) {
        sAlert('error', 'No hay una tabla activa para agregar campos.');
        return;
    }

    // Validar si ya existe un campo con el mismo fieldCode
    if (currentTable.fields && currentTable.fields.getField(fieldCode)) {
        // Usar SweetAlert via sAlert para confirmar sobrescritura
        sAlert(
            'question',
            'Campo duplicado',
            `Ya existe un campo con el id ${fieldCode}. ¿Deseas sobrescribirlo?`,
            'Sobrescribir',
            null,
            null,
            () => {
                // confirmCallback: sobrescribir
                currentTable.fields.editField(fieldCode, new field(
                    fieldCode,
                    currentTable.fields.listFieldKeys().indexOf(fieldCode),
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
                document.dispatchEvent(new CustomEvent('fields-changed', { detail: { fieldList: currentTable.fields } }));
                document.getElementById('fieldCreationForm').reset();
                sToast('success', 'Campo sobrescrito', 'El campo fue sobrescrito correctamente.');
                // Cerrar el modal y reabrir la tabla si corresponde
                setTimeout(() => {
                    const fieldModalEl = document.getElementById('fieldCreationModal');
                    const modal = bootstrap.Modal.getInstance(fieldModalEl);
                    if (modal) modal.hide();
                    const tableModalEl = document.getElementById('tableCreationModal');
                    if (tableModalEl) {
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
        currentTable.fields.listFieldKeys().length,
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
    currentTable.fields.addField(nuevoCampo);
    // Notificar a la UI que los campos cambiaron
    document.dispatchEvent(new CustomEvent('fields-changed', { detail: { fieldList: currentTable.fields } }));
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
        if (tableModalEl) {
            bootstrap.Modal.getOrCreateInstance(tableModalEl).show();
        }
    }, 300);
}

/**
 * Guarda los cambios al editar un campo existente en el fieldList activo usando los datos del formulario.
 * Muestra alertas y toasts según el resultado.
 * @returns {void}
 */
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

    if (!currentTable) {
        sAlert('error', 'No se identificó la tabla actual.');
        return;
    }

    // Actualizar el campo existente
    currentTable.fields.editField(editingFieldCode, new field(
        fieldCode,
        currentTable.fields.listFieldKeys().indexOf(editingFieldCode),
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
    document.dispatchEvent(new CustomEvent('fields-changed', { detail: { fieldList: currentTable.fields } }));
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
        if (tableModalEl) {
            bootstrap.Modal.getOrCreateInstance(tableModalEl).show();
        }
    }, 300);
}