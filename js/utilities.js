/**
 * Ejecuta una función cuando el DOM está completamente cargado.
 * Si el DOM ya está cargado, ejecuta la función inmediatamente.
 * 
 * @param {Function} fn - Función a ejecutar cuando el DOM esté listo
 * @throws {Error} Si hay un error al registrar el evento DOMContentLoaded
 */
export function runOnDomReady(fn) {
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

/**
 * Actualiza una instancia de DataTable con la información de campos proporcionada.
 * @param {Object|Array|{returnFields: Function}} fieldsObj - Objeto con los campos a mostrar.
 *        Puede ser un objeto plano, un array de campos, o un objeto con método returnFields()
 * @param {DataTable} dataTableInstance - Instancia válida de DataTable a actualizar
 * @throws {Error} Si dataTableInstance no es una instancia válida de DataTable
 * @returns {void}
 * 
 * @example
 * // Usando un array de campos
 * fieldToDatatable([
 *   { index: 1, fieldCode: 'name', fieldDataType: 'string', ... },
 *   { index: 2, fieldCode: 'age', fieldDataType: 'number', ... }
 * ], myDataTable);
 */
export function fieldToDatatable(fieldsObj, dataTableInstance) {
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
}