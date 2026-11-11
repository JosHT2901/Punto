<?php
declare(strict_types=1);

// Mostrar errores en pantalla para depurar el test
ini_set('display_errors', '1');
error_reporting(E_ALL);

// La importación de namespaces (use) DEBE ir siempre fuera de cualquier try/if/función
use Dotenv\Dotenv;

$baseDir = dirname(__DIR__);
$autoloadPath = $baseDir . '/lib/php/vendor/autoload.php';
$envPath = $baseDir . '/env';

echo "Ruta base calculada: " . $baseDir . "<br>";
echo "Buscando Autoload en: " . $autoloadPath . " -> " . (file_exists($autoloadPath) ? "ENCONTRADO" : "NO ENCONTRADO") . "<br>";
echo "Buscando carpeta env en: " . $envPath . " -> " . (file_exists($envPath . '/.env') ? "ENCONTRADO .env" : "NO SE ENCUENTRA .env") . "<br><hr>";

if (file_exists($autoloadPath)) {
    require_once $autoloadPath;

    try {
        if (file_exists($envPath . '/.env')) {
            $dotenv = Dotenv::createImmutable($envPath);
            $dotenv->load();
            
            echo "<h3 style='color:green;'>¡Dotenv cargado con éxito!</h3>";
            echo "VALOR DE APP_DEBUG: " . ($_ENV['APP_DEBUG'] ?? 'No definido') . "<br>";
            echo "VALOR DE DB_NAME: " . ($_ENV['DB_NAME'] ?? 'No definido') . "<br>";
        } else {
            echo "<h3 style='color:red;'>El archivo .env no existe en la ruta especificada.</h3>";
        }
    } catch (Throwable $e) {
        echo "<h3 style='color:red;'>Excepción capturada: " . $e->getMessage() . "</h3>";
    }
} else {
    echo "<h3 style='color:red;'>No se pudo cargar el autoloader de Composer.</h3>";
}