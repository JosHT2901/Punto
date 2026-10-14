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
        }

        // 4. Determinar el tipo de operación recibida ('crear' o 'editar')
        $tipo = trim($datos['tipo'] ?? 'crear');

        // 5. Validar permisos usando la función TienePermiso()
        $permisoRequerido = ($tipo === 'editar') ? 'editar_categorias' : 'crear_categorias';
        
        if (!TienePermiso($pdo, $permisoRequerido)) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
        }

        // --- FLUJO A: EDICIÓN DE UNA CATEGORÍA ---
        if ($tipo === 'editar') {
            $idCategoria     = !empty($datos['id_categoria']) ? intval($datos['id_categoria']) : 0;
            $nombreCategoria = strtoupper(trim($datos['nombre_categoria'] ?? ''));
            $atributos       = $datos['atributos'] ?? [];

            if ($idCategoria <= 0) {
                JsonResponse::error('El ID de la categoría a editar no es válido.');
            }
            if (empty($nombreCategoria)) {
                JsonResponse::error('El nombre de la categoría es obligatorio.');
            }
            if (empty($atributos) || !is_array($atributos)) {
                JsonResponse::error('La categoría debe tener al menos un atributo asociado.');
            }

            // Obtener datos anteriores para la auditoría comparativa
            $stmtAnt = $pdo->prepare("SELECT ID, Nombre, Habilitado FROM categorias WHERE ID = :id");
            $stmtAnt->execute([':id' => $idCategoria]);
            $valorAnterior = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$valorAnterior) {
                JsonResponse::error('La categoría que intentas editar no existe.');
            }

            // Validar si el nuevo nombre ya pertenece a OTRA categoría diferente
            $stmtCheck = $pdo->prepare("SELECT ID FROM categorias WHERE Nombre = :nombre AND ID != :id LIMIT 1");
            $stmtCheck->execute([':nombre' => $nombreCategoria, ':id' => $idCategoria]);
            if ($stmtCheck->fetch()) {
                JsonResponse::error('La categoría ingresada ya se encuentra registrada en el sistema.');
            }

            // Iniciar transacción
            $pdo->beginTransaction();

            // 1. Actualizar datos principales de la categoría
            $sqlCat = "UPDATE categorias SET 
                        Nombre = :nombre, 
                        Modificado_Por = :modificado_por,
                        Ultima_Actualizacion = NOW()
                      WHERE ID = :id";

            $paramsUpdateCat = [
                ':nombre'         => $nombreCategoria,
                ':modificado_por' => $usuarioId,
                ':id'             => $idCategoria
            ];

            $stmtCat = $pdo->prepare($sqlCat);
            $stmtCat->execute($paramsUpdateCat);

            // 2. Sincronizar atributos (Eliminar anteriores y reinsertar los vigentes)
            $stmtDelAttr = $pdo->prepare("DELETE FROM categoria_atributos WHERE ID_Categoria = :id_categoria");
            $stmtDelAttr->execute([':id_categoria' => $idCategoria]);

            $sqlAttr = "INSERT INTO categoria_atributos (ID_Categoria, Nombre_Atributo, Tipo_Dato, Creado_Por) VALUES (:id_categoria, :nombre_atributo, :tipo_dato, :creado_por)";
            $stmtAttr = $pdo->prepare($sqlAttr);

            $tiposPermitidos = ['texto', 'numero', 'peso', 'volumen', 'longitud', 'seleccion', 'color', 'booleano'];
            $atributosActualizados = 0;

            foreach ($atributos as $attr) {
                $nombreAttr = strtoupper(trim($attr['nombre'] ?? ''));
                $tipoDato   = strtolower(trim($attr['tipo'] ?? 'texto'));

                if (empty($nombreAttr)) {
                    continue; // Omite atributos vacíos por seguridad
                }

                if (!in_array($tipoDato, $tiposPermitidos)) {
                    $tipoDato = 'texto'; // Fallback por seguridad
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
            }

            // 3. Registrar mediante la función centralizada de bitácora y auditoría
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
        }

        // --- FLUJO B: CREACIÓN DE UNA NUEVA CATEGORÍA ---
        $nombreCategoria = strtoupper(trim($datos['nombre_categoria'] ?? ''));
        $atributos       = $datos['atributos'] ?? [];

        if (empty($nombreCategoria)) {
            JsonResponse::error('El nombre de la categoría es obligatorio.');
        }
        if (empty($atributos) || !is_array($atributos)) {
            JsonResponse::error('Debes agregar al menos un atributo para la categoría.');
        }

        // Validar previamente si ya existe para evitar excepciones innecesarias
        $stmtCheck = $pdo->prepare("SELECT ID FROM categorias WHERE Nombre = :nombre LIMIT 1");
        $stmtCheck->execute([':nombre' => $nombreCategoria]);
        if ($stmtCheck->fetch()) {
            JsonResponse::error('La categoría ingresada ya se encuentra registrada en el sistema.');
        }

        // Iniciar transacción
        $pdo->beginTransaction();

        // 1. Insertar categoría principal
        $sqlCat = "INSERT INTO categorias (Nombre, Registrado_Por, Habilitado) VALUES (:nombre, :registrado_por, 1)";
        $paramsInsertCat = [
            ':nombre'         => $nombreCategoria,
            ':registrado_por' => $usuarioId
        ];
        $stmtCat = $pdo->prepare($sqlCat);
        $stmtCat->execute($paramsInsertCat);

        $nuevaCategoriaId = $pdo->lastInsertId();

        // 2. Insertar atributos asociados
        $sqlAttr = "INSERT INTO categoria_atributos (ID_Categoria, Nombre_Atributo, Tipo_Dato, Creado_Por) VALUES (:id_categoria, :nombre_atributo, :tipo_dato, :creado_por)";
        $stmtAttr = $pdo->prepare($sqlAttr);

        $tiposPermitidos = ['texto', 'numero', 'peso', 'volumen', 'longitud', 'seleccion', 'color', 'booleano'];
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
        }

        // 3. Registrar mediante la función centralizada de bitácora y auditoría
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
            }
            JsonResponse::error('Ya existe un registro duplicado en la base de datos.');
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