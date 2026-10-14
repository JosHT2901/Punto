<?php
/**
 * Utilidades de Cifrado y Descifrado AES-256-CBC
 */

declare(strict_types=1);

/**
 * Obtiene la llave de cifrado de forma segura y centralizada.
 */
function ObtenerLlaveCifrado(): string
{
    static $passphrase = null;
    if ($passphrase === null) {
        $config = require dirname(__DIR__) . '/config/config.php';
        $passphrase = (string) ($config['key'] ?? '');
        if ($passphrase === '') {
            throw new RuntimeException("La llave de cifrado no está configurada.");
        }
    }
    return $passphrase;
}

/**
 * Cifra un payload de texto utilizando AES-256-CBC.
 * 
 * @param string $dato Texto plano a cifrar.
 * @return string Payload cifrado codificado en base64 doble.
 */
function Cifrar_Payload(string $dato): string
{
    $passphrase = ObtenerLlaveCifrado();
    $metodo = 'aes-256-cbc';
    
    // Usamos random_bytes() que es el estándar criptográfico moderno y seguro
    $ivLength = openssl_cipher_iv_length($metodo);
    $iv = random_bytes($ivLength !== false ? $ivLength : 16);
    
    $cifrado = openssl_encrypt($dato, $metodo, $passphrase, 0, $iv);
    if ($cifrado === false) {
        throw new RuntimeException("Error al cifrar el payload.");
    }
    
    // Convertimos el IV a base64 antes de unirlo para mantener un string limpio
    return base64_encode(base64_encode($iv) . '::' . $cifrado);
}

/**
 * Descifra un payload previamente cifrado con Cifrar_Payload.
 * 
 * @param string $payloadBase64 Payload cifrado en base64 doble.
 * @return string|null Texto plano descifrado o null si falla.
 */
function Descifrar_Payload(string $payloadBase64): ?string
{
    try {
        $passphrase = ObtenerLlaveCifrado();
        $metodo = 'aes-256-cbc';

        // 1. Decodificar el contenedor principal (Base64 externo)
        $paqueteCompleto = base64_decode($payloadBase64, true);
        if ($paqueteCompleto === false) {
            return null;
        }

        // 2. Separar el IV del texto cifrado usando el delimitador ::
        $partes = explode('::', $paqueteCompleto, 2);
        if (count($partes) !== 2) {
            return null;
        }

        // 3. El IV se envió como Base64, lo decodificamos a binario
        $iv = base64_decode($partes[0], true);
        if ($iv === false) {
            return null;
        }
        
        $textoCifrado = $partes[1];

        // 4. Descifrar usando OpenSSL
        $descifrado = openssl_decrypt($textoCifrado, $metodo, $passphrase, 0, $iv);

        // Si falla el descifrado (llave incorrecta o texto alterado), devuelve false
        return ($descifrado === false) ? null : $descifrado;

    } catch (Throwable $e) {
        // Capturamos Throwable por si ocurre cualquier anomalía criptográfica
        return null;
    }
}