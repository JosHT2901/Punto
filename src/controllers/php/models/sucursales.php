<?php 
function Obtener_Sucursales(): array {
    try {
        $sql = "SELECT 
                    ID, 
                    nombre, 
                    tipo, 
                    calle, 
                    numero_exterior, 
                    numero_interior, 
                    localidad, 
                    municipio, 
                    entidad_federativa, 
                    codigo_postal, 
                    telefono, 
                    telefono_adicional, 
                    whatsapp, 
                    activo, 
                    fecha_creacion, 
                    ultima_modificacion 
                FROM sucursales 
                ORDER BY nombre ASC";

        // Delegamos la ejecución a nuestro helper robusto Consultar_PDO
        $sucursales = Consultar_PDO($sql);

        // Verificamos que el resultado sea un arreglo válido
        return is_array($sucursales) ? $sucursales : [];

    } catch (Throwable $e) {
        // Registramos el error internamente y retornamos un array vacío para no romper la interfaz
        error_log("Error crítico al obtener sucursales: " . $e->getMessage());
        return [];
    }
}

function Gestionar_Sucursales(array $datos): void {
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener la instancia única de PDO mediante la función Conexion()
        $pdo = Conexion();

        // 3. Validar sesión de usuario activa y obtener su ID y Sesión ID de forma segura
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
        }

        // 4. Determinar si es edición (si viene un ID válido) o creación
        $idSucursal = !empty($datos['id']) ? intval($datos['id']) : 0;
        $tipoOperacion = ($idSucursal > 0 || (isset($datos['tipo_operacion']) && $datos['tipo_operacion'] === 'editar')) ? 'editar' : 'crear';

        $permisoRequerido = ($tipoOperacion === 'editar') ? 'editar_sucursales' : 'crear_sucursales';
        
        if (!TienePermiso($pdo, $permisoRequerido)) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
        }

        // Extracción y limpieza de campos comunes (forzando mayúsculas con UTF-8)
        $nombre             = mb_strtoupper(trim($datos['nombre'] ?? ''), 'UTF-8');
        $tipo               = mb_strtoupper(trim($datos['tipo_sucursal'] ?? ($datos['tipo'] ?? 'TIENDA')), 'UTF-8');
        $calle              = mb_strtoupper(trim($datos['calle'] ?? ''), 'UTF-8');
        $numeroExterior     = mb_strtoupper(trim($datos['numero_exterior'] ?? ''), 'UTF-8');
        $numeroInterior     = mb_strtoupper(trim($datos['numero_interior'] ?? ''), 'UTF-8');
        $codigoPostal       = trim($datos['codigo_postal'] ?? '');
        $estadoBruto        = trim($datos['estado'] ?? '');
        $municipio          = mb_strtoupper(trim($datos['municipio'] ?? ''), 'UTF-8');
        $localidad          = mb_strtoupper(trim($datos['localidad'] ?? ''), 'UTF-8');
        $telefono           = trim($datos['telefono'] ?? '');
        $telefonoAdicional  = trim($datos['telefono_adicional'] ?? '');
        $whatsapp           = trim($datos['whatsapp'] ?? '');

        // 🌟 Conversión de clave de entidad federativa / estado usando el archivo JSON de localidades
        $estado = $estadoBruto;
        if (!empty($estadoBruto)) {
            $jsonPath = __DIR__ . '/../../../json/data/localidades.json';
            if (file_exists($jsonPath)) {
                $contenidoJson = file_get_contents($jsonPath);
                $localidadesData = json_decode($contenidoJson, true);

                if (is_array($localidadesData)) {
                    foreach ($localidadesData as $item) {
                        // Comparamos si coincide por Clave_Estado (ej. "01") o si ya mandaron el nombre del estado
                        if (
                            (isset($item['Clave_Estado']) && strcasecmp($item['Clave_Estado'], $estadoBruto) === 0) ||
                            (isset($item['Estado']) && strcasecmp($item['Estado'], $estadoBruto) === 0)
                        ) {
                            if (!empty($item['Estado'])) {
                                $estadoBruto = $item['Estado'];
                            }
                            break;
                        }
                    }
                }
            }
            $estado = mb_strtoupper(trim($estadoBruto), 'UTF-8');
        }

        // Validaciones generales obligatorias
        if (empty($nombre)) {
            JsonResponse::error('El nombre de la sucursal es obligatorio.');
        }

        $tiposPermitidos = ['TIENDA', 'BODEGA', 'MATRIZ', 'CEDIS', 'OFICINA'];
        if (!in_array($tipo, $tiposPermitidos)) {
            JsonResponse::error('El tipo de sucursal seleccionado no es válido.');
        }

        // --- FLUJO A: EDICIÓN DE UNA SUCURSAL ---
        if ($tipoOperacion === 'editar') {
            if ($idSucursal <= 0) {
                JsonResponse::error('El ID de la sucursal a editar no es válido.');
            }

            // Obtener datos anteriores para la auditoría comparativa
            $stmtAnt = $pdo->prepare("SELECT ID, nombre, tipo, calle, numero_exterior, codigo_postal, activo FROM sucursales WHERE ID = :id");
            $stmtAnt->execute([':id' => $idSucursal]);
            $valorAnterior = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$valorAnterior) {
                JsonResponse::error('La sucursal que intentas editar no existe.');
            }

            // Validar si ya existe OTRA sucursal con el mismo nombre y tipo
            $stmtCheck = $pdo->prepare("SELECT ID FROM sucursales WHERE nombre = :nombre AND tipo = :tipo AND ID != :id LIMIT 1");
            $stmtCheck->execute([
                ':nombre' => $nombre,
                ':tipo'   => $tipo,
                ':id'     => $idSucursal
            ]);
            if ($stmtCheck->fetch()) {
                JsonResponse::error('Ya existe otra sucursal registrada con el mismo nombre y tipo.');
            }

            // Iniciar transacción
            $pdo->beginTransaction();

            $sqlSucursal = "UPDATE sucursales SET 
                nombre = :nombre, 
                tipo = :tipo, 
                calle = :calle, 
                numero_exterior = :numero_exterior, 
                numero_interior = :numero_interior, 
                localidad = :localidad, 
                municipio = :municipio, 
                entidad_federativa = :estado, 
                codigo_postal = :codigo_postal, 
                telefono = :telefono, 
                telefono_adicional = :telefono_adicional, 
                whatsapp = :whatsapp,
                ultima_modificacion = NOW()
                WHERE ID = :id";

            $stmtUpdate = $pdo->prepare($sqlSucursal);
            $stmtUpdate->execute([
                ':nombre'             => $nombre,
                ':tipo'               => $tipo,
                ':calle'              => $calle,
                ':numero_exterior'    => $numeroExterior,
                ':numero_interior'    => $numeroInterior,
                ':localidad'          => $localidad,
                ':municipio'          => $municipio,
                ':estado'             => $estado,
                ':codigo_postal'      => $codigoPostal,
                ':telefono'           => $telefono,
                ':telefono_adicional' => $telefonoAdicional,
                ':whatsapp'           => $whatsapp,
                ':id'                 => $idSucursal
            ]);

            // Registrar en bitácora
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'SUCURSALES',
                'EDITAR',
                $idSucursal,
                "Actualización de la sucursal '{$nombre}' ({$tipo}).",
                $valorAnterior,
                ['nombre' => $nombre, 'tipo' => $tipo, 'entidad_federativa' => $estado]
            );

            $pdo->commit();

            JsonResponse::success('Sucursal actualizada exitosamente.', [
                'id'     => $idSucursal,
                'nombre' => $nombre,
                'tipo'   => $tipo
            ]);
        }

        // --- FLUJO B: CREACIÓN DE UNA NUEVA SUCURSAL ---
        $stmtCheck = $pdo->prepare("SELECT ID FROM sucursales WHERE nombre = :nombre AND tipo = :tipo LIMIT 1");
        $stmtCheck->execute([
            ':nombre' => $nombre,
            ':tipo'   => $tipo
        ]);
        if ($stmtCheck->fetch()) {
            JsonResponse::error('Ya se encuentra registrada una sucursal con este mismo nombre y tipo.');
        }

        // Iniciar transacción
        $pdo->beginTransaction();

        $sqlInsert = "INSERT INTO sucursales 
            (nombre, tipo, calle, numero_exterior, numero_interior, localidad, municipio, entidad_federativa, codigo_postal, telefono, telefono_adicional, whatsapp, activo) 
            VALUES 
            (:nombre, :tipo, :calle, :numero_exterior, :numero_interior, :localidad, :municipio, :estado, :codigo_postal, :telefono, :telefono_adicional, :whatsapp, 1)";

        $stmtInsert = $pdo->prepare($sqlInsert);
        $stmtInsert->execute([
            ':nombre'             => $nombre,
            ':tipo'               => $tipo,
            ':calle'              => $calle,
            ':numero_exterior'    => $numeroExterior,
            ':numero_interior'    => $numeroInterior,
            ':localidad'          => $localidad,
            ':municipio'          => $municipio,
            ':estado'             => $estado,
            ':codigo_postal'      => $codigoPostal,
            ':telefono'           => $telefono,
            ':telefono_adicional' => $telefonoAdicional,
            ':whatsapp'           => $whatsapp
        ]);

        $nuevaSucursalId = $pdo->lastInsertId();

        // Registrar en bitácora
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'SUCURSALES',
            'CREAR',
            $nuevaSucursalId,
            "Registro de la nueva sucursal '{$nombre}' ({$tipo}).",
            null,
            ['nombre' => $nombre, 'tipo' => $tipo, 'entidad_federativa' => $estado]
        );

        $pdo->commit();

        JsonResponse::success('Sucursal registrada exitosamente.', [
            'id'     => $nuevaSucursalId,
            'nombre' => $nombre,
            'tipo'   => $tipo
        ], 201);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }

        if ($e->getCode() == '23000') {
            JsonResponse::error('Ya existe un registro duplicado en la base de datos.');
        }

        error_log("Error de BD al gestionar sucursal: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al procesar sucursal: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}
function Obtener_Sucursales_Paginadas(array $params = []): void {
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Obtener la sucursal actual del usuario logueado (por defecto 0 si no existe)
        $sucursalActualId = (int)($_SESSION['usuario']['sucursal_actual'] ?? ($_SESSION['sucursal_actual'] ?? 0));

        // Unificamos si los filtros vienen anidados o planos desde el request JS
        if (isset($params['filtros']) && is_array($params['filtros'])) {
            $params = array_merge($params, $params['filtros']);
        }

        // Array para acumular todas las condiciones SQL personalizadas
        $condicionesExtra = [];

        // 1. Procesamiento de Tipo de Sucursal (soporta selección múltiple o única)
        if (isset($params['tipo'])) {
            $tipos = (array)$params['tipo'];
            $tipos = array_filter($tipos, function($v) { return $v !== ''; });

            if (!empty($tipos)) {
                $tiposEscapados = array_map(function($val) {
                    return "'" . addslashes($val) . "'";
                }, $tipos);

                $condicionesExtra[] = "tipo IN (" . implode(", ", $tiposEscapados) . ")";
            }
            unset($params['tipo']);
        }

        // 2. Procesamiento de Estado / Activo (mapeado al campo 'activo')
        if (isset($params['Activo']) || isset($params['activo'])) {
            $estadoVal = $params['Activo'] ?? $params['activo'];
            if ($estadoVal !== '' && $estadoVal !== null) {
                $condicionesExtra[] = "activo = " . (int)$estadoVal;
            }
            unset($params['Activo'], $params['activo']);
        }

        // Inyectamos todas las condiciones acumuladas en custom_where
        $customWhereSQL = "";
        if (!empty($condicionesExtra)) {
            $customWhereSQL = implode(" AND ", $condicionesExtra);
            $params['custom_where'] = $customWhereSQL;
        }

        // 3. whitelists de seguridad adaptadas a la tabla sucursales
        $configuracionSeguridad = [
            'columnas_busqueda' => [
                'nombre', 
                'tipo', 
                'calle', 
                'municipio', 
                'entidad_federativa', 
                'codigo_postal', 
                'telefono', 
                'whatsapp'
            ],
            'filtros_permitidos' => [],
            'columnas_orden' => [
                'ID', 
                'nombre', 
                'tipo', 
                'municipio', 
                'entidad_federativa', 
                'fecha_creacion'
            ]
        ];

        // 4. Ejecutamos la paginación normal para la tabla sucursales
        $resultado = PaginacionService::obtenerPaginados('sucursales', $params, $configuracionSeguridad);

        if ($resultado['exito']) {
            // Cargar el mapa de entidades federativas desde el JSON de localidades
            $mapaEntidades = [];
            $rutaJson = __DIR__ . '/../../../src/json/data/localidades.json'; // Ajusta la ruta relativa según la ubicación exacta de este archivo PHP
            
            if (file_exists($rutaJson)) {
                $contenidoJson = file_get_contents($rutaJson);
                $datosJson = json_decode($contenidoJson, true);
                
                if (is_array($datosJson)) {
                    foreach ($datosJson as $item) {
                        $clave = isset($item['Clave_Estado']) ? trim((string)$item['Clave_Estado']) : '';
                        $nombreEntidad = isset($item['Estado']) ? trim((string)$item['Estado']) : '';
                        if ($clave !== '' && $nombreEntidad !== '' && !isset($mapaEntidades[$clave])) {
                            $mapaEntidades[$clave] = $nombreEntidad;
                        }
                    }
                }
            }

            // Procesar los datos de la página actual
            if (!empty($resultado['datos']) && is_array($resultado['datos'])) {
                foreach ($resultado['datos'] as &$sucursal) {
                    $idSucursal = (int)($sucursal['ID'] ?? $sucursal['id'] ?? 0);
                    
                    // Bandera de sucursal actual
                    $sucursal['es_actual'] = ($idSucursal === $sucursalActualId) ? 1 : 0;

                    // Traducir clave de entidad federativa numérica (ej. '29') a su nombre real ('Tlaxcala') usando el JSON
                    $claveEntidad = trim((string)($sucursal['entidad_federativa'] ?? ''));
                    if (isset($mapaEntidades[$claveEntidad])) {
                        $sucursal['entidad_federativa'] = $mapaEntidades[$claveEntidad];
                    }
                    if (!empty($sucursal['localidad'])) {
                        $sucursal['localidad'] = mb_strtoupper(trim($sucursal['localidad']), 'UTF-8');
                    }
                    // 🌟 Transformar municipio y entidad federativa a MAYÚSCULAS
                    if (!empty($sucursal['municipio'])) {
                        $sucursal['municipio'] = mb_strtoupper(trim($sucursal['municipio']), 'UTF-8');
                    }
                    if (!empty($sucursal['entidad_federativa'])) {
                        $sucursal['entidad_federativa'] = mb_strtoupper(trim($sucursal['entidad_federativa']), 'UTF-8');
                    }

                    // 🌟 Formatear la fecha de creación usando FormatearFechaEspanol si existe
                    if (!empty($sucursal['fecha_creacion']) && function_exists('FormatearFechaEspanol')) {
                        $sucursal['fecha_creacion'] = FormatearFechaEspanol($sucursal['fecha_creacion'], true, true);
                    }
                }
                unset($sucursal);

                // 🌟 Ordenar para que la sucursal actual aparezca siempre en la primera posición del array
                if ($sucursalActualId > 0) {
                    usort($resultado['datos'], function($a, $b) use ($sucursalActualId) {
                        $idA = (int)($a['ID'] ?? $a['id'] ?? 0);
                        $idB = (int)($b['ID'] ?? $b['id'] ?? 0);

                        if ($idA === $sucursalActualId) return -1;
                        if ($idB === $sucursalActualId) return 1;
                        return 0;
                    });
                }
            }

            // 🌟 5. OBTENER EL UNIVERSO COMPLETO DE IDs FILTRADOS DE TODAS LAS PÁGINAS
            $todosLosIds = [];
            
            try {
                // Construimos la consulta independiente para extraer todos los IDs filtrados
                $sqlTodosIds = "SELECT ID FROM sucursales";
                $whereParts = [];

                if (!empty($customWhereSQL)) {
                    $whereParts[] = $customWhereSQL;
                }

                $terminoBusqueda = $params['buscar'] ?? $params['search'] ?? '';
                if (!empty($terminoBusqueda)) {
                    $terminoEscapado = '%' . addslashes($terminoBusqueda) . '%';
                    $whereParts[] = "(nombre LIKE '$terminoEscapado' OR tipo LIKE '$terminoEscapado' OR calle LIKE '$terminoEscapado' OR municipio LIKE '$terminoEscapado' OR entidad_federativa LIKE '$terminoEscapado' OR codigo_postal LIKE '$terminoEscapado' OR telefono LIKE '$terminoEscapado' OR whatsapp LIKE '$terminoEscapado')";
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
                error_log("Aviso al consultar todos los IDs globales de sucursales: " . $exQuery->getMessage());
            }

            // Fallback de seguridad: Si la consulta global falló, extraemos los IDs del resultado paginado actual
            if (empty($todosLosIds) && !empty($resultado['datos'])) {
                $todosLosIds = array_map(function($row) { 
                    return strval($row['ID'] ?? $row['id'] ?? ''); 
                }, $resultado['datos']);
            }

            // 6. Respuesta exitosa incluyendo el array completo 'todos_los_ids' y la sucursal actual de referencia
            JsonResponse::success("Sucursales obtenidas correctamente", [
                'datos' => $resultado['datos'],
                'paginacion' => $resultado['paginacion'],
                'todos_los_ids' => $todosLosIds,
                'sucursal_actual_id' => $sucursalActualId,
                'params' => $params
            ]);
        } else {
            JsonResponse::error("Ocurrió un error al consultar las sucursales", null, 500);
        }

    } catch (Throwable $e) {
        error_log("Error en Obtener_Sucursales_Paginadas: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al obtener las sucursales", $e->getMessage(), 500);
    }
}

function Obtener_Sucursal_Por_Id(array $params = []): void {
    try {
        $id = $params['id'] ?? null;

        if (!$id) {
            JsonResponse::error("El ID de la sucursal es obligatorio", "ID no proporcionado", 400);
            return;
        }

        $sql = "SELECT 
                    ID, 
                    nombre, 
                    tipo, 
                    calle, 
                    numero_exterior, 
                    numero_interior, 
                    localidad, 
                    municipio, 
                    entidad_federativa, 
                    codigo_postal, 
                    telefono, 
                    telefono_adicional, 
                    whatsapp, 
                    activo, 
                    fecha_creacion, 
                    ultima_modificacion 
                FROM sucursales 
                WHERE ID = :id 
                LIMIT 1";

        // Si tu helper Consultar_PDO acepta parámetros, se pasan de esta forma:
        $sucursal = Consultar_PDO($sql, ['id' => $id]);
        
        // Como es una consulta por ID único, obtenemos el primer registro si existe
        $datosSucursal = (!empty($sucursal) && is_array($sucursal)) ? $sucursal[0] : null;

        if (!$datosSucursal) {
            JsonResponse::error("La sucursal solicitada no existe", "Registro no encontrado", 404);
            return;
        }

        // 🌟 Mapeo inverso: De Entidad Federativa (Texto) a Clave_Estado usando localidades.json
        if (!empty($datosSucursal['entidad_federativa'])) {
            $jsonPath = __DIR__ . '/../../../json/data/localidades.json';
            if (file_exists($jsonPath)) {
                $contenidoJson = file_get_contents($jsonPath);
                $localidadesData = json_decode($contenidoJson, true);

                if (is_array($localidadesData)) {
                    foreach ($localidadesData as $item) {
                        if (isset($item['Estado'], $item['Clave_Estado']) && 
                            strcasecmp(trim($item['Estado']), trim($datosSucursal['entidad_federativa'])) === 0) {
                            
                            // Asignamos la clave encontrada (ej. "29")
                            $datosSucursal['entidad_federativa_clave'] = $item['Clave_Estado'];
                            
                            // Opcional: Si tu formulario espera directamente la clave en el campo entidad_federativa, descomenta la siguiente línea:
                            // $datosSucursal['entidad_federativa'] = $item['Clave_Estado'];
                            
                            break;
                        }
                    }
                }
            }
        }

        JsonResponse::success("Sucursal obtenida correctamente", [
            'sucursal' => $datosSucursal
        ]);

    } catch (Throwable $e) {
        error_log("Error crítico al obtener la sucursal por ID: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al consultar la sucursal", $e->getMessage(), 500);
    }
}

function Eliminar_Sucursal(array $params = []): void {
    try {
        $id = $params['id'] ?? null;

        if (!$id) {
            JsonResponse::error("El ID de la sucursal es obligatorio", "ID no proporcionado", 400);
            return;
        }

        // 🌟 Validación de seguridad: Verificar si la sucursal a eliminar es la sucursal actual del usuario en sesión
        $sucursalActualSesion = $_SESSION['usuario']['sucursal_actual'] ?? null;
        if ($sucursalActualSesion && (int)$sucursalActualSesion === (int)$id) {
            JsonResponse::error("No puedes eliminar la sucursal actual en la que estás operando", "Acción no permitida", 400);
            return;
        }

        // Verificamos primero si la sucursal existe
        $sqlVerificar = "SELECT ID, nombre FROM sucursales WHERE ID = :id LIMIT 1";
        $resultado = Consultar_PDO($sqlVerificar, ['id' => $id]);
        $sucursal = (!empty($resultado) && is_array($resultado)) ? $resultado[0] : null;

        if (!$sucursal) {
            JsonResponse::error("La sucursal solicitada no existe", "Registro no encontrado", 404);
            return;
        }

        $nombreSucursal = $sucursal['nombre'] ?? 'Desconocida';

        // OPCIÓN A: Borrado Lógico (Recomendado para no romper relaciones con ventas, inventarios, etc.)
        $sqlEliminar = "UPDATE sucursales SET activo = 0, ultima_modificacion = NOW() WHERE ID = :id";
        
        // Ejecutamos la consulta pasándole el parámetro de forma segura
        Consultar_PDO($sqlEliminar, ['id' => $id]);

        // 🌟 Registro en la bitácora de auditoría
        $usuarioId = $_SESSION['usuario']['id'] ?? null;
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['usuario']['sesion_id'] ?? null);

        if (function_exists('RegistrarBitacoraAccion')) {
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'SUCURSALES',
                'ELIMINAR',
                $id,
                "Desactivación/eliminación lógica de la sucursal '{$nombreSucursal}'.",
                null,
                ['id' => $id, 'nombre' => $nombreSucursal]
            );
        }

        // Retornamos la respuesta estandarizada de éxito
        JsonResponse::success("Sucursal eliminada correctamente", [
            'id' => $id
        ]);

    } catch (Throwable $e) {
        // Registramos el error internamente
        error_log("Error crítico al eliminar la sucursal: " . $e->getMessage());
        
        // Retornamos una respuesta de error estandarizada
        JsonResponse::error("Ocurrió un error al intentar eliminar la sucursal", $e->getMessage(), 500);
    }
}

function Habilitar_Sucursal(array $params = []): void {
    try {
        $id = $params['id'] ?? null;

        if (!$id) {
            JsonResponse::error("El ID de la sucursal es obligatorio", "ID no proporcionado", 400);
            return;
        }

        // Verificamos primero si la sucursal existe
        $sqlVerificar = "SELECT ID, nombre, activo FROM sucursales WHERE ID = :id LIMIT 1";
        $resultado = Consultar_PDO($sqlVerificar, ['id' => $id]);
        $sucursal = (!empty($resultado) && is_array($resultado)) ? $resultado[0] : null;

        if (!$sucursal) {
            JsonResponse::error("La sucursal solicitada no existe", "Registro no encontrado", 404);
            return;
        }

        $nombreSucursal = $sucursal['nombre'] ?? 'Desconocida';

        // Validamos si ya se encuentra activa para evitar consultas innecesarias
        if ((int)$sucursal['activo'] === 1) {
            JsonResponse::success("La sucursal ya se encuentra habilitada", [
                'id' => $id
            ]);
            return;
        }

        // Actualizamos el estatus a activo (activo = 1)
        $sqlHabilitar = "UPDATE sucursales SET activo = 1, ultima_modificacion = NOW() WHERE ID = :id";
        Consultar_PDO($sqlHabilitar, ['id' => $id]);

        // 🌟 Registro en la bitácora de auditoría
        $usuarioId = $_SESSION['usuario']['id'] ?? null;
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['usuario']['sesion_id'] ?? null);

        if (function_exists('RegistrarBitacoraAccion')) {
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'SUCURSALES',
                'HABILITAR',
                $id,
                "Habilitación de la sucursal '{$nombreSucursal}'.",
                null,
                ['id' => $id, 'nombre' => $nombreSucursal]
            );
        }

        // Retornamos la respuesta estandarizada de éxito
        JsonResponse::success("Sucursal habilitada correctamente", [
            'id' => $id
        ]);

    } catch (Throwable $e) {
        // Registramos el error internamente
        error_log("Error crítico al habilitar la sucursal: " . $e->getMessage());
        
        // Retornamos una respuesta de error estandarizada
        JsonResponse::error("Ocurrió un error al intentar habilitar la sucursal", $e->getMessage(), 500);
    }
}


function Importar_Sucursales(array $datosCrudos): void {
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

        // 4. Validar permiso estrictamente para creación ('crear_sucursales')
        if (!TienePermiso($pdo, 'crear_sucursales')) {
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

        $tiposPermitidosEnum = ['TIENDA', 'BODEGA', 'MATRIZ', 'CEDIS', 'OFICINA'];

        // Procesar cada archivo recibido
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
                            if ($idx < 1) continue; // Omitir cabecera de la plantilla
                            if (empty(array_filter($datosFila))) continue;
                            $filasDatos[] = $datosFila;
                        }
                    } else {
                        throw new Exception("La librería phpspreadsheet no está disponible en el servidor.");
                    }
                }

                $stmtInsert = $pdo->prepare("
                    INSERT INTO sucursales (
                        nombre, tipo, calle, numero_exterior, numero_interior,
                        localidad, municipio, entidad_federativa, codigo_postal,
                        telefono, telefono_adicional, whatsapp, activo, 
                        fecha_creacion, ultima_modificacion
                    ) VALUES (
                        :nombre, :tipo, :calle, :num_ext, :num_int,
                        :localidad, :municipio, :entidad, :codigo_postal,
                        :telefono, :telefono_add, :whatsapp, 1,
                        NOW(), NOW()
                    )
                ");

                foreach ($filasDatos as $numFila => $fila) {
                    // Conversión a mayúsculas para todos los campos de texto
                    $nombre           = mb_strtoupper(trim($fila[0] ?? ''), 'UTF-8');
                    $tipoBruto        = mb_strtoupper(trim($fila[1] ?? 'TIENDA'), 'UTF-8');
                    $calle            = mb_strtoupper(trim($fila[2] ?? ''), 'UTF-8');
                    $numExt           = mb_strtoupper(trim($fila[3] ?? ''), 'UTF-8');
                    $numInt           = mb_strtoupper(trim($fila[4] ?? ''), 'UTF-8');
                    $localidad        = mb_strtoupper(trim($fila[5] ?? ''), 'UTF-8');
                    $municipio        = mb_strtoupper(trim($fila[6] ?? ''), 'UTF-8');
                    $entidad          = mb_strtoupper(trim($fila[7] ?? ''), 'UTF-8');
                    $codigoPostal     = trim($fila[8] ?? '');
                    $telefono         = trim($fila[9] ?? '');
                    $telefonoAdd      = trim($fila[10] ?? '');
                    $whatsapp         = trim($fila[11] ?? '');

                    // 1. Validar campo obligatorio: Nombre
                    if (empty($nombre)) {
                        $failed[] = [
                            "id"     => "---",
                            "nombre" => "Sucursal en fila #" . ($numFila + 2),
                            "reason" => "El registro carece del nombre obligatorio de la sucursal."
                        ];
                        continue; 
                    }

                    // 2. Normalizar y validar Tipo (ENUM)
                    $tipo = in_array($tipoBruto, $tiposPermitidosEnum) ? $tipoBruto : 'TIENDA';

                    // 3. Validar duplicado por Nombre
                    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM sucursales WHERE LOWER(nombre) = LOWER(:nombre)");
                    $stmtCheck->execute([':nombre' => $nombre]);

                    if ($stmtCheck->fetchColumn() > 0) {
                        $failed[] = [
                            "id"     => "---",
                            "nombre" => $nombre,
                            "reason" => "Ya existe una sucursal registrada con el mismo nombre."
                        ];
                        continue;
                    }

                    // 4. Insertar la sucursal (activo se fuerza siempre como 1)
                    $stmtInsert->execute([
                        ':nombre'        => $nombre,
                        ':tipo'          => $tipo,
                        ':calle'         => !empty($calle) ? $calle : null,
                        ':num_ext'       => !empty($numExt) ? $numExt : null,
                        ':num_int'       => !empty($numInt) ? $numInt : null,
                        ':localidad'     => !empty($localidad) ? $localidad : null,
                        ':municipio'     => !empty($municipio) ? $municipio : null,
                        ':entidad'       => !empty($entidad) ? $entidad : null,
                        ':codigo_postal' => !empty($codigoPostal) ? $codigoPostal : null,
                        ':telefono'      => !empty($telefono) ? $telefono : null,
                        ':telefono_add'  => !empty($telefonoAdd) ? $telefonoAdd : null,
                        ':whatsapp'      => !empty($whatsapp) ? $whatsapp : null
                    ]);

                    $nuevaSucursalId = $pdo->lastInsertId();

                    $processed[] = [
                        "id"     => $nuevaSucursalId,
                        "codigo" => "SUC-" . $nuevaSucursalId,
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

        // Registrar en bitácora de auditoría
        if (function_exists('RegistrarBitacoraAccion')) {
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'SUCURSALES',
                'IMPORTAR_MASIVO',
                null,
                "Proceso de importación masiva de sucursales completado.",
                null,
                ['processed' => count($processed), 'failed' => count($failed)]
            );
        }

        // Estructura de respuesta estandarizada para Procesar_Resumen
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

        JsonResponse::success("Sucursales importadas correctamente.", $dataRespuesta, 200);

    } catch (Throwable $e) {
        error_log("Error crítico al importar sucursales masivas: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error inesperado al procesar la importación masiva: ' . strtolower($e->getMessage()), null, 500);
    }
}

function Eliminar_Masivo_Sucursales(array $datosCrudos): void {
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

        // 4. Validar permiso estrictamente para eliminación ('eliminar_sucursales')
        if (!TienePermiso($pdo, 'eliminar_sucursales')) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
        }

        // 5. Obtener los IDs enviados (soporta JSON body o POST clásico)
        $ids = $datosCrudos['ids'] ?? ($_POST['ids'] ?? []);
        
        if (is_string($ids)) {
            $ids = json_decode($ids, true) ?? [];
        }

        if (empty($ids) || !is_array($ids)) {
            JsonResponse::error('No se han proporcionado sucursales válidas para eliminar.', null, 400);
        }

        // 🌟 Validación de seguridad: Verificar si alguna de las sucursales a eliminar es la sucursal actual en sesión
        $sucursalActualSesion = $_SESSION['usuario']['sucursal_actual'] ?? null;

        $processed = [];
        $failed = [];
        $sesionId = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        $pdo->beginTransaction();

        $stmtVerificar = $pdo->prepare("SELECT ID, nombre, activo FROM sucursales WHERE ID = :id LIMIT 1");
        $stmtEliminar = $pdo->prepare("UPDATE sucursales SET activo = 0, ultima_modificacion = NOW() WHERE ID = :id");

        foreach ($ids as $id) {
            $idInt = (int)$id;

            if ($idInt <= 0) {
                continue;
            }

            // Evitar eliminar la sucursal actual en operación
            if ($sucursalActualSesion && (int)$sucursalActualSesion === $idInt) {
                $failed[] = [
                    "id"     => $idInt,
                    "nombre" => "Sucursal ID: $idInt",
                    "reason" => "No puedes eliminar la sucursal actual en la que estás operando."
                ];
                continue;
            }

            // Verificar si existe la sucursal
            $stmtVerificar->execute([':id' => $idInt]);
            $sucursal = $stmtVerificar->fetch(PDO::FETCH_ASSOC);

            if (!$sucursal) {
                $failed[] = [
                    "id"     => $idInt,
                    "nombre" => "Sucursal ID: $idInt",
                    "reason" => "La sucursal solicitada no existe."
                ];
                continue;
            }

            $nombreSucursal = $sucursal['nombre'] ?? 'Desconocida';

            // Ejecutar la desactivación lógica (activo = 0)
            $stmtEliminar->execute([':id' => $idInt]);

            // Registrar en la bitácora de auditoría individualmente o por lote
            if (function_exists('RegistrarBitacoraAccion')) {
                RegistrarBitacoraAccion(
                    $usuarioId,
                    $sesionId,
                    'SUCURSALES',
                    'ELIMINAR_MASIVO',
                    $idInt,
                    "Desactivación lógica masiva de la sucursal '{$nombreSucursal}'.",
                    null,
                    ['id' => $idInt, 'nombre' => $nombreSucursal]
                );
            }

            $processed[] = [
                "id"     => $idInt,
                "codigo" => "SUC-" . $idInt,
                "nombre" => $nombreSucursal
            ];
        }

        $pdo->commit();

        // Estructura de respuesta estandarizada para Procesar_Resumen
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

        JsonResponse::success("Proceso de eliminación masiva completado.", $dataRespuesta, 200);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al eliminar sucursales masivas: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error inesperado al procesar la eliminación masiva: ' . strtolower($e->getMessage()), null, 500);
    }
}

function Exportar_Sucursales($datos)
{
    $formato   = $datos['formato'] ?? 'csv';
    $seleccion = $datos['seleccion'] ?? [];

    $sql = "SELECT 
                CONCAT('SUC-', ID) AS Codigo,
                nombre AS Nombre,
                tipo AS Tipo,
                calle AS Calle,
                numero_exterior AS Numero_Exterior,
                numero_interior AS Numero_Interior,
                localidad AS Localidad,
                municipio AS Municipio,
                entidad_federativa AS Entidad_Federativa,
                codigo_postal AS Codigo_Postal,
                telefono AS Telefono,
                telefono_adicional AS Telefono_Adicional,
                whatsapp AS WhatsApp,
                CASE WHEN activo = 1 THEN 'ACTIVO' ELSE 'INACTIVO' END AS Estado,
                fecha_creacion AS Fecha_Creacion
            FROM sucursales";
    
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
        'Listado de Sucursales Seleccionadas', 
        'sucursales_reporte'    
    );
}

function Habilitar_Masivo_Sucursales(array $datosCrudos): void {
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

        // 4. Validar permiso estrictamente para habilitación ('habilitar_sucursales')
        if (!TienePermiso($pdo, 'editar_sucursales')) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
        }

        // 5. Obtener los IDs enviados (soporta JSON body o POST clásico)
        $ids = $datosCrudos['ids'] ?? ($_POST['ids'] ?? []);
        
        if (is_string($ids)) {
            $ids = json_decode($ids, true) ?? [];
        }

        if (empty($ids) || !is_array($ids)) {
            JsonResponse::error('No se han proporcionado sucursales válidas para habilitar.', null, 400);
        }

        $processed = [];
        $failed = [];
        $sesionId = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        $pdo->beginTransaction();

        $stmtVerificar = $pdo->prepare("SELECT ID, nombre, activo FROM sucursales WHERE ID = :id LIMIT 1");
        $stmtHabilitar = $pdo->prepare("UPDATE sucursales SET activo = 1, ultima_modificacion = NOW() WHERE ID = :id");

        foreach ($ids as $id) {
            $idInt = (int)$id;

            if ($idInt <= 0) {
                continue;
            }

            // Verificar si existe la sucursal
            $stmtVerificar->execute([':id' => $idInt]);
            $sucursal = $stmtVerificar->fetch(PDO::FETCH_ASSOC);

            if (!$sucursal) {
                $failed[] = [
                    "id"     => $idInt,
                    "nombre" => "Sucursal ID: $idInt",
                    "reason" => "La sucursal solicitada no existe."
                ];
                continue;
            }

            // Validar si ya se encuentra activa
            if ((int)$sucursal['activo'] === 1) {
                $failed[] = [
                    "id"     => $idInt,
                    "nombre" => $sucursal['nombre'] ?? 'Desconocida',
                    "reason" => "La sucursal ya se encuentra habilitada."
                ];
                continue;
            }

            $nombreSucursal = $sucursal['nombre'] ?? 'Desconocida';

            // Ejecutar la activación lógica (activo = 1)
            $stmtHabilitar->execute([':id' => $idInt]);

            // Registrar en la bitácora de auditoría
            if (function_exists('RegistrarBitacoraAccion')) {
                RegistrarBitacoraAccion(
                    $usuarioId,
                    $sesionId,
                    'SUCURSALES',
                    'HABILITAR_MASIVO',
                    $idInt,
                    "Activación lógica masiva de la sucursal '{$nombreSucursal}'.",
                    null,
                    ['id' => $idInt, 'nombre' => $nombreSucursal]
                );
            }

            $processed[] = [
                "id"     => $idInt,
                "codigo" => "SUC-" . $idInt,
                "nombre" => $nombreSucursal
            ];
        }

        $pdo->commit();

        // Estructura de respuesta estandarizada para Procesar_Resumen
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

        JsonResponse::success("Proceso de habilitación masiva completado.", $dataRespuesta, 200);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al habilitar sucursales masivas: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error inesperado al procesar la habilitación masiva: ' . strtolower($e->getMessage()), null, 500);
    }
}