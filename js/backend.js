class dataDocument {
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
            [this.tableId]: {
                tableDescriptionEs: this.tableDescriptionEs,
                tableDescriptionEn: this.tableDescriptionEn,
                fields: this.fields,
                isVisible: this.isVisible,
                isAdminPrivative: this.isAdminPrivative,
                isEnabled: this.isEnabled
            }
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

class field {
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

class fieldList {
    constructor() {
        this.fields = {};
    }

    addField(newField) {
        if (newField instanceof field) {
            // Asignar el índice según la cantidad de campos actuales
            newField.index = Object.keys(this.fields).length + 1;
            this.fields[newField.key()] = newField;
        } else {
            throw new Error('El objeto no es una instancia de la clase field');
        }
    }

    addFields(fieldArray) {
        fieldArray.forEach(field => {
            this.addField(field);
        });

        // Reasignar los índices para mantener el orden correcto
        Object.values(this.fields).forEach((field, idx) => {
            field.index = idx;
        });
    }

    editField(fieldCode, newField) {
        if (newField instanceof field) {
            if (this.fields[fieldCode]) {
                this.fields[fieldCode] = newField;
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
        } else {
            throw new Error('El campo con el código especificado no existe');
        }
    }

    returnFields() {
        return this.fields
    }

    listFieldKeys() {
        return Object.keys(this.fields);
    }
    listFieldValues(language = 'es') {
        return Object.values(this.fields).map(field => field.value(language));
    }
    listFieldIndexes() {
        return Object.values(this.fields).map(field => field.index());
    }
    listFieldKeyNames() {
        return Object.values(this.fields).map(field => field.keyValue());
    }
}