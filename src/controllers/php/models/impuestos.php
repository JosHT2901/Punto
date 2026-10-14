<?php 

/**
 * Obtiene el listado completo de esquemas fiscales ordenados del más reciente al más antiguo.
 * 
 * @return array Arreglo asociativo con los esquemas fiscales o vacío en caso de error.
 */
function Obtener_Esquemas_Fiscales(): array {
    try {
        $sql = "SELECT 
                    id, 
                    nombre, 
                    tasa_iva, 
                    tasa_ieps, 
                    ieps_cuota_litro, 
                    ieps_cuota_unidad, 
                    retencion_isr, 
                    retencion_iva, 
                    estado, 
                    fecha_alta, 
                    fecha_modificacion, 
                    creado_por, 
                    modificado_por 
                FROM impuestos_esquemas 
                ORDER BY id DESC";

        // Delegamos la ejecución a nuestro helper robusto Consultar_PDO
        $esquemas = Consultar_PDO($sql);

        // Verificamos que el resultado sea un arreglo válido
        return is_array($esquemas) ? $esquemas : [];

    } catch (Throwable $e) {
        // Registramos el error internamente y retornamos un array vacío para no romper la interfaz
        error_log("Error crítico al obtener esquemas fiscales: " . $e->getMessage());
        return [];
    }
}

function Guardar_Esquema_Fiscal(array $datos): void {
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

        // 4. Determinar el tipo de operación recibida (soporta 'tipo' o 'accion' enviado desde JS)
        $accion = trim($datos['accion'] ?? ($datos['tipo'] ?? 'unica'));
        $tipo = 'unica';
        if ($accion === 'editar' || $accion === 'actualizar_esquema_fiscal') {
            $tipo = 'editar';
        } elseif ($accion === 'masivo') {
            $tipo = 'masivo';
        }

        // 5. Validar permisos usando tu función TienePermiso()
        $permisoRequerido = ($tipo === 'editar') ? 'editar_esquemas_fiscales' : 'crear_esquemas_fiscales';
        
        if (!TienePermiso($pdo, $permisoRequerido)) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
        }

        // --- FLUJO A: EDICIÓN DE UN ESQUEMA FISCAL ---
        if ($tipo === 'editar') {
            $idEsquema         = !empty($datos['id']) ? intval($datos['id']) : 0;
            $nombre            = strtoupper(trim($datos['nombre'] ?? ''));
            $tasaIva           = floatval($datos['tasa_iva'] ?? 0);
            $tasaIeps          = floatval($datos['tasa_ieps'] ?? 0);
            $iepsCuotaLitro    = floatval($datos['ieps_cuota_litro'] ?? 0);
            $iepsCuotaUnidad   = floatval($datos['ieps_cuota_unidad'] ?? 0);
            $retencionIsr      = floatval($datos['retencion_isr'] ?? 0);
            $retencionIva      = floatval($datos['retencion_iva'] ?? 0);

            if ($idEsquema <= 0) {
                JsonResponse::error('El ID del esquema fiscal a editar no es válido.');
            }
            if (empty($nombre)) {
                JsonResponse::error('El nombre del esquema fiscal es obligatorio.');
            }

            // Obtener valor anterior para la auditoría comparativa
            $stmtAnt = $pdo->prepare("SELECT id, nombre, tasa_iva, tasa_ieps, ieps_cuota_litro, ieps_cuota_unidad, retencion_isr, retencion_iva, estado FROM impuestos_esquemas WHERE id = :id");
            $stmtAnt->execute([':id' => $idEsquema]);
            $valorAnterior = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$valorAnterior) {
                JsonResponse::error('El esquema fiscal que intentas editar no existe.');
            }

            // Validar si el nuevo nombre ya pertenece a OTRO esquema diferente
            $stmtCheck = $pdo->prepare("SELECT id FROM impuestos_esquemas WHERE nombre = :nombre AND id != :id LIMIT 1");
            $stmtCheck->execute([':nombre' => $nombre, ':id' => $idEsquema]);
            if ($stmtCheck->fetch()) {
                JsonResponse::error('El nombre del esquema fiscal ya se encuentra registrado en el sistema.');
            }

            $sql = "UPDATE impuestos_esquemas SET 
                        nombre = :nombre, 
                        tasa_iva = :tasa_iva,
                        tasa_ieps = :tasa_ieps,
                        ieps_cuota_litro = :ieps_cuota_litro,
                        ieps_cuota_unidad = :ieps_cuota_unidad,
                        retencion_isr = :retencion_isr,
                        retencion_iva = :retencion_iva,
                        modificado_por = :modificado_por,
                        fecha_modificacion = NOW()
                    WHERE id = :id";

            $paramsUpdate = [
                ':nombre'            => $nombre,
                ':tasa_iva'          => $tasaIva,
                ':tasa_ieps'         => $tasaIeps,
                ':ieps_cuota_litro'  => $iepsCuotaLitro,
                ':ieps_cuota_unidad' => $iepsCuotaUnidad,
                ':retencion_isr'     => $retencionIsr,
                ':retencion_iva'     => $retencionIva,
                ':modificado_por'    => $usuarioId,
                ':id'                => $idEsquema
            ];

            $stmt = $pdo->prepare($sql);
            $stmt->execute($paramsUpdate);

            // Registro centralizado de bitácora y auditoría
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'IMPUESTOS_ESQUEMAS',
                'EDITAR',
                $idEsquema,
                "Se actualizó el esquema fiscal ID: {$idEsquema} a '{$nombre}'",
                $valorAnterior,
                $paramsUpdate
            );

            JsonResponse::success('Esquema fiscal actualizado exitosamente.', [
                'id'     => $idEsquema,
                'nombre' => $nombre
            ]);
        }

        // --- FLUJO B: CREACIÓN DE UN ÚNICO ESQUEMA FISCAL ---
        $nombre            = strtoupper(trim($datos['nombre'] ?? ''));
        $tasaIva           = floatval($datos['tasa_iva'] ?? 0);
        $tasaIeps          = floatval($datos['tasa_ieps'] ?? 0);
        $iepsCuotaLitro    = floatval($datos['ieps_cuota_litro'] ?? 0);
        $iepsCuotaUnidad   = floatval($datos['ieps_cuota_unidad'] ?? 0);
        $retencionIsr      = floatval($datos['retencion_isr'] ?? 0);
        $retencionIva      = floatval($datos['retencion_iva'] ?? 0);

        if (empty($nombre)) {
            JsonResponse::error('El nombre del esquema fiscal es obligatorio.');
        }

        // Validar previamente si ya existe para evitar errores de excepción
        $stmtCheck = $pdo->prepare("SELECT id FROM impuestos_esquemas WHERE nombre = :nombre LIMIT 1");
        $stmtCheck->execute([':nombre' => $nombre]);
        if ($stmtCheck->fetch()) {
            JsonResponse::error('El esquema fiscal ingresado ya se encuentra registrado en el sistema.');
        }

        $sql = "INSERT INTO impuestos_esquemas (
                    nombre, tasa_iva, tasa_ieps, ieps_cuota_litro, ieps_cuota_unidad, 
                    retencion_isr, retencion_iva, estado, creado_por
                ) VALUES (
                    :nombre, :tasa_iva, :tasa_ieps, :ieps_cuota_litro, :ieps_cuota_unidad, 
                    :retencion_isr, :retencion_iva, 'activo', :creado_por
                )";

        $stmt = $pdo->prepare($sql);
        $paramsInsert = [
            ':nombre'            => $nombre,
            ':tasa_iva'          => $tasaIva,
            ':tasa_ieps'         => $tasaIeps,
            ':ieps_cuota_litro'  => $iepsCuotaLitro,
            ':ieps_cuota_unidad' => $iepsCuotaUnidad,
            ':retencion_isr'     => $retencionIsr,
            ':retencion_iva'     => $retencionIva,
            ':creado_por'        => $usuarioId
        ];
        
        $stmt->execute($paramsInsert);
        $nuevoId = $pdo->lastInsertId();

        // Registro centralizado de bitácora y auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'IMPUESTOS_ESQUEMAS',
            'CREAR',
            $nuevoId,
            "Se registró el esquema fiscal: {$nombre} (ID: {$nuevoId})",
            null,
            $paramsInsert
        );

        JsonResponse::success('Esquema fiscal registrado exitosamente.', [
            'id'     => $nuevoId,
            'nombre' => $nombre
        ], 201);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }

        if ($e->getCode() == '23000') {
            $errorMsg = $e->getMessage();
            if (strpos($errorMsg, 'nombre') !== false) {
                JsonResponse::error('El esquema fiscal ingresado ya se encuentra registrado en el sistema.');
            }
            JsonResponse::error('Ya existe un registro duplicado en la base de datos.');
        }

        error_log("Error de BD al gestionar esquema fiscal: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al procesar esquema fiscal: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}