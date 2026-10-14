<?php
/**
 * Llave de Cifrado del Sistema
 */

declare(strict_types=1);

$cryptoKey = $_ENV['APP_CRYPTO_KEY'] ?? '';

if (empty($cryptoKey)) {
    throw new RuntimeException("La llave de cifrado (APP_CRYPTO_KEY) no está definida en el archivo .env.");
}

return trim($cryptoKey, " \t\n\r\0\x0B\"");