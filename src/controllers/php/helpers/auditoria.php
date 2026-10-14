<?php
/**
 * Registra de manera unificada un evento en las tablas `movimientos` y `auditoria`.
 * 
 * @param int         $usuario_id    ID del usuario que realiza la acción
 * @param int|null    $sesion_id     ID de la sesión activa
 * @param string      $modulo        Nombre del módulo (ej. 'USUARIOS', 'CATEGORIAS')
 * @param string      $accion        Acción realizada (ej. 'INSERT', 'UPDATE', 'CREAR', 'EDITAR')
 * @param int|null    $entidad_id    ID del registro afectado
 * @param string      $descripcion   Texto descriptivo del movimiento
 * @param array|null  $valor_anterior Datos previos (para actualizaciones)
 * @param array|null  $valor_nuevo   Datos nuevos o ingresados
 */
function RegistrarBitacoraAccion($usuario_id,$sesion_id, $modulo,$accion, $entidad_id,$descripcion, $valor_anterior = null,$valor_nuevo = null) {
    try {
        // 1. Insertar en la tabla `movimientos`
        $sqlMov = "INSERT INTO movimientos (usuario_id, sesion_id, modulo, entidad_id, accion, descripcion) 
                   VALUES (:u_id, :s_id, :modulo, :ent_id, :accion, :desc)";
        
        Consultar_PDO($sqlMov, [
            ':u_id'   => $usuario_id,
            ':s_id'   => $sesion_id,
            ':modulo' => strtoupper($modulo),
            ':ent_id' => $entidad_id,
            ':accion' => strtoupper($accion),
            ':desc'   => $descripcion
        ]);

        // 2. Insertar en la tabla `auditoria` (con JSON nativo)
        $sqlAud = "INSERT INTO auditoria (usuario_id, modulo, accion, referencia_id, valor_anterior, valor_nuevo, descripcion, ip_address, user_agent) 
                   VALUES (:u_id, :modulo, :accion, :ref_id, :val_ant, :val_nuevo, :desc, :ip, :agent)";
        
        Consultar_PDO($sqlAud, [
            ':u_id'      => $usuario_id,
            ':modulo'    => strtoupper($modulo),
            ':accion'    => strtoupper($accion),
            ':ref_id'    => $entidad_id,
            ':val_ant'   => $valor_anterior ? json_encode($valor_anterior, JSON_UNESCAPED_UNICODE) : null,
            ':val_nuevo' => $valor_nuevo ? json_encode($valor_nuevo, JSON_UNESCAPED_UNICODE) : null,
            ':desc'      => $descripcion,
            ':ip'        => $_SERVER['REMOTE_ADDR'] ?? null,
            ':agent'     => $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);

    } catch (Exception $e) {
        // Opcional: Registramos en el log del servidor si falla la auditoría, 
        // pero evitamos que rompa el flujo principal del usuario.
        error_log("Error al registrar bitácora de auditoría/movimiento: " . $e->getMessage());
    }
}