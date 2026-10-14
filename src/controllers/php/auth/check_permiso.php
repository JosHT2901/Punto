<?php
/**
 * Servicio de Validación de Permisos Directos
 */

declare(strict_types=1);

/**
 * Verifica si el usuario actual tiene un permiso específico asignado de forma directa.
 * 
 * @param PDO $pdo Instancia de conexión a la base de datos
 * @param string $permisoRequerido Clave o nombre exacto del permiso (ej: 'crear_clientes', 'editar_clientes')
 * @return bool True si el usuario tiene el permiso, false si no.
 */
function TienePermiso(PDO $pdo, string $permisoRequerido): bool
{
    // Asegurarnos de que la sesión esté activa
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // 1. Validar si hay un usuario logueado en sesión (consistente con Gestionar_Cliente)
    $usuarioID = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
    if ($usuarioID <= 0) {
        return false;
    }

    try {
        // 2. Consulta ajustada a tu esquema real haciendo JOIN entre usuarios_permisos y permisos
        $sql = "SELECT 1 
                FROM usuarios_permisos up
                INNER JOIN permisos p ON up.permiso_id = p.id
                WHERE up.usuario_id = :usuario_id 
                  AND p.nombre_permiso = :permiso 
                LIMIT 1";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':usuario_id' => $usuarioID,
            ':permiso'    => $permisoRequerido
        ]);

        // Si fetchColumn() encuentra al menos una fila, retorna true
        return $stmt->fetchColumn() !== false;

    } catch (Throwable $e) {
        // Por seguridad, si ocurre un fallo en la base de datos, denegamos el acceso
        error_log("Error al verificar el permiso directo ($permisoRequerido): " . $e->getMessage());
        return false;
    }
}