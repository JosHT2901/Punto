<?php
/**
 * Configuración Central del Sistema
 */

declare(strict_types=1);

return [
    'url_base' => $_ENV['APP_URL'] ?? 'http://localhost/punto_1/src/views/paginas',
    'db'       => require __DIR__ . '/db.php',
    'smtp'     => require __DIR__ . '/smtp.php',
    'imap'     => require __DIR__ . '/imap.php',
    // Leemos la clave de cifrado directamente de $_ENV (o de getenv como respaldo)
    'key'      => $_ENV['APP_CRYPTO_KEY'] ?? getenv('APP_CRYPTO_KEY') ?? '',
];