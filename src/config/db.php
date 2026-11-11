<?php
/**
 * Configuración de Base de Datos
 */

declare(strict_types=1);

return [
    'host'      => $_ENV['DB_HOST'] ?? '127.0.0.1',
    'port'      => $_ENV['DB_PORT'] ?? 3306,
    'db'        => $_ENV['DB_NAME'] ?? '',      // Coincide con la validación de conexion.php
    'user'      => $_ENV['DB_USER'] ?? '',      // Coincide con la validación de conexion.php
    'password'  => $_ENV['DB_PASS'] ?? '',      // Coincide con la validación de conexion.php
    'charset'   => 'utf8mb4',
    'dump_path' => $_ENV['DB_DUMP_PATH'] ?? 'mysqldump',
];