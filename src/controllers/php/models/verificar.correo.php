<?php
function Solicitar_Token_Verificacion_Correo(): void
{
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Verificar que el usuario esté logueado y exista en sesión
        if (!isset($_SESSION['usuario']) || !is_array($_SESSION['usuario'])) {
            JsonResponse::error("No hay una sesión de usuario activa.", null, 401);
            return;
        }

        // 3. Extraer el ID y correo del usuario desde la sesión
        $usuarioId = (int)($_SESSION['usuario']['id'] ?? 0);
        $correoUsuario = $_SESSION['usuario']['correo'] ?? '';

        if ($usuarioId <= 0) {
            JsonResponse::error("Identificador de usuario inválido en la sesión.", null, 400);
            return;
        }

        // 4. NUEVO: Verificar directamente en la base de datos si el correo ya está verificado
        $sqlVerificado = "SELECT correo_verificado FROM usuarios WHERE ID = :id LIMIT 1";
        $resultadoUsuario = Consultar_PDO($sqlVerificado, [':id' => $usuarioId]);

        if (empty($resultadoUsuario)) {
            JsonResponse::error("El usuario especificado no existe en el sistema.", null, 404);
            return;
        }

        if ((int)$resultadoUsuario[0]['correo_verificado'] === 1) {
            JsonResponse::error("Tu correo electrónico ya se encuentra verificado.", null, 400);
            return;
        }

        // 5. Definir el tipo de token requerido
        $tipoToken = 'verificacion_cuenta';
        $minutosExpiracion = 15;

        // 6. Llamar a la función para verificar si ya existe un token vigente
        $resultadoToken = Generar_Y_Guardar_Token($usuarioId, $tipoToken, $minutosExpiracion);

        if (!$resultadoToken) {
            JsonResponse::error("No se pudo generar o recuperar el código de verificación.", null, 500);
            return;
        }

        // Si la función detecta que el token NO es nuevo (es decir, ya existía uno vigente)
        if (!$resultadoToken['es_nuevo']) {
            JsonResponse::error("Ya cuentas con un código de verificación vigente.", null, 400);
            return;
        }

        $tokenGenerado = $resultadoToken['token'];

        // 7. AQUÍ DISPARAS EL ENVÍO DEL CORREO SMTP (Solo se ejecuta si se generó uno nuevo y no estaba verificado)
        if (!empty($correoUsuario)) {
            // MailService::enviarCorreoVerificacion($correoUsuario, $tokenGenerado);
        }

        // 8. Responder con éxito al cliente
        JsonResponse::success("Código de verificación generado correctamente.", null);

    } catch (Throwable $e) {
        error_log("Error en Solicitar_Token_Verificacion_Correo: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al procesar la solicitud.", $e->getMessage(), 500);
    }
}


/**
 * Obtiene el token vigente de la base de datos y envía el correo de verificación 
 * utilizando únicamente el ID de sesión del usuario.
 */
function Enviar_Correo_Verificacion_Con_Id_Sesion(): void
{
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Verificar que el usuario esté logueado en sesión
        if (!isset($_SESSION['usuario']) || !is_array($_SESSION['usuario'])) {
            JsonResponse::error("No hay una sesión de usuario activa.", null, 401);
        }

        // 3. Extraer el ID de sesión del usuario
        $usuarioId = (int)($_SESSION['usuario']['id'] ?? 0);

        if ($usuarioId <= 0) {
            JsonResponse::error("Identificador de usuario inválido en la sesión.", null, 400);
        }

        // 4. Consultar el correo y el nombre directamente de la tabla 'usuarios'
        $sqlUsuario = "SELECT nombre, correo FROM usuarios WHERE ID = :id LIMIT 1";
        $resultadoUsuario = Consultar_PDO($sqlUsuario, ['id' => $usuarioId]);

        if (empty($resultadoUsuario) || !is_array($resultadoUsuario)) {
            JsonResponse::error("No se encontró el registro del usuario en la base de datos.", null, 404);
        }

        $nombreUsuario = $resultadoUsuario[0]['nombre'] ?? 'Usuario';
        $correoUsuario = $resultadoUsuario[0]['correo'] ?? '';

        if (empty($correoUsuario)) {
            JsonResponse::error("El usuario no cuenta con un correo electrónico registrado.", null, 400);
        }

        // 5. Consultar el token vigente, no usado y su fecha de expiración de la tabla 'tokens_usuarios'
        $tipoToken = 'verificacion_cuenta';
        $sqlToken = "SELECT token, fecha_expiracion FROM tokens_usuarios 
                     WHERE usuario_id = :usuario_id 
                       AND tipo = :tipo 
                       AND usado = 0 
                       AND fecha_expiracion > NOW() 
                     ORDER BY id DESC LIMIT 1";

        $resultadoToken = Consultar_PDO($sqlToken, [
            'usuario_id' => $usuarioId,
            'tipo'       => $tipoToken
        ]);

        if (empty($resultadoToken) || !is_array($resultadoToken)) {
            JsonResponse::error("No se encontró un código de verificación activo para este usuario.", null, 404);
        }

        $tokenExistente = $resultadoToken[0]['token'] ?? '';
        $fechaExpiracion = $resultadoToken[0]['fecha_expiracion'] ?? '';

        if (empty($tokenExistente)) {
            JsonResponse::error("El token de verificación obtenido no es válido.", null, 500);
        }

        // Formatear la hora de expiración de forma amigable (Ej: 14:35:00)
        $horaExpira = !empty($fechaExpiracion) ? date('H:i', strtotime($fechaExpiracion)) : 'pronto';

        // Obtener el nombre del remitente desde tu configuración actual si está disponible
        $nombreRemitente = $_ENV['SMTP_FROM_NAME'] ?? getenv('SMTP_FROM_NAME') ?? 'Sistema';
        $nombreRemitente = trim($nombreRemitente, '"\'');

        // 6. Preparar los datos estructurados usando el sistema de llaves {{variable}}
        $datosCorreo = [
            'destinatario_email'  => $correoUsuario,
            'destinatario_nombre' => $nombreUsuario,
            'asunto'              => 'Código de Verificación de Cuenta',
            'cuerpo_html'         => '
                <div style="font-family:\'Montserrat\', Arial, sans-serif; max-width:600px; margin:auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color:#03618d; text-align:center;">Código de un solo uso</h2>
                    <p>Hola <strong>{{nombre}}</strong>,</p>
                    <p>Tu código de verificación es:</p>
                    <div style="font-size:32px; text-align:center; letter-spacing:6px; font-weight:bold; color:#03618d; margin:20px 0; background:#f8fafc; padding: 15px; border-radius: 6px;">
                        {{codigo}}
                    </div>
                    <p style="text-align:center; background:#c7e0f4; padding:10px; border-radius:8px; color:#0f172a;">
                        Válido hasta las <strong>{{hora_expira}}</strong>
                    </p>
                    <p style="font-size:13px; color:#555; margin-top: 20px;">Si no solicitaste este código, puedes ignorar este mensaje.</p>
                    <p style="margin-top: 30px; font-weight: bold; color: #334155;">{{remitente}}</p>
                </div>
            ',
            'variables' => [
                'nombre'      => $nombreUsuario,
                'codigo'      => $tokenExistente,
                'hora_expira' => $horaExpira,
                'remitente'   => $nombreRemitente
            ]
        ];

        // 7. Llamar a tu función de envío de correo
        Enviar_Correo($datosCorreo);
    } catch (Throwable $e) {
        error_log("Error en Enviar_Correo_Verificacion_Con_Id_Sesion: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al procesar el envío del correo.", $e->getMessage(), 500);
    }
}

function Verificar_Token_Verificacion_Correo(array $data): void
{
    $token = trim($data['codigo'] ?? '');
    
    if (empty($token)) {
        JsonResponse::error("El token de verificación es obligatorio.", null, 400);
        return;
    }

    try {
        // 1. Buscar el token en la base de datos usando Consultar_PDO
        $sql = "SELECT t.id AS token_id, t.usuario_id, t.tipo, t.usado, t.fecha_expiracion, 
                       u.ID, u.correo, u.nombre_usuario, u.correo_verificado, u.Habilitado
                FROM tokens_usuarios t
                INNER JOIN usuarios u ON t.usuario_id = u.ID
                WHERE t.token = :token AND t.tipo = 'verificacion_cuenta'
                LIMIT 1";

        $resultado = Consultar_PDO($sql, [
            ':token' => $token
        ]);

        if (empty($resultado)) {
            JsonResponse::error("El token proporcionado no es válido o no corresponde a una verificación de cuenta.", null, 404);
            return;
        }

        $registro = $resultado[0];

        // 2. Validar si ya fue usado
        if ((int)$registro['usado'] === 1) {
            JsonResponse::error("Este token ya ha sido utilizado anteriormente.", null, 400);
            return;
        }

        // 3. Validar si ha expirado
        $fechaExpiracion = new DateTime($registro['fecha_expiracion']);
        $ahora = new DateTime();

        if ($ahora > $fechaExpiracion) {
            JsonResponse::error("El token ha expirado. Solicite uno nuevo.", null, 400);
            return;
        }

        // 4. Validar si el usuario está habilitado
        if ((int)$registro['Habilitado'] === 0) {
            JsonResponse::error("La cuenta de usuario se encuentra deshabilitada.", null, 403);
            return;
        }

        // 5. Transacción segura utilizando la conexión Singleton para asegurar consistencia
        $pdo = Conexion();
        $pdo->beginTransaction();

        try {
            // Marcar token como consumido usando Consultar_PDO
            Consultar_PDO("UPDATE tokens_usuarios SET usado = 1 WHERE id = :id", [
                ':id' => $registro['token_id']
            ]);

            // Actualizar el estado de verificación en la tabla usuarios si aún no está verificado
            if ((int)$registro['correo_verificado'] === 0) {
                Consultar_PDO("UPDATE usuarios SET correo_verificado = 1, Ultima_modificacion = NOW() WHERE ID = :id", [
                    ':id' => $registro['ID']
                ]);
            }

            $pdo->commit();
        } catch (Throwable $txEx) {
            $pdo->rollBack();
            throw $txEx;
        }

        // 6. Responder de manera exitosa usando JsonResponse::success
        JsonResponse::success("¡Cuenta verificada correctamente!", [
            'usuario_id'        => $registro['ID'],
            'correo'            => $registro['correo'],
            'nombre_usuario'    => $registro['nombre_usuario'],
            'correo_verificado' => 1
        ], 200);

    } catch (Throwable $e) {
        error_log("Error al verificar token: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al procesar la verificación del token.", $e->getMessage(), 500);
    }
}


