<?php
/**
 * Configuración de SMTP
 */

declare(strict_types=1);

// Limpiamos espacios y comillas externas que puedan importarse erróneamente del .env
$limpiarEnv = function($clave, $defecto = '') {
    $valor = $_ENV[$clave] ?? $defecto;
    return trim($valor, " \t\n\r\0\x0B\""); // Remueve espacios y comillas dobles de los extremos
};

return [
    'host'   => $limpiarEnv('SMTP_HOST', 'smtp.ionos.mx'), 
    'port'   => (int)($_ENV['SMTP_PORT'] ?? 587),         // Puerto estándar para TLS explícito
    'user'   => $limpiarEnv('SMTP_USER', ''),
    'pass'   => $limpiarEnv('SMTP_PASS', ''),             // Extrae la contraseña libre de comillas basura
    'secure' => strtolower($limpiarEnv('SMTP_SECURE', 'tls')), // Asegura el string en minúsculas ('tls' o 'ssl')
    'from'   => [
        'email' => $limpiarEnv('SMTP_USER', ''),
        'name'  => 'Etcétera de México'
    ]
];