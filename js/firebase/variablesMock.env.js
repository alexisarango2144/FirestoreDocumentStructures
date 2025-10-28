// Se dejan los datos de autenticación de Firebase con para validación de la entrega. 
// ToDo: Almacenar las variables de entorno en un archivo .env real 


/**
 * @description Función que aloja y retorna los datos de autenticación de Firebase
 * Se dejan los datos de autenticación de para validación de la entrega. 
 * ToDo: Almacenar las variables de entorno en un archivo .env real para evitar la carga y divulgación de información sensible (riesgos críticos de seguridad)
 * @returns Las variables con los datos de acceso a Firebase
 */

export function obtenerAuthVariables() {
    
    const PROJECT_ID = "gestionhc-2144";

    const SERVICE_ACCOUNT_KEY_JSON = {
        "type": "service_account",
        "project_id": "gestionhc-2144",
        "private_key_id": "8a4f3760578996e19935156265b3656565adc3e3",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCkg/LqAwMrf77H\nKeEMYSmqZNm7m+FOLTx/1/KGilxKhnC7i+xyC9dcEu7wVxJMyeeVz6EGPIbWGw9l\nYpBcfNVyxf4tBrfRWxAeTuHTeU68707byQKKA5y9pN51uQZ2CDRrEwmFi4hrBWvE\nZ1zNTjeoFTU/DYmXLbtUIwVNl1YsCi309YeX/7y2n+IHkLwpbCoReB/uaHl6x7XC\nFU/WXy3eIp1orDM/1l0Rg1Gs9DjAlgMda1XBAEsUQBLDsV7ui2EgF+JdnwLGZ0f1\nrQcjI7ZAbq/3dJBSro4/4oFukSlnjBhKdSvZX5dpgRtrrnnDFdFNV6790b/rt3nb\nXczLL+tDAgMBAAECggEACjR/1lxRegVL7vbTav0r+dHqX7o6WQBysaDSU94z/hDQ\n4BFnSBEhTtODLDglKSDtKLHfKeU0nVttsmWm0YCSN7MTIp/kDyyNl2kKlnT+mWG5\ni+YFg6ItuuXbQYTfYxBR5W0iOL0rEoMc6ECxKlshFgrFaXU22ms6ekGh4T+eAiVA\npFZE57U9Qd/trVAMC9prIhMtNKVp6NMPUt2XtnL0srDB8xXwm+j1ZWwjrmnfU48S\nZLJ8nio0vsku/hH4I/UYjLbbpUQvPp2rEUe11b/oVfGHijK82lNGlFvP7pI6yRjw\nuWazKL4BALyvvEZ18RA3iadCCtMjOxeKOsjTZM99YQKBgQDdLoSVstQG7o0sRXKD\n1eOyjriGu2riucZo3xJpN/YMiUCE87iS4muBAZ+6JUYfBzEK8CCjscI9+x3FMKNX\nLN6GPqlaBce/mlv27K9qtdLP7xDeEl13noyKA1nP856NRCY/CVTH81GffXojc6Le\ngkwLqgPJOxY/Usz6JninjQ53XQKBgQC+adDVz7WZSk6v4wGr3T5O7REWOs1RWCjW\nS5H6Q2VSWHxglwwUHazwe5l3zK7Ungoq54xFXyoNihv6VMdHckDZFl13NQHiBQdD\nqtzA8UdH2VnyvbyPsduZdbq3YByW5BuYdMylFphlUdnEcI90fhzFxaj4WmCcKhRl\niDPuu3jjHwKBgEgMMxwgWHi5lDrrlFXlgnpTi0A4JKUeJsdagsDLfdavjtjAG0ud\nfa9UPBeCtMi+qvcJKVipOsC94ACvy0VGVGYeW0P7xglf2r0gdDOqbrVVBoWQLeod\nN2JtnP/kN62EmYDHJVrMo7X0RajurgsVHnheNUWDfce6zRJfHcZWaHPxAoGAaeE5\nKMs49aYmHxOhqEl8DjMwnyXPaX4WJyMaZwj23FUrxCH5q23c7lQsQDtms/+1M6pR\ni3mhTqoPaKGfthDIEm6nRlQJWf7lzTDDU95WfpNTuvDaWyTRMYIPc0xUWWs6FQpN\niTcJQr3C08KrYmGF6ktA6+iFdBDKCrMz/XntfI0CgYAicwLxnNScz724Dv1wFBFF\nZtNu7BSLdXnTTtR8h5wQHE3u9JLro9wWGQuVcAlP8uDvm0g3dgmrWhMiQs9cju8k\n7ogO1rCJ+Bk9tHcRMUydHU+qEh08kuLbfza+Rd5POXhpOCds7Hucil4kVA7oyyIz\nJgyiq4zm/H8aGivElwbJkQ==\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-fbsvc@gestionhc-2144.iam.gserviceaccount.com",
        "client_id": "100712153360907505265",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40gestionhc-2144.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
    };

    return {
        PROJECT_ID,
        SERVICE_ACCOUNT_KEY_JSON
    };
}


