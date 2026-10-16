
/**
 * Calcula el hash SHA-256 de una cadena de texto usando la Web Crypto API nativa.
 * 
 * @param {string} texto Texto a hashear
 * @returns {Promise<string>} Hash en formato hexadecimal de 64 caracteres
 */
async function sha256(texto) {
    if (typeof texto !== 'string') {
        texto = String(texto || '');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Cifra un texto plano utilizando AES-256-CBC (compatible con PHP openssl_encrypt)
 * 
 * @param {string} plaintext Texto que deseas proteger
 * @returns {string|null} Paquete cifrado en Base64 o null en caso de error
 */
function Cifrar_Payload(plaintext) {
    try {
        if (!plaintext || typeof plaintext !== 'string') {
            console.error("Cifrar_Payload: El texto de entrada no es válido.");
            return null;
        }
        const secretKey = UI_CONFIG?.CRYPTO_KEY;
        if (!secretKey) {
            console.error("Cifrar_Payload: La llave de cifrado (SYSTEM_CONFIG.CRYPTO_KEY) no está definida.");
            return null;
        }
        
        // 1. Generar un IV aleatorio de 16 bytes (128 bits para AES)
        const iv = CryptoJS.lib.WordArray.random(16);
        
        // 2. Parsear la llave para que CryptoJS la procese correctamente
        const key = CryptoJS.enc.Utf8.parse(secretKey);

        // 3. Cifrar el texto utilizando AES en modo CBC con padding PKCS7
        const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        // 4. Convertir el IV a Base64 (formato esperado por PHP)
        const ivBase64 = CryptoJS.enc.Base64.stringify(iv);
        
        // 5. Extraer el texto cifrado (CryptoJS por defecto lo devuelve en Base64)
        const ciphertext = encrypted.toString();

        // 6. Unir IV y Ciphertext separados por '::', y codificar todo el paquete en Base64 final
        const packageString = ivBase64 + "::" + ciphertext;
        const finalBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(packageString));

        return finalBase64;

    } catch (error) {
        console.error("Error crítico al cifrar el payload:", error);
        return null;
    }
}

/**
 * Descifra un paquete cifrado en AES-256-CBC (compatible con PHP openssl_decrypt)
 * 
 * @param {string} encryptedData Paquete Base64 recibido del backend
 * @returns {string|null} Texto plano original o null si falla
 */
function Descifrar_Payload(encryptedData) {
    try {
        if (!encryptedData || typeof encryptedData !== 'string') {
            return null;
        }

        const secretKey = UI_CONFIG?.CRYPTO_KEY;
        if (!secretKey) {
            console.error("Descifrar_Payload: La llave de cifrado (SYSTEM_CONFIG.CRYPTO_KEY) no está definida.");
            return null;
        }

        // 1. Decodificar el paquete completo desde Base64 principal
        const decodedBytes = CryptoJS.enc.Base64.parse(encryptedData);
        const decodedPackage = decodedBytes.toString(CryptoJS.enc.Utf8);
        
        // 2. Separar el IV y el texto cifrado
        const parts = decodedPackage.split('::');
        if (parts.length !== 2) {
            console.warn("Descifrar_Payload: El formato del paquete descifrado es inválido.");
            return null;
        }

        // 3. El IV viene en Base64, lo parseamos de regreso a WordArray
        const iv = CryptoJS.enc.Base64.parse(parts[0]);
        const ciphertext = parts[1];
        
        // 4. Parsear la llave secreta
        const key = CryptoJS.enc.Utf8.parse(secretKey);

        // 5. Descifrar el contenido
        const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        // 6. Convertir el resultado a cadena de texto UTF-8 legible
        const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
        if (!plaintext) {
            console.warn("Descifrar_Payload: No se pudo obtener texto legible (posible llave incorrecta).");
            return null;
        }

        return plaintext;

    } catch (error) {
        console.error("Error crítico al descifrar el payload:", error);
        return null;
    }
}