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
                    estado, 
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

        // 5. Validar permisos usando la nomenclatura correcta de tu tabla permisos ('sucursales.crear' / 'sucursales.editar')
        $permisoRequerido = ($tipoOperacion === 'editar') ? 'sucursales.editar' : 'sucursales.crear';
        
        if (!TienePermiso($pdo, $permisoRequerido)) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
        }

        // Extracción y limpieza de campos comunes
        $nombre            = strtoupper(trim($datos['nombre'] ?? ''));
        $tipo              = strtoupper(trim($datos['tipo_sucursal'] ?? ($datos['tipo'] ?? 'TIENDA')));
        $calle             = trim($datos['calle'] ?? '');
        $numeroExterior    = trim($datos['numero_exterior'] ?? '');
        $numeroInterior    = trim($datos['numero_interior'] ?? '');
        $codigoPostal      = trim($datos['codigo_postal'] ?? '');
        $estado            = trim($datos['estado'] ?? '');
        $municipio         = trim($datos['municipio'] ?? '');
        $localidad         = trim($datos['localidad'] ?? '');
        $telefono          = trim($datos['telefono'] ?? '');
        $telefonoAdicional = trim($datos['telefono_adicional'] ?? '');
        $whatsapp          = trim($datos['whatsapp'] ?? '');

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
                estado = :estado, 
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
                ['nombre' => $nombre, 'tipo' => $tipo]
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
            (nombre, tipo, calle, numero_exterior, numero_interior, localidad, municipio, estado, codigo_postal, telefono, telefono_adicional, whatsapp, activo) 
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
            ['nombre' => $nombre, 'tipo' => $tipo]
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