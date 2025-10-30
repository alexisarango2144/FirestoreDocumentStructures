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
        // Convertir cada documento a una instancia de dataDocument.
        // Pasamos `doc.fields` como objeto plano y el constructor de dataDocument
        // se encargará de normalizarlo a un `fieldList`.
        return docs.map(doc => new dataDocument(
            doc.tableId,
            doc.tableDescriptionEs,
            doc.tableDescriptionEn,
            doc.fields || {},
            doc.isVisible,
            doc.isAdminPrivative,
            doc.isEnabled,
            doc.documentId // Incluimos el documentId
        ));
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
    constructor(tableId, tableDescriptionEs, tableDescriptionEn = null, fields = {}, isVisible = true, isAdminPrivative = true, isEnabled = true, documentId = null) {
        this.tableId = tableId;
        this.tableDescriptionEs = tableDescriptionEs;
        this.tableDescriptionEn = tableDescriptionEn;
        // Normalizar `fields` a una instancia de fieldList
        if (fields instanceof fieldList) {
            this.fields = fields;
        } else {
            this.fields = fieldList.fromObject(fields || {});
        }
        this.isVisible = isVisible;
        this.isAdminPrivative = isAdminPrivative;
        this.isEnabled = isEnabled;
        this.documentId = documentId; // ID del documento en Firestore
    }

    structure() {
        return {
            tableId: this.tableId,
            tableDescriptionEs: this.tableDescriptionEs,
            tableDescriptionEn: this.tableDescriptionEn,
            // Serializar fields a un objeto plano para Firestore o transporte
            fields: this.fields && typeof this.fields.toObject === 'function' ? this.fields.toObject() : this.fields,
            isVisible: this.isVisible,
            isAdminPrivative: this.isAdminPrivative,
            isEnabled: this.isEnabled,
            documentId: this.documentId
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
        // Si fields es una instancia de fieldList delegamos en su helper.
        if (this.fields && typeof this.fields.listFieldKeyNames === 'function') {
            return this.fields.listFieldKeyNames();
        }
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

    index() {
        return this.index;
    }

    // Devuelve el código único del campo
    key() {
        return this.fieldCode;
    }

    // Devuelve un par { fieldCode: fieldNameEs } útil para listados
    keyValue() {
        return { [this.fieldCode]: this.fieldNameEs };
    }
}

export class fieldList {
    constructor() {
        this.fields = {};
    }

    /**
     * Crea una instancia de fieldList a partir de un objeto plano { fieldCode: fieldData }
     * Conserva índices si están presentes y normaliza a instancias de `field`.
     * @param {object} obj
     * @returns {fieldList}
     */
    static fromObject(obj = {}) {
        const fl = new fieldList();
        Object.entries(obj).forEach(([fieldCode, fieldData]) => {
            fl.fields[fieldCode] = new field(
                fieldCode,
                // Aceptamos tanto `index` como `idx` si hay variaciones
                fieldData.index ?? fieldData.idx ?? 0,
                fieldData.fieldDataType,
                fieldData.fieldNameEs,
                fieldData.fieldNameEn,
                fieldData.fieldMaxLength,
                // el nombre en Firestore puede ser `fieldIsRequired` o `isRequired`
                (fieldData.fieldIsRequired ?? fieldData.isRequired) || false,
                fieldData.isVisible ?? true,
                fieldData.isEditable ?? true,
                fieldData.isSearchable ?? false,
                fieldData.isAdminPrivative ?? false,
                fieldData.isEnabled ?? true
            );
        });
        fl._reassignIndexes();
        return fl;
    }

    /**
     * Serializa la lista de campos a un objeto plano con la estructura esperada por Firestore.
     * @returns {object}
     */
    toObject() {
        const obj = {};
        Object.values(this.fields)
            .sort((a, b) => a.index - b.index)
            .forEach(f => {
                obj[f.fieldCode] = {
                    index: f.index,
                    fieldDataType: f.fieldDataType,
                    fieldNameEs: f.fieldNameEs,
                    fieldNameEn: f.fieldNameEn,
                    fieldMaxLength: f.fieldMaxLength,
                    fieldIsRequired: f.isRequired,
                    isVisible: f.isVisible,
                    isEditable: f.isEditable,
                    isSearchable: f.isSearchable,
                    isAdminPrivative: f.isAdminPrivative,
                    isEnabled: f.isEnabled
                };
            });
        return obj;
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

    /**
     * Devuelve una instancia `field` por su código o null si no existe
     * @param {string} fieldCode
     * @returns {field|null}
     */
    getField(fieldCode) {
        return this.fields[fieldCode] || null;
    }

    /**
     * Método para mover un campo a una nueva posición (reindexa automáticamente)
     * @param {string} fieldCode
     * @param {number} newIndex
     */
    moveField(fieldCode, newIndex) {
        const f = this.getField(fieldCode);
        if (!f) throw new Error('Campo no encontrado: ' + fieldCode);
        f.index = newIndex;
        this._reassignIndexes();
    }
}

// Añadimos helpers en dataDocument para delegar operaciones a fieldList
Object.assign(dataDocument.prototype, {
    getField(fieldCode) {
        return this.fields.getField(fieldCode);
    },
    addField(fieldInstance) {
        return this.fields.addField(fieldInstance);
    },
    editField(fieldCode, newField) {
        return this.fields.editField(fieldCode, newField);
    },
    removeField(fieldCode) {
        return this.fields.removeField(fieldCode);
    },
    listFieldKeys() {
        return this.fields.listFieldKeys();
    },
    returnFields() {
        return this.fields.returnFields();
    }
});