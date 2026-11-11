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
        JsonResponse::error("Ocurrió un error inesperado al consultar los permisos.", $e->getMessage(), 500);
    }
}

function Obtener_Permisos_Usuario($data) {
    $usuario_plano = Descifrar_Payload($data['usuario_id']);
    $usuarioId = filter_var($usuario_plano ?? null, FILTER_VALIDATE_INT);

    if (!$usuarioId || $usuarioId <= 0) {
        JsonResponse::error("El ID del usuario es inválido o no está definido en 'data'.", null, 400);
    }

    try {
        // 1. Obtener la información general del usuario junto con su imagen principal
        $sqlUsuario = "
            SELECT 
                u.ID AS usuario_id, 
                u.nombre, 
                u.apellido_paterno, 
                u.apellido_materno, 
                u.correo, 
                u.nombre_usuario, 
                u.Habilitado,
                ui.ruta AS imagen_ruta,
                ui.nombre_archivo AS imagen_nombre
            FROM usuarios u
            LEFT JOIN usuarios_imagenes ui ON u.ID = ui.usuario_id AND ui.principal = 1
            WHERE u.ID = ?
            LIMIT 1
        ";
        $resUsuario = Consultar_PDO($sqlUsuario, [$usuarioId]);

        if (empty($resUsuario)) {
            JsonResponse::error("El usuario especificado no existe en el sistema.", null, 404);
        }

        $usuarioInfo = $resUsuario[0];

        // 2. Obtener los permisos del catálogo y verificar si el usuario los posee
        $sqlPermisos = "
            SELECT 
                p.id AS permiso_id,
                p.modulo,
                p.nombre_permiso,
                p.descripcion,
                CASE WHEN up.usuario_id IS NOT NULL THEN 1 ELSE 0 END AS asignado
            FROM permisos p
            LEFT JOIN usuarios_permisos up 
                ON p.id = up.permiso_id AND up.usuario_id = ?
            ORDER BY p.modulo ASC, p.id ASC
        ";

        $resultados = Consultar_PDO($sqlPermisos, [$usuarioId]);

        $permisosAgrupados = [];
        $totalAsignados = 0;
        $totalGeneral = count($resultados);

        foreach ($resultados as $row) {
            $modulo = $row['modulo'];

            if (!isset($permisosAgrupados[$modulo])) {
                $permisosAgrupados[$modulo] = [
                    'modulo' => $modulo,
                    'total_modulo' => 0,
                    'asignados_modulo' => 0,
                    'permisos' => []
                ];
            }

            $asignado = (int)$row['asignado'] === 1;
            if ($asignado) {
                $totalAsignados++;
                $permisosAgrupados[$modulo]['asignados_modulo']++;
            }

            $permisosAgrupados[$modulo]['total_modulo']++;
            $permisosAgrupados[$modulo]['permisos'][] = [
                'id' => (int)$row['permiso_id'],
                'nombre_permiso' => $row['nombre_permiso'],
                'descripcion' => $row['descripcion'],
                'asignado' => $asignado
            ];
        }

        // Bandera que indica si el usuario no tiene ningún permiso asignado
        $sinPermisos = ($totalAsignados === 0);

        // 3. Estructura unificada combinando perfil de usuario, datos de imagen y permisos
        $responseData = [
            'usuario' => [
                'id' => (int)$usuarioInfo['usuario_id'],
                'nombre_completo' => trim($usuarioInfo['nombre'] . ' ' . ($usuarioInfo['apellido_paterno'] ?? '') . ' ' . ($usuarioInfo['apellido_materno'] ?? '')),
                'nombre' => $usuarioInfo['nombre'],
                'apellido_paterno' => $usuarioInfo['apellido_paterno'],
                'apellido_materno' => $usuarioInfo['apellido_materno'],
                'correo' => $usuarioInfo['correo'],
                'nombre_usuario' => $usuarioInfo['nombre_usuario'],
                'imagen' => $usuarioInfo['imagen_ruta'] ?? null, // Ruta de la imagen principal
                'habilitado' => (bool)$usuarioInfo['Habilitado']
            ],
            'permisos_stats' => [
                'total_general' => $totalGeneral,
                'total_asignados' => $totalAsignados,
                'sin_permisos' => $sinPermisos
            ],
            'modulos' => array_values($permisosAgrupados)
        ];

        JsonResponse::success("Información y permisos del usuario obtenidos correctamente.", $responseData, 200);

    } catch (Throwable $e) {
        JsonResponse::error("Error interno del servidor al procesar la solicitud.", $e->getMessage(), 500);
    }
}