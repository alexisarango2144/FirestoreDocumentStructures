import { getDocuments } from "./firebase/firebaseCRUD.js";
import { parseFirestoreData } from "./firebase/firebaseService.js";
import { sToast } from "./swal.js";

/**
 * Lee todos los documentos de una colección de Firestore.
 * @param {string} collectionName El nombre de la colección a leer.
 * @returns {Array} Un array de objetos JSON de los documentos.
 */
export async function readAllDocuments(collectionName) {
  try {
    let { docs } = await getDocuments(collectionName);
    return docs;
  } catch (e) {
    sToast('error', 'Error al obtener los documentos', 'Revisa la consola para más detalles.');
    console.log("Error en readAllDocuments: " + e.message);
  }
}

/**
 * Actualiza un documento específico en Firestore.
 * @param {object} data Objeto de datos plano con la información a actualizar.
 * @param {string} collectionName El nombre de la colección.
 * @param {string} documentId El ID del documento a actualizar.
 * @returns {object} El documento actualizado.
 */
async function updateDocumentInCollection(data, collectionName, documentId) {
  try {
    let firestoreData = prepareForFirestore(data);
    let response = await updateDocument(firestoreData, collectionName, documentId);
    return response;
  } catch (e) {
    Logger.log("Error en updateDocumentInCollection: " + e.message);
    return { error: "No se pudo actualizar el documento. " + e.message };
  }
}


export class dataDocument {
    constructor(tableId, tableDescriptionEs, tableDescriptionEn = null, fields = {}, isVisible = true, isAdminPrivative = true, isEnabled = true) {
        this.tableId = tableId;
        this.tableDescriptionEs = tableDescriptionEs;
        this.tableDescriptionEn = tableDescriptionEn;
        this.fields = fields;
        this.isVisible = isVisible;
        this.isAdminPrivative = isAdminPrivative;
        this.isEnabled = isEnabled;
    }

    structure() {
        return {
            tableId: this.tableId,
            tableDescriptionEs: this.tableDescriptionEs,
            tableDescriptionEn: this.tableDescriptionEn,
            fields: this.fields,
            isVisible: this.isVisible,
            isAdminPrivative: this.isAdminPrivative,
            isEnabled: this.isEnabled
        };
    }

    desciption(language = 'es') {
        if (language === 'es') {
            return this.tableDescriptionEs;
        } else if (language === 'en') {
            return this.tableDescriptionEn;
        }

    }

    listFieldKeyNames() {
        return Object.values(this.fields).map(field => field.keyValue());
    }
}

export class field {
    constructor(fieldCode, fieldIndex, fieldDataType, fieldNameEs, fieldNameEn = null, fieldMaxLength = null, isRequired = false, isVisible = true, isEditable = true, isSearchable = false, isAdminPrivative = false, isEnabled = true) {
        this.fieldCode = fieldCode;
        this.index = fieldIndex;
        this.fieldDataType = fieldDataType;
        this.fieldNameEs = fieldNameEs;
        this.fieldNameEn = fieldNameEn;
        this.fieldMaxLength = fieldMaxLength;
        this.isRequired = isRequired;
        this.isVisible = isVisible;
        this.isEditable = isEditable;
        this.isSearchable = isSearchable;
        this.isAdminPrivative = isAdminPrivative;
        this.isEnabled = isEnabled;
    }

    structure() {
        return {
            [this.fieldCode]: {
                index: this.index,
                fieldDataType: this.fieldDataType,
                fieldNameEs: this.fieldNameEs,
                fieldNameEn: this.fieldNameEn,
                fieldMaxLength: this.fieldMaxLength,
                fieldIsRequired: this.isRequired,
                isVisible: this.isVisible,
                isEditable: this.isEditable,
                isSearchable: this.isSearchable,
                isAdminPrivative: this.isAdminPrivative,
                isEnabled: this.isEnabled
            }
        };
    }

    value(language = 'es') {
        if (language === 'es') {
            return this.fieldNameEs;
        } else if (language === 'en') {
            return this.fieldNameEn;
        }
    }

    key() {
        return this.fieldCode;
    }

    keyValue() {
        return {
            [this.fieldCode]: this.fieldNameEs
        };
    }

    index() {
        return this.index;
    }
}

export class fieldList {
    constructor() {
        this.fields = {};
    }

    _reassignIndexes() {
        // Ordena los campos por el índice actual y reasigna índices consecutivos desde 0
        const sortedFields = Object.values(this.fields).sort((a, b) => a.index - b.index);
        sortedFields.forEach((field, idx) => {
            field.index = idx;
        });
    }

    addField(newField) {
        if (newField instanceof field) {
            // Asignar el índice según la cantidad de campos actuales
            newField.index = Object.keys(this.fields).length;
            this.fields[newField.key()] = newField;
            this._reassignIndexes();
        } else {
            throw new Error('El objeto no es una instancia de la clase field');
        }
    }

    addFields(fieldArray) {
        fieldArray.forEach(field => {
            this.addField(field);
        });
        this._reassignIndexes();
    }

    editField(fieldCode, newField) {
        if (newField instanceof field) {
            if (this.fields[fieldCode]) {
                // Mantener el índice original
                newField.index = this.fields[fieldCode].index;
                this.fields[fieldCode] = newField;
                this._reassignIndexes();
            } else {
                throw new Error('El campo con el código especificado no existe');
            }
        } else {
            throw new Error('El nuevo objeto no es una instancia de la clase field');
        }
    }

    removeField(fieldCode) {
        if (this.fields[fieldCode]) {
            delete this.fields[fieldCode];
            this._reassignIndexes();
        } else {
            throw new Error('El campo con el código especificado no existe');
        }
    }

    returnFields() {
        // Devuelve los campos ordenados por index ascendente
        return Object.values(this.fields)
            .sort((a, b) => a.index - b.index);
    }

    listFieldKeys() {
        // Devuelve los fieldCode ordenados por index ascendente
        return Object.values(this.fields)
            .sort((a, b) => (a.index - b.index))
            .map(field => field.key());
    }

    listFieldValues(language = 'es') {
        // Devuelve los valores ordenados por index ascendente
        return Object.values(this.fields)
            .sort((a, b) => (a.index - b.index))
            .map(field => field.value(language));
    }

    listFieldIndexes() {
        // Devuelve los índices ordenados por index ascendente
        return Object.values(this.fields)
            .sort((a, b) => (a.index - b.index))
            .map(field => field.index);
    }

    listFieldKeyNames() {
        // Devuelve los pares {fieldCode: fieldNameEs} ordenados por index ascendente
        return Object.values(this.fields)
            .sort((a, b) => (a.index - b.index))
            .map(field => field.keyValue());
    }
}