<?php
/**
 * Gestión de Conexión y Consultas PDO (Singleton)
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/bootstrap.php';

/**
 * Provee una instancia única de PDO (Singleton)
 * 
 * @return PDO
 * @throws Exception Si la configuración o la conexión fallan.
 */
function Conexion(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = require dirname(__DIR__) . '/config/config.php';
    $db = $config['db'] ?? [];

    // 2. Validación estricta de parámetros obligatorios
    foreach (['host', 'db', 'user', 'password'] as $key) {
        if (empty($db[$key])) {
            throw new Exception("Configuración DB incompleta: falta la clave '{$key}'.");
        }
    }

    // 3. Parámetros opcionales con valores por defecto
    $port = $db['port'] ?? '3306';
    $charset = $db['charset'] ?? 'utf8mb4';

    try {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $db['host'],
            $port,
            $db['db'],
            $charset
        );

        // Detección segura de driver: Evita el Fatal Error en consola CLI vs Servidor web
        $comandoInicialClave = defined('\Pdo\Mysql::ATTR_INIT_COMMAND') 
            ? \Pdo\Mysql::ATTR_INIT_COMMAND 
            : PDO::MYSQL_ATTR_INIT_COMMAND;

        $pdo = new PDO(
            $dsn,
            $db['user'],
            $db['password'],
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false, // Cambiado a false por seguridad nativa de tipos en PDO
                $comandoInicialClave         => "SET NAMES {$charset}; SET time_zone = '-06:00';"
            ]
        );

        return $pdo;

    } catch (PDOException $e) {
        // Encadenamiento de excepciones: Oculta credenciales pero preserva el log técnico original
        throw new Exception("Error de conexión a la base de datos.", 0, $e);
    }
}

/**
 * Función auxiliar para ejecutar consultas de forma simplificada
 * 
 * @param string $sql Consulta SQL
 * @param array $params Parámetros de la consulta
 * @param bool $returnId Si es true y la consulta es un INSERT, devuelve el ID generado.
 * @return mixed Resultados del SELECT, ID del INSERT, o número de filas afectadas.
 * @throws Exception Si ocurre un fallo en la ejecución.
 */
function Consultar_PDO(string $sql, array $params = [], bool $returnId = false)
{
    try {
        $pdo = Conexion(); 
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $sqlTrimmed = ltrim($sql);

        // 1. Si es una consulta SELECT, devolvemos los resultados
        if (stripos($sqlTrimmed, 'SELECT') === 0) {
            return $stmt->fetchAll();
        }

        // 2. Si es un INSERT y pedimos el ID, devolvemos el lastInsertId
        if ($returnId && stripos($sqlTrimmed, 'INSERT') === 0) {
            return (int) $pdo->lastInsertId();
        }

        // 3. Para UPDATE, DELETE o INSERT estándar, devolvemos filas afectadas
        return $stmt->rowCount();

} catch (Throwable $e) {
        throw new Exception("Error en la ejecución de la consulta: " . $e->getMessage(), 0, $e);
    }
}