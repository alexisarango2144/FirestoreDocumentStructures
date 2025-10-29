// Se dejan los datos de autenticación de Firebase con para validación de la entrega. 
// ToDo: Almacenar las variables de entorno en un archivo .env real 


/**
 * @description Función que aloja y retorna los datos de autenticación de Firebase
 * Se dejan los datos de autenticación de para validación de la entrega. 
 * ToDo: Almacenar las variables de entorno en un archivo .env real para evitar la carga y divulgación de información sensible (riesgos críticos de seguridad)
 * @returns Las variables con los datos de acceso a Firebase
 */

export async function obtenerAuthVariables(decryptKey) {

    const PROJECT_ID = "gestionhc-2144";
    const encryptedServiceAccountKey = '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';
    const MD5_HASH_KEY = 'de98e5765f6a546f7262f02c8bfecc00';

    try {
        const decryptedServiceAccountKey = CryptoJS.AES.decrypt(encryptedServiceAccountKey, decryptKey).toString(CryptoJS.enc.Utf8);
        const SERVICE_ACCOUNT_KEY_JSON = JSON.parse(decryptedServiceAccountKey);
        if (CryptoJS.MD5(JSON.stringify(SERVICE_ACCOUNT_KEY_JSON)).toString() === MD5_HASH_KEY) {
            return {
                PROJECT_ID,
                SERVICE_ACCOUNT_KEY_JSON,
            };
        } else {
            throw new Error("Clave de cifrado incorrecta");
        }
    } catch (error) {
        throw new Error("Error al descifrar las variables de autenticación: " + error.message);
    }
}


