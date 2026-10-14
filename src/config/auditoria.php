<?php
/**
 * Utilidades de Auditoría, Logs y Control de Movimientos del Sistema
 */

declare(strict_types=1);

/**
 * Obtiene la IP real del usuario incluso detrás de proxies
 */
function ObtenerIP(): string
{
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

/**
 * Registro de auditoría en archivo físico (.log)
 */
function AuditoriaLog(string $mensaje, string $nivel = 'INFO'): void
{
    $dirLog = dirname(__DIR__) . '/logs';
    if (!is_dir($dirLog)) {
        mkdir($dirLog, 0777, true);
    }

    $fecha   = date('Y-m-d H:i:s');
    $ip      = ObtenerIP();
    $usuario = $_SESSION['usuario']['nombre_usuario'] ?? 'Sistema/Anonimo';
    
    $logMsg = "[$fecha] [$nivel] [User: $usuario] [IP: $ip] - $mensaje" . PHP_EOL;
    
    // LOCK_EX evita corrupción si varios usuarios escriben al mismo tiempo
    file_put_contents($dirLog . '/sistema_auditoria.log', $logMsg, FILE_APPEND | LOCK_EX);
}

/**
 * Registra movimientos operativos y de auditoría en la base de datos y log físico.
 */
function RegistrarMovimiento(PDO $pdo, string $modulo, string $accion, ?int $id_referencia, string $descripcion): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    try {
        $ip        = ObtenerIP();
        $ua        = $_SERVER['HTTP_USER_AGENT'] ?? 'Desconocido';
        $usuarioID = $_SESSION['usuario']['id'] ?? 0;
        
        // Capturar el ID desde cualquiera de las dos ubicaciones lógicas
        $sesionID  = $_SESSION['usuario']['sesion_id'] ?? $_SESSION['seguridad']['sess_db_id'] ?? null; 

        // --- CORRECCIÓN CRÍTICA DE INTEGRIDAD PARA LA FK ---
        if (empty($sesionID) || (int)$sesionID <= 0) {
            $sesionID = null;
        } else {
            $sesionID = (int)$sesionID;
        }

        // Si hay un usuario válido en sesión, registramos el movimiento
        if ($usuarioID > 0) {
            $sqlMov = "INSERT INTO movimientos (usuario_id, modulo, entidad_id, accion, descripcion, fecha, sesion_id) 
                       VALUES (:uid, :mod, :ent, :acc, :des, NOW(), :ses)";
            
            $stmtMov = $pdo->prepare($sqlMov);
            $stmtMov->execute([
                'uid' => $usuarioID,
                'mod' => $modulo,
                'ent' => $id_referencia, 
                'acc' => $accion,
                'des' => mb_substr($descripcion, 0, 255), // mb_substr para seguridad multibyte en UTF-8
                'ses' => $sesionID 
            ]);
        }

        // 2. REGISTRO EN TABLA AUDITORIA
        $sqlAudit = "INSERT INTO auditoria (usuario_id, modulo, accion, referencia_id, descripcion, ip_address, user_agent, fecha) 
                     VALUES (:uid, :mod, :acc, :ref, :des, :ip, :ua, NOW())";
        
        $stmtAudit = $pdo->prepare($sqlAudit);
        $stmtAudit->execute([
            'uid' => $usuarioID,
            'mod' => $modulo,
            'acc' => $accion,
            'ref' => $id_referencia,
            'des' => $descripcion, 
            'ip'  => $ip,
            'ua'  => mb_substr($ua, 0, 255)
        ]);

        // 3. LOG FÍSICO
        $nivelLog = in_array(strtoupper($accion), ['ERROR', 'CRITICAL', 'DELETE'], true) ? 'WARNING' : 'INFO';
        AuditoriaLog("Modulo: $modulo | Accion: $accion | EntidadRef: " . ($id_referencia ?? 'N/A') . " | IP: $ip | SESS_DB_ID: " . ($sesionID ?? 'Ninguna') . " | Desc: $descripcion", $nivelLog);

    } catch (Throwable $e) {
        // Usamos Throwable para atrapar tanto Exception como PDOException
        AuditoriaLog("CRITICAL - Fallo registro en DB (Mov/Audit): " . $e->getMessage(), 'CRITICAL');
        error_log("Fallo crítico en RegistrarMovimiento: " . $e->getMessage());
    }
}