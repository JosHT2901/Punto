<?php

function Obtener_Clientes(): void {
    try {
        $sql = "SELECT 
                    ID, 
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
                    Fecha_Registro, 
                    Ultima_Actualizacion, 
                    Habilitado, 
                    Modificado_por,
                    TRIM(CONCAT(Nombre, ' ', COALESCE(Apellido_Paterno, ''), ' ', COALESCE(Apellido_Materno, ''))) AS nombre_completo
                FROM clientes 
                ORDER BY ID DESC";

        // Delegamos la ejecución a nuestro helper robusto Consultar_PDO
        $clientes = Consultar_PDO($sql);

        // Verificamos que el resultado sea un arreglo válido
        $listaClientes = is_array($clientes) ? $clientes : [];

        // Respondemos usando JsonResponse (el cual envía el JSON y detiene la ejecución con exit)
        JsonResponse::success('Clientes obtenidos correctamente.', $listaClientes);

    } catch (Throwable $e) {
        // Registramos el error internamente y retornamos una respuesta de error estandarizada
        error_log("Error crítico al obtener clientes: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error en el servidor al obtener los clientes.', null, 500);
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

        // Identificar la sección que se está guardando (si aplica en edición)
        $seccion = trim($datos['seccion'] ?? '');

        if ($esEdicion) {
            // --- FLUJO DE ACTUALIZACIÓN POR SECCIONES (UPDATE) ---
            
            // Obtener el valor anterior para la auditoría comparativa
            $stmtAnt = $pdo->prepare("SELECT * FROM clientes WHERE ID = :id");
            $stmtAnt->execute([':id' => $idCliente]);
            $valorAnterior = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$valorAnterior) {
                JsonResponse::error('El cliente que intentas editar no existe.');
            }

            // Construir la consulta dinámicamente según la sección enviada
            if ($seccion === 'basica') {
                $nombre          = trim($datos['nombre'] ?? '');
                $apellidoPaterno = !empty($datos['apellido_paterno']) ? trim($datos['apellido_paterno']) : null;
                $apellidoMaterno = !empty($datos['apellido_materno']) ? trim($datos['apellido_materno']) : null;
                $tipoCliente     = trim($datos['tipo_cliente'] ?? 'FÍSICA');

                if (empty($nombre)) {
                    JsonResponse::error('El nombre o razón social es obligatorio.');
                }

                $sql = "UPDATE clientes SET 
                            Tipo_Cliente = :tipo_cliente,
                            Nombre = :nombre, 
                            Apellido_Paterno = :apellido_paterno, 
                            Apellido_Materno = :apellido_materno, 
                            Modificado_por = :modificado_por,
                            Ultima_Actualizacion = NOW()
                        WHERE ID = :id";

                $paramsUpdate = [
                    ':tipo_cliente'     => $tipoCliente,
                    ':nombre'           => $nombre,
                    ':apellido_paterno' => $apellidoPaterno,
                    ':apellido_materno' => $apellidoMaterno,
                    ':modificado_por'   => $usuarioId,
                    ':id'               => $idCliente
                ];

            } elseif ($seccion === 'fiscal') {
                $rfc           = strtoupper(trim($datos['rfc'] ?? ''));
                $regimenFiscal = !empty($datos['regimen_fiscal']) ? trim($datos['regimen_fiscal']) : null;
                $codigoPostal  = !empty($datos['codigo_postal']) ? trim($datos['codigo_postal']) : null;

                if (empty($rfc)) {
                    JsonResponse::error('El RFC es obligatorio.');
                }

                $sql = "UPDATE clientes SET 
                            RFC = :rfc, 
                            Regimen_Fiscal = :regimen_fiscal, 
                            Codigo_Postal = :codigo_postal, 
                            Modificado_por = :modificado_por,
                            Ultima_Actualizacion = NOW()
                        WHERE ID = :id";

                $paramsUpdate = [
                    ':rfc'            => $rfc,
                    ':regimen_fiscal' => $regimenFiscal,
                    ':codigo_postal'  => $codigoPostal,
                    ':modificado_por' => $usuarioId,
                    ':id'             => $idCliente
                ];

            } elseif ($seccion === 'contacto') {
                $telefono = trim($datos['telefono'] ?? '');
                $correo   = trim($datos['correo'] ?? '');

                if (empty($telefono)) {
                    JsonResponse::error('El teléfono es obligatorio.');
                }
                if (empty($correo) || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
                    JsonResponse::error('El correo electrónico no es válido.');
                }

                $sql = "UPDATE clientes SET 
                            Telefono = :telefono, 
                            Correo = :correo, 
                            Modificado_por = :modificado_por,
                            Ultima_Actualizacion = NOW()
                        WHERE ID = :id";

                $paramsUpdate = [
                    ':telefono'       => $telefono,
                    ':correo'         => $correo,
                    ':modificado_por' => $usuarioId,
                    ':id'             => $idCliente
                ];

            } else {
                // Si no viene sección específica, actualizamos todo (por compatibilidad general)
                $codigoCliente   = trim($datos['codigo_cliente'] ?? ($datos['Codigo_Cliente'] ?? ''));
                $nombre          = trim($datos['nombre'] ?? '');
                $rfc             = strtoupper(trim($datos['rfc'] ?? ''));
                $telefono        = trim($datos['telefono'] ?? '');
                $correo          = trim($datos['correo'] ?? '');
                $tipoCliente     = trim($datos['tipo_cliente'] ?? 'FÍSICA');
                $apellidoPaterno = !empty($datos['apellido_paterno']) ? trim($datos['apellido_paterno']) : null;
                $apellidoMaterno = !empty($datos['apellido_materno']) ? trim($datos['apellido_materno']) : null;
                $regimenFiscal   = !empty($datos['regimen_fiscal']) ? trim($datos['regimen_fiscal']) : null;
                $codigoPostal    = !empty($datos['codigo_postal']) ? trim($datos['codigo_postal']) : null;

                if (empty($nombre) || empty($rfc) || empty($telefono) || empty($correo)) {
                    JsonResponse::error('Todos los campos obligatorios deben estar completos.');
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
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($paramsUpdate);

            // Registro centralizado de bitácora y auditoría
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'CLIENTES',
                'EDITAR_' . strtoupper($seccion ?: 'GENERAL'),
                $idCliente,
                "Se actualizaron los datos de la sección [{$seccion}] del cliente ID: {$idCliente}",
                $valorAnterior,
                $paramsUpdate
            );

            JsonResponse::success('Sección actualizada exitosamente.', [
                'id' => $idCliente
            ]);

        } else {
            // --- FLUJO DE CREACIÓN / VERIFICACIÓN DE INHABILITADOS (INSERT) ---
            
            $codigoCliente   = trim($datos['codigo_cliente'] ?? ($datos['Codigo_Cliente'] ?? ''));
            $nombre          = trim($datos['nombre'] ?? '');
            $rfc             = strtoupper(trim($datos['rfc'] ?? ''));
            $telefono        = trim($datos['telefono'] ?? '');
            $correo          = trim($datos['correo'] ?? '');
            $tipoCliente     = trim($datos['tipo_cliente'] ?? 'FÍSICA');
            $apellidoPaterno = !empty($datos['apellido_paterno']) ? trim($datos['apellido_paterno']) : null;
            $apellidoMaterno = !empty($datos['apellido_materno']) ? trim($datos['apellido_materno']) : null;
            $regimenFiscal   = !empty($datos['regimen_fiscal']) ? trim($datos['regimen_fiscal']) : null;
            $codigoPostal    = !empty($datos['codigo_postal']) ? trim($datos['codigo_postal']) : null;

            if (!is_numeric($codigoCliente)) {
                JsonResponse::error('El código de cliente debe ser numérico.');
            }
            if (empty($nombre) || empty($rfc) || empty($telefono) || empty($correo)) {
                JsonResponse::error('Faltan campos obligatorios para registrar el cliente.');
            }
            if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
                JsonResponse::error('El correo electrónico no es válido.');
            }

            // Comprobar si ya existe un registro inhabilitado con los datos clave
            $stmtCheckInactivo = $pdo->prepare("
                SELECT ID, Habilitado, Correo, Telefono, RFC, Codigo_Cliente 
                FROM clientes 
                WHERE (Correo = :correo OR Telefono = :telefono OR RFC = :rfc OR Codigo_Cliente = :codigo_cliente) 
                LIMIT 1
            ");
            $stmtCheckInactivo->execute([
                ':correo'         => $correo,
                ':telefono'       => $telefono,
                ':rfc'            => $rfc,
                ':codigo_cliente' => $codigoCliente
            ]);
            $clienteExistente = $stmtCheckInactivo->fetch(PDO::FETCH_ASSOC);

            if ($clienteExistente) {
                if (intval($clienteExistente['Habilitado']) === 0) {
                    $idClienteInactivo = intval($clienteExistente['ID']);

                    $sqlReactivar = "UPDATE clientes SET 
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
                                        Habilitado = 1,
                                        Modificado_por = :modificado_por,
                                        Ultima_Actualizacion = NOW()
                                    WHERE ID = :id";

                    $paramsReactivar = [
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
                        ':id'               => $idClienteInactivo
                    ];

                    $stmtReac = $pdo->prepare($sqlReactivar);
                    $stmtReac->execute($paramsReactivar);

                    RegistrarBitacoraAccion(
                        $usuarioId,
                        $sesionId,
                        'CLIENTES',
                        'REACTIVAR',
                        $idClienteInactivo,
                        "Se reactivó y actualizó el cliente que estaba inhabilitado: {$nombre} (ID: {$idClienteInactivo})",
                        $clienteExistente,
                        $paramsReactivar
                    );

                    JsonResponse::success('El cliente se encontraba inhabilitado en el sistema; ha sido reactivado y actualizado exitosamente.', [
                        'id'             => $idClienteInactivo,
                        'codigo_cliente' => $codigoCliente,
                        'tipo_cliente'   => $tipoCliente,
                        'nombre'         => $nombre
                    ], 200);
                }
            }

            // Procedimiento normal de inserción (INSERT)
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
        if ($e->getCode() == '23000') {
            $errorMsg = $e->getMessage();
            if (strpos($errorMsg, 'Codigo_Cliente') !== false) {
                JsonResponse::error('El código de cliente ya está asignado a otro registro activo.');
            }
            if (strpos($errorMsg, 'RFC') !== false) {
                JsonResponse::error('El RFC ingresado ya pertenece a otro cliente activo.');
            }
            if (strpos($errorMsg, 'Telefono') !== false) {
                JsonResponse::error('El número de teléfono ya está asociado a otro cliente activo.');
            }
            if (strpos($errorMsg, 'Correo') !== false) {
                JsonResponse::error('El correo electrónico ya se encuentra registrado en un cliente activo.');
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

function Obtener_Clientes_Paginados(array $params = []): void {
    try {
        // Unificamos si los filtros vienen anidados o planos desde el request JS
        if (isset($params['filtros']) && is_array($params['filtros'])) {
            $params = array_merge($params, $params['filtros']);
        }

        // Array para acumular todas las condiciones SQL personalizadas
        $condicionesExtra = [];

        // 1. Procesamiento de tipo_rfc (Genérico / Específico)
        if (isset($params['tipo_rfc'])) {
            $tipoRfcSeleccionado = (array)$params['tipo_rfc'];
            $subCondicionesRfc = [];
            
            if (in_array('generico', $tipoRfcSeleccionado)) {
                $subCondicionesRfc[] = "RFC LIKE '%XEX%'";
            }
            if (in_array('especifico', $tipoRfcSeleccionado)) {
                $subCondicionesRfc[] = "RFC NOT LIKE '%XEX%'";
            }

            if (!empty($subCondicionesRfc)) {
                $condicionesExtra[] = "(" . implode(" OR ", $subCondicionesRfc) . ")";
            }
            unset($params['tipo_rfc']);
        }

        // 2. Procesamiento de Régimen Fiscal (soporta selección múltiple o única)
        if (isset($params['regimen_fiscal'])) {
            $regimenes = (array)$params['regimen_fiscal'];
            $regimenes = array_filter($regimenes, function($v) { return $v !== ''; });

            if (!empty($regimenes)) {
                $regimenesEscapados = array_map(function($val) {
                    return "'" . addslashes($val) . "'";
                }, $regimenes);

                $condicionesExtra[] = "Regimen_Fiscal IN (" . implode(", ", $regimenesEscapados) . ")";
            }
            unset($params['regimen_fiscal']);
        }

        // 3. Procesamiento de Estado / Habilitado
        if (isset($params['Habilitado']) || isset($params['habilitado'])) {
            $estadoVal = $params['Habilitado'] ?? $params['habilitado'];
            if ($estadoVal !== '' && $estadoVal !== null) {
                $condicionesExtra[] = "Habilitado = " . (int)$estadoVal;
            }
            unset($params['Habilitado'], $params['habilitado']);
        }

        // Inyectamos todas las condiciones acumuladas en custom_where
        $customWhereSQL = "";
        if (!empty($condicionesExtra)) {
            $customWhereSQL = implode(" AND ", $condicionesExtra);
            $params['custom_where'] = $customWhereSQL;
        }

        // 4. whitelists de seguridad
        $configuracionSeguridad = [
            'columnas_busqueda' => [
                'Nombre', 
                'Apellido_Paterno', 
                'Apellido_Materno', 
                'Codigo_Cliente', 
                'RFC', 
                'Telefono', 
                'Correo'
            ],
            'filtros_permitidos' => [],
            'columnas_orden' => [
                'ID', 
                'Codigo_Cliente', 
                'Nombre', 
                'Apellido_Paterno', 
                'RFC', 
                'Fecha_Registro'
            ]
        ];

        // 5. Ejecutamos la paginación normal para la tabla
        $resultado = PaginacionService::obtenerPaginados('clientes', $params, $configuracionSeguridad);

        if ($resultado['exito']) {
            // 🌟 6. OBTENER EL UNIVERSO COMPLETO DE IDS FILTRADOS DE TODAS LAS PÁGINAS
            $todosLosIds = [];
            
            try {
                // Construimos la consulta independiente para extraer todos los IDs filtrados
                $sqlTodosIds = "SELECT ID FROM clientes";
                $whereParts = [];

                if (!empty($customWhereSQL)) {
                    $whereParts[] = $customWhereSQL;
                }

                $terminoBusqueda = $params['buscar'] ?? $params['search'] ?? '';
                if (!empty($terminoBusqueda)) {
                    $terminoEscapado = '%' . addslashes($terminoBusqueda) . '%';
                    $whereParts[] = "(Nombre LIKE '$terminoEscapado' OR Apellido_Paterno LIKE '$terminoEscapado' OR Apellido_Materno LIKE '$terminoEscapado' OR Codigo_Cliente LIKE '$terminoEscapado' OR RFC LIKE '$terminoEscapado' OR Telefono LIKE '$terminoEscapado' OR Correo LIKE '$terminoEscapado')";
                }

                if (!empty($whereParts)) {
                    $sqlTodosIds .= " WHERE " . implode(" AND ", $whereParts);
                }

                // Forma robusta de obtener la conexión PDO desde tus clases de servicio o base de datos
                $conexionDb = null;
                if (class_exists('Database') && method_exists('Database', 'getConnection')) {
                    $conexionDb = Database::getConnection();
                } elseif (class_exists('Conexion') && method_exists('Conexion', 'conectar')) {
                    $conexionDb = Conexion::conectar();
                } elseif (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
                    $conexionDb = $GLOBALS['pdo'];
                }

                if ($conexionDb) {
                    $stmtIds = $conexionDb->query($sqlTodosIds);
                    if ($stmtIds) {
                        $todosLosIds = array_map('strval', $stmtIds->fetchAll(PDO::FETCH_COLUMN));
                    }
                }
            } catch (Throwable $exQuery) {
                error_log("Aviso al consultar todos los IDs globales: " . $exQuery->getMessage());
            }

            // Fallback de seguridad: Si por alguna razón la consulta global falló, extraemos los IDs del resultado paginado actual
            if (empty($todosLosIds) && !empty($resultado['datos'])) {
                $todosLosIds = array_map(function($row) { 
                    return strval($row['ID'] ?? $row['id'] ?? ''); 
                }, $resultado['datos']);
            }

            // 7. Respuesta exitosa incluyendo el array completo 'todos_los_ids'
            JsonResponse::success("Clientes obtenidos correctamente", [
                'datos' => $resultado['datos'],
                'paginacion' => $resultado['paginacion'],
                'todos_los_ids' => $todosLosIds, // <--- Aquí viajan los IDs de TODAS las páginas del filtro actual
                'params' => $params
            ]);
        } else {
            JsonResponse::error("Ocurrió un error al consultar los clientes", null, 500);
        }

    } catch (Throwable $e) {
        error_log("Error en Obtener_Clientes_Paginados: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al obtener los clientes", $e->getMessage(), 500);
    }
}
function Importar_Clientes(array $datosCrudos): void {
    try {
        // 1. Asegurar sesión activa
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener PDO
        $pdo = Conexion();

        // 3. Validar sesión e ID de usuario
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa para realizar esta acción.', null, 401);
        }

        // 4. Validar permiso estrictamente para creación ('crear_clientes')
        if (!TienePermiso($pdo, 'crear_clientes')) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
        }

        // --- NORMALIZACIÓN DE ENTRADA DE ARCHIVOS ---
        $archivosFiles = $datosCrudos['archivos'] ?? ($_FILES ?? []);
        $archivosAProcesar = [];

        foreach ($archivosFiles as $key => $fileData) {
            if (is_array($fileData) && isset($fileData['name'])) {
                if (!is_array($fileData['name'])) {
                    if ($fileData['error'] === UPLOAD_ERR_OK) {
                        $archivosAProcesar[] = $fileData;
                    }
                } else {
                    foreach ($fileData['name'] as $idx => $name) {
                        if ($fileData['error'][$idx] === UPLOAD_ERR_OK) {
                            $archivosAProcesar[] = [
                                'name'     => $fileData['name'][$idx],
                                'type'     => $fileData['type'][$idx],
                                'tmp_name' => $fileData['tmp_name'][$idx],
                                'error'    => $fileData['error'][$idx],
                                'size'     => $fileData['size'][$idx]
                            ];
                        }
                    }
                }
            }
        }

        if (empty($archivosAProcesar)) {
            JsonResponse::error('No se ha recibido ningún archivo válido para procesar.', null, 400);
        }

        $processed = [];
        $failed = [];
        $sesionId = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        // Procesar cada archivo recibido en memoria
        foreach ($archivosAProcesar as $archivo) {
            $nombreOriginal = $archivo['name'];
            $tmpPath = $archivo['tmp_name'];
            $extension = strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION));

            $formatosPermitidos = ['xlsx', 'xls', 'csv'];
            if (!in_array($extension, $formatosPermitidos)) {
                $failed[] = [
                    "id"     => $nombreOriginal,
                    "nombre" => $nombreOriginal,
                    "reason" => "El formato del archivo (.$extension) no está permitido para importación masiva."
                ];
                continue;
            }

            $pdo->beginTransaction();
            try {
                $filasDatos = [];

                if ($extension === 'csv') {
                    if (($gestor = fopen($tmpPath, "r")) !== FALSE) {
                        $filaNum = 0;
                        while (($datosFila = fgetcsv($gestor, 1000, ",")) !== FALSE) {
                            $filaNum++;
                            if ($filaNum === 1) continue; // Omitir cabecera
                            if (empty(array_filter($datosFila))) continue;
                            $filasDatos[] = $datosFila;
                        }
                        fclose($gestor);
                    }
                } elseif (in_array($extension, ['xlsx', 'xls'])) {
                    if (class_exists('\PhpOffice\PhpSpreadsheet\IOFactory')) {
                        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($tmpPath);
                        $sheet = $spreadsheet->getSheetByName('Plantilla Importación') ?? $spreadsheet->getActiveSheet();
                        $filasTotales = $sheet->toArray();
                        
                        foreach ($filasTotales as $idx => $datosFila) {
                            if ($idx < 2) continue; // Omitir cabeceras y descripciones de la plantilla
                            if (empty(array_filter($datosFila))) continue;
                            $filasDatos[] = $datosFila;
                        }
                    } else {
                        throw new Exception("La librería phpspreadsheet no está disponible en el servidor.");
                    }
                }

                $stmtInsert = $pdo->prepare("
                    INSERT INTO clientes (
                        Codigo_Cliente, Tipo_Cliente, RFC, Nombre, Apellido_Paterno, 
                        Apellido_Materno, Telefono, Correo, Regimen_Fiscal, Codigo_Postal, 
                        Registrado_Por, Habilitado, Fecha_Registro, Ultima_Actualizacion
                    ) VALUES (
                        :codigo, :tipo_cliente, :rfc, :nombre, :ap_paterno, 
                        :ap_materno, :telefono, :correo, :regimen_fiscal, :codigo_postal, 
                        :registrado_por, 1, NOW(), NOW()
                    )
                ");

                foreach ($filasDatos as $numFila => $fila) {
                    $tipoCliente   = mb_strtoupper(trim($fila[0] ?? 'GENERAL'), 'UTF-8');
                    $rfc           = mb_strtoupper(trim($fila[1] ?? 'XAXX010101000'), 'UTF-8');
                    $nombre        = mb_strtoupper(trim($fila[2] ?? ''), 'UTF-8');
                    $apPaterno     = mb_strtoupper(trim($fila[3] ?? ''), 'UTF-8');
                    $apMaterno     = mb_strtoupper(trim($fila[4] ?? ''), 'UTF-8');
                    $telefonoBruto = trim($fila[5] ?? '');
                    $correo        = mb_strtoupper(trim($fila[6] ?? ''), 'UTF-8');
                    $regimenBruto  = trim($fila[7] ?? '');
                    $codigoPostal  = trim($fila[8] ?? '');

                    $nombreCompleto = trim("$nombre $apPaterno $apMaterno");
                    if (empty($nombreCompleto)) {
                        $nombreCompleto = "cliente en fila #" . ($numFila + 1);
                    }

                    if (empty($nombre) || empty($telefonoBruto) || empty($correo)) {
                        $failed[] = [
                            "id"     => "---",
                            "nombre" => $nombreCompleto,
                            "reason" => "el registro carece de datos obligatorios (nombre, teléfono o correo)."
                        ];
                        continue; 
                    }

                    // Validar y normalizar teléfono (+52 + 10 dígitos)
                    $telefonoLimpios = preg_replace('/\D/', '', $telefonoBruto);
                    if (strlen($telefonoLimpios) >= 11 && strpos($telefonoBruto, '+') === 0) {
                        $telefonoFormateado = '+' . $telefonoLimpios;
                    } elseif (strlen($telefonoLimpios) === 12 && strpos($telefonoLimpios, '52') === 0) {
                        $telefonoFormateado = '+' . $telefonoLimpios;
                    } elseif (strlen($telefonoLimpios) === 10) {
                        $telefonoFormateado = '+52' . $telefonoLimpios;
                    } else {
                        $failed[] = [
                            "id"     => "---",
                            "nombre" => $nombreCompleto,
                            "reason" => "El formato del teléfono '$telefonoBruto' es inválido (debe incluir +52 y 10 dígitos)."
                        ];
                        continue;
                    }

                    // Validación de duplicados: RFC genérico múltiple permitido, RFC real único, correo y teléfono únicos
                    $esRfcGenerico = in_array($rfc, ['XAXX010101000', 'XEXX010101000']);
                    if ($esRfcGenerico) {
                        $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM clientes WHERE Correo = :correo OR Telefono = :telefono");
                        $stmtCheck->execute([':correo' => $correo, ':telefono' => $telefonoFormateado]);
                    } else {
                        $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM clientes WHERE Correo = :correo OR Telefono = :telefono OR RFC = :rfc");
                        $stmtCheck->execute([':correo' => $correo, ':telefono' => $telefonoFormateado, ':rfc' => $rfc]);
                    }

                    if ($stmtCheck->fetchColumn() > 0) {
                        $failed[] = [
                            "id"     => "---",
                            "nombre" => $nombreCompleto,
                            "reason" => "Ya existe un cliente registrado con el mismo correo, teléfono o rfc."
                        ];
                        continue;
                    }

                    // Extraer régimen fiscal (clave numérica de 3 dígitos)
                    $regimenFiscal = null;
                    if (!empty($regimenBruto)) {
                        preg_match('/^\d{3}/', $regimenBruto, $matches);
                        $regimenFiscal = $matches[0] ?? preg_replace('/\D/', '', $regimenBruto);
                    }

                    // Generar código automático mediante tu función existente
                    $codigoCliente = Generar_Codigo_Cliente();

                    $stmtInsert->execute([
                        ':codigo'         => $codigoCliente,
                        ':tipo_cliente'   => !empty($tipoCliente) ? $tipoCliente : 'GENERAL',
                        ':rfc'            => !empty($rfc) ? $rfc : 'XAXX010101000',
                        ':nombre'         => $nombre,
                        ':ap_paterno'     => !empty($apPaterno) ? $apPaterno : null,
                        ':ap_materno'     => !empty($apMaterno) ? $apMaterno : null,
                        ':telefono'       => $telefonoFormateado,
                        ':correo'         => $correo,
                        ':regimen_fiscal' => !empty($regimenFiscal) ? $regimenFiscal : null,
                        ':codigo_postal'  => !empty($codigoPostal) ? $codigoPostal : null,
                        ':registrado_por' => $usuarioId
                    ]);

                    $processed[] = [
                        "id"     => $codigoCliente,
                        "codigo" => $codigoCliente,
                        "nombre" => $nombreCompleto
                    ];
                }

                $pdo->commit();

            } catch (Throwable $ex) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                $failed[] = [
                    "id"     => $nombreOriginal,
                    "nombre" => "archivo: $nombreOriginal",
                    "reason" => strtolower($ex->getMessage())
                ];
            }
        }

        // Registrar en bitácora si existe la función
        if (function_exists('RegistrarBitacoraAccion')) {
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'CLIENTES',
                'IMPORTAR_MASIVO',
                null,
                "proceso de importación masiva de clientes completado.",
                null,
                ['processed' => count($processed), 'failed' => count($failed)]
            );
        }

        // Estructura de datos requerida por Procesar_Resumen
        $totalProcesados = count($processed);
        $totalFallidos = count($failed);
        $totalGeneral = $totalProcesados + $totalFallidos;

        $dataRespuesta = [
            "stats" => [
                "total"   => $totalGeneral,
                "success" => $totalProcesados,
                "error"   => $totalFallidos
            ],
            "results" => [
                "processed" => $processed,
                "failed"    => $failed
            ]
        ];

        // Forzar ok: true usando JsonResponse::success para que la UI abra el modal correctamente
        JsonResponse::success("Clientes importados correctamente.", $dataRespuesta, 200);

    } catch (Throwable $e) {
        error_log("error crítico al importar clientes masivos: " . $e->getMessage());
        JsonResponse::error('ocurrió un error inesperado al procesar la importación masiva: ' . strtolower($e->getMessage()), null, 500);
    }
}

function Eliminar_Clientes(array $datos): void {
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener la instancia única de PDO
        $pdo = Conexion();

        // 3. Validar que exista una sesión de usuario activa
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
        }

        // 4. Obtener y normalizar los IDs a procesar
        $idsRaw = $datos['ids'] ?? ($datos['id'] ?? []);
        if (!is_array($idsRaw)) {
            $idsRaw = [$idsRaw];
        }

        $idsClientes = array_values(array_unique(array_filter(array_map('intval', $idsRaw))));

        if (empty($idsClientes)) {
            JsonResponse::error('No se han seleccionado clientes válidos para eliminar.');
        }

        // 5. Determinar si es una operación masiva o individual y asignar el permiso correspondiente
        $esMasivo = count($idsClientes) > 1;
        $permisoRequerido = $esMasivo ? 'eliminar_clientes_masivo' : 'eliminar_clientes';

        // 6. Validar permisos usando tu función TienePermiso()
        if (!TienePermiso($pdo, $permisoRequerido)) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
        }

        // 7. Iniciar transacción para asegurar la integridad
        $pdo->beginTransaction();

        $processed = [];
        $failed = [];
        $inhabilitadoValor = 0;

        $stmtUpdate = $pdo->prepare("UPDATE clientes SET Habilitado = :habilitado, Modificado_por = :modificado_por, Ultima_Actualizacion = NOW() WHERE ID = :id AND Habilitado = 1");

        foreach ($idsClientes as $idCliente) {
            // Verificar si el cliente existe y está activo
            $stmtAnt = $pdo->prepare("SELECT ID, Codigo_Cliente, Nombre, Apellido_Paterno, Habilitado FROM clientes WHERE ID = :id");
            $stmtAnt->execute([':id' => $idCliente]);
            $cliente = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$cliente) {
                $failed[] = [
                    'id' => $idCliente,
                    'nombre' => "Cliente ID #{$idCliente}",
                    'reason' => 'El cliente no existe o ya se encuentra inactivo.'
                ];
                continue;
            }

            $nombreCompleto = trim("{$cliente['Nombre']} {$cliente['Apellido_Paterno']}");

            // Ejecutar la inhabilitación (soft delete)
            $stmtUpdate->execute([
                ':habilitado'     => $inhabilitadoValor,
                ':modificado_por' => $usuarioId,
                ':id'             => $idCliente
            ]);

            if ($stmtUpdate->rowCount() > 0) {
                // Registrar bitácora individual
                if (function_exists('RegistrarBitacoraAccion')) {
                    RegistrarBitacoraAccion(
                        $usuarioId,
                        $sesionId,
                        'CLIENTES',
                        'ELIMINAR',
                        $idCliente,
                        "Se deshabilitó el cliente ID: {$idCliente} ({$nombreCompleto})",
                        $cliente,
                        ['Habilitado' => $inhabilitadoValor, 'Modificado_por' => $usuarioId]
                    );
                }

                $processed[] = [
                    'id' => $idCliente,
                    'nombre' => $nombreCompleto,
                    'codigo' => $cliente['Codigo_Cliente']
                ];
            } else {
                $failed[] = [
                    'id' => $idCliente,
                    'nombre' => $nombreCompleto,
                    'reason' => 'No se pudo actualizar el estado del cliente en la base de datos.'
                ];
            }
        }

        // Confirmar transacción
        $pdo->commit();

        $mensajeResumen = count($failed) === 0 
            ? "Proceso de eliminación completado exitosamente." 
            : "Proceso completado con algunas observaciones.";

        // Devolver la respuesta estructurada masiva compatible con Procesar_Resumen
        JsonResponse::massive($mensajeResumen, $processed, $failed, 200);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al eliminar clientes: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al eliminar clientes: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

/**
 * Obtiene y responde la información detallada de un cliente por su ID utilizando JsonResponse.
 * 
 * @return void
 */
function Obtener_Informacion_Cliente($datos): void {
    try {
        // 1. Obtener y validar el ID enviado por POST
        $id = $datos['id'];

        if ($id <= 0) {
            JsonResponse::error('ID de cliente no válido.');
        }

        // 2. Definir la consulta SQL
        $sql = "SELECT 
                    ID, 
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
                    Fecha_Registro, 
                    Ultima_Actualizacion, 
                    Habilitado, 
                    Modificado_por,
                    TRIM(CONCAT(Nombre, ' ', COALESCE(Apellido_Paterno, ''), ' ', COALESCE(Apellido_Materno, ''))) AS nombre_completo
                FROM clientes 
                WHERE ID = :id 
                LIMIT 1";

        // 3. Ejecutar mediante el helper Consultar_PDO
        $resultado = Consultar_PDO($sql, [':id' => $id]);

        // 4. Validar si se encontró el registro
        if (is_array($resultado) && count($resultado) > 0) {
            JsonResponse::success('Cliente obtenido correctamente.', $resultado[0]);
        } else {
            JsonResponse::error('El cliente solicitado no existe.', null, 404);
        }

    } catch (Throwable $e) {
        // 5. Manejo de excepciones y registro interno
        error_log("Error crítico al obtener el cliente por ID: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error en el servidor al obtener la información del cliente.', null, 500);
    }
}

function Exportar_Clientes($datos)
{
    $formato   = $datos['formato'] ?? 'csv';
    $seleccion = $datos['seleccion'] ?? [];

    $sql = "SELECT Codigo_Cliente, Tipo_Cliente, RFC, Nombre, Apellido_Paterno, Apellido_Materno, Telefono, Correo, Regimen_Fiscal, Codigo_Postal, Fecha_Registro, Habilitado 
            FROM clientes";
    
    $params = [];

    // Solo agregamos la cláusula WHERE y el filtro si realmente hay IDs seleccionados
    if (!empty($seleccion) && is_array($seleccion)) {
        $idsLimpios = array_filter(array_map('intval', $seleccion));
        
        if (!empty($idsLimpios)) {
            $placeholders = implode(',', array_fill(0, count($idsLimpios), '?'));
            $sql .= " WHERE ID IN ({$placeholders})"; // Aquí nace el WHERE de forma limpia
            $params = $idsLimpios;
        }
    }

    $sql .= " ORDER BY ID DESC";

    EjecutarExportacion(
        $formato,             
        $sql,                 
        $params,              
        'Listado de Clientes Seleccionados', 
        'clientes_reporte'    
    );
}

function Habilitar_Clientes(array $datos): void {
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener la instancia única de PDO
        $pdo = Conexion();

        // 3. Validar que exista una sesión de usuario activa
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
        }

        // 4. Obtener y normalizar los IDs a procesar
        $idsRaw = $datos['ids'] ?? ($datos['id'] ?? []);
        if (!is_array($idsRaw)) {
            $idsRaw = [$idsRaw];
        }

        $idsClientes = array_values(array_unique(array_filter(array_map('intval', $idsRaw))));

        if (empty($idsClientes)) {
            JsonResponse::error('No se han seleccionado clientes válidos para habilitar.');
        }

        // 5. Determinar si es una operación masiva o individual y asignar el permiso correspondiente
        $esMasivo = count($idsClientes) > 1;
        $permisoRequerido = 'editar_clientes';

        // 6. Validar permisos usando tu función TienePermiso()
        if (!TienePermiso($pdo, $permisoRequerido)) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
        }

        // 7. Iniciar transacción para asegurar la integridad
        $pdo->beginTransaction();

        $processed = [];
        $failed = [];
        $habilitadoValor = 1;

        // Cambiamos la condición para buscar los que estén inactivos (Habilitado = 0) y actualizarlos a 1
        $stmtUpdate = $pdo->prepare("UPDATE clientes SET Habilitado = :habilitado, Modificado_por = :modificado_por, Ultima_Actualizacion = NOW() WHERE ID = :id AND Habilitado = 0");

        foreach ($idsClientes as $idCliente) {
            // Verificar si el cliente existe y está inactivo
            $stmtAnt = $pdo->prepare("SELECT ID, Codigo_Cliente, Nombre, Apellido_Paterno, Habilitado FROM clientes WHERE ID = :id");
            $stmtAnt->execute([':id' => $idCliente]);
            $cliente = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$cliente) {
                $failed[] = [
                    'id' => $idCliente,
                    'nombre' => "Cliente ID #{$idCliente}",
                    'reason' => 'El cliente no existe.'
                ];
                continue;
            }

            if ((int)$cliente['Habilitado'] === 1) {
                $failed[] = [
                    'id' => $idCliente,
                    'nombre' => trim("{$cliente['Nombre']} {$cliente['Apellido_Paterno']}"),
                    'reason' => 'El cliente ya se encuentra habilitado.'
                ];
                continue;
            }

            $nombreCompleto = trim("{$cliente['Nombre']} {$cliente['Apellido_Paterno']}");

            // Ejecutar la habilitación
            $stmtUpdate->execute([
                ':habilitado'     => $habilitadoValor,
                ':modificado_por' => $usuarioId,
                ':id'             => $idCliente
            ]);

            if ($stmtUpdate->rowCount() > 0) {
                // Registrar bitácora individual
                if (function_exists('RegistrarBitacoraAccion')) {
                    RegistrarBitacoraAccion(
                        $usuarioId,
                        $sesionId,
                        'CLIENTES',
                        'HABILITAR', // Acción actualizada
                        $idCliente,
                        "Se habilitó el cliente ID: {$idCliente} ({$nombreCompleto})",
                        $cliente,
                        ['Habilitado' => $habilitadoValor, 'Modificado_por' => $usuarioId]
                    );
                }

                $processed[] = [
                    'id' => $idCliente,
                    'nombre' => $nombreCompleto,
                    'codigo' => $cliente['Codigo_Cliente']
                ];
            } else {
                $failed[] = [
                    'id' => $idCliente,
                    'nombre' => $nombreCompleto,
                    'reason' => 'No se pudo actualizar el estado del cliente en la base de datos.'
                ];
            }
        }

        // Confirmar transacción
        $pdo->commit();

        $mensajeResumen = count($failed) === 0 
            ? "Proceso de habilitación completado exitosamente." 
            : "Proceso completado con algunas observaciones.";

        // Devolver la respuesta estructurada masiva compatible con Procesar_Resumen
        JsonResponse::massive($mensajeResumen, $processed, $failed, 200);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al habilitar clientes: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al habilitar clientes: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}