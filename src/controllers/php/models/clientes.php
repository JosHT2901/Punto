<?php
function Obtener_Clientes(): array {
    try {
        $sql = "SELECT 
                    ID, 
                    Codigo_Cliente, 
                    RFC, 
                    Nombre, 
                    Apellido_Paterno, 
                    Apellido_Materno, 
                    Telefono, 
                    Correo, 
                    Regimen_Fiscal, 
                    Codigo_Postal, 
                    Registrado_Por, 
                    Fecha_Registro, 
                    Ultima_Actualizacion, 
                    Habilitado, 
                    Modificado_por 
                FROM clientes 
                ORDER BY ID DESC";

        // Delegamos la ejecución a nuestro helper robusto Consultar_PDO
        $clientes = Consultar_PDO($sql);

        // Verificamos que el resultado sea un arreglo válido
        return is_array($clientes) ? $clientes : [];

    } catch (Throwable $e) {
        // Registramos el error internamente y retornamos un array vacío para no romper la interfaz
        error_log("Error crítico al obtener clientes: " . $e->getMessage());
        return [];
    }
}

function Gestionar_Cliente(array $datos): void {
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

        // 4. Verificar si viene un ID interno (PK) para determinar si es Edición o Creación
        $idCliente = !empty($datos['id']) ? intval($datos['id']) : (!empty($datos['ID']) ? intval($datos['ID']) : 0);
        $esEdicion = ($idCliente > 0);

        // 5. Validar permisos usando tu función TienePermiso()
        $permisoRequerido = $esEdicion ? 'editar_clientes' : 'crear_clientes';
        
        if (!TienePermiso($pdo, $permisoRequerido)) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
        }

        // 6. Limpiar y validar código de cliente
        $codigoCliente = trim($datos['codigo_cliente'] ?? ($datos['Codigo_Cliente'] ?? ''));

        // 7. Limpiar y validar campos obligatorios restantes
        $nombre   = trim($datos['nombre'] ?? '');
        $rfc      = strtoupper(trim($datos['rfc'] ?? ''));
        $telefono = trim($datos['telefono'] ?? '');
        $correo   = trim($datos['correo'] ?? '');
        
        // Recibir y normalizar el tipo de cliente
        $tipoCliente = trim($datos['tipo_cliente'] ?? ($datos['tipo_persona'] ?? 'General'));
        
        if (!is_numeric($codigoCliente)) {
            JsonResponse::error('El código de cliente debe ser numérico.');
        }
        if (empty($nombre)) {
            JsonResponse::error('El nombre o razón social es obligatorio.');
        }
        if (empty($rfc)) {
            JsonResponse::error('El RFC es obligatorio.');
        }
        if (empty($telefono)) {
            JsonResponse::error('El teléfono es obligatorio.');
        }
        if (empty($correo) || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            JsonResponse::error('El correo electrónico no es válido.');
        }

        // 8. Procesar campos opcionales (si vienen vacíos se guardan como NULL)
        $apellidoPaterno = !empty($datos['apellido_paterno']) ? trim($datos['apellido_paterno']) : null;
        $apellidoMaterno = !empty($datos['apellido_materno']) ? trim($datos['apellido_materno']) : null;
        $regimenFiscal   = !empty($datos['regimen_fiscal']) ? trim($datos['regimen_fiscal']) : null;
        $codigoPostal    = !empty($datos['codigo_postal']) ? trim($datos['codigo_postal']) : null;

        if ($esEdicion) {
            // --- FLUJO DE ACTUALIZACIÓN (UPDATE) ---
            
            // Obtener el valor anterior para la auditoría comparativa
            $stmtAnt = $pdo->prepare("SELECT * FROM clientes WHERE ID = :id");
            $stmtAnt->execute([':id' => $idCliente]);
            $valorAnterior = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$valorAnterior) {
                JsonResponse::error('El cliente que intentas editar no existe.');
            }

            $sql = "UPDATE clientes SET 
                        Codigo_Cliente = :codigo_cliente,
                        Tipo_Cliente = :tipo_cliente,
                        RFC = :rfc, 
                        Nombre = :nombre, 
                        Apellido_Paterno = :apellido_paterno, 
                        Apellido_Materno = :apellido_materno, 
                        Telefono = :telefono, 
                        Correo = :correo, 
                        Regimen_Fiscal = :regimen_fiscal, 
                        Codigo_Postal = :codigo_postal, 
                        Modificado_por = :modificado_por,
                        Ultima_Actualizacion = NOW()
                    WHERE ID = :id";

            $paramsUpdate = [
                ':codigo_cliente'   => $codigoCliente,
                ':tipo_cliente'     => $tipoCliente,
                ':rfc'              => $rfc,
                ':nombre'           => $nombre,
                ':apellido_paterno' => $apellidoPaterno,
                ':apellido_materno' => $apellidoMaterno,
                ':telefono'         => $telefono,
                ':correo'           => $correo,
                ':regimen_fiscal'   => $regimenFiscal,
                ':codigo_postal'    => $codigoPostal,
                ':modificado_por'   => $usuarioId,
                ':id'               => $idCliente
            ];

            $stmt = $pdo->prepare($sql);
            $stmt->execute($paramsUpdate);

            // Registro centralizado de bitácora y auditoría
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'CLIENTES',
                'EDITAR',
                $idCliente,
                "Se actualizaron los datos del cliente: {$nombre} (ID: {$idCliente})",
                $valorAnterior,
                $paramsUpdate
            );

            JsonResponse::success('Cliente actualizado exitosamente.', [
                'id'             => $idCliente,
                'codigo_cliente' => $codigoCliente,
                'tipo_cliente'   => $tipoCliente,
                'nombre'         => $nombre
            ]);

        } else {
            // --- FLUJO DE CREACIÓN (INSERT) ---
            $sql = "INSERT INTO clientes (
                        Codigo_Cliente, 
                        Tipo_Cliente,
                        RFC, 
                        Nombre, 
                        Apellido_Paterno, 
                        Apellido_Materno, 
                        Telefono, 
                        Correo, 
                        Regimen_Fiscal, 
                        Codigo_Postal, 
                        Registrado_Por, 
                        Habilitado
                    ) VALUES (
                        :codigo_cliente, 
                        :tipo_cliente,
                        :rfc, 
                        :nombre, 
                        :apellido_paterno, 
                        :apellido_materno, 
                        :telefono, 
                        :correo, 
                        :regimen_fiscal, 
                        :codigo_postal, 
                        :registrado_por, 
                        1
                    )";

            $paramsInsert = [
                ':codigo_cliente'   => $codigoCliente,
                ':tipo_cliente'     => $tipoCliente,
                ':rfc'              => $rfc,
                ':nombre'           => $nombre,
                ':apellido_paterno' => $apellidoPaterno,
                ':apellido_materno' => $apellidoMaterno,
                ':telefono'         => $telefono,
                ':correo'           => $correo,
                ':regimen_fiscal'   => $regimenFiscal,
                ':codigo_postal'    => $codigoPostal,
                ':registrado_por'   => $usuarioId
            ];

            $stmt = $pdo->prepare($sql);
            $stmt->execute($paramsInsert);

            $nuevoId = $pdo->lastInsertId();

            // Registro centralizado de bitácora y auditoría
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'CLIENTES',
                'CREAR',
                $nuevoId,
                "Se registró el cliente: {$nombre} (Código: {$codigoCliente})",
                null,
                $paramsInsert
            );

            JsonResponse::success('Cliente registrado exitosamente.', [
                'id'             => $nuevoId,
                'codigo_cliente' => $codigoCliente,
                'tipo_cliente'   => $tipoCliente,
                'nombre'         => $nombre
            ], 201);
        }

    } catch (PDOException $e) {
        // Capturar errores de índices únicos (Codigo_Cliente, RFC, Teléfono, Correo duplicados)
        if ($e->getCode() == '23000') {
            $errorMsg = $e->getMessage();
            if (strpos($errorMsg, 'Codigo_Cliente') !== false) {
                JsonResponse::error('El código de cliente ya está asignado a otro registro.');
            }
            if (strpos($errorMsg, 'RFC') !== false) {
                JsonResponse::error('El RFC ingresado ya pertenece a otro cliente.');
            }
            if (strpos($errorMsg, 'Telefono') !== false) {
                JsonResponse::error('El número de teléfono ya está asociado a otro cliente.');
            }
            if (strpos($errorMsg, 'Correo') !== false) {
                JsonResponse::error('El correo electrónico ya se encuentra registrado.');
            }
            JsonResponse::error('Ya existe un registro con datos duplicados en el sistema.');
        }

        error_log("Error de BD al guardar/actualizar cliente: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        error_log("Error crítico al procesar cliente: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

/**
 * Genera el siguiente código de cliente numérico único consultando la base de datos.
 * Utiliza Consultar_PDO() para mantener la estandarización y aprovecha la conexión Singleton.
 */
function Generar_Codigo_Cliente() {
    try {
        $sql = "SELECT MAX(CAST(Codigo_Cliente AS UNSIGNED)) as max_codigo 
                FROM clientes 
                WHERE Codigo_Cliente REGEXP '^[0-9]+$'";
        
        // Usamos tu función auxiliar Consultar_PDO
        $resultado = Consultar_PDO($sql);
        
        $siguienteCodigo = 1001; 
        
        // Consultar_PDO devuelve un array de resultados para consultas SELECT
        if (!empty($resultado) && isset($resultado[0]['max_codigo']) && !empty($resultado[0]['max_codigo'])) {
            $siguienteCodigo = intval($resultado[0]['max_codigo']) + 1;
        }
        
        return (string)$siguienteCodigo;

    } catch (Throwable $e) {
        error_log("Error al generar código de cliente en BD: " . $e->getMessage());
        JsonResponse::error('Error al generar el código automático del cliente.', null, 500);
    }
}