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
    'key'      => require __DIR__ . '/key.php',
];