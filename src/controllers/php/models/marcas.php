<?php 

function Obtener_Marcas(): void {
    try {
        $sql = "SELECT 
                    ID, 
                    Nombre, 
                    Habilitado, 
                    Fecha_Registro, 
                    Registrado_Por, 
                    Ultima_Actualizacion, 
                    Modificado_Por 
                FROM marcas 
                ORDER BY Nombre ASC";

        // Delegamos la ejecución a nuestro helper robusto Consultar_PDO
        $marcas = Consultar_PDO($sql);

        // Verificamos que el resultado sea un arreglo válido
        if (!is_array($marcas)) {
            JsonResponse::error("No se pudo obtener el listado de marcas.", null, 500);
        }

        // Retornamos la respuesta estandarizada con éxito
        JsonResponse::success("Marcas obtenidas correctamente", $marcas);

    } catch (Throwable $e) {
        // Registramos el error internamente y respondemos con error controlado
        error_log("Error crítico al obtener marcas: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al consultar las marcas.", null, 500);
    }
}
function Gestionar_Marcas(array $datos): void {
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

        // 4. Determinar el tipo de operación recibida ('unica', 'editar', 'masivo')
        $tipo = trim($datos['tipo'] ?? 'unica');

        // 5. Validar permisos usando tu función TienePermiso()
        $permisoRequerido = ($tipo === 'editar') ? 'editar_marcas' : 'crear_marcas';
        
        if (!TienePermiso($pdo, $permisoRequerido)) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
        }

        // --- FLUJO A: EDICIÓN DE UNA MARCA ---
        if ($tipo === 'editar') {
            $idMarca = !empty($datos['id']) ? intval($datos['id']) : 0;
            $nombre  = strtoupper(trim($datos['nombre'] ?? ''));

            if ($idMarca <= 0) {
                JsonResponse::error('El ID de la marca a editar no es válido.');
            }
            if (empty($nombre)) {
                JsonResponse::error('El nombre de la marca es obligatorio.');
            }

            // Obtener valor anterior para la auditoría comparativa
            $stmtAnt = $pdo->prepare("SELECT ID, Nombre, Habilitado FROM marcas WHERE ID = :id");
            $stmtAnt->execute([':id' => $idMarca]);
            $valorAnterior = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$valorAnterior) {
                JsonResponse::error('La marca que intentas editar no existe.');
            }

            // Validar si el nuevo nombre ya pertenece a OTRA marca diferente
            $stmtCheck = $pdo->prepare("SELECT ID FROM marcas WHERE Nombre = :nombre AND ID != :id LIMIT 1");
            $stmtCheck->execute([':nombre' => $nombre, ':id' => $idMarca]);
            if ($stmtCheck->fetch()) {
                JsonResponse::error('La marca ingresada ya se encuentra registrada en el sistema.');
            }

            $sql = "UPDATE marcas SET 
                        Nombre = :nombre, 
                        Modificado_Por = :modificado_por,
                        Ultima_Actualizacion = NOW()
                    WHERE ID = :id";

            $paramsUpdate = [
                ':nombre'         => $nombre,
                ':modificado_por' => $usuarioId,
                ':id'             => $idMarca
            ];

            $stmt = $pdo->prepare($sql);
            $stmt->execute($paramsUpdate);

            // Registro centralizado de bitácora y auditoría
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'MARCAS',
                'EDITAR',
                $idMarca,
                "Se actualizó la marca ID: {$idMarca} a '{$nombre}'",
                $valorAnterior,
                $paramsUpdate
            );

            JsonResponse::success('Marca actualizada exitosamente.', [
                'id'     => $idMarca,
                'nombre' => $nombre
            ]);
        }

        // --- FLUJO B: CREACIÓN MASIVA DE MARCAS ---
        if ($tipo === 'masivo') {
            $marcas = $datos['marcas'] ?? [];

            if (empty($marcas) || !is_array($marcas)) {
                JsonResponse::error('No hay marcas válidas para procesar de forma masiva.');
            }

            // Iniciamos transacción para asegurar que se guarden todas o ninguna si hay error
            $pdo->beginTransaction();

            $sql = "INSERT INTO marcas (Nombre, Registrado_Por, Habilitado) VALUES (:nombre, :registrado_por, 1)";
            $stmt = $pdo->prepare($sql);
            $stmtCheck = $pdo->prepare("SELECT ID FROM marcas WHERE Nombre = :nombre LIMIT 1");

            $insertadas = 0;
            foreach ($marcas as $item) {
                $nombre = strtoupper(trim($item['nombre'] ?? ''));
                if (empty($nombre)) {
                    continue; // Omite vacíos por seguridad
                }

                // Verificar si ya existe en la base de datos antes de insertar
                $stmtCheck->execute([':nombre' => $nombre]);
                if ($stmtCheck->fetch()) {
                    $pdo->rollBack();
                    JsonResponse::error("La marca '$nombre' ya se encuentra registrada en el sistema.");
                }

                $stmt->execute([
                    ':nombre'         => $nombre,
                    ':registrado_por' => $usuarioId
                ]);
                
                $nuevoId = $pdo->lastInsertId();
                $insertadas++;

                // Registro centralizado por cada elemento insertado masivamente
                RegistrarBitacoraAccion(
                    $usuarioId,
                    $sesionId,
                    'MARCAS',
                    'CREAR_MASIVO',
                    $nuevoId,
                    "Se registró masivamente la marca: {$nombre}",
                    null,
                    ['nombre' => $nombre, 'registrado_por' => $usuarioId]
                );
            }

            if ($insertadas === 0) {
                $pdo->rollBack();
                JsonResponse::error('No se pudo registrar ninguna marca porque los nombres venían vacíos.');
            }

            $pdo->commit();

            JsonResponse::success("Se registraron $insertadas marcas exitosamente.", [
                'total' => $insertadas
            ], 201);
        }

        // --- FLUJO C: CREACIÓN DE UNA ÚNICA MARCA ---
        $nombre = strtoupper(trim($datos['nombre'] ?? ''));

        if (empty($nombre)) {
            JsonResponse::error('El nombre de la marca es obligatorio.');
        }

        // Validar previamente si ya existe para evitar errores de excepción
        $stmtCheck = $pdo->prepare("SELECT ID FROM marcas WHERE Nombre = :nombre LIMIT 1");
        $stmtCheck->execute([':nombre' => $nombre]);
        if ($stmtCheck->fetch()) {
            JsonResponse::error('La marca ingresada ya se encuentra registrada en el sistema.');
        }

        $sql = "INSERT INTO marcas (Nombre, Registrado_Por, Habilitado) VALUES (:nombre, :registrado_por, 1)";
        $stmt = $pdo->prepare($sql);
        $paramsInsert = [
            ':nombre'         => $nombre,
            ':registrado_por' => $usuarioId
        ];
        $stmt->execute($paramsInsert);

        $nuevoId = $pdo->lastInsertId();

        // Registro centralizado de bitácora y auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'MARCAS',
            'CREAR',
            $nuevoId,
            "Se registró la marca: {$nombre} (ID: {$nuevoId})",
            null,
            $paramsInsert
        );

        JsonResponse::success('Marca registrada exitosamente.', [
            'id'     => $nuevoId,
            'nombre' => $nombre
        ], 201);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }

        if ($e->getCode() == '23000') {
            $errorMsg = $e->getMessage();
            if (strpos($errorMsg, 'uk_nombre_marca') !== false || strpos($errorMsg, 'Nombre') !== false) {
                JsonResponse::error('La marca ingresada ya se encuentra registrada en el sistema.');
            }
            JsonResponse::error('Ya existe un registro duplicado en la base de datos.');
        }

        error_log("Error de BD al gestionar marca: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al procesar marca: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}