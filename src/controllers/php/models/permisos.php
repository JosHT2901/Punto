<?php
function Obtener_Permisos(): void {
    try {
        // Asegurarnos de que la sesión esté activa
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Validar que el usuario esté autenticado y tenga un ID en sesión
        if (!isset($_SESSION['usuario']['id']) || empty($_SESSION['usuario']['id'])) {
            JsonResponse::error("No autorizado. Inicie sesión para continuar.", null, 401);
            return;
        }

        $usuarioId = (int) $_SESSION['usuario']['id'];

        $sql = "SELECT 
                    p.id, 
                    p.modulo, 
                    p.nombre_permiso, 
                    p.descripcion, 
                    up.assigned_at 
                FROM usuarios_permisos up
                INNER JOIN permisos p ON up.permiso_id = p.id
                WHERE up.usuario_id = :usuario_id
                ORDER BY p.modulo ASC, p.nombre_permiso ASC";

        // Delegamos la ejecución a nuestro helper robusto Consultar_PDO con parámetros
        $permisos = Consultar_PDO($sql, ['usuario_id' => $usuarioId]);

        // Verificamos que el resultado sea un arreglo válido
        if (!is_array($permisos)) {
            JsonResponse::error("No se pudo obtener el listado de permisos del usuario.", null, 500);
        }

        // Retornamos la respuesta estandarizada con éxito
        JsonResponse::success("Permisos obtenidos correctamente", $permisos);

    } catch (Throwable $e) {
        // Registramos el error internamente y respondemos con error controlado
        error_log("Error crítico al obtener permisos de la sesión: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al consultar los permisos.", null, 500);
    }
}