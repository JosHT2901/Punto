<?php

/**
 * Clase JsonResponse
 * Estandariza las respuestas del servidor para peticiones AJAX.
 */
class JsonResponse {

    /**
     * Envía una respuesta de éxito (ok: true).
     * 
     * @param string $mensaje Mensaje informativo para el usuario.
     * @param mixed $data Información adicional (objetos, arrays, IDs).
     * @param int $code Código de estado HTTP (200 por defecto).
     */
    public static function success($mensaje = "Operación exitosa", $data = null, int $code = 200): void {
        self::send(true, $mensaje, $data, $code);
    }

    /**
     * Envía una respuesta de error (ok: false).
     * 
     * @param string $mensaje Razón del fallo.
     * @param mixed $data Información extra sobre el error si es necesaria.
     * @param int $code Código de estado HTTP (400, 403, 404, 500).
     */
    public static function error($mensaje = "Ocurrió un error inesperado", $data = null, int $code = 400): void {
        self::send(false, $mensaje, $data, $code);
    }

    /**
     * Envía una respuesta estandarizada para procesos masivos (eliminación, actualización, etc.).
     * 
     * @param string $mensaje Mensaje general del proceso.
     * @param array $processed Arreglo de elementos procesados con éxito (con sus detalles: id, nombre, sku, etc.).
     * @param array $failed Arreglo de elementos que fallaron (con su id y motivo).
     * @param int $code Código de estado HTTP (200 por defecto).
     */
    public static function massive(string $mensaje, array $processed, array $failed, int $code = 200): void {
        $total = count($processed) + count($failed);
        
        $data = [
            "stats" => [
                "total"   => $total,
                "success" => count($processed),
                "error"   => count($failed)
            ],
            "results" => [
                "processed" => $processed,
                "failed"    => $failed
            ]
        ];

        // Determinamos el estado 'ok' global (true si al menos hubo un éxito o si el total es 0)
        $ok = count($processed) > 0 || $total === 0;

        self::send($ok, $mensaje, $data, $code);
    }

    /**
     * Procesa y envía la respuesta final al cliente.
     * 
     * @param bool $ok Estado de la respuesta.
     * @param string $mensaje Mensaje descriptivo.
     * @param mixed $data Datos adjuntos.
     * @param int $code Código HTTP.
     */
    private static function send(bool $ok, string $mensaje, $data, int $code): void {
        // 1. Limpieza del búfer de salida:
        // Evita que Warnings o Notices previos corrompan el formato JSON.
        if (ob_get_level() > 0) {
            ob_end_clean();
        }

        // 2. Establecer el código HTTP
        http_response_code($code);

        // 3. Encabezados obligatorios para JSON y UTF-8
        header('Content-Type: application/json; charset=UTF-8');

        // 4. Estructura unificada de respuesta
        $response = [
            'ok'      => $ok,
            'mensaje' => $mensaje,
            'data'    => $data
        ];

        try {
            // 5. Codificación segura
            echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            // Fallback de emergencia si el array no se pudo convertir a JSON
            http_response_code(500);
            echo json_encode([
                'ok' => false,
                'mensaje' => 'Error al codificar la respuesta JSON: ' . $e->getMessage(),
                'data' => null
            ], JSON_UNESCAPED_UNICODE);
        }

        // 6. Detener la ejecución de inmediato
        exit;
    }
}