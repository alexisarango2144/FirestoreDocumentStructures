import { sToast } from "../swal.js";

import { obtenerAuthVariables } from "./variablesMock.env.js";

const authVariables = obtenerAuthVariables();


/**
 * Crea almacena y lee el token de acceso a la API de FireStore (Firebase)
 * @returns El token de acceso
 */

async function getAccessToken() {
    // Validamos si el token existe en caché y lo retornamos
    // Comprobar token en caché junto a su expiry
    const cachedToken = localStorage.getItem('fsAccessToken');
    const cachedExpiry = localStorage.getItem('fsAccessTokenExpiry');
    if (cachedToken && cachedExpiry && Date.now() < parseInt(cachedExpiry, 10)) {
        return cachedToken; // es un string con el access_token
    }

    // De lo contrario se genera y se retorna
    const serviceAccount = authVariables.SERVICE_ACCOUNT_KEY_JSON;
    const tokenUrl = "https://www.googleapis.com/oauth2/v4/token";
    const payload = {
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: await createJWT(serviceAccount),
    };

    // La API de token espera application/x-www-form-urlencoded
    const body = new URLSearchParams(payload).toString();

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body
    };

    try {
        const response = await fetch(tokenUrl, options);
        const token = await response.json();

        if (!response.ok) {
            throw new Error(token.error_description || token.error || JSON.stringify(token));
        }

        // Guardar sólo el access_token y su expiry en ms
        const accessToken = token.access_token;
        const expiresIn = token.expires_in || 3600; // segundos
        const expiryTs = Date.now() + (expiresIn * 1000) - (5 * 60 * 1000); // restamos 5 minutos de margen

        localStorage.setItem('fsAccessToken', accessToken);
        localStorage.setItem('fsAccessTokenExpiry', String(expiryTs));

        return accessToken;
    } catch (error) {
        sToast('error', 'Error obteniendo access token', 'No se pudo obtener el token de acceso a Firebase. Ver consola para más detalles.');
        console.error('Error obteniendo access token:', error);
        throw error;
    }
}

/**
 * Función para generar el token JWT adaptada de una diseñada en Apps Script. Se reemplazan las utilidades de Apps Script por el Web Crypto API del navegador 
 * @param {object} serviceAccount Cuenta con la información de autenticación de la cuenta para generar el token JWT
 * @returns 
 */
async function createJWT(serviceAccount) {
    const header = {
        alg: "RS256",
        typ: "JWT",
    };

    const now = Math.floor(Date.now() / 1000);
    const claimSet = {
        iss: serviceAccount.client_email,
        scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform",
        aud: "https://www.googleapis.com/oauth2/v4/token",
        exp: now + 3600,
        iat: now,
    };

    const base64UrlEncode = (obj) =>
        btoa(JSON.stringify(obj))
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_");

    const signatureInput = `${base64UrlEncode(header)}.${base64UrlEncode(claimSet)}`;

    // Importa la clave privada PEM en formato que entienda WebCrypto
    async function importPrivateKey(pem) {
        const pemContents = pem
            .replace(/-----BEGIN PRIVATE KEY-----/, "")
            .replace(/-----END PRIVATE KEY-----/, "")
            .replace(/\s+/g, "");
        const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
        return crypto.subtle.importKey(
            "pkcs8",
            binaryDer.buffer,
            { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
            false,
            ["sign"]
        );
    }

    const privateKey = await importPrivateKey(serviceAccount.private_key);
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureInput);
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, data);

    // Convierte la firma a Base64URL
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

    return `${signatureInput}.${base64Signature}`;
}

/**
 * Realiza la solicitud a Firebase 
 * @param {string} path 
 * @param {string} method 
 * @param {object} payload 
 * @returns Respuesta como objeto JSON
 */
export async function firestoreRequest(path, method, payload) {
    try {
        const token = await getAccessToken();
        const url = `https://firestore.googleapis.com/v1/projects/${authVariables.PROJECT_ID}/databases/(default)/documents${path}`;
        const options = {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: payload ? JSON.stringify(payload) : undefined,
        };

        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || JSON.stringify(data));
        }
        return data;
    } catch (e) {
        sToast('error', 'Error en la solicitud a Firestore', 'No se pudo completar la solicitud a Firestore. Ver consola para más detalles.');
        console.error("Error en la solicitud a Firestore: ", e);
        throw e;
    }
}


// ------------------------------------------
// Funciones auxiliares para manejo de datos 
// ------------------------------------------


/**
 * Función de alto nivel para formatear el objeto completo que se enviará a Firestore.
 * Esta función se llamaa directamente desde las funciones `createDocument` y `updateDocument`.
 *
 * @param {object} data El objeto JSON plano (ej. { "nombre": "Juan", "fecha": new Date() }).
 * @returns {object} El objeto final con la propiedad `fields` listo para la API de Firestore.
 */
export function prepareForFirestore(data) {
    try {
        let fields = {};
        for (let key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                fields[key] = convertToFirestoreObject(data[key]);
            }
        }
        return { fields };
    } catch (e) {
        sToast('error', 'Error al preparar datos para Firestore', 'No se pudieron convertir los datos al formato requerido por Firestore. Ver consola para más detalles.');
        return console.error("Error en prepareForFirestore: " + e.message);
    }
}


/**
 * Convierte un objeto JavaScript plano a un objeto con el formato de la API de Firestore.
 * Esta función es recursiva para manejar objetos anidados y arrays de forma correcta.
 *
 * @param {object|Array|string|number|boolean|null|Date} value El valor a convertir. Puede ser un objeto, un array, una cadena, un número, un booleano o una fecha.
 * @returns {object} Un objeto formateado para Firestore con su tipo de campo correspondiente.
 */
export function convertToFirestoreObject(value) {
    // Maneja objetos anidados (mapValue)
    if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
        let fields = Object.entries(value).reduce((acc, [key, val]) => {
            acc[key] = convertToFirestoreObject(val); // Llamada recursiva para cada propiedad
            return acc;
        }, {});
        return { mapValue: { fields } };
    }

    // Maneja arrays (arrayValue)
    if (Array.isArray(value)) {
        let values = value.map(item => convertToFirestoreObject(item)); // Llamada recursiva para cada elemento
        return { arrayValue: { values } };
    }

    // Maneja fechas (timestampValue)
    if (value instanceof Date) {
        return { timestampValue: value.toISOString() };
    }

    // Maneja cadenas (stringValue) con una condición especial para "~"
    if (typeof value === "string") {
        // Si la cadena comienza con "~", elimina el prefijo.
        if (value.startsWith('~')) {
            return { stringValue: value.substring(1) };
        }
        return { stringValue: value };
    }

    // Maneja números (integerValue y doubleValue)
    if (typeof value === "number") {
        if (Number.isInteger(value)) {
            return { integerValue: value };
        }
        return { doubleValue: value };
    }

    // Maneja booleanos (booleanValue)
    if (typeof value === "boolean") {
        return { booleanValue: value };
    }

    // Si el valor es nulo, lo maneja como nullValue
    if (value === null) {
        return { nullValue: null };
    }

    // Devuelve un valor nulo si no se reconoce el tipo
    return { nullValue: null };
}

/**
 * Genera un mapa avanzado de tokens de búsqueda, incluyendo substrings para búsquedas parciales.
 * @param {object} formData El objeto con los datos del formulario.
 * @param {Array<string>} [includedTokenFields=[]] Un array de claves a incluir en los tokens.
 * @param {number} [minSubstringLength=3] La longitud mínima para los substrings generados.
 * @returns {object} Un mapa de tokens y substrings, listo para Firestore.
 */
export function generateAdvancedSearchTokensMap(formData, includedTokenFields = [], minSubstringLength = 3) {
    const searchMap = {};

    // Normaliza una cadena: pasa a minúsculas y elimina tildes/diacríticos.
    // También elimina caracteres no alfanuméricos (salvo espacios) para tokens limpios.
    const normalizeToken = (str) => {
        if (!str || typeof str !== 'string') return str;
        // NFD separa caracteres y diacríticos, luego se eliminan los diacríticos
        const withoutDiacritics = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Convertir a minúsculas
        const lower = withoutDiacritics.toLowerCase();
        // Eliminar caracteres que no sean letras, números o espacios
        return lower.replace(/[^a-z0-9\s]/g, '');
    };

    const addTokenToMap = (token) => {
        if (!token) return;

        const t = normalizeToken(token.trim());
        if (!t) return;

        // Añade el token completo
        searchMap[t] = true;

        // Añade todos los substrings del token (para búsquedas parciales)
        for (let i = minSubstringLength; i <= t.length; i++) {
            const sub = t.substring(0, i);
            if (sub) searchMap[sub] = true;
        }
    };

    for (const key in formData) {
        if (!Object.prototype.hasOwnProperty.call(formData, key)) continue;
        // Si includedTokenFields está vacío, se incluyen todos los campos
        if (Array.isArray(includedTokenFields) && includedTokenFields.length > 0 && !includedTokenFields.includes(key)) continue;

        const value = formData[key];
        if (value === null || value === undefined || value === '') continue;

        let rawTokens = [];
        if (typeof value === 'string') {
            // Normalizamos la cadena completa antes de partir en tokens
            const normalized = normalizeToken(value);
            rawTokens = normalized.split(/\s+/).filter(Boolean);
        } else if (typeof value === 'number') {
            rawTokens.push(String(value));
        }

        rawTokens.forEach(addTokenToMap);
    }

    return searchMap;
}

/**
 * Transforma un documento de Firestore a un objeto JavaScript plano.
 * Esta es una función auxiliar que se llama recursivamente.
 *
 * @param {object} firestoreFields El objeto `fields` de Firestore.
 * @returns {object} Un objeto JavaScript plano con los valores.
 */
export function parseFirestoreFields(firestoreFields) {
  const parsedDoc = {};
  for (const key in firestoreFields) {
    if (Object.prototype.hasOwnProperty.call(firestoreFields, key)) {
      const field = firestoreFields[key];

      // Maneja los tipos de datos de Firestore
      if (field.stringValue !== undefined) {
        parsedDoc[key] = field.stringValue;
      } else if (field.integerValue !== undefined) {
        parsedDoc[key] = parseInt(field.integerValue);
      } else if (field.doubleValue !== undefined) {
        parsedDoc[key] = parseFloat(field.doubleValue);
      } else if (field.booleanValue !== undefined) {
        parsedDoc[key] = field.booleanValue;
      } else if (field.timestampValue !== undefined) {
        parsedDoc[key] = new Date(field.timestampValue);
      } else if (field.nullValue !== undefined) {
        parsedDoc[key] = null;
      } else if (field.arrayValue !== undefined) {
        // Llamada recursiva para procesar cada elemento del array
        parsedDoc[key] = field.arrayValue.values ? field.arrayValue.values.map(value => parseFirestoreFields({ temp: value }).temp) : [];
      } else if (field.mapValue !== undefined) {
        // Llamada recursiva para procesar el objeto anidado
        parsedDoc[key] = parseFirestoreFields(field.mapValue.fields);
      }
    }
  }
  return parsedDoc;
}

/**
 * Transforma un array de documentos de Firestore a un array de objetos JavaScript planos.
 * @param {Array} docs Array de documentos de Firestore.
 * @returns {Array} Array de objetos planos.
 */
export function parseFirestoreData(docs) {
  if (!docs || !Array.isArray(docs)) {
    return [];
  }
  
  return docs.map(doc => {
    // Si el documento tiene campos, los parseamos.
    if (doc.fields) {
      const parsedDoc = parseFirestoreFields(doc.fields);
      // Agrega el ID del documento
      parsedDoc.documentId = doc.name.split("/").pop();
      return parsedDoc;
    }
    
    // Si el documento no tiene campos (es una referencia o un error), lo ignora.
    return null;
  }).filter(doc => doc !== null);
}