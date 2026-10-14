<?php
/**
 * Bootstrap del Sistema
 * Inicializa dependencias, variables de entorno, configuración global y entorno de ejecución.
 */

declare(strict_types=1);

/* ===============================
   AUTOLOAD (Composer)
================================ */
require_once __DIR__ . '../../lib/php/vendor/autoload.php';

use Dotenv\Dotenv;

/* ===============================
   CARGAR VARIABLES DE ENTORNO (.env)
================================ */
try {
    $rutaEnv = dirname(__DIR__) . '/env'; 
    if (file_exists($rutaEnv . '/.env')) {
        $dotenv = Dotenv::createImmutable($rutaEnv);
        $dotenv->load();
    }
} catch (Throwable $e) {
    // Capturamos Throwable por seguridad ante errores de sintaxis o lectura en el .env
}

/* ===============================
   CONFIGURACIÓN GLOBAL (Primero)
================================ */
// Definimos constantes y configuraciones antes de cargar dependencias internas
$isDebug = filter_var($_ENV['APP_DEBUG'] ?? false, FILTER_VALIDATE_BOOLEAN);

define('CONFIG', require __DIR__ . '/config.php');
define('BASE_PATH', realpath(__DIR__ . '/..'));
define('IS_DEBUG', $isDebug);

/* ===============================
   MANEJO DE ERRORES Y DEBUG
================================ */
if (!IS_DEBUG) {
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT);
} else {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
}

/* ===============================
   ZONA HORARIA (Dinámica desde DB o Fallback)
================================ */
// Valor por defecto inmediato por seguridad
date_default_timezone_set('America/Mexico_City');

try {
    require_once __DIR__ . '/conexion.php';
    $pdo = Conexion(); 
    
    if ($pdo) {
        $stmt = $pdo->prepare("SELECT v_valor FROM sistema_variables WHERE v_clave = 'pv_timezone' LIMIT 1");
        $stmt->execute();
        $ajuste = $stmt->fetch();

        if (!empty($ajuste['v_valor'])) {
            date_default_timezone_set($ajuste['v_valor']);
        }
    }
} catch (Throwable $e) {
    // Si la base de datos no está lista, la tabla no existe o falla la conexión, 
    // el sistema continúa operando con el fallback de 'America/Mexico_City'.
}