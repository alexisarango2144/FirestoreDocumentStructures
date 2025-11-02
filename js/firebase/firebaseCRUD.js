import { firestoreRequest, generateAdvancedSearchTokensMap, parseFirestoreFields, prepareForFirestore } from "./firebaseService.js";


/**
 * Crea un nuevo documento en una colección de Firestore.
 * @param {object} data Objeto de datos plano del formulario (ej. { "firstName": "Alexis" }).
 * @param {string} collectionName El nombre de la colección de Firestore donde se creará el documento.
 * @param {Array<string>|string|null} [includedTokenFields=null] Campos a incluir en el mapa de tokens de búsqueda. Puede ser un array, una cadena con un campo, o null para none.
 * @returns {Promise<object>} Respuesta de la API de Firestore para la creación del documento.
 * @throws {Error} Lanza en caso de error durante la creación o actualización del documento.
 */

export async function createDocument(data, collectionName, includedTokenFields = null) {
    // Generamos los searchTokens (puede devolver un objeto vacío si includedTokenFields es null/[] según la lógica)
    data.searchTokens = await generateAdvancedSearchTokensMap(data, includedTokenFields, 3);

    let path = `/${collectionName}`;

    try {
        // Seteamos metadatos antes de construir el payload para el POST
        const createdOn = new Date();
        let documentId = null;

        data.createdOn = createdOn;
        data.lastModified = createdOn;
        data.isDeleted = false;

        // Preparar el objeto que se enviará a Firestore ya con los campos anteriores
        let firestoreData = prepareForFirestore(data);

        var response = await firestoreRequest(path, "POST", firestoreData);

        documentId = response.name.split("/").pop();
        data.documentId = documentId;

        // Aseguramos que searchTokens sea un objeto antes de asignar el documentId
        if (!data.searchTokens || typeof data.searchTokens !== 'object') {
            data.searchTokens = {};
        }
        data.searchTokens[documentId] = true;

        try {
            // Actualizamos el documento recién creado para incluir el documentId y actualizar los searchTokens
            let updatedFirestoreData = prepareForFirestore(data);
            await firestoreRequest(`/${collectionName}/${documentId}`, "PATCH", updatedFirestoreData);
        } catch (e) {
            // Intentamos informar el error real al lanzar
            throw new Error("Se creó el documento pero no se pudo insertar el ID del documento creado como propiedad: " + (e && e.message ? e.message : e));
        }
        return response;
    } catch (e) {
        // Preservamos el mensaje de error original en la excepción
        throw new Error("Ocurrió un error al crear el documento: " + (e && e.message ? e.message : e));
    }
}



/**
 * Retorna un documento de Firestore por su ID en un formato plano y simple.
 *
 * @param {string} collectionName El nombre de la colección (p.ej., 'pacientes').
 * @param {string} documentId El ID del documento (p.ej., '1214746415').
 * @returns {object|null} Un objeto de datos plano del documento o null si no se encuentra.
 */

export async function getDocumentById(collectionName, documentId) {
    if (!collectionName || !documentId) {
        throw new Error("El nombre de la colección y el ID del documento son obligatorios.");
    }

    const path = `/${collectionName}/${documentId}`;

    try {
        const response = await firestoreRequest(path, "GET", null);


        // Usamos la función auxiliar para convertir los campos a un objeto plano.
        const parsedDoc = parseFirestoreFields(response.fields);

        // Si la respuesta es un objeto válido de documento de Firestore
        if (response && response.fields) {
            let collectionKeys = {};

            for (let key in response.fields) {
                collectionKeys[key] = "";
                let documentId;
                let documentCollection;
                if (Object.prototype.hasOwnProperty.call(response.fields, key)) {
                    let field = response.fields[key];

                    if (field.referenceValue !== undefined) {
                        documentId = field.referenceValue.split("/").pop();
                        parsedDoc[key] = field.stringValue;
                    }
                }
            }

            // Agregamos el ID del documento, que es crucial para futuras actualizaciones.
            parsedDoc.documentId = response.name.split("/").pop();

            return parsedDoc;
        }

        return null;

    } catch (e) {
        // Manejo del error 404 (documento no encontrado)
        if (e && e.message && e.message.includes("404")) {
            return null;
        }

        // Si es cualquier otro error, relanzamos para que lo maneje el caller
        throw new Error("Error obteniendo documento: " + (e && e.message ? e.message : e));
    }
}


/**
 * Actualiza un documento existente en una colección de Firestore.
 * @param {object} newData El objeto de datos plano a actualizar, enviado desde el frontend.
 * @param {string} collectionName El nombre de la colección.
 * @param {string} documentId El ID del documento a actualizar.
 * @returns {Promise<object>} Respuesta de la API de Firestore para la operación PATCH.
 * @throws {Error} Lanza si ocurre un error durante la actualización.
 */
export async function updateDocument(newData = {}, collectionName, documentId) {

    // 1. Obtiene el documento existente en formato plano (sin el campo "fields").
    const existingDoc = await getDocumentById(collectionName, documentId);

    // Si el documento no existe, se lanza un error.
    if (!existingDoc) {
        throw new Error(`El documento con ID ${documentId} no existe, por tanto, no puede ser actualizado.`);
    }

    // 2. Combina los datos existentes con los nuevos datos del formulario.
    // Esto asegura que los campos no enviados por el frontend se mantengan.
    const updatedData = Object.assign({}, existingDoc, newData);
    updatedData.lastModified = new Date();

    // 3. Formatea el objeto combinado para la API de Firestore.
    // Esta función maneja los tipos de dato y crea el objeto "fields".
    const firestoreData = prepareForFirestore(updatedData);

    // 4. Realiza la solicitud de actualización (PATCH) a Firestore.
    const path = `/${collectionName}/${documentId}`;
    try {
        let response = await firestoreRequest(path, "PATCH", firestoreData);
        return response;
    } catch (e) {
        throw new Error("No se pudo actualizar el documento: " + (e && e.message ? e.message : e));
    }
}

/**
 * Realiza una eliminación lógica de un documento existente en una colección de Firestore.
 * @param {string} collectionName El nombre de la colección.
 * @param {string} documentId El ID del documento a actualizar.
 * @returns {object} El objeto de respuesta de la API de Firestore.
 */

export async function deleteDocument(collectionName, documentId) {
    let newData = {
        "isDeleted": true,
        "deletedOn": new Date()
    };

    // Validación básica de parámetros
    if (!collectionName || !documentId) {
        throw new Error("El nombre de la colección y el ID del documento son obligatorios para eliminar.");
    }

    try {
        const response = await updateDocument(newData, collectionName, documentId);
        return response;
    } catch (e) {
        throw new Error("No se pudo eliminar el registro: " + (e && e.message ? e.message : e));
    }
}

/**
 * Realiza una eliminación permanente de un documento existente en una colección de Firestore.
 * @param {string} collectionName El nombre de la colección.
 * @param {string} documentId El ID del documento a actualizar.
 * @returns {object} El objeto de respuesta de la API de Firestore.
 */

export async function completeDeleteDocument(collectionName = "patients", documentId = "gJBBAQN0vA3i30WKM18s") {
    var path = `/${collectionName}/${documentId}`;
    try {
        var response = await firestoreRequest(path, "DELETE");
        return response;
    } catch (e) {
        throw new Error("No se pudo eliminar el documento: " + (e && e.message ? e.message : e));
    }
}

/**
 * Obtiene documentos de una colección, optimizado para búsqueda con múltiples tokens usando un mapa.
 *
 * @param {string} collectionName El nombre de la colección.
 * @param {string} [searchTerm=null] Término de búsqueda. Los espacios separan los tokens.
 * @param {number} [pageSize=10] Número de documentos por página.
 * @param {string} [pageToken=null] Token de la página anterior para continuar la paginación (JSON string con property `values`).
 * @param {Array<string>} [orderBy=["createdOn", "desc"]] Campo y dirección de ordenación (ej. ["createdOn","desc"]).
 * @returns {Promise<{docs: Array<object>, nextPageToken: object|null}>} Un objeto con los documentos parseados y el token para la siguiente página (o null).
 * @throws {Error} Lanza si hay un error en la consulta a la API de Firestore.
 */
export async function getDocuments(collectionName = "patients", searchTerm = null, pageSize = null, pageToken = null, orderBy = ["createdOn", "desc"]) {
    let serverOrderBy;
    const structuredQuery = {
        "structuredQuery": {
            "from": [{ "collectionId": collectionName }],
        }
    };

    // 1. Lógica para el término de búsqueda (WHERE) - MODIFICADA
    if (searchTerm) {
        let processedTerms = searchTerm.toLowerCase().split(/[\s,.;:%\-_]+/);
        // let processedTerms = searchTerm.trim().toLowerCase().split(' ').filter(term => term.length > 0);

        if (processedTerms.length > 0) {
            // Creamos un filtro de igualdad para cada token de búsqueda
            const filters = processedTerms.map(term => ({
                "fieldFilter": {
                    // La clave es que ahora consultamos un subcampo del mapa: "searchTokens.alexis"
                    "field": { "fieldPath": `searchTokens.${term}` },
                    "op": "EQUAL",
                    "value": { "booleanValue": true }
                }
            }));

            // Si hay más de un término, se combinan con AND.
            // Firestore maneja esto perfectamente para filtros de igualdad.
            if (filters.length > 1) {
                structuredQuery.structuredQuery.where = {
                    "compositeFilter": {
                        "op": "AND",
                        "filters": filters
                    }
                };
            } else {
                structuredQuery.structuredQuery.where = filters[0];
            }
        }
    }

    // 2. Lógica para la ordenación (ORDER BY)

    if (orderBy && orderBy.length === 2) {
        const [field, direction] = orderBy;
        const apiDirection = direction.toLowerCase() === "asc" ? "ASCENDING" : "DESCENDING";
        serverOrderBy = [{ "field": { "fieldPath": field }, "direction": apiDirection }];
    } else {
        throw new Error("El parámetro 'orderBy' es requerido para la paginación.");
    }

    // 3. Lógica para el límite de resultados (LIMIT)
    if (pageSize) {
        structuredQuery.structuredQuery.limit = pageSize;
    }

    // 4. Lógica para la paginación (PAGINATION / CURSOR)
    if (pageToken) {
        try {
            const cursorData = JSON.parse(pageToken);
            structuredQuery.structuredQuery.startAt = {
                values: cursorData.values,
                before: false
            };
        } catch (e) {
            throw new Error("El pageToken proporcionado no es válido.");
        }
    }

    // 5. Llama a la API y procesa la respuesta
    try {
        const response = await firestoreRequest(`:runQuery`, "POST", structuredQuery);

        if (response[0] && response[0].error) {
            throw new Error(response[0].error.message || "Error en la API de Firestore");
        }

        const docs = response.filter(item => item.document).map(item => item.document);
        let nextPageToken = null;

        if (docs.length === pageSize) {
            const lastDoc = docs[docs.length - 1];
            const orderByField = serverOrderBy[0].field.fieldPath;
            const cursorValue = lastDoc.fields[orderByField];

            if (cursorValue) {
                const tokenData = {
                    values: [cursorValue]
                };
                nextPageToken = tokenData;
            }
        }

        const parsedDocs = docs.map(doc => parseFirestoreFields(doc.fields));

        return { docs: parsedDocs, nextPageToken: nextPageToken };

    } catch (e) {
        throw new Error('Ocurrió un error obteniendo documentos: ' + (e && e.message ? e.message : e));
    }
}

/**
 * Función auxiliar para extraer el valor primitivo de un objeto de valor de Firestore.
 * Ejemplo: { "stringValue": "Alexis" } -> "Alexis"
 * @param {object} firestoreValue El objeto de valor de Firestore.
 * @returns {string|number|boolean|null} El valor primitivo.
 */
function getFirestoreValue(firestoreValue) {
    if (!firestoreValue) return null;
    const valueType = Object.keys(firestoreValue)[0];
    return firestoreValue[valueType];
}