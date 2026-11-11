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
            return;
        }

        // 4. Validar permisos usando tu función TienePermiso() para creación
        if (!TienePermiso($pdo, 'crear_esquemas_fiscales')) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
            return;
        }

        // --- FLUJO DE CREACIÓN DE UN ÚNICO ESquema FISCAL ---
        $nombre            = strtoupper(trim($datos['nombre'] ?? ''));
        $tasaIva           = floatval($datos['tasa_iva'] ?? 0);
        $tasaIeps          = floatval($datos['tasa_ieps'] ?? 0);
        $iepsCuotaLitro    = floatval($datos['ieps_cuota_litro'] ?? 0);
        $iepsCuotaUnidad   = floatval($datos['ieps_cuota_unidad'] ?? 0);
        $retencionIsr      = floatval($datos['retencion_isr'] ?? 0);
        $retencionIva      = floatval($datos['retencion_iva'] ?? 0);

        if (empty($nombre)) {
            JsonResponse::error('El nombre del esquema fiscal es obligatorio.');
            return;
        }

        // Validar previamente si ya existe para evitar errores de excepción
        $stmtCheck = $pdo->prepare("SELECT id FROM impuestos_esquemas WHERE nombre = :nombre LIMIT 1");
        $stmtCheck->execute([':nombre' => $nombre]);
        if ($stmtCheck->fetch()) {
            JsonResponse::error('El esquema fiscal ingresado ya se encuentra registrado en el sistema.');
            return;
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
                return;
            }
            JsonResponse::error('Ya existe un registro duplicado en la base de datos.');
            return;
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

function Obtener_Esquemas_Impuestos_Paginados(array $params = []): void {
    try {
        // Unificamos si los filtros vienen anidados o planos desde el request JS
        if (isset($params['filtros']) && is_array($params['filtros'])) {
            $params = array_merge($params, $params['filtros']);
        }

        // Array para acumular todas las condiciones SQL personalizadas
        $condicionesExtra = [];

        // 1. Procesamiento de Estado / habilitado
        if (isset($params['Habilitado']) || isset($params['habilitado'])) {
            $estadoVal = $params['Habilitado'] ?? $params['habilitado'];
            if ($estadoVal !== '' && $estadoVal !== null) {
                $estadoStr = ((int)$estadoVal === 1) ? 'activo' : 'inactivo';
                $condicionesExtra[] = "estado = '" . addslashes($estadoStr) . "'";
            }
            unset($params['Habilitado'], $params['habilitado']);
        }

        // 2. Procesamiento de Tasa de IVA
        if (isset($params['f_iva']) || isset($params['iva'])) {
            $tasaIva = $params['f_iva'] ?? $params['iva'];
            $ivas = (array)$tasaIva;
            $ivas = array_filter($ivas, function($v) { return $v !== ''; });

            if (!empty($ivas)) {
                $ivasProcesados = array_map(function($val) {
                    $num = floatval($val);
                    if ($num > 1) {
                        $num = $num / 100;
                    }
                    return "'" . addslashes((string)$num) . "'";
                }, $ivas);

                $condicionesExtra[] = "tasa_iva IN (" . implode(", ", $ivasProcesados) . ")";
            }
            unset($params['f_iva'], $params['iva']);
        }

        // 3. Procesamiento de Tasa de IEPS
        if (isset($params['f_ieps']) || isset($params['ieps'])) {
            $iepsVal = $params['f_ieps'] ?? $params['ieps'];
            if ($iepsVal === 'con_ieps') {
                $condicionesExtra[] = "(tasa_ieps > 0 OR ieps_cuota_litro > 0 OR ieps_cuota_unidad > 0)";
            } elseif ($iepsVal === 'sin_ieps') {
                $condicionesExtra[] = "(tasa_ieps = 0 AND ieps_cuota_litro = 0 AND ieps_cuota_unidad = 0)";
            }
            unset($params['f_ieps'], $params['ieps']);
        }

        // 4. Procesamiento de Retenciones ('isr' o 'iva')
        if (isset($params['f_retenciones']) || isset($params['retenciones'])) {
            $retVal = $params['f_retenciones'] ?? $params['retenciones'];
            $retenciones = (array)$retVal;
            $retenciones = array_filter($retenciones, function($v) { return $v !== ''; });

            $subRet = [];
            if (in_array('isr', $retenciones)) {
                $subRet[] = "retencion_isr > 0";
            }
            if (in_array('iva', $retenciones)) {
                $subRet[] = "retencion_iva > 0";
            }

            if (!empty($subRet)) {
                $condicionesExtra[] = "(" . implode(" OR ", $subRet) . ")";
            }
            unset($params['f_retenciones'], $params['retenciones']);
        }

        // Inyectamos todas las condiciones acumuladas en custom_where
        $customWhereSQL = "";
        if (!empty($condicionesExtra)) {
            $customWhereSQL = implode(" AND ", $condicionesExtra);
            $params['custom_where'] = $customWhereSQL;
        }

        // Obtener la variable de moneda del sistema (por ejemplo, símbolo como '$', 'USD', etc.)
        $simboloMoneda = '$'; // Valor por defecto
        try {
            $sqlMoneda = "SELECT v_valor FROM sistema_variables WHERE v_clave = 'moneda' OR v_clave = 'simbolo_moneda' LIMIT 1";
            $resMoneda = Consultar_PDO($sqlMoneda);
            if (!empty($resMoneda) && isset($resMoneda[0]['v_valor'])) {
                $simboloMoneda = $resMoneda[0]['v_valor'];
            }
        } catch (Throwable $exMoneda) {
            // Se mantiene el símbolo por defecto si ocurre algún error
        }

        // 5. Whitelists de seguridad para impuestos_esquemas
        $configuracionSeguridad = [
            'columnas_busqueda' => [
                'nombre'
            ],
            'filtros_permitidos' => [],
            'columnas_orden' => [
                'id', 
                'nombre', 
                'tasa_iva', 
                'tasa_ieps', 
                'fecha_alta'
            ]
        ];

        // 6. Ejecutamos la paginación normal para la tabla
        $resultado = PaginacionService::obtenerPaginados('impuestos_esquemas', $params, $configuracionSeguridad);

        if ($resultado['exito']) {
            // Formatear campos fiscales y agregar el conteo de productos asociados con etiqueta dinámica ("producto" o "productos")
            if (!empty($resultado['datos']) && is_array($resultado['datos'])) {
                $conexionDb = null;
                if (class_exists('Database') && method_exists('Database', 'getConnection')) {
                    $conexionDb = Database::getConnection();
                } elseif (class_exists('Conexion') && method_exists('Conexion', 'conectar')) {
                    $conexionDb = Conexion::conectar();
                } elseif (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
                    $conexionDb = $GLOBALS['pdo'];
                }

                foreach ($resultado['datos'] as &$row) {
                    $idEsquemaActual = $row['ID'] ?? $row['id'] ?? null;

                    // Consultar cuántos productos tienen asignado este esquema fiscal en producto_fiscal
                    $totalProductos = 0;
                    if ($conexionDb && !empty($idEsquemaActual)) {
                        try {
                            $stmtProd = $conexionDb->prepare("SELECT COUNT(*) FROM producto_fiscal WHERE Perfil_Impuesto_ID = :perfil_id");
                            $stmtProd->execute([':perfil_id' => $idEsquemaActual]);
                            $totalProductos = (int)$stmtProd->fetchColumn();
                        } catch (Throwable $exProd) {
                            $totalProductos = 0;
                        }
                    }
                    
                    // Asignamos el valor numérico y el texto formateado con pluralización correcta
                    $row['total_productos'] = $totalProductos;
                    $row['total_productos_texto'] = $totalProductos . ($totalProductos === 1 ? ' producto' : ' productos');

                    // IVA a porcentaje formateado (ej: "16%")
                    if (isset($row['tasa_iva'])) {
                        $row['tasa_iva'] = rtrim(rtrim(number_format(floatval($row['tasa_iva']) * 100, 2, '.', ''), '0'), '.') . '%';
                    }
                    
                    // Retenciones a porcentaje formateado (ej: "10%")
                    if (isset($row['retencion_isr'])) {
                        $row['retencion_isr'] = rtrim(rtrim(number_format(floatval($row['retencion_isr']) * 100, 2, '.', ''), '0'), '.') . '%';
                    }
                    if (isset($row['retencion_iva'])) {
                        $row['retencion_iva'] = rtrim(rtrim(number_format(floatval($row['retencion_iva']) * 100, 2, '.', ''), '0'), '.') . '%';
                    }

                    // Tasa IEPS ad-valorem a porcentaje formateado (ej: "8%")
                    if (isset($row['tasa_ieps'])) {
                        $row['tasa_ieps'] = rtrim(rtrim(number_format(floatval($row['tasa_ieps']) * 100, 2, '.', ''), '0'), '.') . '%';
                    }

                    // Cuotas de IEPS formateadas usando la variable de moneda del sistema (ej: "$0.00")
                    $camposMoneda = ['ieps_cuota_litro', 'ieps_cuota_unidad'];
                    foreach ($camposMoneda as $campo) {
                        if (isset($row[$campo])) {
                            $row[$campo] = $simboloMoneda . ' ' . number_format(floatval($row[$campo]), 2, '.', ',');
                        }
                    }
                }
                unset($row);
            }

            // 🌟 7. OBTENER EL UNIVERSO COMPLETO DE IDS FILTRADOS DE TODAS LAS PÁGINAS
            $todosLosIds = [];
            
            try {
                $sqlTodosIds = "SELECT id FROM impuestos_esquemas";
                $whereParts = [];

                if (!empty($customWhereSQL)) {
                    $whereParts[] = $customWhereSQL;
                }

                $terminoBusqueda = $params['buscar'] ?? $params['search'] ?? '';
                if (!empty($terminoBusqueda)) {
                    $terminoEscapado = '%' . addslashes($terminoBusqueda) . '%';
                    $whereParts[] = "(nombre LIKE '$terminoEscapado')";
                }

                if (!empty($whereParts)) {
                    $sqlTodosIds .= " WHERE " . implode(" AND ", $whereParts);
                }

                $conexionDbIds = null;
                if (class_exists('Database') && method_exists('Database', 'getConnection')) {
                    $conexionDbIds = Database::getConnection();
                } elseif (class_exists('Conexion') && method_exists('Conexion', 'conectar')) {
                    $conexionDbIds = Conexion::conectar();
                } elseif (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
                    $conexionDbIds = $GLOBALS['pdo'];
                }

                if ($conexionDbIds) {
                    $stmtIds = $conexionDbIds->query($sqlTodosIds);
                    if ($stmtIds) {
                        $todosLosIds = array_map('strval', $stmtIds->fetchAll(PDO::FETCH_COLUMN));
                    }
                }
            } catch (Throwable $exQuery) {
                error_log("Aviso al consultar todos los IDs globales de impuestos: " . $exQuery->getMessage());
            }

            // Fallback de seguridad
            if (empty($todosLosIds) && !empty($resultado['datos'])) {
                $todosLosIds = array_map(function($row) { 
                    return strval($row['id'] ?? $row['ID'] ?? ''); 
                }, $resultado['datos']);
            }

            // 8. Respuesta exitosa incluyendo el array completo 'todos_los_ids'
            JsonResponse::success("Esquemas de impuestos obtenidos correctamente", [
                'datos' => $resultado['datos'],
                'paginacion' => $resultado['paginacion'],
                'todos_los_ids' => $todosLosIds,
                'params' => $params
            ]);
        } else {
            JsonResponse::error("Ocurrió un error al consultar los esquemas de impuestos", null, 500);
        }

    } catch (Throwable $e) {
        error_log("Error en Obtener_Esquemas_Impuestos_Paginados: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al obtener los esquemas de impuestos", $e->getMessage(), 500);
    }
}

function Obtener_Esquema_Impuesto_Por_Id(array $params = []): void {
    try {
        // Obtenemos el ID ya sea directamente o anidado
        $id = $params['ID'] ?? $params['id'] ?? null;

        if (empty($id) || !is_numeric($id)) {
            JsonResponse::error("El ID del esquema de impuesto es obligatorio y válido", null, 400);
            return;
        }

        $idEscapado = intval($id);

        $sql = "SELECT 
                    ID, 
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
                WHERE ID = $idEscapado 
                LIMIT 1";

        $resultado = Consultar_PDO($sql);

        if (!empty($resultado) && is_array($resultado)) {
            $esquema = $resultado[0];

            // Obtener la variable de moneda del sistema (por defecto '$')
            $simboloMoneda = '$';
            try {
                $sqlMoneda = "SELECT v_valor FROM sistema_variables WHERE v_clave = 'moneda' OR v_clave = 'simbolo_moneda' LIMIT 1";
                $resMoneda = Consultar_PDO($sqlMoneda);
                if (!empty($resMoneda) && isset($resMoneda[0]['v_valor'])) {
                    $simboloMoneda = $resMoneda[0]['v_valor'];
                }
            } catch (Throwable $exMoneda) {
                // Se mantiene el símbolo por defecto
            }

            // 1. Formatear tasa_iva con formato de 4 decimales ('0.1600') para ser compatible con el CustomSelect
            if (isset($esquema['tasa_iva'])) {
                $valorIvaFloat = floatval($esquema['tasa_iva']);
                $esquema['tasa_iva_porcentaje'] = $valorIvaFloat * 100;
                // Mantenemos el valor decimal exacto con 4 decimales para el select
                $esquema['tasa_iva_decimal'] = number_format($valorIvaFloat, 4, '.', '');
                // Versión string con símbolo para visualización si se requiere
                $esquema['tasa_iva'] = rtrim(rtrim(number_format($esquema['tasa_iva_porcentaje'], 2, '.', ''), '0'), '.') . '%';
            }

            // 2. Demás campos de porcentaje
            if (isset($esquema['tasa_ieps'])) {
                $esquema['tasa_ieps_porcentaje'] = floatval($esquema['tasa_ieps']) * 100;
                $esquema['tasa_ieps'] = rtrim(rtrim(number_format($esquema['tasa_ieps_porcentaje'], 2, '.', ''), '0'), '.') . '%';
            }
            if (isset($esquema['retencion_isr'])) {
                $esquema['retencion_isr_porcentaje'] = floatval($esquema['retencion_isr']) * 100;
                $esquema['retencion_isr'] = rtrim(rtrim(number_format($esquema['retencion_isr_porcentaje'], 2, '.', ''), '0'), '.') . '%';
            }
            if (isset($esquema['retencion_iva'])) {
                $esquema['retencion_iva_porcentaje'] = floatval($esquema['retencion_iva']) * 100;
                $esquema['retencion_iva'] = rtrim(rtrim(number_format($esquema['retencion_iva_porcentaje'], 2, '.', ''), '0'), '.') . '%';
            }

            // Cuotas fijas de IEPS en formato moneda
            $camposMoneda = ['ieps_cuota_litro', 'ieps_cuota_unidad'];
            foreach ($camposMoneda as $campo) {
                if (isset($esquema[$campo])) {
                    $esquema[$campo] = $simboloMoneda . ' ' . number_format(floatval($esquema[$campo]), 2, '.', ',');
                }
            }

            // Estructuramos la respuesta correctamente con la clave 'datos' para que coincida con window.impuestoActual.datos
            JsonResponse::success("Esquema de impuesto obtenido correctamente", $esquema);
        } else {
            JsonResponse::error("El esquema de impuesto solicitado no existe", null, 404);
        }

    } catch (Throwable $e) {
        error_log("Error en Obtener_Esquema_Impuesto_Por_Id: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al consultar el esquema de impuesto", $e->getMessage(), 500);
    }
}

function Actualizar_Esquema_Fiscal(array $datos): void {
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
            return;
        }

        // 4. Validar permisos usando tu función TienePermiso() para edición
        if (!TienePermiso($pdo, 'editar_esquemas_fiscales')) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
            return;
        }

        // --- FLUJO DE EDICIÓN DE UN ESQUEMA FISCAL ---
        $idEsquema         = !empty($datos['id']) ? intval($datos['id']) : 0;
        $nombre            = strtoupper(trim($datos['nombre'] ?? ''));
        
        // Normalización de tasas y porcentajes (si es > 1, se divide entre 100 para almacenar formato decimal correcto en DECIMAL(5,4))
        $rawTasaIva        = floatval($datos['tasa_iva'] ?? 0);
        $tasaIva           = ($rawTasaIva > 1) ? $rawTasaIva / 100 : $rawTasaIva;

        $rawTasaIeps       = floatval($datos['tasa_ieps'] ?? 0);
        $tasaIeps          = ($rawTasaIeps > 1) ? $rawTasaIeps / 100 : $rawTasaIeps;

        $iepsCuotaLitro    = floatval($datos['ieps_cuota_litro'] ?? 0);
        $iepsCuotaUnidad   = floatval($datos['ieps_cuota_unidad'] ?? 0);

        $rawRetIsr         = floatval($datos['retencion_isr'] ?? 0);
        $retencionIsr      = ($rawRetIsr > 1) ? $rawRetIsr / 100 : $rawRetIsr;

        $rawRetIva         = floatval($datos['retencion_iva'] ?? 0);
        $retencionIva      = ($rawRetIva > 1) ? $rawRetIva / 100 : $rawRetIva;

        if ($idEsquema <= 0) {
            JsonResponse::error('El ID del esquema fiscal a editar no es válido.');
            return;
        }
        if (empty($nombre)) {
            JsonResponse::error('El nombre del esquema fiscal es obligatorio.');
            return;
        }

        // Obtener valor anterior para la auditoría comparativa
        $stmtAnt = $pdo->prepare("SELECT id, nombre, tasa_iva, tasa_ieps, ieps_cuota_litro, ieps_cuota_unidad, retencion_isr, retencion_iva, estado FROM impuestos_esquemas WHERE id = :id");
        $stmtAnt->execute([':id' => $idEsquema]);
        $valorAnterior = $stmtAnt->fetch(PDO::FETCH_ASSOC);

        if (!$valorAnterior) {
            JsonResponse::error('El esquema fiscal que intentas editar no existe.');
            return;
        }

        // Validar si el nuevo nombre ya pertenece a OTRO esquema diferente
        $stmtCheck = $pdo->prepare("SELECT id FROM impuestos_esquemas WHERE nombre = :nombre AND id != :id LIMIT 1");
        $stmtCheck->execute([':nombre' => $nombre, ':id' => $idEsquema]);
        if ($stmtCheck->fetch()) {
            JsonResponse::error('El nombre del esquema fiscal ya se encuentra registrado en el sistema.');
            return;
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

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }

        if ($e->getCode() == '23000') {
            $errorMsg = $e->getMessage();
            if (strpos($errorMsg, 'nombre') !== false) {
                JsonResponse::error('El esquema fiscal ingresado ya se encuentra registrado en el sistema.');
                return;
            }
            JsonResponse::error('Ya existe un registro duplicado en la base de datos.');
            return;
        }

        error_log("Error de BD al actualizar esquema fiscal: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al actualizar esquema fiscal: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Eliminar_Esquema_Fiscal(array $datos): void {
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
            return;
        }

        // 4. Validar permisos usando tu función TienePermiso() para eliminación
        if (!TienePermiso($pdo, 'eliminar_esquemas_fiscales')) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
            return;
        }

        // --- FLUJO DE ELIMINACIÓN LÓGICA DE UN ESQUEMA FISCAL ---
        $idEsquema = !empty($datos['id']) ? intval($datos['id']) : 0;

        if ($idEsquema <= 0) {
            JsonResponse::error('El ID del esquema fiscal a eliminar no es válido.');
            return;
        }

        // 5. Validar si el esquema está asignado a algún PRODUCTO ACTIVO (`habilitado = 1`) en la tabla productos
        $sqlCheckProd = "SELECT COUNT(*) 
                         FROM producto_fiscal pf
                         INNER JOIN productos p ON pf.Producto_ID = p.ID
                         WHERE pf.Perfil_Impuesto_ID = :id AND p.habilitado = 1";
        
        $stmtCheckProd = $pdo->prepare($sqlCheckProd);
        $stmtCheckProd->execute([':id' => $idEsquema]);
        $totalProductosActivos = (int)$stmtCheckProd->fetchColumn();

        if ($totalProductosActivos > 0) {
            $textoProd = $totalProductosActivos === 1 ? '1 producto activo' : "{$totalProductosActivos} productos activos";
            JsonResponse::error("No se puede eliminar el esquema fiscal porque actualmente está asignado a {$textoProd}.");
            return;
        }

        // Obtener valor anterior para la auditoría comparativa
        $stmtAnt = $pdo->prepare("SELECT id, nombre, tasa_iva, tasa_ieps, ieps_cuota_litro, ieps_cuota_unidad, retencion_isr, retencion_iva, estado FROM impuestos_esquemas WHERE id = :id");
        $stmtAnt->execute([':id' => $idEsquema]);
        $valorAnterior = $stmtAnt->fetch(PDO::FETCH_ASSOC);

        if (!$valorAnterior) {
            JsonResponse::error('El esquema fiscal que intentas eliminar no existe.');
            return;
        }

        // Ejecutar la eliminación LÓGICA (cambiar estado a 'inactivo') en la base de datos
        $sqlUpd = "UPDATE impuestos_esquemas SET estado = 'inactivo', modificado_por = :modificado_por, fecha_modificacion = NOW() WHERE id = :id";
        $stmtUpd = $pdo->prepare($sqlUpd);
        $stmtUpd->execute([
            ':modificado_por' => $usuarioId,
            ':id'             => $idEsquema
        ]);

        // Registro centralizado de bitácora y auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'IMPUESTOS_ESQUEMAS',
            'ELIMINAR',
            $idEsquema,
            "Se inactivó (eliminación lógica) el esquema fiscal ID: {$idEsquema} ('{$valorAnterior['nombre']}')",
            $valorAnterior,
            ['estado' => 'inactivo']
        );

        JsonResponse::success('Esquema fiscal eliminado exitosamente.', [
            'id' => $idEsquema
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }

        error_log("Error de BD al eliminar lógicamente esquema fiscal: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al eliminar esquema fiscal: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Habilitar_Esquema_Fiscal(array $datos): void {
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
            return;
        }

        // 4. Validar permisos usando tu función TienePermiso() para edición/habilitación
        if (!TienePermiso($pdo, 'editar_esquemas_fiscales')) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
            return;
        }

        // --- FLUJO DE HABILITACIÓN DE UN ESQUEMA FISCAL ---
        $idEsquema = !empty($datos['id']) ? intval($datos['id']) : 0;

        if ($idEsquema <= 0) {
            JsonResponse::error('El ID del esquema fiscal a habilitar no es válido.');
            return;
        }

        // Obtener valor anterior para la auditoría comparativa
        $stmtAnt = $pdo->prepare("SELECT id, nombre, tasa_iva, tasa_ieps, ieps_cuota_litro, ieps_cuota_unidad, retencion_isr, retencion_iva, estado FROM impuestos_esquemas WHERE id = :id");
        $stmtAnt->execute([':id' => $idEsquema]);
        $valorAnterior = $stmtAnt->fetch(PDO::FETCH_ASSOC);

        if (!$valorAnterior) {
            JsonResponse::error('El esquema fiscal que intentas habilitar no existe.');
            return;
        }

        // Ejecutar la actualización para cambiar el estado a 'activo'
        $sqlUpd = "UPDATE impuestos_esquemas SET estado = 'activo', modificado_por = :modificado_por, fecha_modificacion = NOW() WHERE id = :id";
        $stmtUpd = $pdo->prepare($sqlUpd);
        $stmtUpd->execute([
            ':modificado_por' => $usuarioId,
            ':id'             => $idEsquema
        ]);

        // Registro centralizado de bitácora y auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'IMPUESTOS_ESQUEMAS',
            'HABILITAR',
            $idEsquema,
            "Se habilitó el esquema fiscal ID: {$idEsquema} ('{$valorAnterior['nombre']}')",
            $valorAnterior,
            ['estado' => 'activo']
        );

        JsonResponse::success('Esquema fiscal habilitado exitosamente.', [
            'id' => $idEsquema
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }

        error_log("Error de BD al habilitar esquema fiscal: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al habilitar esquema fiscal: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Habilitar_Esquemas_Fiscales(array $datos): void {
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $pdo = Conexion();

        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
            return;
        }

        if (!TienePermiso($pdo, 'editar_esquemas_fiscales')) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
            return;
        }

        $idsRaw = $datos['ids'] ?? ($datos['id'] ?? []);
        if (is_string($idsRaw)) {
            $idsRaw = explode(',', $idsRaw);
        }
        if (!is_array($idsRaw)) {
            $idsRaw = [$idsRaw];
        }

        $idsLimpios = array_values(array_unique(array_filter(array_map('intval', $idsRaw), function($id) {
            return $id > 0;
        })));

        if (empty($idsLimpios)) {
            JsonResponse::error('No se seleccionó ningún esquema fiscal válido para habilitar.');
            return;
        }

        $pdo->beginTransaction();

        $processed = [];
        $failed = [];
        $nuevoEstado = 'activo';

        $stmtUpdate = $pdo->prepare("UPDATE impuestos_esquemas 
                                     SET estado = :estado, modificado_por = :modificado_por, fecha_modificacion = NOW() 
                                     WHERE id = :id");

        foreach ($idsLimpios as $idEsquema) {
            $stmtAnt = $pdo->prepare("SELECT * FROM impuestos_esquemas WHERE id = :id LIMIT 1");
            $stmtAnt->execute([':id' => $idEsquema]);
            $esquema = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$esquema) {
                $failed[] = [
                    'id' => $idEsquema,
                    'nombre' => "Esquema ID #{$idEsquema}",
                    'reason' => 'El esquema fiscal no existe.'
                ];
                continue;
            }

            $esquemaId = $esquema['id'] ?? ($esquema['ID'] ?? $idEsquema);
            $esquemaNombre = $esquema['nombre'] ?? ($esquema['Nombre'] ?? "Esquema #{$idEsquema}");
            $esquemaEstado = $esquema['estado'] ?? ($esquema['Estado'] ?? '');

            if (strtolower($esquemaEstado) === $nuevoEstado) {
                $failed[] = [
                    'id' => (int)$esquemaId,
                    'nombre' => $esquemaNombre,
                    'reason' => 'El esquema fiscal ya se encuentra habilitado.'
                ];
                continue;
            }

            $stmtUpdate->execute([
                ':estado'         => $nuevoEstado,
                ':modificado_por' => $usuarioId,
                ':id'             => (int)$esquemaId
            ]);

            if ($stmtUpdate->rowCount() > 0) {
                if (function_exists('RegistrarBitacoraAccion')) {
                    RegistrarBitacoraAccion(
                        $usuarioId,
                        $sesionId,
                        'IMPUESTOS_ESQUEMAS',
                        'HABILITAR',
                        (int)$esquemaId,
                        "Se habilitó el esquema fiscal ID: {$esquemaId} ('{$esquemaNombre}')",
                        $esquema,
                        ['estado' => $nuevoEstado, 'modificado_por' => $usuarioId]
                    );
                }

                $processed[] = [
                    'id' => (int)$esquemaId,
                    'nombre' => $esquemaNombre
                ];
            } else {
                $failed[] = [
                    'id' => (int)$esquemaId,
                    'nombre' => $esquemaNombre,
                    'reason' => 'No se pudo actualizar el estado en la base de datos.'
                ];
            }
        }

        $pdo->commit();

        $mensajeResumen = count($failed) === 0 
            ? "Esquemas fiscales habilitados exitosamente." 
            : "Proceso completado con algunas observaciones.";

        JsonResponse::massive($mensajeResumen, $processed, $failed, 200);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al habilitar esquemas fiscales: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al habilitar esquemas fiscales: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Eliminar_Esquemas_Fiscales(array $datos): void {
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $pdo = Conexion();

        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
            return;
        }

        if (!TienePermiso($pdo, 'editar_esquemas_fiscales')) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
            return;
        }

        $idsRaw = $datos['ids'] ?? ($datos['id'] ?? []);
        if (is_string($idsRaw)) {
            $idsRaw = explode(',', $idsRaw);
        }
        if (!is_array($idsRaw)) {
            $idsRaw = [$idsRaw];
        }

        $idsLimpios = array_values(array_unique(array_filter(array_map('intval', $idsRaw), function($id) {
            return $id > 0;
        })));

        if (empty($idsLimpios)) {
            JsonResponse::error('No se seleccionó ningún esquema fiscal válido para eliminar.');
            return;
        }

        $pdo->beginTransaction();

        $processed = [];
        $failed = [];
        $nuevoEstado = 'inactivo';

        $stmtCheckProd = $pdo->prepare("SELECT COUNT(*) 
                                       FROM producto_fiscal pf
                                       INNER JOIN productos p ON pf.Producto_ID = p.ID
                                       WHERE pf.Perfil_Impuesto_ID = :id AND p.habilitado = 1");

        $stmtUpdate = $pdo->prepare("UPDATE impuestos_esquemas 
                                     SET estado = :estado, modificado_por = :modificado_por, fecha_modificacion = NOW() 
                                     WHERE id = :id");

        foreach ($idsLimpios as $idEsquema) {
            $stmtAnt = $pdo->prepare("SELECT * FROM impuestos_esquemas WHERE id = :id LIMIT 1");
            $stmtAnt->execute([':id' => $idEsquema]);
            $esquema = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$esquema) {
                $failed[] = [
                    'id' => $idEsquema,
                    'nombre' => "Esquema ID #{$idEsquema}",
                    'reason' => 'El esquema fiscal no existe.'
                ];
                continue;
            }

            $esquemaId = $esquema['id'] ?? ($esquema['ID'] ?? $idEsquema);
            $esquemaNombre = $esquema['nombre'] ?? ($esquema['Nombre'] ?? "Esquema #{$idEsquema}");
            $esquemaEstado = $esquema['estado'] ?? ($esquema['Estado'] ?? '');

            if (strtolower($esquemaEstado) === $nuevoEstado) {
                $failed[] = [
                    'id' => (int)$esquemaId,
                    'nombre' => $esquemaNombre,
                    'reason' => 'El esquema fiscal ya se encuentra inactivo.'
                ];
                continue;
            }

            $stmtCheckProd->execute([':id' => (int)$esquemaId]);
            $totalProductosActivos = (int)$stmtCheckProd->fetchColumn();

            if ($totalProductosActivos > 0) {
                $textoProd = $totalProductosActivos === 1 ? '1 producto activo' : "{$totalProductosActivos} productos activos";
                $failed[] = [
                    'id' => (int)$esquemaId,
                    'nombre' => $esquemaNombre,
                    'reason' => "No se puede eliminar porque actualmente está asignado a {$textoProd}."
                ];
                continue;
            }

            $stmtUpdate->execute([
                ':estado'         => $nuevoEstado,
                ':modificado_por' => $usuarioId,
                ':id'             => (int)$esquemaId
            ]);

            if ($stmtUpdate->rowCount() > 0) {
                if (function_exists('RegistrarBitacoraAccion')) {
                    RegistrarBitacoraAccion(
                        $usuarioId,
                        $sesionId,
                        'IMPUESTOS_ESQUEMAS',
                        'ELIMINAR_LOGICO',
                        (int)$esquemaId,
                        "Se inactivó el esquema fiscal ID: {$esquemaId} ('{$esquemaNombre}')",
                        $esquema,
                        ['estado' => $nuevoEstado, 'modificado_por' => $usuarioId]
                    );
                }

                $processed[] = [
                    'id' => (int)$esquemaId,
                    'nombre' => $esquemaNombre
                ];
            } else {
                $failed[] = [
                    'id' => (int)$esquemaId,
                    'nombre' => $esquemaNombre,
                    'reason' => 'No se pudo actualizar el estado en la base de datos.'
                ];
            }
        }

        $pdo->commit();

        $mensajeResumen = count($failed) === 0 
            ? "Esquemas fiscales eliminados correctamente." 
            : "Proceso completado con algunas observaciones.";

        JsonResponse::massive($mensajeResumen, $processed, $failed, 200);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al eliminar esquemas fiscales: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al eliminar esquemas fiscales: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Importar_Esquemas_Fiscales(array $datosCrudos): void {
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
            return;
        }

        // 4. Validar permiso estrictamente para edición/creación de esquemas fiscales
        if (!TienePermiso($pdo, 'editar_esquemas_fiscales')) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
            return;
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
            return;
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
                            if ($idx < 1) continue; // Omitir cabecera (fila 1 de la plantilla)
                            if (empty(array_filter($datosFila))) continue;
                            $filasDatos[] = $datosFila;
                        }
                    } else {
                        throw new Exception("La librería phpspreadsheet no está disponible en el servidor.");
                    }
                }

                $stmtInsert = $pdo->prepare("
                    INSERT INTO impuestos_esquemas (
                        nombre, tasa_iva, tasa_ieps, ieps_cuota_litro, ieps_cuota_unidad, 
                        retencion_isr, retencion_iva, estado, creado_por, modificado_por, 
                        fecha_alta, fecha_modificacion
                    ) VALUES (
                        :nombre, :tasa_iva, :tasa_ieps, :ieps_cuota_litro, :ieps_cuota_unidad, 
                        :retencion_isr, :retencion_iva, :estado, :creado_por, :modificado_por, 
                        NOW(), NOW()
                    )
                ");

                foreach ($filasDatos as $numFila => $fila) {
                    $nombre          = trim($fila[0] ?? '');
                    $tasaIva         = trim($fila[1] ?? '0.0000');
                    $tasaIeps        = trim($fila[2] ?? '0.0000');
                    $iepsCuotaLitro  = trim($fila[3] ?? '0.0000');
                    $iepsCuotaUnidad = trim($fila[4] ?? '0.0000');
                    $retencionIsr    = trim($fila[5] ?? '0.0000');
                    $retencionIva    = trim($fila[6] ?? '0.0000');
                    $estado          = strtolower(trim($fila[7] ?? 'activo'));

                    $nombreEsquema = !empty($nombre) ? $nombre : "Esquema en fila #" . ($numFila + 2);

                    if (empty($nombre)) {
                        $failed[] = [
                            "id"     => "---",
                            "nombre" => $nombreEsquema,
                            "reason" => "El esquema fiscal carece de nombre obligatorio."
                        ];
                        continue; 
                    }

                    if (!in_array($estado, ['activo', 'inactivo'])) {
                        $estado = 'activo';
                    }

                    // Validación de duplicados por nombre exacto
                    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM impuestos_esquemas WHERE nombre = :nombre");
                    $stmtCheck->execute([':nombre' => $nombre]);

                    if ($stmtCheck->fetchColumn() > 0) {
                        $failed[] = [
                            "id"     => "---",
                            "nombre" => $nombreEsquema,
                            "reason" => "Ya existe un esquema fiscal registrado con el mismo nombre ('$nombre')."
                        ];
                        continue;
                    }

                    $stmtInsert->execute([
                        ':nombre'            => $nombre,
                        ':tasa_iva'          => is_numeric($tasaIva) ? $tasaIva : 0.0000,
                        ':tasa_ieps'         => is_numeric($tasaIeps) ? $tasaIeps : 0.0000,
                        ':ieps_cuota_litro'  => is_numeric($iepsCuotaLitro) ? $iepsCuotaLitro : 0.0000,
                        ':ieps_cuota_unidad' => is_numeric($iepsCuotaUnidad) ? $iepsCuotaUnidad : 0.0000,
                        ':retencion_isr'     => is_numeric($retencionIsr) ? $retencionIsr : 0.0000,
                        ':retencion_iva'     => is_numeric($retencionIva) ? $retencionIva : 0.0000,
                        ':estado'            => $estado,
                        ':creado_por'        => $usuarioId,
                        ':modificado_por'    => $usuarioId
                    ]);

                    $nuevoId = (int)$pdo->lastInsertId();

                    $processed[] = [
                        "id"     => $nuevoId,
                        "codigo" => $nuevoId,
                        "nombre" => $nombre
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
                'IMPUESTOS_ESQUEMAS',
                'IMPORTAR_MASIVO',
                null,
                "Proceso de importación masiva de esquemas fiscales completado.",
                null,
                ['processed' => count($processed), 'failed' => count($failed)]
            );
        }

        // Estructura de datos requerida por Procesar_Resumen / Modal de Información
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

        JsonResponse::success("Esquemas fiscales importados correctamente.", $dataRespuesta, 200);

    } catch (Throwable $e) {
        error_log("Error crítico al importar esquemas fiscales masivos: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error inesperado al procesar la importación masiva: ' . strtolower($e->getMessage()), null, 500);
    }
}

function Exportar_Esquemas_Fiscales($datos)
{
    $formato   = $datos['formato'] ?? 'csv';
    $seleccion = $datos['seleccion'] ?? [];

    $sql = "SELECT 
                ID, 
                nombre AS 'Nombre del Esquema', 
                tasa_iva AS 'Tasa IVA', 
                tasa_ieps AS 'Tasa IEPS', 
                ieps_cuota_litro AS 'IEPS Cuota Litro ($)', 
                ieps_cuota_unidad AS 'IEPS Cuota Unidad ($)', 
                retencion_isr AS 'Retención ISR', 
                retencion_iva AS 'Retención IVA', 
                estado AS 'Estado', 
                fecha_alta AS 'Fecha de Alta', 
                fecha_modificacion AS 'Última Modificación'
            FROM impuestos_esquemas";
    
    $params = [];

    // Solo agregamos la cláusula WHERE y el filtro si realmente hay IDs seleccionados
    if (!empty($seleccion) && is_array($seleccion)) {
        $idsLimpios = array_filter(array_map('intval', $seleccion));
        
        if (!empty($idsLimpios)) {
            $placeholders = implode(',', array_fill(0, count($idsLimpios), '?'));
            $sql .= " WHERE ID IN ({$placeholders})";
            $params = $idsLimpios;
        }
    }

    $sql .= " ORDER BY ID DESC";

    EjecutarExportacion(
        $formato,            
        $sql,                
        $params,             
        'Listado de Esquemas Fiscales', 
        'esquemas_fiscales_reporte'    
    );
}