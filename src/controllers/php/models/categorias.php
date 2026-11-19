<?php 

/**
 * Obtiene el listado completo de categorías ordenadas alfabéticamente
 * @return array
 */
function Obtener_Categorias(): array {
    try {
        $sql = "SELECT 
                    ID, 
                    Nombre, 
                    Habilitado, 
                    Fecha_Registro, 
                    Registrado_Por, 
                    Ultima_Actualizacion, 
                    Modificado_Por 
                FROM categorias 
                ORDER BY Nombre ASC";

        // Delegamos la ejecución a nuestro helper robusto Consultar_PDO
        $categorias = Consultar_PDO($sql);

        // Verificamos que el resultado sea un arreglo válido
        return is_array($categorias) ? $categorias : [];

    } catch (Throwable $e) {
        // Registramos el error internamente y retornamos un array vacío para no romper la interfaz
        error_log("Error crítico al obtener categorías: " . $e->getMessage());
        return [];
    }
}

function Gestionar_Categorias(array $datos): void {
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
            return;
        }

        // 4. Determinar el tipo de operación recibida ('crear' o 'editar')
        $tipo = trim($datos['tipo'] ?? 'crear');

        // 5. Validar permisos usando la función TienePermiso()
        $permisoRequerido = ($tipo === 'editar') ? 'editar_categorias' : 'crear_categorias';
        
        if (!TienePermiso($pdo, $permisoRequerido)) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
            return;
        }

        $nombreCategoria = strtoupper(trim($datos['nombre_categoria'] ?? ''));
        $atributos       = $datos['atributos'] ?? [];

        if (empty($nombreCategoria)) {
            JsonResponse::error('El nombre de la categoría es obligatorio.');
            return;
        }
        if (empty($atributos) || !is_array($atributos)) {
            JsonResponse::error('La categoría debe tener al menos un atributo asociado.');
            return;
        }

        $tiposPermitidos = ['texto', 'numero', 'peso', 'volumen', 'longitud', 'seleccion', 'color', 'booleano'];

        // --- FLUJO A: EDICIÓN DE UNA CATEGORÍA ---
        if ($tipo === 'editar') {
            $idCategoria = !empty($datos['id_categoria']) ? intval($datos['id_categoria']) : 0;

            if ($idCategoria <= 0) {
                JsonResponse::error('El ID de la categoría a editar no es válido.');
                return;
            }

            // Obtener datos anteriores para la auditoría comparativa
            $stmtAnt = $pdo->prepare("SELECT ID, Nombre, Habilitado FROM categorias WHERE ID = :id");
            $stmtAnt->execute([':id' => $idCategoria]);
            $valorAnterior = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$valorAnterior) {
                JsonResponse::error('La categoría que intentas editar no existe.');
                return;
            }

            // Validar si el nuevo nombre ya pertenece a OTRA categoría diferente
            $stmtCheck = $pdo->prepare("SELECT ID FROM categorias WHERE Nombre = :nombre AND ID != :id LIMIT 1");
            $stmtCheck->execute([':nombre' => $nombreCategoria, ':id' => $idCategoria]);
            if ($stmtCheck->fetch()) {
                JsonResponse::error('La categoría ingresada ya se encuentra registrada en el sistema.');
                return;
            }

            // Iniciar transacción
            $pdo->beginTransaction();

            // 1. Actualizar datos principales de la categoría
            $sqlCat = "UPDATE categorias SET 
                        Nombre = :nombre, 
                        Modificado_Por = :modificado_por,
                        Ultima_Actualizacion = NOW()
                      WHERE ID = :id";

            $stmtCat = $pdo->prepare($sqlCat);
            $stmtCat->execute([
                ':nombre'         => $nombreCategoria,
                ':modificado_por' => $usuarioId,
                ':id'             => $idCategoria
            ]);

            // 2. Sincronizar atributos (Eliminar anteriores y reinsertar los vigentes)
            $stmtDelAttr = $pdo->prepare("DELETE FROM categoria_atributos WHERE ID_Categoria = :id_categoria");
            $stmtDelAttr->execute([':id_categoria' => $idCategoria]);

            $sqlAttr = "INSERT INTO categoria_atributos (ID_Categoria, Nombre_Atributo, Tipo_Dato, Creado_Por) VALUES (:id_categoria, :nombre_atributo, :tipo_dato, :creado_por)";
            $stmtAttr = $pdo->prepare($sqlAttr);

            $atributosActualizados = 0;

            foreach ($atributos as $attr) {
                $nombreAttr = strtoupper(trim($attr['nombre'] ?? ''));
                $tipoDato   = strtolower(trim($attr['tipo'] ?? 'texto'));

                if (empty($nombreAttr)) {
                    continue;
                }

                if (!in_array($tipoDato, $tiposPermitidos)) {
                    $tipoDato = 'texto';
                }

                $stmtAttr->execute([
                    ':id_categoria'    => $idCategoria,
                    ':nombre_atributo' => $nombreAttr,
                    ':tipo_dato'       => $tipoDato,
                    ':creado_por'      => $usuarioId
                ]);
                $atributosActualizados++;
            }

            if ($atributosActualizados === 0) {
                $pdo->rollBack();
                JsonResponse::error('La categoría debe mantener al menos un atributo válido.');
                return;
            }

            // 3. Registrar en bitácora y auditoría
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'CATEGORIAS',
                'EDITAR',
                $idCategoria,
                "Actualización de la categoría '{$nombreCategoria}' con {$atributosActualizados} atributos.",
                $valorAnterior,
                ['nombre' => $nombreCategoria, 'atributos_count' => $atributosActualizados]
            );

            $pdo->commit();

            JsonResponse::success('Categoría actualizada exitosamente.', [
                'id'               => $idCategoria,
                'nombre_categoria' => $nombreCategoria
            ]);
            return; // Detenemos la ejecución para que no pase al flujo de creación
        }

        // --- FLUJO B: CREACIÓN DE UNA NUEVA CATEGORÍA ---
        // Validar previamente si ya existe para evitar excepciones innecesarias
        $stmtCheck = $pdo->prepare("SELECT ID FROM categorias WHERE Nombre = :nombre LIMIT 1");
        $stmtCheck->execute([':nombre' => $nombreCategoria]);
        if ($stmtCheck->fetch()) {
            JsonResponse::error('La categoría ingresada ya se encuentra registrada en el sistema.');
            return;
        }

        // Iniciar transacción
        $pdo->beginTransaction();

        // 1. Insertar categoría principal
        $sqlCat = "INSERT INTO categorias (Nombre, Registrado_Por, Habilitado) VALUES (:nombre, :registrado_por, 1)";
        $stmtCat = $pdo->prepare($sqlCat);
        $stmtCat->execute([
            ':nombre'         => $nombreCategoria,
            ':registrado_por' => $usuarioId
        ]);

        $nuevaCategoriaId = $pdo->lastInsertId();

        // 2. Insertar atributos asociados
        $sqlAttr = "INSERT INTO categoria_atributos (ID_Categoria, Nombre_Atributo, Tipo_Dato, Creado_Por) VALUES (:id_categoria, :nombre_atributo, :tipo_dato, :creado_por)";
        $stmtAttr = $pdo->prepare($sqlAttr);

        $atributosInsertados = 0;

        foreach ($atributos as $attr) {
            $nombreAttr = strtoupper(trim($attr['nombre'] ?? ''));
            $tipoDato   = strtolower(trim($attr['tipo'] ?? 'texto'));

            if (empty($nombreAttr)) {
                continue;
            }

            if (!in_array($tipoDato, $tiposPermitidos)) {
                $tipoDato = 'texto';
            }

            $stmtAttr->execute([
                ':id_categoria'    => $nuevaCategoriaId,
                ':nombre_atributo' => $nombreAttr,
                ':tipo_dato'       => $tipoDato,
                ':creado_por'      => $usuarioId
            ]);
            $atributosInsertados++;
        }

        if ($atributosInsertados === 0) {
            $pdo->rollBack();
            JsonResponse::error('No se pudo registrar la categoría porque los nombres de los atributos venían vacíos.');
            return;
        }

        // 3. Registrar en bitácora y auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'CATEGORIAS',
            'CREAR',
            $nuevaCategoriaId,
            "Registro de la nueva categoría '{$nombreCategoria}' con {$atributosInsertados} atributos.",
            null,
            ['nombre' => $nombreCategoria, 'atributos_count' => $atributosInsertados]
        );

        $pdo->commit();

        JsonResponse::success('Categoría registrada exitosamente.', [
            'id'               => $nuevaCategoriaId,
            'nombre_categoria' => $nombreCategoria,
            'total_atributos'  => $atributosInsertados
        ], 201);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }

        // Manejo de índices únicos violados (ej. uk_nombre_categoria)
        if ($e->getCode() == '23000') {
            $errorMsg = $e->getMessage();
            if (strpos($errorMsg, 'uk_nombre_categoria') !== false || strpos($errorMsg, 'Nombre') !== false) {
                JsonResponse::error('La categoría ingresada ya se encuentra registrada en el sistema.');
                return;
            }
            JsonResponse::error('Ya existe un registro duplicado en la base de datos.');
            return;
        }

        error_log("Error de BD al gestionar categoría: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al procesar categoría: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}
function Obtener_Atributos(): void {
    try {
        $sql = "SELECT 
                    ID, 
                    ID_Categoria, 
                    Nombre_Atributo, 
                    Tipo_Dato, 
                    Fecha_Creacion, 
                    Creado_Por 
                FROM categoria_atributos
                ORDER BY Nombre_Atributo ASC";
        
        // Ejecutamos la consulta general sin parámetros
        $atributos = Consultar_PDO($sql);

        // Verificamos que el resultado sea un arreglo válido
        $listaAtributos = is_array($atributos) ? $atributos : [];

        // Retornamos la respuesta exitosa estandarizada con JsonResponse
        JsonResponse::success("Atributos obtenidos correctamente", $listaAtributos, 200);

    } catch (Throwable $e) {
        // Registramos el error internamente por seguridad
        error_log("Error crítico al obtener los atributos de categorías: " . $e->getMessage());
        
        // Retornamos una respuesta de error controlada al cliente
        JsonResponse::error("Ocurrió un error al obtener los atributos", null, 500);
    }
}

function Obtener_Categorias_Paginadas(array $params = []): void {
    try {
        // Unificamos si los filtros vienen anidados o planos desde el request JS
        if (isset($params['filtros']) && is_array($params['filtros'])) {
            $params = array_merge($params, $params['filtros']);
        }

        // Array para acumular todas las condiciones SQL personalizadas
        $condicionesExtra = [];

        // Procesamiento de Estado / Habilitado
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

        // 4. Whitelists de seguridad basadas en la tabla `categorias`
        $configuracionSeguridad = [
            'columnas_busqueda' => [
                'Nombre'
            ],
            'filtros_permitidos' => [],
            'columnas_orden' => [
                'ID', 
                'Nombre', 
                'Habilitado', 
                'Fecha_Registro'
            ]
        ];

        // 5. Ejecutamos la paginación normal para la tabla (PaginacionService lee automáticamente el orden de $params si está configurado)
        $resultado = PaginacionService::obtenerPaginados('categorias', $params, $configuracionSeguridad);

        if ($resultado['exito']) {
            // Forma robusta de obtener la conexión PDO para consultas complementarias
            $conexionDb = null;
            if (class_exists('Database') && method_exists('Database', 'getConnection')) {
                $conexionDb = Database::getConnection();
            } elseif (class_exists('Conexion') && method_exists('Conexion', 'conectar')) {
                $conexionDb = Conexion::conectar();
            } elseif (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
                $conexionDb = $GLOBALS['pdo'];
            }

            // 🌟 5.1 Enriquecer cada categoría de la página actual con sus atributos correspondientes
            if (!empty($resultado['datos']) && $conexionDb) {
                $idsPagina = array_map(function($cat) {
                    return intval($cat['ID'] ?? $cat['id'] ?? 0);
                }, $resultado['datos']);

                $idsPagina = array_filter($idsPagina);

                if (!empty($idsPagina)) {
                    $placeholders = implode(',', array_fill(0, count($idsPagina), '?'));
                    $sqlAtributos = "SELECT ID, ID_Categoria, Nombre_Atributo, Tipo_Dato, Fecha_Creacion 
                                     FROM categoria_atributos 
                                     WHERE ID_Categoria IN ($placeholders)";
                    
                    $stmtAttr = $conexionDb->prepare($sqlAtributos);
                    $stmtAttr->execute(array_values($idsPagina));
                    $todosAtributos = $stmtAttr->fetchAll(PDO::FETCH_ASSOC);

                    // Agrupamos los atributos por ID de categoría
                    $atributosPorCategoria = [];
                    foreach ($todosAtributos as $attr) {
                        $idCat = $attr['ID_Categoria'];
                        $atributosPorCategoria[$idCat][] = $attr;
                    }

                    // Inyectamos el array 'atributos' dentro de cada registro de categoría
                    foreach ($resultado['datos'] as &$categoria) {
                        $idCat = intval($categoria['ID'] ?? $categoria['id'] ?? 0);
                        $categoria['atributos'] = $atributosPorCategoria[$idCat] ?? [];
                    }
                    unset($categoria);
                }
            }

            // 🌟 6. OBTENER EL UNIVERSO COMPLETO DE IDS FILTRADOS DE TODAS LAS PÁGINAS (respetando orden si aplica)
            $todosLosIds = [];
            
            try {
                // Construimos la consulta independiente para extraer todos los IDs filtrados
                $sqlTodosIds = "SELECT ID FROM categorias";
                $whereParts = [];

                if (!empty($customWhereSQL)) {
                    $whereParts[] = $customWhereSQL;
                }

                $terminoBusqueda = $params['buscar'] ?? $params['search'] ?? '';
                if (!empty($terminoBusqueda)) {
                    $terminoEscapado = '%' . addslashes($terminoBusqueda) . '%';
                    $whereParts[] = "(Nombre LIKE '$terminoEscapado')";
                }

                if (!empty($whereParts)) {
                    $sqlTodosIds .= " WHERE " . implode(" AND ", $whereParts);
                }

                // Aplicar el mismo orden al universo global de IDs si se recibe en los parámetros
                $columnaOrden = $params['ordenar_por'] ?? $params['columna'] ?? 'ID';
                $direccionOrden = strtoupper($params['direccion'] ?? 'DESC');
                
                // Validar contra columnas permitidas por seguridad
                if (in_array($columnaOrden, $configuracionSeguridad['columnas_orden']) && in_array($direccionOrden, ['ASC', 'DESC'])) {
                    $sqlTodosIds .= " ORDER BY {$columnaOrden} {$direccionOrden}";
                } else {
                    $sqlTodosIds .= " ORDER BY ID DESC";
                }

                if ($conexionDb) {
                    $stmtIds = $conexionDb->query($sqlTodosIds);
                    if ($stmtIds) {
                        $todosLosIds = array_map('strval', $stmtIds->fetchAll(PDO::FETCH_COLUMN));
                    }
                }
            } catch (Throwable $exQuery) {
                error_log("Aviso al consultar todos los IDs globales de categorías: " . $exQuery->getMessage());
            }

            // Fallback de seguridad: Si la consulta global falló, extraemos los IDs del resultado paginado actual
            if (empty($todosLosIds) && !empty($resultado['datos'])) {
                $todosLosIds = array_map(function($row) { 
                    return strval($row['ID'] ?? $row['id'] ?? ''); 
                }, $resultado['datos']);
            }

            // 7. Respuesta exitosa incluyendo las categorías con sus atributos y el array 'todos_los_ids'
            JsonResponse::success("Categorías obtenidas correctamente", [
                'datos' => $resultado['datos'],
                'paginacion' => $resultado['paginacion'],
                'todos_los_ids' => $todosLosIds, // IDs de TODAS las páginas del filtro y orden actual
                'params' => $params
            ]);
        } else {
            JsonResponse::error("Ocurrió un error al consultar las categorías", null, 500);
        }

    } catch (Throwable $e) {
        error_log("Error en Obtener_Categorias_Paginadas: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al obtener las categorías", $e->getMessage(), 500);
    }
}

function Obtener_Categoria_Por_Id(array $params = []): void {
    try {
        // Obtenemos el ID de los parámetros enviados (soporta id o id_categoria)
        $idCategoria = $params['id'] ?? $params['id_categoria'] ?? null;

        if (!$idCategoria || !is_numeric($idCategoria)) {
            JsonResponse::error("El ID de la categoría es inválido o no fue proporcionado.", null, 400);
            return;
        }

        // Forma robusta de obtener la conexión PDO
        $conexionDb = null;
        if (class_exists('Database') && method_exists('Database', 'getConnection')) {
            $conexionDb = Database::getConnection();
        } elseif (class_exists('Conexion') && method_exists('Conexion', 'conectar')) {
            $conexionDb = Conexion::conectar();
        } elseif (isset($GLOBALS['pdo']) && $GLOBALS['pdo'] instanceof PDO) {
            $conexionDb = $GLOBALS['pdo'];
        }

        if (!$conexionDb) {
            JsonResponse::error("No se pudo establecer conexión con la base de datos.", null, 500);
            return;
        }

        // 1. Consultar la categoría principal
        $sqlCategoria = "SELECT ID, Nombre, Habilitado, Fecha_Registro FROM categorias WHERE ID = :id LIMIT 1";
        $stmtCat = $conexionDb->prepare($sqlCategoria);
        $stmtCat->execute([':id' => (int)$idCategoria]);
        $categoria = $stmtCat->fetch(PDO::FETCH_ASSOC);

        if (!$categoria) {
            JsonResponse::error("La categoría solicitada no existe.", null, 404);
            return;
        }

        // 2. Consultar los atributos asociados a esta categoría
        $sqlAtributos = "SELECT ID, ID_Categoria, Nombre_Atributo, Tipo_Dato, Fecha_Creacion 
                         FROM categoria_atributos 
                         WHERE ID_Categoria = :id";
        $stmtAttr = $conexionDb->prepare($sqlAtributos);
        $stmtAttr->execute([':id' => (int)$idCategoria]);
        $atributos = $stmtAttr->fetchAll(PDO::FETCH_ASSOC);

        // Agregamos los atributos dentro del objeto de respuesta de la categoría
        $categoria['atributos'] = $atributos;

        // 3. Responder con éxito usando la estructura estándar del sistema
        JsonResponse::success("Categoría obtenida correctamente", $categoria);

    } catch (Throwable $e) {
        error_log("Error en Obtener_Categoria_Por_Id: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al obtener la categoría", $e->getMessage(), 500);
    }
}

function Cambiar_Estado_Categoria(array $params = []): void {
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener la conexión PDO mediante la función estándar del sistema
        $pdo = Conexion();

        // 3. Validar sesión de usuario activa y obtener sus datos de forma segura
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
            return;
        }

        // 4. Validar permisos necesarios (ej: 'cambiar_estado_categorias' o 'editar_categorias')
        if (!TienePermiso($pdo, 'editar_categorias')) {
            JsonResponse::error('No cuentas con los permisos necesarios para modificar el estado de las categorías.', null, 403);
            return;
        }

        // 5. Obtener y validar los parámetros recibidos
        $idCategoria = !empty($params['id'] ?? $params['id_categoria']) ? intval($params['id'] ?? $params['id_categoria']) : 0;
        
        // El estado al que se desea cambiar: 1 (Habilitar) o 0 (Deshabilitar)
        if (!isset($params['habilitado']) && !isset($params['Habilitado'])) {
            JsonResponse::error('El estado de habilitación es obligatorio.', null, 400);
            return;
        }
        
        $nuevoEstado = intval($params['habilitado'] ?? $params['Habilitado']);
        $nuevoEstado = ($nuevoEstado === 1) ? 1 : 0; // Asegurar que sea estrictamente 0 o 1

        if ($idCategoria <= 0) {
            JsonResponse::error('El ID de la categoría no es válido.', null, 400);
            return;
        }

        // 6. Verificar que la categoría exista y obtener sus datos actuales
        $stmtCat = $pdo->prepare("SELECT ID, Nombre, Habilitado FROM categorias WHERE ID = :id LIMIT 1");
        $stmtCat->execute([':id' => $idCategoria]);
        $categoriaActual = $stmtCat->fetch(PDO::FETCH_ASSOC);

        if (!$categoriaActual) {
            JsonResponse::error('La categoría solicitada no existe.', null, 404);
            return;
        }

        $estadoActual = intval($categoriaActual['Habilitado']);

        // Si ya tiene el estado que se solicita, no hay nada que cambiar
        if ($estadoActual === $nuevoEstado) {
            $accionStr = $nuevoEstado === 1 ? 'habilitada' : 'deshabilitada';
            JsonResponse::success("La categoría ya se encuentra {$accionStr}.", [
                'id' => $idCategoria,
                'habilitado' => $nuevoEstado
            ]);
            return;
        }

        // 7. REGLA DE NEGOCIO: Si se va a DESHABILITAR (nuevoEstado === 0), validar que NO tenga productos asociados
        if ($nuevoEstado === 0) {
            $stmtProd = $pdo->prepare("SELECT COUNT(*) AS total FROM productos WHERE categoria_id = :id_categoria");
            $stmtProd->execute([':id_categoria' => $idCategoria]);
            $resultadoProd = $stmtProd->fetch(PDO::FETCH_ASSOC);
            $totalProductos = intval($resultadoProd['total'] ?? 0);

            if ($totalProductos > 0) {
                JsonResponse::error(
                    "No se puede deshabilitar la categoría '{$categoriaActual['Nombre']}' porque tiene {$totalProductos} producto(s) asociado(s).",
                    ['total_productos' => $totalProductos],
                    422 // Unprocessable Entity
                );
                return;
            }
        }

        // 8. Iniciar Transacción
        $pdo->beginTransaction();

        // Actualizar el estado en la tabla categorias
        $sqlUpdate = "UPDATE categorias SET 
                        Habilitado = :habilitado, 
                        Modificado_Por = :modificado_por,
                        Ultima_Actualizacion = NOW()
                      WHERE ID = :id";

        $stmtUpdate = $pdo->prepare($sqlUpdate);
        $stmtUpdate->execute([
            ':habilitado'     => $nuevoEstado,
            ':modificado_por' => $usuarioId,
            ':id'             => $idCategoria
        ]);

        // 9. Registrar la acción en la bitácora del sistema
        $accionBitacora = $nuevoEstado === 1 ? 'HABILITAR' : 'DESHABILITAR';
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'CATEGORIAS',
            $accionBitacora,
            $idCategoria,
            "Se cambió el estado de la categoría '{$categoriaActual['Nombre']}' a " . ($nuevoEstado === 1 ? 'Habilitado' : 'Deshabilitado') . ".",
            $categoriaActual,
            ['id' => $idCategoria, 'nuevo_estado' => $nuevoEstado]
        );

        $pdo->commit();

        $mensajeExito = $nuevoEstado === 1 ? 'Categoría habilitada exitosamente.' : 'Categoría deshabilitada exitosamente.';
        JsonResponse::success($mensajeExito, [
            'id'         => $idCategoria,
            'habilitado' => $nuevoEstado
        ]);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error al cambiar estado de categoría: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error inesperado al actualizar el estado de la categoría.', $e->getMessage(), 500);
    }
}

function Habilitar_Masivo_Categorias(array $datosCrudos): void {
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

        // 4. Validar permiso estrictamente para edición/habilitación
        if (!TienePermiso($pdo, 'editar_categorias')) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
            return;
        }

        // 5. Obtener los IDs enviados (soporta JSON body o POST clásico, o envío individual 'id')
        $ids = $datosCrudos['ids'] ?? ($_POST['ids'] ?? []);
        if (empty($ids) && isset($datosCrudos['id'])) {
            $ids = [$datosCrudos['id']];
        }
        
        if (is_string($ids)) {
            $ids = json_decode($ids, true) ?? [];
        }

        if (empty($ids) || !is_array($ids)) {
            JsonResponse::error('No se han proporcionado categorías válidas para habilitar.', null, 400);
            return;
        }

        $processed = [];
        $failed = [];
        $sesionId = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        $pdo->beginTransaction();

        $stmtVerificar = $pdo->prepare("SELECT ID, Nombre, Habilitado FROM categorias WHERE ID = :id LIMIT 1");
        $stmtHabilitar = $pdo->prepare("UPDATE categorias SET Habilitado = 1, Ultima_Actualizacion = NOW(), Modificado_Por = :modificado_por WHERE ID = :id");

        foreach ($ids as $id) {
            $idInt = (int)$id;

            if ($idInt <= 0) {
                continue;
            }

            // Verificar si existe la categoría
            $stmtVerificar->execute([':id' => $idInt]);
            $categoria = $stmtVerificar->fetch(PDO::FETCH_ASSOC);

            if (!$categoria) {
                $failed[] = [
                    "id"     => $idInt,
                    "nombre" => "Categoría ID: $idInt",
                    "reason" => "La categoría solicitada no existe."
                ];
                continue;
            }

            // Validar si ya se encuentra habilitada
            if ((int)$categoria['Habilitado'] === 1) {
                $failed[] = [
                    "id"     => $idInt,
                    "nombre" => $categoria['Nombre'] ?? 'Desconocida',
                    "reason" => "La categoría ya se encuentra habilitada."
                ];
                continue;
            }

            $nombreCategoria = $categoria['Nombre'] ?? 'Desconocida';

            // Ejecutar la activación lógica (Habilitado = 1)
            $stmtHabilitar->execute([
                ':modificado_por' => $usuarioId,
                ':id'             => $idInt
            ]);

            // Registrar en la bitácora de auditoría
            if (function_exists('RegistrarBitacoraAccion')) {
                RegistrarBitacoraAccion(
                    $usuarioId,
                    $sesionId,
                    'CATEGORIAS',
                    'HABILITAR',
                    $idInt,
                    "Habilitación de la categoría '{$nombreCategoria}'.",
                    $categoria,
                    ['id' => $idInt, 'nombre' => $nombreCategoria]
                );
            }

            $processed[] = [
                "id"     => $idInt,
                "nombre" => $nombreCategoria
            ];
        }

        $pdo->commit();

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

        JsonResponse::success("Proceso de habilitación completado.", $dataRespuesta, 200);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al habilitar categorías: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error inesperado al procesar la habilitación: ' . strtolower($e->getMessage()), null, 500);
    }
}


function Deshabilitar_Masivo_Categorias(array $datosCrudos): void {
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

        // 4. Validar permiso estrictamente para edición
        if (!TienePermiso($pdo, 'eliminar_categorias')) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
            return;
        }

        // 5. Obtener los IDs enviados (soporta JSON body, POST clásico, o envío individual 'id')
        $ids = $datosCrudos['ids'] ?? ($_POST['ids'] ?? []);
        if (empty($ids) && isset($datosCrudos['id'])) {
            $ids = [$datosCrudos['id']];
        }
        
        if (is_string($ids)) {
            $ids = json_decode($ids, true) ?? [];
        }

        if (empty($ids) || !is_array($ids)) {
            JsonResponse::error('No se han proporcionado categorías válidas para deshabilitar.', null, 400);
            return;
        }

        $processed = [];
        $failed = [];
        $sesionId = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        $pdo->beginTransaction();

        $stmtVerificar = $pdo->prepare("SELECT ID, Nombre, Habilitado FROM categorias WHERE ID = :id LIMIT 1");
        $stmtVerificarProductos = $pdo->prepare("SELECT COUNT(*) AS total FROM productos WHERE categoria_id = :id_categoria");
        $stmtDeshabilitar = $pdo->prepare("UPDATE categorias SET Habilitado = 0, Ultima_Actualizacion = NOW(), Modificado_Por = :modificado_por WHERE ID = :id");

        foreach ($ids as $id) {
            $idInt = (int)$id;

            if ($idInt <= 0) {
                continue;
            }

            // Verificar si existe la categoría
            $stmtVerificar->execute([':id' => $idInt]);
            $categoria = $stmtVerificar->fetch(PDO::FETCH_ASSOC);

            if (!$categoria) {
                $failed[] = [
                    "id"     => $idInt,
                    "nombre" => "Categoría ID: $idInt",
                    "reason" => "La categoría solicitada no existe."
                ];
                continue;
            }

            // Validar si ya se encuentra deshabilitada
            if ((int)$categoria['Habilitado'] === 0) {
                $failed[] = [
                    "id"     => $idInt,
                    "nombre" => $categoria['Nombre'] ?? 'Desconocida',
                    "reason" => "La categoría ya se encuentra deshabilitada."
                ];
                continue;
            }

            // REGLA DE NEGOCIO: Validar si tiene productos asociados en la tabla 'productos'
            $stmtVerificarProductos->execute([':id_categoria' => $idInt]);
            $resultadoProd = $stmtVerificarProductos->fetch(PDO::FETCH_ASSOC);
            $totalProductos = intval($resultadoProd['total'] ?? 0);

            if ($totalProductos > 0) {
                $failed[] = [
                    "id"     => $idInt,
                    "nombre" => $categoria['Nombre'] ?? 'Desconocida',
                    "reason" => "No se puede deshabilitar porque tiene {$totalProductos} producto(s) asociado(s)."
                ];
                continue;
            }

            $nombreCategoria = $categoria['Nombre'] ?? 'Desconocida';

            // Ejecutar la desactivación lógica (Habilitado = 0)
            $stmtDeshabilitar->execute([
                ':modificado_por' => $usuarioId,
                ':id'             => $idInt
            ]);

            // Registrar en la bitácora de auditoría
            if (function_exists('RegistrarBitacoraAccion')) {
                RegistrarBitacoraAccion(
                    $usuarioId,
                    $sesionId,
                    'CATEGORIAS',
                    'DESHABILITAR',
                    $idInt,
                    "Deshabilitación de la categoría '{$nombreCategoria}'.",
                    $categoria,
                    ['id' => $idInt, 'nombre' => $nombreCategoria]
                );
            }

            $processed[] = [
                "id"     => $idInt,
                "nombre" => $nombreCategoria
            ];
        }

        $pdo->commit();

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

        JsonResponse::success("Proceso de deshabilitación completado.", $dataRespuesta, 200);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al deshabilitar categorías: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error inesperado al procesar la deshabilitación: ' . strtolower($e->getMessage()), null, 500);
    }
}

function Exportar_Categorias($datos)
{
    $formato   = $datos['formato'] ?? 'csv';
    $seleccion = $datos['seleccion'] ?? [];

    $sql = "SELECT ID, Nombre, Habilitado, Fecha_Registro, Ultima_Actualizacion 
            FROM categorias";
    
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
        'Listado de Categorías', 
        'categorias_reporte'    
    );
}

function Importar_Categorias(array $datosCrudos = []): void {
    try {
        // 1. Asegurar sesión activa
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener conexión PDO
        $pdo = Conexion();

        // 3. Validar sesión e ID de usuario
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa para realizar esta acción.', null, 401);
            return;
        }

        // 4. Validar permiso para crear/importar categorías
        if (!TienePermiso($pdo, 'crear_categorias') && !TienePermiso($pdo, 'editar_categorias')) {
            JsonResponse::error('No cuentas con los permisos necesarios para importar categorías.', null, 403);
            return;
        }

        // 5. Validar archivo subido (soporta input name 'archivo' o 'file')
        $archivo = $_FILES['archivo'] ?? ($_FILES['file'] ?? null);
        if (!$archivo || $archivo['error'] !== UPLOAD_ERR_OK) {
            JsonResponse::error('No se recibió ningún archivo válido o ocurrió un error al subirlo.', null, 400);
            return;
        }

        $rutaTemporal = $archivo['tmp_name'];
        $nombreOriginal = $archivo['name'] ?? '';
        $extension = strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION));

        if (!in_array($extension, ['xlsx', 'xls', 'csv'])) {
            JsonResponse::error('Formato de archivo no soportado. Por favor sube un archivo .xlsx o .csv.', null, 400);
            return;
        }

        // 6. Leer filas del archivo (omitiendo fila 1 de título y fila 2 de subencabezado)
        $filasCrudas = [];

        if ($extension === 'csv') {
            if (($handle = fopen($rutaTemporal, 'r')) !== false) {
                $numFila = 0;
                while (($data = fgetcsv($handle, 2000, ',')) !== false) {
                    $numFila++;
                    if ($numFila <= 2) continue; // Saltar fila 1 y fila 2
                    $filasCrudas[] = [
                        'fila' => $numFila,
                        'cols' => $data
                    ];
                }
                fclose($handle);
            }
        } else {
            // Lectura nativa con PhpSpreadsheet para .xlsx / .xls
            if (!class_exists('\PhpOffice\PhpSpreadsheet\IOFactory')) {
                JsonResponse::error('La librería PhpSpreadsheet no está cargada en el servidor.', null, 500);
                return;
            }

            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($rutaTemporal);
            // Buscar específicamente la pestaña 'Plantilla Importación' o tomar la segunda/activa
            $hoja = $spreadsheet->getSheetByName('Plantilla Importación');
            if (!$hoja) {
                $hoja = ($spreadsheet->getSheetCount() > 1) ? $spreadsheet->getSheet(1) : $spreadsheet->getActiveSheet();
            }

            $highestRow = $hoja->getHighestDataRow();
            for ($r = 3; $r <= $highestRow; $r++) {
                $colA = $hoja->getCell("A{$r}")->getValue();
                $colB = $hoja->getCell("B{$r}")->getValue();
                $colC = $hoja->getCell("C{$r}")->getValue();

                $filasCrudas[] = [
                    'fila' => $r,
                    'cols' => [$colA, $colB, $colC]
                ];
            }
        }

        if (empty($filasCrudas)) {
            JsonResponse::error('El archivo no contiene registros para importar a partir de la fila 3.', null, 400);
            return;
        }

        // 7. Configuración de validaciones según esquema de BD
        $tiposPermitidos = ['texto', 'numero', 'peso', 'volumen', 'longitud', 'seleccion', 'color', 'booleano'];
        
        $processed = [];
        $failed = [];
        $cacheCategorias = []; // Cache en memoria: ['nombre_en_minusculas' => ID]

        $pdo->beginTransaction();

        // Sentencias preparadas
        $stmtBuscarCat = $pdo->prepare("SELECT ID, Nombre FROM categorias WHERE LOWER(TRIM(Nombre)) = LOWER(TRIM(:nombre)) LIMIT 1");
        $stmtInsertCat = $pdo->prepare("INSERT INTO categorias (Nombre, Habilitado, Fecha_Registro, Registrado_Por) VALUES (:nombre, 1, NOW(), :usuario_id)");
        
        $stmtBuscarAttr = $pdo->prepare("SELECT ID FROM categoria_atributos WHERE ID_Categoria = :id_cat AND LOWER(TRIM(Nombre_Atributo)) = LOWER(TRIM(:nombre_attr)) LIMIT 1");
        $stmtInsertAttr = $pdo->prepare("INSERT INTO categoria_atributos (ID_Categoria, Nombre_Atributo, Tipo_Dato, Fecha_Creacion, Creado_Por) VALUES (:id_cat, :nombre_attr, :tipo_dato, NOW(), :usuario_id)");

        foreach ($filasCrudas as $item) {
            $numFila = $item['fila'];
            $cols    = $item['cols'];

            $nombreCategoria = trim((string)($cols[0] ?? ''));
            $nombreAtributo  = trim((string)($cols[1] ?? ''));
            $tipoDato        = strtolower(trim((string)($cols[2] ?? '')));

            // Ignorar filas completamente vacías (por ejemplo, filas preformateadas sin datos)
            if ($nombreCategoria === '' && $nombreAtributo === '' && $tipoDato === '') {
                continue;
            }

            // Validar obligatoriedad y longitud de Categoría
            if ($nombreCategoria === '') {
                $failed[] = [
                    "fila"   => $numFila,
                    "nombre" => "Fila #{$numFila}",
                    "reason" => "El 'Nombre Categoría' es obligatorio."
                ];
                continue;
            }

            if (mb_strlen($nombreCategoria) > 150) {
                $failed[] = [
                    "fila"   => $numFila,
                    "nombre" => $nombreCategoria,
                    "reason" => "El nombre de la categoría excede los 150 caracteres permitidos."
                ];
                continue;
            }

            // Validar coherencia entre Nombre del Atributo y Tipo de Dato
            if ($nombreAtributo !== '' && $tipoDato === '') {
                $failed[] = [
                    "fila"   => $numFila,
                    "nombre" => "{$nombreCategoria} -> {$nombreAtributo}",
                    "reason" => "Debe seleccionar un 'Tipo de Dato' para el atributo '{$nombreAtributo}'."
                ];
                continue;
            }

            if ($nombreAtributo === '' && $tipoDato !== '') {
                $failed[] = [
                    "fila"   => $numFila,
                    "nombre" => $nombreCategoria,
                    "reason" => "Se indicó un Tipo de Dato ('{$tipoDato}') pero falta el 'Nombre del Atributo'."
                ];
                continue;
            }

            if ($nombreAtributo !== '' && mb_strlen($nombreAtributo) > 100) {
                $failed[] = [
                    "fila"   => $numFila,
                    "nombre" => "{$nombreCategoria} -> {$nombreAtributo}",
                    "reason" => "El nombre del atributo excede los 100 caracteres permitidos."
                ];
                continue;
            }

            if ($tipoDato !== '' && !in_array($tipoDato, $tiposPermitidos, true)) {
                $failed[] = [
                    "fila"   => $numFila,
                    "nombre" => "{$nombreCategoria} -> {$nombreAtributo}",
                    "reason" => "Tipo de dato '{$tipoDato}' inválido. Permitidos: " . implode(', ', $tiposPermitidos) . "."
                ];
                continue;
            }

            // 8. Obtener o crear la Categoría (evitando duplicados en múltiples filas)
            $claveCache = mb_strtolower($nombreCategoria);
            $categoriaNueva = false;

            if (isset($cacheCategorias[$claveCache])) {
                $idCategoria = $cacheCategorias[$claveCache];
            } else {
                $stmtBuscarCat->execute([':nombre' => $nombreCategoria]);
                $catExistente = $stmtBuscarCat->fetch(PDO::FETCH_ASSOC);

                if ($catExistente) {
                    $idCategoria = (int)$catExistente['ID'];
                } else {
                    $stmtInsertCat->execute([
                        ':nombre'     => $nombreCategoria,
                        ':usuario_id' => $usuarioId
                    ]);
                    $idCategoria = (int)$pdo->lastInsertId();
                    $categoriaNueva = true;
                }
                $cacheCategorias[$claveCache] = $idCategoria;
            }

            // 9. Si la fila no trae atributo, solo registramos la categoría (si fue nueva)
            if ($nombreAtributo === '') {
                if ($categoriaNueva) {
                    $processed[] = [
                        "id"     => $idCategoria,
                        "fila"   => $numFila,
                        "nombre" => "{$nombreCategoria} (Sin atributos)"
                    ];
                } else {
                    $failed[] = [
                        "fila"   => $numFila,
                        "nombre" => $nombreCategoria,
                        "reason" => "La categoría ya existía y no se especificó ningún atributo nuevo en esta fila."
                    ];
                }
                continue;
            }

            // 10. Verificar que el atributo no esté ya registrado en esa categoría
            $stmtBuscarAttr->execute([
                ':id_cat'      => $idCategoria,
                ':nombre_attr' => $nombreAtributo
            ]);

            if ($stmtBuscarAttr->fetch(PDO::FETCH_ASSOC)) {
                $failed[] = [
                    "fila"   => $numFila,
                    "nombre" => "{$nombreCategoria} → {$nombreAtributo}",
                    "reason" => "El atributo '{$nombreAtributo}' ya existe dentro de la categoría '{$nombreCategoria}'."
                ];
                continue;
            }

            // Insertar el atributo en categoria_atributos
            $stmtInsertAttr->execute([
                ':id_cat'      => $idCategoria,
                ':nombre_attr' => $nombreAtributo,
                ':tipo_dato'   => $tipoDato,
                ':usuario_id'  => $usuarioId
            ]);

            $processed[] = [
                "id"     => $idCategoria,
                "fila"   => $numFila,
                "nombre" => "{$nombreCategoria} → {$nombreAtributo} ({$tipoDato})"
            ];
        }

        // 11. Registrar en bitácora si hubo al menos un registro procesado
        if (count($processed) > 0 && function_exists('RegistrarBitacoraAccion')) {
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'CATEGORIAS',
                'IMPORTAR_MASIVO',
                0,
                "Importación masiva de categorías/atributos desde archivo '{$nombreOriginal}'. Procesados: " . count($processed) . ", Omitidos/Errores: " . count($failed) . ".",
                null,
                ['archivo' => $nombreOriginal, 'procesados' => count($processed), 'fallidos' => count($failed)]
            );
        }

        $pdo->commit();

        // 12. Respuesta estandarizada para Procesar_Resumen en Frontend
        $totalProcesados = count($processed);
        $totalFallidos   = count($failed);
        $totalGeneral    = $totalProcesados + $totalFallidos;

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

        JsonResponse::success("Importación de categorías finalizada.", $dataRespuesta, 200);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico en Importar_Categorias: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error inesperado al importar las categorías: ' . $e->getMessage(), null, 500);
    }
}