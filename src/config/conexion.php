<?php
/**
 * Gestión de Conexión y Consultas PDO (Singleton)
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/bootstrap.php';

/**
 * Provee una instancia única de PDO (Singleton)
 */
function Conexion(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    // Intentamos cargar la configuración de forma segura
    $db = [];
    if (file_exists(__DIR__ . '/db.php')) {
        $db = require __DIR__ . '/db.php';
    }

    // Mapeo seguro con respaldo directo de $_ENV si el archivo devolviera vacíos
   // Mapeo seguro con respaldo de getenv() y $_ENV
   $host     = $db['host'] ?? $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? '127.0.0.1';
   $port     = $db['port'] ?? $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?? '3306';
   $dbname   = $db['db'] ?? $db['dbname'] ?? $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? '';
   $user     = $db['user'] ?? $db['username'] ?? $_ENV['DB_USER'] ?? getenv('DB_USER') ?? '';
   $password = $db['password'] ?? $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?? '';
   $charset  = $db['charset'] ?? 'utf8mb4';

    // Validación estricta con mensaje claro
    if (empty($dbname) || empty($user)) {
        throw new Exception("Configuración DB incompleta: Faltan credenciales en el archivo .env o en db.php (DB_NAME: '{$dbname}', DB_USER: '{$user}').");
    }

    try {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $host,
            $port,
            $dbname,
            $charset
        );

        $comandoInicialClave = defined('\Pdo\Mysql::ATTR_INIT_COMMAND') 
            ? \Pdo\Mysql::ATTR_INIT_COMMAND 
            : PDO::MYSQL_ATTR_INIT_COMMAND;

        $pdo = new PDO(
            $dsn,
            $user,
            $password,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                $comandoInicialClave         => "SET NAMES {$charset}; SET time_zone = '-06:00';"
            ]
        );

        return $pdo;

    } catch (PDOException $e) {
        throw new Exception("Error de conexión a la base de datos: " . $e->getMessage(), 0, $e);
    }
}

/**
 * Función auxiliar para ejecutar consultas de forma simplificada
 */
function Consultar_PDO(string $sql, array $params = [], bool $returnId = false)
{
    try {
        $pdo = Conexion(); 
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $sqlTrimmed = ltrim($sql);

        if (stripos($sqlTrimmed, 'SELECT') === 0) {
            return $stmt->fetchAll();
        }

        if ($returnId && stripos($sqlTrimmed, 'INSERT') === 0) {
            return (int) $pdo->lastInsertId();
        }

        return $stmt->rowCount();

    } catch (Throwable $e) {
        throw new Exception("Error en la ejecución de la consulta: " . $e->getMessage(), 0, $e);
    }
}