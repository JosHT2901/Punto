<?php
/**
 * Llave de Cifrado del Sistema
 */

declare(strict_types=1);

$cryptoKey = $_ENV['APP_CRYPTO_KEY'] ?? getenv('APP_CRYPTO_KEY') ?? '';

// Si aún está vacía, intentamos leerla a la fuerza del .env por seguridad
if (empty($cryptoKey)) {
    $rutaEnvPosibles = [
        __DIR__ . '/../env/.env',
        __DIR__ . '/../.env',
        __DIR__ . '/../../env/.env'
    ];
    
    foreach ($rutaEnvPosibles as $ruta) {
        if (file_exists($ruta)) {
            $lineas = file($ruta, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lineas as $linea) {
                if (str_starts_with(trim($linea), 'APP_CRYPTO_KEY=')) {
                    $cryptoKey = trim(substr($linea, strpos($linea, '=') + 1), " \t\n\r\0\x0B\"");
                    break 2;
                }
            }
        }
    }
}

// Fallback de emergencia para desarrollo local si de plano no existe
if (empty($cryptoKey)) {
    $cryptoKey = 'clave_temporal_segura_para_evitar_error_12345';
}

return trim($cryptoKey, " \t\n\r\0\x0B\"");