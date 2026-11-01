<?php

function Obtener_Archivos_Biblioteca(array $datos): void
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $pdo = Conexion();

        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
            return;
        }

        if (!TienePermiso($pdo, 'ver_biblioteca')) {
            JsonResponse::error('No cuentas con los permisos necesarios para ver la biblioteca.', null, 403);
            return;
        }

        // Verificar si el usuario tiene permiso para ver los usuarios asignados
        $puedeVerAsignaciones = TienePermiso($pdo, 'asignar_usuarios_biblioteca');

        $limite = isset($datos['limite']) ? max(1, min(100, (int)$datos['limite'])) : 20;
        $offset = isset($datos['offset']) ? max(0, (int)$datos['offset']) : 0;
        
        // Capturar parámetros de búsqueda y filtros
        $busqueda = trim($datos['buscar'] ?? ($datos['busqueda'] ?? ''));
        $tipoArchivo = $datos['tipo_archivo'] ?? [];
        $fechaModificacion = trim($datos['fecha_modificacion'] ?? '');

        // Por defecto activamos la inclusión del blob en base64 para que la vista previa funcione
        $incluirBlob = isset($datos['incluir_blob']) ? (bool)$datos['incluir_blob'] : true;

        // Lógica de acceso: Archivos no eliminados Y (sin registros en asignaciones [para todos] O asignados al usuario actual)
        $sqlWhere = "WHERE a.eliminado = 0 AND (NOT EXISTS (SELECT 1 FROM biblioteca_archivo_usuarios bau_sub WHERE bau_sub.archivo_id = a.id) OR EXISTS (SELECT 1 FROM biblioteca_archivo_usuarios bau_sub2 WHERE bau_sub2.archivo_id = a.id AND bau_sub2.usuario_id = :usuario_id_acceso))";
        
        $params = [
            ':usuario_id_acceso' => $usuarioId
        ];

        // 1. Filtro de búsqueda por nombre
        if (!empty($busqueda)) {
            $sqlWhere .= " AND a.nombre_original LIKE :busqueda";
            $params[':busqueda'] = "%{$busqueda}%";
        }

        // 2. Filtro dinámico de Tipo de Archivo (admite múltiples seleccionados)
        if (!empty($tipoArchivo)) {
            if (is_string($tipoArchivo)) {
                $tipoArchivo = [$tipoArchivo];
            }
            
            $sqlWhere .= " AND (";
            foreach ($tipoArchivo as $index => $tipo) {
                $prefijoOr = ($index > 0) ? " OR " : "";
                if ($tipo === 'imagen') {
                    $sqlWhere .= "{$prefijoOr}(a.extension IN ('png', 'jpg', 'jpeg', 'webp', 'gif'))";
                } elseif ($tipo === 'pdf') {
                    $sqlWhere .= "{$prefijoOr}(a.extension = 'pdf')";
                } elseif ($tipo === 'audio') {
                    $sqlWhere .= "{$prefijoOr}(a.extension IN ('mp3', 'wav', 'ogg', 'm4a', 'aac'))";
                } elseif ($tipo === 'video') {
                    $sqlWhere .= "{$prefijoOr}(a.extension IN ('mp4', 'webm', 'mov'))";
                } elseif ($tipo === 'otro') {
                    $sqlWhere .= "{$prefijoOr}(a.extension NOT IN ('png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf', 'mp3', 'wav', 'ogg', 'm4a', 'aac', 'mp4', 'webm', 'mov'))";
                }
            }
            $sqlWhere .= ")";
        }

        // 3. Filtro de Fecha de Modificación
        if (!empty($fechaModificacion)) {
            $campoFecha = "COALESCE(a.actualizado_en, a.creado_en)";
            if ($fechaModificacion === 'hoy') {
                $sqlWhere .= " AND DATE({$campoFecha}) = CURDATE()";
            } elseif ($fechaModificacion === 'ayer') {
                $sqlWhere .= " AND DATE({$campoFecha}) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
            } elseif ($fechaModificacion === 'ultimos_7_dias') {
                $sqlWhere .= " AND {$campoFecha} >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            } elseif ($fechaModificacion === 'ultimos_30_dias') {
                $sqlWhere .= " AND {$campoFecha} >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            } elseif ($fechaModificacion === 'antiguos') {
                $sqlWhere .= " AND {$campoFecha} < DATE_SUB(NOW(), INTERVAL 30 DAY)";
            }
        }

        // Si tiene permiso, usamos GROUP_CONCAT para obtener los IDs de los usuarios asignados
        $columnasAsignados = $puedeVerAsignaciones 
            ? ", (SELECT GROUP_CONCAT(bau_list.usuario_id) FROM biblioteca_archivo_usuarios bau_list WHERE bau_list.archivo_id = a.id) AS usuarios_asignados" 
            : "";

        $sql = "SELECT 
                    a.id,
                    a.nombre_original,
                    a.nombre_sistema,
                    a.extension,
                    a.tipo_mime,
                    a.tamano_bytes,
                    a.ruta_almacenamiento,
                    a.carpeta_id,
                    a.subido_por,
                    a.creado_en,
                    a.actualizado_en,
                    l.ultima_vez_abierto
                    {$columnasAsignados}
                FROM biblioteca_archivos a
                LEFT JOIN biblioteca_archivo_usuario_lectura l 
                    ON a.id = l.archivo_id AND l.usuario_id = :usuario_id_lectura
                {$sqlWhere}
                ORDER BY l.ultima_vez_abierto DESC, a.creado_en DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':usuario_id_lectura', $usuarioId, PDO::PARAM_INT);

        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val, PDO::PARAM_INT);
        }

        $stmt->execute();
        $todosLosArchivos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Validación de existencia física, formateo de fechas y mapeo de datos
        $archivosValidados = [];
        foreach ($todosLosArchivos as $archivo) {
            $rutaFisica = __DIR__ . '/../../../' . ltrim($archivo['ruta_almacenamiento'], '/');

            if (file_exists($rutaFisica)) {
                $archivo['blob'] = null;

                // Límite de 25MB en una sola línea
                $limiteTamanioBytes = 25 * 1024 * 1024; 

                if ($incluirBlob && filesize($rutaFisica) <= $limiteTamanioBytes) {
                    $contenidoBinario = @file_get_contents($rutaFisica);
                    if ($contenidoBinario !== false) {
                        $mime = $archivo['tipo_mime'];
                        if (empty($mime) || $mime === 'application/octet-stream') {
                            $ext = strtolower($archivo['extension']);
                            $mimesMap = [
                                'mp3' => 'audio/mpeg',
                                'wav' => 'audio/wav',
                                'ogg' => 'audio/ogg',
                                'm4a' => 'audio/mp4',
                                'aac' => 'audio/aac',
                                'mp4' => 'video/mp4',
                                'webm' => 'video/webm'
                            ];
                            $mime = $mimesMap[$ext] ?? 'application/octet-stream';
                        }

                        $archivo['blob'] = 'data:' . $mime . ';base64,' . base64_encode($contenidoBinario);
                    }
                }

                // Si tiene el campo de asignados y no es nulo, lo convertimos a un array de enteros
                if ($puedeVerAsignaciones) {
                    if (!empty($archivo['usuarios_asignados'])) {
                        $archivo['usuarios_asignados'] = array_map('intval', explode(',', $archivo['usuarios_asignados']));
                    } else {
                        $archivo['usuarios_asignados'] = []; 
                    }
                }

                // Formatear las fechas usando FormatearFechaEspanol
                $archivo['creado_en_formato'] = !empty($archivo['creado_en']) ? FormatearFechaEspanol($archivo['creado_en'], false, true) : '';
                $archivo['actualizado_en_formato'] = !empty($archivo['actualizado_en']) ? FormatearFechaEspanol($archivo['actualizado_en'], false, true) : '';

                $archivosValidados[] = $archivo;
            }
        }

        $totalRegistrosValidos = count($archivosValidados);

        // Aplicamos la paginación sobre los archivos reales y válidos
        $archivosPaginados = array_slice($archivosValidados, $offset, $limite);

        JsonResponse::success('Archivos obtenidos correctamente.', [
            'archivos' => $archivosPaginados,
            'datos' => $datos,
            'paginacion' => [
                'total' => $totalRegistrosValidos,
                'limite' => $limite,
                'offset' => $offset,
                'siguiente_offset' => $offset + count($archivosPaginados),
                'tiene_mas' => ($offset + count($archivosPaginados)) < $totalRegistrosValidos
            ]
        ]);
    } catch (PDOException $e) {
        error_log("Error de BD al obtener la biblioteca: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);
    } catch (Throwable $e) {
        error_log("Error crítico al procesar la biblioteca: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}
function Subir_Archivos_Biblioteca()
{
    $pdo = Conexion();
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $uid_sesion = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? null));
        if (!$uid_sesion) {
            JsonResponse::error("Sesión expirada o no válida.", null, 401);
            return;
        }

        // Validar permisos de gestión
        if (!TienePermiso($pdo, 'gestionar_biblioteca')) {
            JsonResponse::error("No cuentas con los permisos necesarios para subir archivos.", null, 403);
            return;
        }

        $subaccion = $_POST['subaccion'] ?? 'ninguna';
        $directorioDestino = '../../../uploads/biblioteca/';

        if (!is_dir($directorioDestino)) {
            mkdir($directorioDestino, 0755, true);
        }

        if (!isset($_FILES['files']) || empty($_FILES['files']['name'][0])) {
            JsonResponse::error("No se han seleccionado archivos para subir.", null, 400);
            return;
        }

        // 1. Fase de Detección: Identificar conflictos por nombre original activo
        $conflictos = [];
        foreach ($_FILES['files']['name'] as $nombreOriginal) {
            $sqlCheck = "SELECT id FROM biblioteca_archivos WHERE nombre_original = ? AND eliminado = 0 LIMIT 1";
            $stmtCheck = $pdo->prepare($sqlCheck);
            $stmtCheck->execute([$nombreOriginal]);
            if ($stmtCheck->fetch()) {
                $conflictos[] = $nombreOriginal;
            }
        }

        // Si hay conflictos y no se ha especificado una subacción, retornar 409 Conflict
        if (!empty($conflictos) && $subaccion === 'ninguna') {
            JsonResponse::error("Conflicto detectado: Existen archivos con el mismo nombre.", [
                'duplicados' => $conflictos,
                'cantidad' => count($conflictos)
            ], 409);
            return;
        }

        // 2. Fase de Ejecución con Transacción de Base de Datos
        $pdo->beginTransaction();
        $resultados = [];

        foreach ($_FILES['files']['name'] as $index => $nombreOriginal) {
            if ($_FILES['files']['error'][$index] !== UPLOAD_ERR_OK) {
                continue;
            }

            $nombreFinal = $nombreOriginal;
            $idExistente = null;
            $nombreServidorViejo = null;

            // --- Lógica de Manejo de Duplicados ---
            if ($subaccion === 'sobreescribir') {
                // Buscar si existe el registro activo para actualizarlo en lugar de insertar uno nuevo
                $sqlBusqueda = "SELECT id, nombre_sistema FROM biblioteca_archivos WHERE nombre_original = ? AND eliminado = 0 LIMIT 1";
                $stmtBusqueda = $pdo->prepare($sqlBusqueda);
                $stmtBusqueda->execute([$nombreOriginal]);
                $archivoPrevio = $stmtBusqueda->fetch(PDO::FETCH_ASSOC);

                if ($archivoPrevio) {
                    $idExistente = $archivoPrevio['id'];
                    $nombreServidorViejo = $archivoPrevio['nombre_sistema'];
                }
            } elseif ($subaccion === 'copia') {
                $info = pathinfo($nombreOriginal);
                $baseName = $info['filename'];
                $ext = isset($info['extension']) ? '.' . $info['extension'] : '';

                // Obtener nombres existentes con formato de copia (ej. "archivo (1).pdf")
                $sqlMax = "SELECT nombre_original FROM biblioteca_archivos 
                           WHERE nombre_original REGEXP ? AND eliminado = 0";
                $regex = '^' . preg_quote($baseName, '/') . ' \([0-9]+\)' . preg_quote($ext, '/') . '$';

                $stmtMax = $pdo->prepare($sqlMax);
                $stmtMax->execute([$regex]);
                $copias = $stmtMax->fetchAll(PDO::FETCH_COLUMN);

                $nuevoNumero = 1;
                if (!empty($copias)) {
                    $numeros = [];
                    foreach ($copias as $nombre) {
                        preg_match('/ \(([0-9]+)\)' . preg_quote($ext, '/') . '$/', $nombre, $m);
                        if (isset($m[1])) {
                            $numeros[] = (int)$m[1];
                        }
                    }
                    $nuevoNumero = !empty($numeros) ? max($numeros) + 1 : 1;
                }
                $nombreFinal = $baseName . ' (' . $nuevoNumero . ')' . $ext;
            }

            // --- Proceso de Almacenamiento Físico ---
            $ext = pathinfo($nombreFinal, PATHINFO_EXTENSION);
            $nombreServidor = uniqid('bib_', true) . '.' . strtolower($ext);
            $rutaRelativa = 'uploads/biblioteca/' . $nombreServidor;
            $rutaCompleta = $directorioDestino . $nombreServidor;

            if (move_uploaded_file($_FILES['files']['tmp_name'][$index], $rutaCompleta)) {
                
                // Si es sobreescritura y encontramos el registro previo, ACTUALIZAMOS
                if ($idExistente) {
                    // Borrar físicamente el archivo viejo del servidor si existe
                    if ($nombreServidorViejo && file_exists($directorioDestino . $nombreServidorViejo)) {
                        @unlink($directorioDestino . $nombreServidorViejo);
                    }

                    $sqlUpdate = "UPDATE biblioteca_archivos SET 
                                    nombre_sistema = ?, 
                                    extension = ?, 
                                    tipo_mime = ?, 
                                    tamano_bytes = ?, 
                                    ruta_almacenamiento = ?, 
                                    subido_por = ?,
                                    actualizado_en = NOW() 
                                  WHERE id = ?";

                    $stmtUpdate = $pdo->prepare($sqlUpdate);
                    $stmtUpdate->execute([
                        $nombreServidor,
                        strtolower($ext),
                        $_FILES['files']['type'][$index] ?? 'application/octet-stream',
                        $_FILES['files']['size'][$index],
                        $rutaRelativa,
                        $uid_sesion,
                        $idExistente
                    ]);

                    $resultados[] = [
                        'id' => $idExistente,
                        'nombre_original' => $nombreFinal,
                        'nombre_sistema' => $nombreServidor
                    ];
                } else {
                    // Si es nuevo o copia, INSERTAMOS un registro nuevo
                    $sqlInsert = "INSERT INTO biblioteca_archivos (
                        nombre_original, nombre_sistema, extension, tipo_mime, 
                        tamano_bytes, ruta_almacenamiento, eliminado, subido_por
                    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)";

                    $stmtInsert = $pdo->prepare($sqlInsert);
                    $stmtInsert->execute([
                        $nombreFinal,
                        $nombreServidor,
                        strtolower($ext),
                        $_FILES['files']['type'][$index] ?? 'application/octet-stream',
                        $_FILES['files']['size'][$index],
                        $rutaRelativa,
                        $uid_sesion
                    ]);

                    $resultados[] = [
                        'id' => $pdo->lastInsertId(),
                        'nombre_original' => $nombreFinal,
                        'nombre_sistema' => $nombreServidor
                    ];
                }
            }
        }

        $pdo->commit();
        JsonResponse::success("Archivos subidos y procesados correctamente.", $resultados);
    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error al subir archivos a la biblioteca: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Error interno al procesar la subida de archivos.', null, 500);
    }
}

function Obtener_Tipos_Archivos_Biblioteca(): void
{
    try {
        $sql = "SELECT DISTINCT 
                    extension AS id, 
                    UPPER(extension) AS texto 
                FROM biblioteca_archivos 
                WHERE eliminado = 0 
                ORDER BY extension ASC";

        // Delegamos la ejecución a nuestro helper robusto Consultar_PDO
        $tiposArchivos = Consultar_PDO($sql);

        // Verificamos que el resultado sea un arreglo válido
        if (!is_array($tiposArchivos)) {
            JsonResponse::error("No se pudo obtener el listado de tipos de archivos.", null, 500);
            return;
        }

        // Retornamos la respuesta estandarizada con éxito
        JsonResponse::success("Tipos de archivos obtenidos correctamente", $tiposArchivos);

    } catch (Throwable $e) {
        // Registramos el error internamente y respondemos con error controlado
        error_log("Error crítico al obtener tipos de archivos de la biblioteca: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al consultar los tipos de archivos.", null, 500);
    }
}

/**
 * Registra o actualiza la fecha/hora en que un usuario abrió un archivo de la biblioteca.
 * 
 * @param array $datos Arreglo que debe contener al menos 'archivo_id'.
 * @return void
 */
function Registrar_Apertura_Documento_Biblioteca(array $datos): void {
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

        if (!TienePermiso($pdo, 'ver_biblioteca')) {
            JsonResponse::error('No cuentas con los permisos necesarios para acceder a los archivos de la biblioteca.', null, 403);
        }

        // 4. Capturar la IP de origen del cliente de forma segura (para auditoría o logs)
        $ipOrigen = $_SERVER['HTTP_CLIENT_IP'] 
                    ?? ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null);
        if ($ipOrigen === '::1') {
            $ipOrigen = '127.0.0.1';
        }

        // 5. Extraer y validar el ID del archivo enviado
        $archivoId = isset($datos['archivo_id']) ? (int)$datos['archivo_id'] : 0;

        if ($archivoId <= 0) {
            JsonResponse::error('El identificador del archivo no es válido.', null, 400);
        }

        // 6. Validar previamente que el archivo exista en la base de datos
        $stmtCheck = $pdo->prepare("SELECT id, nombre_original FROM biblioteca_archivos WHERE id = :id LIMIT 1");
        $stmtCheck->execute([':id' => $archivoId]);
        $archivo = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$archivo) {
            JsonResponse::error('El archivo solicitado no existe o fue eliminado.', null, 404);
        }

        // Iniciamos transacción para asegurar consistencia
        $pdo->beginTransaction();

        // 7. Insertar o actualizar el registro de lectura usando el índice único (archivo_id, usuario_id)
        $sql = "INSERT INTO biblioteca_archivo_usuario_lectura (archivo_id, usuario_id, ultima_vez_abierto) 
                VALUES (:archivo_id, :usuario_id, CURRENT_TIMESTAMP) 
                ON DUPLICATE KEY UPDATE 
                ultima_vez_abierto = CURRENT_TIMESTAMP";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':archivo_id' => $archivoId,
            ':usuario_id' => (int)$usuarioId
        ]);

        // 8. Registro centralizado opcional en bitácora y auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'BIBLIOTECA_ARCHIVOS',
            'LECTURA',
            $archivoId,
            "El usuario abrió el documento: '{$archivo['nombre_original']}' (IP: {$ipOrigen}).",
            null,
            ['archivo_id' => $archivoId]
        );

        $pdo->commit();

        JsonResponse::success('Apertura de documento registrada exitosamente.', [
            'archivo_id' => $archivoId
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al registrar lectura de archivo en biblioteca: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al procesar la apertura del documento: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

/**
 * Elimina un archivo de la biblioteca (borrado lógico o físico).
 * 
 * @param array $datos Arreglo que debe contener al menos 'archivo_id'.
 * @return void
 */
function Eliminar_Archivo_Biblioteca(array $datos): void {
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener la instancia única de PDO mediante tu función Conexion()
        $pdo = Conexion();

        // 3. Validar que exista una sesión de usuario activa y obtener su ID y Sesión ID
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
            return;
        }

        // Validar permisos (ajusta el nombre del permiso según tu rol o lógica)
        if (!TienePermiso($pdo, 'gestionar_biblioteca') && !TienePermiso($pdo, 'eliminar_archivos_biblioteca')) {
            JsonResponse::error('No cuentas con los permisos necesarios para eliminar archivos de la biblioteca.', null, 403);
            return;
        }

        // 4. Extraer y validar el ID del archivo enviado
        $archivoId = isset($datos['archivo_id']) ? (int)$datos['archivo_id'] : 0;

        if ($archivoId <= 0) {
            JsonResponse::error('El identificador del archivo no es válido.', null, 400);
            return;
        }

        // 5. Buscar el archivo en la base de datos para obtener su ruta física
        $stmtCheck = $pdo->prepare("SELECT id, nombre_original, ruta_almacenamiento FROM biblioteca_archivos WHERE id = :id LIMIT 1");
        $stmtCheck->execute([':id' => $archivoId]);
        $archivo = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$archivo) {
            JsonResponse::error('El archivo solicitado no existe o ya fue eliminado.', null, 404);
            return;
        }

        // Iniciamos transacción para asegurar consistencia
        $pdo->beginTransaction();

        // OPCIÓN A: Borrado Lógico (Recomendado para mantener integridad en auditorías)
        // Actualizamos la columna `eliminado = 1`
        $sql = "UPDATE biblioteca_archivos SET eliminado = 1, actualizado_en = CURRENT_TIMESTAMP WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $archivoId]);

        /* 
         * OPCIÓN B: Si prefieres borrado físico total de la BD en lugar de lógico, descomenta la siguiente línea:
         * $stmt = $pdo->prepare("DELETE FROM biblioteca_archivos WHERE id = :id");
         * $stmt->execute([':id' => $archivoId]);
         */

        // 6. Eliminar el archivo físico del servidor (Opcional, según tu requerimiento)
        $rutaFisica = __DIR__ . '/../../../' . ltrim($archivo['ruta_almacenamiento'], '/');
        if (file_exists($rutaFisica)) {
            @unlink($rutaFisica);
        }

        // 7. Registrar la acción en la bitácora del sistema
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'BIBLIOTECA_ARCHIVOS',
            'ELIMINAR',
            $archivoId,
            "Se eliminó el documento: '{$archivo['nombre_original']}' (ID: {$archivoId}).",
            null,
            ['archivo_id' => $archivoId]
        );

        $pdo->commit();

        JsonResponse::success('Archivo eliminado exitosamente.', [
            'archivo_id' => $archivoId
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al eliminar archivo de la biblioteca: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al eliminar el archivo: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

/**
 * Crea una copia física y un nuevo registro en la base de datos de un archivo de la biblioteca.
 * 
 * @param array $datos Arreglo que debe contener al menos 'archivo_id'.
 * @return void
 */
function Crear_Copia_Archivo_Biblioteca(array $datos): void {
    try {
        // 1. Asegurar sesión activa
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

        // Validar permisos necesarios
        if (!TienePermiso($pdo, 'gestionar_biblioteca')) {
            JsonResponse::error('No cuentas con los permisos necesarios para duplicar archivos en la biblioteca.', null, 403);
            return;
        }

        // 2. Extraer y validar el ID del archivo original
        $archivoId = isset($datos['archivo_id']) ? (int)$datos['archivo_id'] : 0;

        if ($archivoId <= 0) {
            JsonResponse::error('El identificador del archivo no es válido.', null, 400);
            return;
        }

        // 3. Buscar el archivo original en la base de datos
        $stmt = $pdo->prepare("SELECT * FROM biblioteca_archivos WHERE id = :id AND eliminado = 0 LIMIT 1");
        $stmt->execute([':id' => $archivoId]);
        $original = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$original) {
            JsonResponse::error('El archivo original no existe o fue eliminado.', null, 404);
            return;
        }

        // 4. Verificar que el archivo físico exista en el servidor
        $rutaOriginalFisica = __DIR__ . '/../../../' . ltrim($original['ruta_almacenamiento'], '/');
        if (!file_exists($rutaOriginalFisica)) {
            JsonResponse::error('El archivo físico no se encuentra en el servidor.', null, 404);
            return;
        }

        // Iniciamos transacción para asegurar consistencia entre disco y base de datos
        $pdo->beginTransaction();

        // 5. Preparar nombres y rutas para la copia
        $extension = $original['extension'];
        $nombreBase = pathinfo($original['nombre_original'], PATHINFO_FILENAME);
        $nuevoNombreOriginal = "Copia de " . $nombreBase . ($extension ? '.' . $extension : '');

        $directorioRelativo = dirname($original['ruta_almacenamiento']);
        $directorioFisico = __DIR__ . '/../../../' . ltrim($directorioRelativo, '/');

        if (!is_dir($directorioFisico)) {
            mkdir($directorioFisico, 0755, true);
        }

        $nuevoNombreSistema = uniqid('doc_copia_', true) . ($extension ? '.' . $extension : '');
        $nuevaRutaRelativa = rtrim($directorioRelativo, '/') . '/' . $nuevoNombreSistema;
        $nuevaRutaFisica = $directorioFisico . '/' . $nuevoNombreSistema;

        // 6. Duplicar el archivo físico en el servidor
        if (!copy($rutaOriginalFisica, $nuevaRutaFisica)) {
            throw new Exception('No se pudo duplicar el archivo físico en el servidor.');
        }

        // 7. Insertar el nuevo registro en la base de datos
        $sqlInsert = "INSERT INTO biblioteca_archivos (
            nombre_original, nombre_sistema, extension, tipo_mime, 
            tamano_bytes, ruta_almacenamiento, carpeta_id, subido_por, creado_en, eliminado
        ) VALUES (
            :nombre_original, :nombre_sistema, :extension, :tipo_mime, 
            :tamano_bytes, :ruta_almacenamiento, :carpeta_id, :subido_por, CURRENT_TIMESTAMP, 0
        )";

        $stmtInsert = $pdo->prepare($sqlInsert);
        $stmtInsert->execute([
            ':nombre_original'     => $nuevoNombreOriginal,
            ':nombre_sistema'      => $nuevoNombreSistema,
            ':extension'           => $extension,
            ':tipo_mime'           => $original['tipo_mime'],
            ':tamano_bytes'        => $original['tamano_bytes'],
            ':ruta_almacenamiento' => $nuevaRutaRelativa,
            ':carpeta_id'          => $original['carpeta_id'],
            ':subido_por'          => $usuarioId
        ]);

        $nuevoArchivoId = $pdo->lastInsertId();

        // 8. Registrar la acción en la bitácora de auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'BIBLIOTECA_ARCHIVOS',
            'DUPLICAR',
            $nuevoArchivoId,
            "Se creó una copia del documento '{$original['nombre_original']}' (ID original: {$archivoId}) con el nombre '{$nuevoNombreOriginal}'.",
            null,
            ['archivo_origen_id' => $archivoId, 'nuevo_archivo_id' => $nuevoArchivoId]
        );

        $pdo->commit();

        // 9. Obtener el registro completo recién creado para retornarlo al cliente
        $stmtNuevo = $pdo->prepare("SELECT * FROM biblioteca_archivos WHERE id = :id LIMIT 1");
        $stmtNuevo->execute([':id' => $nuevoArchivoId]);
        $nuevoArchivo = $stmtNuevo->fetch(PDO::FETCH_ASSOC);

        JsonResponse::success('Copia del archivo creada exitosamente.', [
            'archivo' => $nuevoArchivo
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al duplicar archivo de la biblioteca: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al duplicar el archivo: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Eliminar_Multiples_Archivos_Biblioteca(array $datos): void {
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener la instancia única de PDO mediante tu función Conexion()
        $pdo = Conexion();

        // 3. Validar que exista una sesión de usuario activa y obtener su ID y Sesión ID
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
            return;
        }

        // Validar permisos
        if (!TienePermiso($pdo, 'gestionar_biblioteca')) {
            JsonResponse::error('No cuentas con los permisos necesarios para eliminar archivos de la biblioteca.', null, 403);
            return;
        }

        // 4. Extraer y validar el array de IDs de archivos enviado
        $idsRaw = $datos['ids'] ?? ($datos['archivo_ids'] ?? []);
        if (!is_array($idsRaw)) {
            // Permitir también si mandan un solo "archivo_id" por compatibilidad
            if (isset($datos['archivo_id'])) {
                $idsRaw = [$datos['archivo_id']];
            } else {
                $idsRaw = [];
            }
        }

        // Limpiar y asegurar que sean enteros válidos mayores a 0
        $ids = array_filter(array_map('intval', $idsRaw), function($id) {
            return $id > 0;
        });

        if (empty($ids)) {
            JsonResponse::error('No se seleccionaron archivos válidos para eliminar.', null, 400);
            return;
        }

        // 5. Buscar los archivos en la base de datos para obtener sus rutas físicas
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmtCheck = $pdo->prepare("SELECT id, nombre_original, ruta_almacenamiento FROM biblioteca_archivos WHERE id IN ($placeholders)");
        $stmtCheck->execute(array_values($ids));
        $archivos = $stmtCheck->fetchAll(PDO::FETCH_ASSOC);

        if (empty($archivos)) {
            JsonResponse::error('Los archivos solicitados no existen o ya fueron eliminados.', null, 404);
            return;
        }

        // Iniciamos transacción para asegurar consistencia
        $pdo->beginTransaction();

        // Extraer los IDs reales encontrados que sí existen en BD
        $idsExistentes = array_column($archivos, 'id');
        $placeholdersExistentes = implode(',', array_fill(0, count($idsExistentes), '?'));

        // OPCIÓN A: Borrado Lógico masivo
        $sql = "UPDATE biblioteca_archivos SET eliminado = 1, actualizado_en = CURRENT_TIMESTAMP WHERE id IN ($placeholdersExistentes)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($idsExistentes);

        /* 
         * OPCIÓN B: Borrado físico total de la BD (si lo prefieres, descomenta abajo):
         * $stmt = $pdo->prepare("DELETE FROM biblioteca_archivos WHERE id IN ($placeholdersExistentes)");
         * $stmt->execute($idsExistentes);
         */

        // 6. Eliminar los archivos físicos del servidor
        foreach ($archivos as $archivo) {
            if (!empty($archivo['ruta_almacenamiento'])) {
                $rutaFisica = __DIR__ . '/../../../' . ltrim($archivo['ruta_almacenamiento'], '/');
                if (file_exists($rutaFisica)) {
                    @unlink($rutaFisica);
                }
            }
        }

        // 7. Registrar la acción en la bitácora del sistema
        $totalEliminados = count($archivos);
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'BIBLIOTECA_ARCHIVOS',
            'ELIMINAR_MULTIPLES',
            null,
            "Se eliminaron {$totalEliminados} documentos de la biblioteca de forma masiva.",
            null,
            ['archivos_ids' => $idsExistentes]
        );

        $pdo->commit();

        JsonResponse::success("Se eliminaron {$totalEliminados} archivos exitosamente.", [
            'archivos_ids' => $idsExistentes
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al eliminar archivos de la biblioteca: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al eliminar los archivos: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Descargar_Archivo_Individual(array $datos): void {
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener la instancia única de PDO mediante tu función Conexion()
        $pdo = Conexion();

        // 3. Validar que exista una sesión de usuario activa y obtener su ID y Sesión ID
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
            return;
        }

        // Validar permisos
        if (!TienePermiso($pdo, 'gestionar_biblioteca') && !TienePermiso($pdo, 'descargar_archivos_biblioteca')) {
            JsonResponse::error('No cuentas con los permisos necesarios para descargar archivos de la biblioteca.', null, 403);
            return;
        }

        // 4. Extraer y validar el ID del archivo
        $archivoId = isset($datos['archivo_id']) ? (int)$datos['archivo_id'] : 0;
        if ($archivoId <= 0) {
            JsonResponse::error('El identificador del archivo no es válido.', null, 400);
            return;
        }

        // 5. Buscar el archivo en la base de datos
        $stmtCheck = $pdo->prepare("SELECT id, nombre_original, ruta_almacenamiento FROM biblioteca_archivos WHERE id = :id AND (eliminado IS NULL OR eliminado = 0) LIMIT 1");
        $stmtCheck->execute([':id' => $archivoId]);
        $archivo = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$archivo || empty($archivo['ruta_almacenamiento'])) {
            JsonResponse::error('El archivo solicitado no existe o ya fue eliminado.', null, 404);
            return;
        }

        // 6. Verificar ruta física del archivo
        $rutaFisica = __DIR__ . '/../../../' . ltrim($archivo['ruta_almacenamiento'], '/');
        if (!file_exists($rutaFisica)) {
            JsonResponse::error('El archivo físico no se encuentra en el servidor.', null, 404);
            return;
        }

        // 7. Registrar la acción en la bitácora del sistema
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'BIBLIOTECA_ARCHIVOS',
            'DESCARGAR_INDIVIDUAL',
            $archivoId,
            "Se descargó el documento individual: '{$archivo['nombre_original']}' (ID: {$archivoId}).",
            null,
            ['archivo_id' => $archivoId]
        );

        // 8. Enviar el archivo individual al navegador
        $nombreOriginal = $archivo['nombre_original'];
        $mimeType = mime_content_type($rutaFisica) ?: 'application/octet-stream';

        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: attachment; filename="' . basename($nombreOriginal) . '"');
        header('Content-Length: ' . filesize($rutaFisica));
        header('Pragma: no-cache');
        header('Expires: 0');

        readfile($rutaFisica);
        exit;

    } catch (PDOException $e) {
        error_log("Error de BD al descargar archivo individual: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        error_log("Error crítico al descargar archivo individual: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Descargar_Multiples_Archivos_Zip(array $datos): void {
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener la instancia única de PDO mediante tu función Conexion()
        $pdo = Conexion();

        // 3. Validar que exista una sesión de usuario activa y obtener su ID y Sesión ID
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
            return;
        }

        // Validar permisos
        if (!TienePermiso($pdo, 'ver_biblioteca')) {
            JsonResponse::error('No cuentas con los permisos necesarios para descargar archivos de la biblioteca.', null, 403);
            return;
        }

        // 4. Extraer y validar el array de IDs enviado
        $idsRaw = $datos['archivo_ids'] ?? ($datos['ids'] ?? []);
        if (!is_array($idsRaw)) {
            $idsRaw = [];
        }

        $ids = array_filter(array_map('intval', $idsRaw), function($id) {
            return $id > 0;
        });

        if (empty($ids)) {
            JsonResponse::error('No se seleccionaron archivos válidos para descargar.', $datos, 400);
            return;
        }

        // 5. Buscar los archivos en la base de datos
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmtCheck = $pdo->prepare("SELECT id, nombre_original, ruta_almacenamiento FROM biblioteca_archivos WHERE id IN ($placeholders) AND (eliminado IS NULL OR eliminado = 0)");
        $stmtCheck->execute(array_values($ids));
        $archivos = $stmtCheck->fetchAll(PDO::FETCH_ASSOC);

        if (empty($archivos)) {
            JsonResponse::error('Los archivos solicitados no existen o ya fueron eliminados.', null, 404);
            return;
        }

        // 6. Crear un archivo ZIP temporal en el servidor
        $zip = new ZipArchive();
        $nombreZipTemp = tempnam(sys_get_temp_dir(), 'zip_');
        $nombreZipFinal = 'archivos_biblioteca_' . date('Y-m-d_His') . '.zip';

        if ($zip->open($nombreZipTemp, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
            JsonResponse::error('No se pudo crear el archivo comprimido en el servidor.', null, 500);
            return;
        }

        $archivosAgregados = 0;
        foreach ($archivos as $archivo) {
            if (!empty($archivo['ruta_almacenamiento'])) {
                $rutaFisica = __DIR__ . '/../../../' . ltrim($archivo['ruta_almacenamiento'], '/');
                if (file_exists($rutaFisica)) {
                    // Evitar nombres duplicados dentro del ZIP renombrándolos si es necesario
                    $nombreUnico = $archivo['nombre_original'];
                    $contador = 1;
                    while ($zip->locateName($nombreUnico) !== false) {
                        $info = pathinfo($archivo['nombre_original']);
                        $nombreUnico = $info['filename'] . '_' . $contador . '.' . ($info['extension'] ?? '');
                        $contador++;
                    }

                    $zip->addFile($rutaFisica, $nombreUnico);
                    $archivosAgregados++;
                }
            }
        }

        $zip->close();

        if ($archivosAgregados === 0 || !file_exists($nombreZipTemp)) {
            @unlink($nombreZipTemp);
            JsonResponse::error('No se encontraron los archivos físicos en el servidor para comprimir.', null, 404);
            return;
        }

        // 7. Registrar la acción en la bitácora del sistema
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'BIBLIOTECA_ARCHIVOS',
            'DESCARGAR_ZIP',
            null,
            "Se descargaron {$archivosAgregados} documentos en formato ZIP.",
            null,
            ['archivos_ids' => array_column($archivos, 'id')]
        );

        // 8. Enviar el archivo ZIP al navegador
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $nombreZipFinal . '"');
        header('Content-Length: ' . filesize($nombreZipTemp));
        header('Pragma: no-cache');
        header('Expires: 0');

        readfile($nombreZipTemp);
        @unlink($nombreZipTemp);
        exit;

    } catch (PDOException $e) {
        error_log("Error de BD al generar ZIP de la biblioteca: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        error_log("Error crítico al generar ZIP: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Cambiar_Nombre_Archivo_Biblioteca(array $datos): void {
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener la instancia única de PDO mediante tu función Conexion()
        $pdo = Conexion();

        // 3. Validar que exista una sesión de usuario activa y obtener su ID y Sesión ID
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
            return;
        }

        // Validar permisos
        if (!TienePermiso($pdo, 'gestionar_biblioteca')) {
            JsonResponse::error('No cuentas con los permisos necesarios para modificar archivos de la biblioteca.', null, 403);
            return;
        }

        // 4. Extraer y validar el ID del archivo y el nuevo nombre
        $archivoId = isset($datos['archivo_id']) ? (int)$datos['archivo_id'] : 0;
        $nuevoNombre = isset($datos['nuevo_nombre']) ? trim($datos['nuevo_nombre']) : '';

        if ($archivoId <= 0) {
            JsonResponse::error('El identificador del archivo no es válido.', null, 400);
            return;
        }

        if (empty($nuevoNombre)) {
            JsonResponse::error('El nuevo nombre del archivo no puede estar vacío.', null, 400);
            return;
        }

        // 5. Buscar el archivo actual en la base de datos
        $stmtCheck = $pdo->prepare("SELECT id, nombre_original, extension FROM biblioteca_archivos WHERE id = :id AND (eliminado IS NULL OR eliminado = 0) LIMIT 1");
        $stmtCheck->execute([':id' => $archivoId]);
        $archivo = $stmtCheck->fetch(PDO::FETCH_ASSOC);

        if (!$archivo) {
            JsonResponse::error('El archivo solicitado no existe o ya fue eliminado.',$datos, 404);
            return;
        }

        $nombreAnterior = $archivo['nombre_original'];

        // Opcional: Asegurar que conserve o incluya su extensión original si el usuario no la escribió
        $extension = $archivo['extension'] ?? '';
        if (!empty($extension)) {
            // Si el nuevo nombre no termina con la extensión, se la agregamos automáticamente
            $extensionConPunto = '.' . ltrim(strtolower($extension), '.');
            if (strtolower(substr($nuevoNombre, -strlen($extensionConPunto))) !== $extensionConPunto) {
                $nuevoNombre .= $extensionConPunto;
            }
        }

        // Iniciamos transacción para asegurar consistencia
        $pdo->beginTransaction();

        // 6. Actualizar el nombre en la base de datos
        $sql = "UPDATE biblioteca_archivos SET nombre_original = :nuevo_nombre, actualizado_en = CURRENT_TIMESTAMP WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nuevo_nombre' => $nuevoNombre,
            ':id' => $archivoId
        ]);

        // 7. Registrar la acción en la bitácora del sistema
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'BIBLIOTECA_ARCHIVOS',
            'CAMBIAR_NOMBRE',
            $archivoId,
            "Se cambió el nombre del archivo de '{$nombreAnterior}' a '{$nuevoNombre}' (ID: {$archivoId}).",
            null,
            ['archivo_id' => $archivoId, 'nombre_anterior' => $nombreAnterior, 'nombre_nuevo' => $nuevoNombre]
        );

        $pdo->commit();

        JsonResponse::success('Nombre del archivo actualizado exitosamente.', [
            'archivo_id' => $archivoId,
            'nuevo_nombre' => $nuevoNombre
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al cambiar nombre del archivo: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al cambiar nombre del archivo: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Guardar_Asignacion_Archivo_Usuarios(array $datos): void
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $pdo = Conexion();

        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
            return;
        }

        if (!TienePermiso($pdo, 'asignar_usuarios_biblioteca')) {
            JsonResponse::error('No cuentas con los permisos necesarios para asignar usuarios.', null, 403);
            return;
        }

        // Recibir el ID del archivo y el arreglo de IDs de usuarios seleccionados
        $archivoId = isset($datos['archivo_id']) ? (int)$datos['archivo_id'] : 0;
        $usuariosIds = $datos['usuarios_ids'] ?? ($datos['seleccionados'] ?? []);

        if ($archivoId <= 0) {
            JsonResponse::error('ID de archivo inválido.', null, 400);
            return;
        }

        if (!is_array($usuariosIds)) {
            $usuariosIds = [];
        }

        // =========================================================================
        // REGLA NUEVA: Asegurar que el usuario logueado con permiso de asignar 
        // siempre se incluya a sí mismo en las asignaciones del documento.
        // =========================================================================
        if ($usuarioId > 0 && !in_array($usuarioId, $usuariosIds)) {
            $usuariosIds[] = $usuarioId;
        }
        // Limpiamos duplicados por si acaso ya venía incluido
        $usuariosIds = array_unique(array_map('intval', $usuariosIds));

        // Iniciar transacción para asegurar consistencia
        $pdo->beginTransaction();

        // 1. Eliminar las asignaciones anteriores para este archivo
        $stmtDel = $pdo->prepare("DELETE FROM biblioteca_archivo_usuarios WHERE archivo_id = :archivo_id");
        $stmtDel->bindValue(':archivo_id', $archivoId, PDO::PARAM_INT);
        $stmtDel->execute();

        // 2. Insertar las nuevas asignaciones (incluyendo al usuario logueado)
        if (!empty($usuariosIds)) {
            $sqlIns = "INSERT INTO biblioteca_archivo_usuarios (archivo_id, usuario_id) VALUES (:archivo_id, :usuario_id)";
            $stmtIns = $pdo->prepare($sqlIns);

            foreach ($usuariosIds as $uid) {
                if ($uid > 0) {
                    $stmtIns->bindValue(':archivo_id', $archivoId, PDO::PARAM_INT);
                    $stmtIns->bindValue(':usuario_id', $uid, PDO::PARAM_INT);
                    $stmtIns->execute();
                }
            }
        }

        // Confirmar transacción
        $pdo->commit();

        // Retornar éxito con la lista actualizada que ya incluye al usuario logueado
        JsonResponse::success('Asignaciones guardadas correctamente.', [
            'archivo_id' => $archivoId,
            'usuarios_asignados' => array_values($usuariosIds)
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al asignar usuarios al archivo: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);
    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al asignar usuarios: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado.', null, 500);
    }
}