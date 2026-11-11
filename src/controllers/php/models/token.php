<?php
function Generar_Y_Guardar_Token(int $usuarioId, string $tipo, int $minutosExpiracion = 15): ?array {
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Verificar si ya existe un token vigente y no usado para este usuario y tipo
        $sqlVerificar = "SELECT token, fecha_expiracion FROM tokens_usuarios 
                         WHERE usuario_id = :usuario_id 
                           AND tipo = :tipo 
                           AND usado = 0 
                           AND fecha_expiracion > NOW() 
                         ORDER BY id DESC LIMIT 1";
        
        $resultados = Consultar_PDO($sqlVerificar, [
            'usuario_id' => $usuarioId,
            'tipo'       => $tipo
        ]);

        // Si ya existe un token vigente, lo reutilizamos e indicamos que NO es nuevo
        if (!empty($resultados) && is_array($resultados)) {
            $tokenExistente = $resultados[0]['token'] ?? null;
            if (!empty($tokenExistente)) {
                return [
                    'token' => $tokenExistente,
                    'es_nuevo' => false
                ];
            }
        }

        // 2. Si no existe o ya expiró, invalidamos cualquier residuo anterior por seguridad
        $sqlInvalidar = "UPDATE tokens_usuarios SET usado = 1 WHERE usuario_id = :usuario_id AND tipo = :tipo AND usado = 0";
        Consultar_PDO($sqlInvalidar, [
            'usuario_id' => $usuarioId,
            'tipo'       => $tipo
        ]);

        // 3. Generar un PIN numérico seguro de 6 dígitos
        $codigoPin = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // 4. Calcular fecha y hora de expiración corregida
        $fechaExpiracion = date('Y-m-d H:i:s', time() + ($minutosExpiracion * 60));

        // 5. Insertar el nuevo token en la base de datos usando Consultar_PDO
        $sqlInsert = "INSERT INTO tokens_usuarios (usuario_id, token, tipo, usado, fecha_expiracion) 
                      VALUES (:usuario_id, :token, :tipo, 0, :fecha_expiracion)";
        
        Consultar_PDO($sqlInsert, [
            'usuario_id'       => $usuarioId,
            'token'            => $codigoPin,
            'tipo'             => $tipo,
            'fecha_expiracion' => $fechaExpiracion
        ], true);

        return [
            'token' => $codigoPin,
            'es_nuevo' => true
        ];

    } catch (Throwable $e) {
        error_log("Error crítico en Generar_Y_Guardar_Token: " . $e->getMessage());
        return null;
    }
}