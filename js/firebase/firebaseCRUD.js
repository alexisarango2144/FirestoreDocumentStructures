import { sAlert } from "../swal.js";
import { firestoreRequest, generateAdvancedSearchTokensMap, parseFirestoreFields, prepareForFirestore } from "./firebaseService.js";


/**
 * Crea un nuevo documento en una colección de Firestore.
 * @param {object} data Objeto de datos plano del formulario (ej. { "firstName": "Alexis" }).
 * @param {string} collectionName El nombre de la colección de Firestore donde se creará el documento.
 * @returns {object} El documento creado o un mensaje de error.
 */

export async function createDocument(data, collectionName, excludedTokenFields = null) {
  let createdOn = new Date();
  let documentId = null;

  data.createdOn = createdOn;
  data.lastModified = createdOn;
  data.isDeleted = false;

  data.searchTokens = await generateAdvancedSearchTokensMap(data, excludedTokenFields, 3);

  let path = `/${collectionName}`;
  let firestoreData = prepareForFirestore(data);

  try {
    var response = await firestoreRequest(path, "POST", firestoreData);

    documentId = response.name.split("/").pop();
    data.documentId = documentId;
    if (data.searchTokens && typeof data.searchTokens == 'object') {
      data.searchTokens[documentId] = true;
    }

    let updatedFirestoreData = prepareForFirestore(data);
    await firestoreRequest(`/${collectionName}/${documentId}`, "PATCH", updatedFirestoreData);


    return response;
  } catch (e) {
    sAlert('error', 'Error creando documento', 'No se pudo crear el documento en Firebase. Ver consola para más detalles.');
    console.log("Error en createDocument: " + e.message);
    return { error: "No se pudo crear el documento. " + e.message };
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
    if (e.message.includes("404")) {
      sAlert('warning', 'Documento no encontrado', `No se encontró el registro con ID ${documentId} en la colección ${collectionName}.`);
      console.log(`No se encontró el registro con ID ${documentId} en la colección ${collectionName}.`);
      return null;
    }

    // Si es cualquier otro error, se lanza la excepción.
    sAlert('error', 'Error buscando documento', 'Ocurrió un error al buscar el registro. Ver consola para más detalles.');
    console.log("Ocurrió un error al buscar el registro: " + e.message);
    throw e;
  }
}


/**
 * Actualiza un documento existente en una colección de Firestore.
 * * @param {object} newData El objeto de datos plano a actualizar, enviado desde el frontend.
 * @param {string} collectionName El nombre de la colección.
 * @param {string} documentId El ID del documento a actualizar.
 * @returns {object} El objeto de respuesta de la API de Firestore.
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
    let  response = await firestoreRequest(path, "PATCH", firestoreData);
    return response;
  } catch (e) {
    sAlert('error', 'Error actualizando documento', 'No se pudo actualizar el documento en Firebase. Ver consola para más detalles.');
    console.log("Error en la solicitud PATCH de updateDocument: " + e.message);
    throw new Error("No se pudo actualizar el documento. " + e.message);
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

  try {
    let response = await updateDocument(newData, collectionName, documentId);
    return response;
  } catch {
    sAlert('error', 'Error eliminando documento', 'No se pudo eliminar el documento en Firebase. Ver consola para más detalles.');
    console.log("Error en deleteDocument: " + e.message);
    throw new Error("No se pudo eliminar el registro. " + e.message);
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
    sAlert('error', 'Error eliminando documento', 'No se pudo eliminar el documento en Firebase. Ver consola para más detalles.');
    console.log(e);
  }
}

/**
 * Obtiene documentos de una colección, optimizado para búsqueda con múltiples tokens usando un mapa.
 *
 * @param {string} collectionName El nombre de la colección.
 * @param {string} [searchTerm=null] Término de búsqueda. Los espacios separan los tokens.
 * @param {number} [pageSize=10] Número de documentos por página.
 * @param {string} [pageToken=null] Token de la página anterior para continuar la pagpaginación.
 * @param {Array<string>} [orderBy=["createdOn", "desc"]] Campo y dirección de ordenación.
 * @returns {{docs: Array<object>, nextPageToken: string|null}} Un objeto con los documentos y el token para la siguiente página.
 */
export async function getDocuments(collectionName = "patients", searchTerm = null, pageSize = 2, pageToken = null, orderBy = ["createdOn", "desc"]) {
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
      sAlert('error', 'Error de la API de Firestore', 'Ocurrió un error al obtener los documentos de Firebase. Ver consola para más detalles.');
      console.log("Error de la API de Firestore: " + JSON.stringify(response[0].error));
      throw new Error(response[0].error.message);
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
    sAlert('error', 'Error obteniendo documentos', 'No se pudieron obtener los documentos de Firebase. Ver consola para más detalles.');
    console.log("Error en getDocuments con POST: " + e.message);
    throw e;
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