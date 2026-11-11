<?php
/**
 * Controlador de Notificaciones
 */

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Enrutador principal de peticiones de notificaciones
 */
function Manejar_Peticion_Notificaciones($data) {
    $accion = $data['accion'] ?? '';

    switch ($accion) {
        case 'obtener_notificaciones':
            Obtener_Notificaciones_Usuario();
            break;
        case 'marcar_leida':
            Marcar_Notificacion_Leida($data);
            break;
        case 'eliminar_notificacion':
            Eliminar_Notificacion($data);
            break;
        default:
            JsonResponse::error('Acción de notificaciones no válida.', null, 400);
            break;
    }
}

/**
 * 1. Obtiene las notificaciones activas (no eliminadas) del usuario en sesión
 */
function Obtener_Notificaciones_Usuario() {
    $usuarioId = isset($_SESSION['usuario']['id']) ? (int)$_SESSION['usuario']['id'] : 0;
    if ($usuarioId <= 0) {
        JsonResponse::error('No autorizado.', null, 401);
    }

    try {
        $sql = "SELECT id, tipo, titulo, mensaje, data, leida, es_eliminable, created_at 
                FROM notificaciones 
                WHERE usuario_id = ? AND deleted_at IS NULL 
                ORDER BY created_at DESC 
                LIMIT 50";
        
        $notificaciones = Consultar_PDO($sql, [$usuarioId]);

        JsonResponse::success('Notificaciones obtenidas correctamente.', $notificaciones, 200);
    } catch (Throwable $e) {
        error_log("Error al obtener notificaciones: " . $e->getMessage());
        JsonResponse::error('Error al cargar las notificaciones.', null, 500);
    }
}

/**
 * 2. Marca una notificación específica como leída
 */
function Marcar_Notificacion_Leida($data) {
    $usuarioId = isset($_SESSION['usuario']['id']) ? (int)$_SESSION['usuario']['id'] : 0;
    $notifId = isset($data['id']) ? (int)$data['id'] : 0;

    if ($usuarioId <= 0 || $notifId <= 0) {
        JsonResponse::error('Parámetros inválidos.', null, 400);
    }

    try {
        $sql = "UPDATE notificaciones 
                SET leida = 1, leida_at = NOW() 
                WHERE id = ? AND usuario_id = ? AND deleted_at IS NULL";
        
        $rowCount = Consultar_PDO($sql, [$notifId, $usuarioId]);

        if ($rowCount > 0) {
            JsonResponse::success('Notificación marcada como leída.', null, 200);
        } else {
            JsonResponse::error('La notificación no existe o ya fue procesada.', null, 404);
        }
    } catch (Throwable $e) {
        error_log("Error al marcar notificación: " . $e->getMessage());
        JsonResponse::error('Error al actualizar la notificación.', null, 500);
    }
}

/**
 * 3. Borrado lógico de una notificación (respetando si es eliminable)
 */
function Eliminar_Notificacion($data) {
    $usuarioId = isset($_SESSION['usuario']['id']) ? (int)$_SESSION['usuario']['id'] : 0;
    $notifId = isset($data['id']) ? (int)$data['id'] : 0;

    if ($usuarioId <= 0 || $notifId <= 0) {
        JsonResponse::error('Parámetros inválidos.', null, 400);
    }

    try {
        // Verificar si la notificación permite ser eliminada
        $sqlCheck = "SELECT es_eliminable FROM notificaciones WHERE id = ? AND usuario_id = ? AND deleted_at IS NULL";
        $resultado = Consultar_PDO($sqlCheck, [$notifId, $usuarioId]);

        if (empty($resultado)) {
            JsonResponse::error('La notificación no existe.', null, 404);
        }

        $esEliminable = (int)$resultado[0]['es_eliminable'];
        if ($esEliminable === 0) {
            JsonResponse::error('Esta notificación es del sistema y no se puede eliminar.', null, 403);
        }

        // Ejecutar borrado lógico (`deleted_at`)
        SqlUpdateDelete:
        $sqlDelete = "UPDATE notificaciones SET deleted_at = NOW() WHERE id = ? AND usuario_id = ?";
        Consultar_PDO($sqlDelete, [$notifId, $usuarioId]);

        JsonResponse::success('Notificación eliminada correctamente.', null, 200);

    } catch (Throwable $e) {
        error_log("Error al eliminar notificación: " . $e->getMessage());
        JsonResponse::error('Error al eliminar la notificación.', null, 500);
    }
}