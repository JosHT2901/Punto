<?php 
function Obtener_Variables_Sistema(): array {
    try {
        $sql = "SELECT 
                    id, 
                    v_clave, 
                    v_valor, 
                    v_descripcion, 
                    creado_en, 
                    ultima_actualizacion 
                FROM sistema_variables 
                ORDER BY v_clave ASC";

        // Delegamos la ejecución a nuestro helper robusto Consultar_PDO
        $variables = Consultar_PDO($sql);

        // Verificamos que el resultado sea un arreglo válido
        return is_array($variables) ? $variables : [];

    } catch (Throwable $e) {
        // Registramos el error internamente y retornamos un array vacío para no romper la interfaz
        error_log("Error crítico al obtener variables del sistema: " . $e->getMessage());
        return [];
    }
}

function Gestionar_Variables_Sistema(array $datos): void {
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener la instancia única de PDO mediante tu función Conexion()
        $pdo = Conexion();

        // 3. Validar que exista una sesión de usuario activa y obtener su ID y Sesión ID correctamente
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
        }

        // 4. Validar permisos usando el nombre de permiso correcto ('variables.editar')
        if (!TienePermiso($pdo, 'variables.editar')) {
            JsonResponse::error('No cuentas con los permisos necesarios para modificar las variables del sistema.', null, 403);
        }

        // 5. Capturar la IP de origen del cliente de forma segura (opcional para logs)
        $ipOrigen = $_SERVER['HTTP_CLIENT_IP'] 
                    ?? ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null);
        if ($ipOrigen === '::1') {
            $ipOrigen = '127.0.0.1';
        }

        // 6. Extraer y validar los campos enviados desde el formulario de variables
        $simboloMoneda       = trim($datos['simbolo_moneda'] ?? '');
        $codigoIso           = strtoupper(trim($datos['codigo_iso'] ?? ''));
        $redondearPrecios    = isset($datos['redondear_precios']) ? (int)$datos['redondear_precios'] : 0;
        $bloquearStockCero   = isset($datos['bloquear_stock_cero']) ? (int)$datos['bloquear_stock_cero'] : 0;

        // Arreglo con las variables clave-valor que vamos a guardar/actualizar
        $variablesAGuardar = [
            'simbolo_moneda'      => $simboloMoneda,
            'codigo_iso'          => $codigoIso,
            'redondear_precios'     => $redondearPrecios,
            'bloquear_stock_cero'   => $bloquearStockCero
        ];

        // Iniciamos transacción para asegurar consistencia
        $pdo->beginTransaction();

        $sql = "INSERT INTO sistema_variables (v_clave, v_valor, v_descripcion) 
                VALUES (:clave, :valor, :descripcion) 
                ON DUPLICATE KEY UPDATE 
                v_valor = VALUES(v_valor), 
                ultima_actualizacion = CURRENT_TIMESTAMP";

        $stmt = $pdo->prepare($sql);

        // Descripciones predeterminadas para cada clave
        $descripciones = [
            'simbolo_moneda'      => 'Símbolo monetario utilizado en la interfaz',
            'codigo_iso'          => 'Código ISO 4217 de la moneda principal',
            'redondear_precios'   => 'Indica si los precios se redondean automáticamente (1 = Sí, 0 = No)',
            'bloquear_stock_cero' => 'Bloquea la venta si el producto cuenta con stock en cero (1 = Sí, 0 = No)'
        ];

        foreach ($variablesAGuardar as $clave => $valor) {
            $stmt->execute([
                ':clave'       => $clave,
                ':valor'       => (string)$valor,
                ':descripcion' => $descripciones[$clave] ?? 'Variable del sistema'
            ]);
        }

        // Registro centralizado de bitácora y auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'SISTEMA_VARIABLES',
            'ACTUALIZAR',
            null,
            "Se actualizaron las variables de entorno del sistema (IP: {$ipOrigen}).",
            null,
            $variablesAGuardar
        );

        $pdo->commit();

        JsonResponse::success('Variables del sistema actualizadas exitosamente.', [
            'variables' => $variablesAGuardar
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al gestionar variables del sistema: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al procesar variables del sistema: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

