<?php
/**
 * Configuración de IMAP
 */

declare(strict_types=1);

// Limpiamos espacios y comillas externas que se importen erróneamente del .env
$limpiarEnv = function($clave, $defecto = '') {
    $valor = $_ENV[$clave] ?? $defecto;
    return trim($valor, " \t\n\r\0\x0B\""); // Remueve espacios y comillas dobles literales
};

return [
    'host'   => $limpiarEnv('IMAP_HOST', 'imap.ionos.mx'),
    'port'   => (int)($_ENV['IMAP_PORT'] ?? 993),
    'user'   => $limpiarEnv('IMAP_USER', 'contacto@tiendas-etcetera.com'),
    'pass'   => $limpiarEnv('IMAP_PASS', ''), // Mantiene intactos caracteres especiales sin comillas basura
    'secure' => strtolower($limpiarEnv('IMAP_SECURE', 'ssl')), // IONOS usa SSL/TLS implícito para el puerto 993
    'from'   => [
        'email' => $limpiarEnv('IMAP_USER', 'contacto@tiendas-etcetera.com'),
        'name'  => 'Etcétera de México'
    ]
];