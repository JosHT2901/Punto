<?php
require_once __DIR__ . '/../../../config/conexion.php';
require_once __DIR__ . '/../helpers/json.response.php';
require_once __DIR__ . '/../helpers/paginacion.php';
require_once __DIR__ . '/../helpers/time.php';
require_once __DIR__ . '/../helpers/auditoria.php';
require_once __DIR__ . '/../../../config/auditoria.php';
require_once __DIR__ . '/../helpers/cifrado.php';
require_once __DIR__ . '/../helpers/paginacion.services.php';
require_once __DIR__ . '/../auth/check_permiso.php';
require_once __DIR__ . '/../helpers/exportar_universal.php';
require_once __DIR__ . '/../../../config/sesion_example.php';

require_once __DIR__ . '/../models/token.php';
require_once __DIR__ . '/../controllers/mail.php';
function DespacharAccion($accionesPermitidas) {
    try {
        $accion = $_POST['accion'] ?? '';

        if (!array_key_exists($accion, $accionesPermitidas)) {
            JsonResponse::error("Acción '$accion' no válida o no permitida.");
        }

        $funcion = $accionesPermitidas[$accion];
        
        // 1. Obtener los parámetros base de la petición
        $params = $_POST['data'] ?? $_POST;

        // 2. SOPORTE PARA FILES: Si se enviaron archivos, los inyectamos en $params
        if (!empty($_FILES)) {
            // Si $params es un string o no es array por alguna razón, lo volvemos un array estructurado
            if (!is_array($params)) {
                $params = ['valor_plano' => $params];
            }
            // Fusionamos los archivos dentro de la clave 'archivos'
            $params['archivos'] = $_FILES;
        }

        // Validar que la función exista en los archivos requeridos
        if (!function_exists($funcion)) {
            JsonResponse::error("Error interno: La función '$funcion' no está definida.");
        }

        // Ejecutamos la lógica pasando el array unificado
        $resultado = $funcion($params);

        // Si la función ya llamó a JsonResponse internamente, el script terminará ahí.
        JsonResponse::success(
            $resultado['mensaje'] ?? "Operación exitosa", 
            $resultado['data'] ?? $resultado
        );

    } catch (Throwable $e) {
        JsonResponse::error($e->getMessage());
    }
}