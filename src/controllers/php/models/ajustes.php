<?php 
function Obtener_Variables_Sistema(array $params = []): void {
    try {
        $sql = "SELECT 
                    id, 
                    v_clave, 
                    v_valor, 
                    v_descripcion, 
                    creado_en, 
                    ultima_actualizacion 
                FROM sistema_variables 
                ORDER BY v_clave ASC";

        // Delegamos la ejecución a nuestro helper robusto Consultar_PDO
        $variables = Consultar_PDO($sql);
        $variablesLimpias = is_array($variables) ? $variables : [];

        // Retornamos la respuesta estandarizada de éxito con JsonResponse
        JsonResponse::success("Variables del sistema obtenidas correctamente", [
            'variables' => $variablesLimpias,
            'total' => count($variablesLimpias)
        ]);

    } catch (Throwable $e) {
        // Registramos el error internamente
        error_log("Error crítico al obtener variables del sistema: " . $e->getMessage());
        
        // Retornamos una respuesta de error estandarizada
        JsonResponse::error("Ocurrió un error al consultar las variables del sistema", $e->getMessage(), 500);
    }
}

function Gestionar_Variables_Sistema(array $datos): void {
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

        if (!TienePermiso($pdo, 'editar_variables')) {
            JsonResponse::error('No cuentas con los permisos necesarios para modificar las variables del sistema.', null, 403);
        }

        // 5. Capturar la IP de origen del cliente de forma segura (opcional para logs)
        $ipOrigen = $_SERVER['HTTP_CLIENT_IP'] 
                    ?? ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null);
        if ($ipOrigen === '::1') {
            $ipOrigen = '127.0.0.1';
        }

        // 6. Extraer y validar los campos enviados desde el formulario de variables
        $simboloMoneda       = trim($datos['simbolo_moneda'] ?? '');
        $codigoIso           = strtoupper(trim($datos['codigo_iso'] ?? ''));
        $redondearPrecios    = isset($datos['redondear_precios']) ? (int)$datos['redondear_precios'] : 0;
        $bloquearStockCero   = isset($datos['bloquear_stock_cero']) ? (int)$datos['bloquear_stock_cero'] : 0;

        // Arreglo con las variables clave-valor que vamos a guardar/actualizar
        $variablesAGuardar = [
            'simbolo_moneda'      => $simboloMoneda,
            'codigo_iso'          => $codigoIso,
            'redondear_precios'     => $redondearPrecios,
            'bloquear_stock_cero'   => $bloquearStockCero
        ];

        // Iniciamos transacción para asegurar consistencia
        $pdo->beginTransaction();

        $sql = "INSERT INTO sistema_variables (v_clave, v_valor, v_descripcion) 
                VALUES (:clave, :valor, :descripcion) 
                ON DUPLICATE KEY UPDATE 
                v_valor = VALUES(v_valor), 
                ultima_actualizacion = CURRENT_TIMESTAMP";

        $stmt = $pdo->prepare($sql);

        // Descripciones predeterminadas para cada clave
        $descripciones = [
            'simbolo_moneda'      => 'Símbolo monetario utilizado en la interfaz',
            'codigo_iso'          => 'Código ISO 4217 de la moneda principal',
            'redondear_precios'   => 'Indica si los precios se redondean automáticamente (1 = Sí, 0 = No)',
            'bloquear_stock_cero' => 'Bloquea la venta si el producto cuenta con stock en cero (1 = Sí, 0 = No)'
        ];

        foreach ($variablesAGuardar as $clave => $valor) {
            $stmt->execute([
                ':clave'       => $clave,
                ':valor'       => (string)$valor,
                ':descripcion' => $descripciones[$clave] ?? 'Variable del sistema'
            ]);
        }

        // Registro centralizado de bitácora y auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'SISTEMA_VARIABLES',
            'ACTUALIZAR',
            null,
            "Se actualizaron las variables de entorno del sistema (IP: {$ipOrigen}).",
            null,
            $variablesAGuardar
        );

        $pdo->commit();

        JsonResponse::success('Variables del sistema actualizadas exitosamente.', [
            'variables' => $variablesAGuardar
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al gestionar variables del sistema: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al procesar variables del sistema: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Obtener_Informacion_Empresa(): void {
    try {
        // Consulta SQL basada estrictamente en la estructura actual de la tabla empresa (ID 1)
        $sql = "SELECT 
                    e.ID,
                    e.razon_social,
                    e.rfc,
                    e.regimen_fiscal,
                    e.calle,
                    e.numero_exterior,
                    e.numero_interior,
                    e.colonia,
                    e.codigo_postal,
                    e.municipio,
                    e.estado,
                    e.telefono,
                    e.telefono_adicional,
                    e.correo,
                    e.whatsapp,
                    e.web,
                    e.fecha_creacion,
                    e.ultima_actualizacion,
                    e.actualizado_por,
                    CONCAT_WS(' ', u.nombre, u.apellido_paterno) AS actualizado_por_nombre
                FROM empresa e
                LEFT JOIN usuarios u ON e.actualizado_por = u.ID
                WHERE e.ID = 1
                LIMIT 1";

        // Ejecutamos la consulta usando tu helper Consultar_PDO
        $resultado = Consultar_PDO($sql);

        // Si la tabla no tiene registros todavía, devolvemos un objeto vacío para que el formulario inicie en blanco
        if (empty($resultado) || !is_array($resultado)) {
            JsonResponse::success("No hay información de empresa registrada aún.", [
                'empresa' => null
            ]);
            return;
        }

        // Extraemos el primer y único registro
        $empresa = $resultado[0];

        // Respuesta exitosa estandarizada con JsonResponse
        JsonResponse::success("Información de la empresa obtenida correctamente", [
            'empresa' => $empresa
        ]);

    } catch (Throwable $e) {
        error_log("Error en Obtener_Informacion_Empresa: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al obtener la información de la empresa", $e->getMessage(), 500);
    }
}

function Guardar_Informacion_Empresa(array $datos): void {
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

        // Validación de permisos (ajusta el nombre del permiso según tu catálogo)
        if (!TienePermiso($pdo, 'editar_empresa')) {
            JsonResponse::error('No cuentas con los permisos necesarios para modificar la información de la empresa.', null, 403);
        }

        // 5. Capturar la IP de origen del cliente de forma segura
        $ipOrigen = $_SERVER['HTTP_CLIENT_IP'] 
                    ?? ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null);
        if ($ipOrigen === '::1') {
            $ipOrigen = '127.0.0.1';
        }

        // 6. Extraer y validar los campos enviados desde el formulario de empresa
        $razonSocial       = trim($datos['razon_social'] ?? '');
        $rfc               = strtoupper(trim($datos['rfc'] ?? ''));
        $regimenFiscal     = trim($datos['regimen_fiscal'] ?? '');
        $calle             = trim($datos['calle'] ?? '');
        $numeroExterior    = trim($datos['numero_exterior'] ?? '');
        $numeroInterior    = trim($datos['numero_interior'] ?? '');
        $colonia           = trim($datos['colonia'] ?? '');
        $codigoPostal      = trim($datos['codigo_postal'] ?? '');
        $municipio         = trim($datos['municipio'] ?? '');
        $estado            = trim($datos['estado'] ?? '');
        $telefono          = trim($datos['telefono'] ?? '');
        $telefonoAdicional = trim($datos['telefono_adicional'] ?? '');
        $correo            = trim($datos['correo'] ?? '');
        $whatsapp          = trim($datos['whatsapp'] ?? '');
        $web               = trim($datos['web'] ?? '');

        // Validaciones básicas del lado del servidor
        if (empty($razonSocial) || empty($rfc) || empty($regimenFiscal)) {
            JsonResponse::error('Los campos Razón Social, RFC y Régimen Fiscal son obligatorios.', null, 400);
        }

        if (empty($calle) || empty($numeroExterior) || empty($estado) || empty($municipio) || empty($colonia) || empty($codigoPostal)) {
            JsonResponse::error('Todos los campos del domicilio fiscal son obligatorios.', $datos, 400);
        }

        // Estructura de datos para guardar e indexar
        $datosEmpresa = [
            'razon_social'       => $razonSocial,
            'rfc'                => $rfc,
            'regimen_fiscal'     => $regimenFiscal,
            'calle'              => $calle,
            'numero_exterior'    => $numeroExterior,
            'numero_interior'    => $numeroInterior !== '' ? $numeroInterior : null,
            'colonia'            => $colonia,
            'codigo_postal'      => $codigoPostal,
            'municipio'          => $municipio,
            'estado'             => $estado,
            'telefono'           => $telefono !== '' ? $telefono : null,
            'telefono_adicional' => $telefonoAdicional !== '' ? $telefonoAdicional : null,
            'correo'             => $correo !== '' ? $correo : null,
            'whatsapp'           => $whatsapp !== '' ? $whatsapp : null,
            'web'                => $web !== '' ? $web : null,
            'actualizado_por'    => (int)$usuarioId
        ];

        // Iniciamos transacción para asegurar consistencia
        $pdo->beginTransaction();

        // Consulta con patrón Singleton forzando ID = 1
        $sql = "INSERT INTO empresa (
                    ID, razon_social, rfc, regimen_fiscal, calle, numero_exterior, 
                    numero_interior, colonia, codigo_postal, municipio, estado, 
                    telefono, telefono_adicional, correo, whatsapp, web, actualizado_por
                ) VALUES (
                    1, :razon_social, :rfc, :regimen_fiscal, :calle, :numero_exterior, 
                    :numero_interior, :colonia, :codigo_postal, :municipio, :estado, 
                    :telefono, :telefono_adicional, :correo, :whatsapp, :web, :actualizado_por
                ) 
                ON DUPLICATE KEY UPDATE 
                    razon_social       = VALUES(razon_social),
                    rfc                = VALUES(rfc),
                    regimen_fiscal     = VALUES(regimen_fiscal),
                    calle              = VALUES(calle),
                    numero_exterior    = VALUES(numero_exterior),
                    numero_interior    = VALUES(numero_interior),
                    colonia            = VALUES(colonia),
                    codigo_postal      = VALUES(codigo_postal),
                    municipio          = VALUES(municipio),
                    estado             = VALUES(estado),
                    telefono           = VALUES(telefono),
                    telefono_adicional = VALUES(telefono_adicional),
                    correo             = VALUES(correo),
                    whatsapp           = VALUES(whatsapp),
                    web                = VALUES(web),
                    actualizado_por    = VALUES(actualizado_por),
                    ultima_actualizacion = CURRENT_TIMESTAMP";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($datosEmpresa);

        // Registro centralizado de bitácora y auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'EMPRESA_CONFIGURACION',
            'ACTUALIZAR',
            null,
            "Se actualizó la información fiscal y de domicilio de la empresa (IP: {$ipOrigen}).",
            null,
            $datosEmpresa
        );

        $pdo->commit();

        JsonResponse::success('Información de la empresa actualizada exitosamente.', [
            'empresa' => $datosEmpresa
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al gestionar la información de la empresa: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al procesar la información de la empresa: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Gestionar_Logo_Empresa(array $datos): void {
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

        // 4. Validación estricta del permiso solicitado
        if (!TienePermiso($pdo, 'editar_empresa')) {
            JsonResponse::error('No cuentas con los permisos necesarios para modificar el logotipo de la empresa.', null, 403);
        }

        // 5. Capturar la IP de origen del cliente de forma segura (opcional para logs)
        $ipOrigen = $_SERVER['HTTP_CLIENT_IP'] 
                    ?? ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null);
        if ($ipOrigen === '::1') {
            $ipOrigen = '127.0.0.1';
        }

        // 6. Extraer y validar el logo enviado (en formato Base64)
        $logoBase64 = trim($datos['logo'] ?? '');
        $empresaId  = isset($datos['empresa_id']) ? (int)$datos['empresa_id'] : 1; // Por defecto empresa_id = 1

        if (empty($logoBase64)) {
            JsonResponse::error('No se ha proporcionado ninguna imagen de logotipo.', null, 400);
        }

        // Limpiar el encabezado data:image/...;base64, si lo trae adjunto el string
        if (preg_match('/^data:image\/(\w+);base64,/', $logoBase64, $tipoMatch)) {
            $extension = strtolower($tipoMatch[1]); // ej: png, jpeg, jpg
            $logoBase64 = substr($logoBase64, strpos($logoBase64, ',') + 1);
        } else {
            $extension = 'png'; // Valor por defecto si no trae cabecera
        }

        // Determinar el tipo MIME correcto
        $tipoMime = 'image/png';
        if ($extension === 'jpeg' || $extension === 'jpg') {
            $tipoMime = 'image/jpeg';
        }

        // Decodificar el Base64 a binario puro para el LONGBLOB
        $binarioLogotipo = base64_decode($logoBase64);
        if ($binarioLogotipo === false) {
            JsonResponse::error('El formato de la imagen proporcionada no es válido.', null, 400);
        }

        // Validar tamaño máximo opcional (ej. máx 2MB para evitar saturar la BD)
        if (strlen($binarioLogotipo) > 2 * 1024 * 1024) {
            JsonResponse::error('La imagen es demasiado pesada. El tamaño máximo permitido es 2MB.', null, 400);
        }

        // Iniciamos transacción para asegurar consistencia
        $pdo->beginTransaction();

        $sql = "INSERT INTO empresa_logo (empresa_id, logotipo, tipo_mime, fecha_actualizacion) 
                VALUES (:empresa_id, :logotipo, :tipo_mime, CURRENT_TIMESTAMP) 
                ON DUPLICATE KEY UPDATE 
                logotipo = VALUES(logotipo), 
                tipo_mime = VALUES(tipo_mime),
                fecha_actualizacion = CURRENT_TIMESTAMP";

        $stmt = $pdo->prepare($sql);

        // Usamos bindValue con PDO::PARAM_LOB para manejar correctamente el formato binario LONGBLOB
        $stmt->bindValue(':empresa_id', $empresaId, PDO::PARAM_INT);
        $stmt->bindValue(':logotipo', $binarioLogotipo, PDO::PARAM_LOB);
        $stmt->bindValue(':tipo_mime', $tipoMime, PDO::PARAM_STR);

        $stmt->execute();

        // Registro centralizado de bitácora y auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'EMPRESA_LOGO',
            'ACTUALIZAR',
            null,
            "Se actualizó el logotipo de la empresa ID: {$empresaId} (IP: {$ipOrigen}).",
            null,
            ['empresa_id' => $empresaId, 'tipo_mime' => $tipoMime]
        );

        $pdo->commit();

        JsonResponse::success('Logotipo de la empresa actualizado exitosamente.', [
            'empresa_id' => $empresaId,
            'tipo_mime'  => $tipoMime
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al guardar el logotipo: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al procesar el logotipo: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Obtener_Logo_Empresa(array $params = []): void {
    try {
        // 1. Obtener el ID de la empresa (por defecto 1, o desde los parámetros enviados)
        $empresaId = isset($params['empresa_id']) ? (int)$params['empresa_id'] : 1;

        $sql = "SELECT 
                    empresa_id, 
                    logotipo, 
                    tipo_mime, 
                    fecha_actualizacion 
                FROM empresa_logo 
                WHERE empresa_id = :empresa_id 
                LIMIT 1";

        // Usamos una consulta segura con PDO para evitar inyección y manejar bien el binario
        $pdo = Conexion();
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':empresa_id', $empresaId, PDO::PARAM_INT);
        $stmt->execute();
        $logoData = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$logoData) {
            JsonResponse::success("No se encontró ningún logotipo registrado para esta empresa", [
                'logo_base64' => null,
                'tipo_mime' => null,
                'existe' => false
            ]);
            return;
        }

        // Convertir el LONGBLOB binario a Base64 con su respectivo Data URI scheme
        $binario = $logoData['logotipo'];
        $tipoMime = !empty($logoData['tipo_mime']) ? $logoData['tipo_mime'] : 'image/png';
        
        $logoBase64 = null;
        if (!empty($binario)) {
            $logoBase64 = 'data:' . $tipoMime . ';base64,' . base64_encode($binario);
        }

        // Retornamos la respuesta estandarizada de éxito con JsonResponse
        JsonResponse::success("Logotipo obtenido correctamente", [
            'empresa_id' => (int)$logoData['empresa_id'],
            'logo_base64' => $logoBase64,
            'tipo_mime' => $tipoMime,
            'fecha_actualizacion' => $logoData['fecha_actualizacion'],
            'existe' => true
        ]);

    } catch (Throwable $e) {
        // Registramos el error internamente
        error_log("Error crítico al obtener el logotipo de la empresa: " . $e->getMessage());
        
        // Retornamos una respuesta de error estandarizada
        JsonResponse::error("Ocurrió un error al consultar el logotipo de la empresa", $e->getMessage(), 500);
    }
}

function Eliminar_Logo_Empresa(array $datos): void {
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

        // 4. Validación estricta del permiso solicitado
        if (!TienePermiso($pdo, 'editar_empresa')) {
            JsonResponse::error('No cuentas con los permisos necesarios para eliminar el logotipo de la empresa.', null, 403);
        }

        // 5. Capturar la IP de origen del cliente de forma segura (opcional para logs)
        $ipOrigen = $_SERVER['HTTP_CLIENT_IP'] 
                    ?? ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null);
        if ($ipOrigen === '::1') {
            $ipOrigen = '127.0.0.1';
        }

        // 6. Obtener el ID de la empresa (por defecto 1, o desde los parámetros enviados)
        $empresaId = isset($datos['empresa_id']) ? (int)$datos['empresa_id'] : 1;

        // Iniciamos transacción para asegurar consistencia
        $pdo->beginTransaction();

        $sql = "DELETE FROM empresa_logo WHERE empresa_id = :empresa_id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':empresa_id', $empresaId, PDO::PARAM_INT);
        $stmt->execute();

        // Registro centralizado de bitácora y auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'EMPRESA_LOGO',
            'ELIMINAR',
            null,
            "Se eliminó el logotipo de la empresa ID: {$empresaId} (IP: {$ipOrigen}).",
            null,
            ['empresa_id' => $empresaId]
        );

        $pdo->commit();

        JsonResponse::success('Logotipo eliminado exitosamente.', [
            'empresa_id' => $empresaId
        ]);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al eliminar el logotipo: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al procesar la eliminación del logotipo: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}