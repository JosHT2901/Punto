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

        // 6. Extraer y validar los campos enviados desde el formulario de variables (incluyendo comisión e IVA)
        $simboloMoneda         = trim($datos['simbolo_moneda'] ?? '');
        $codigoIso             = strtoupper(trim($datos['codigo_iso'] ?? ''));
        $redondearPrecios      = isset($datos['redondear_precios']) ? (int)$datos['redondear_precios'] : 0;
        $bloquearStockCero     = isset($datos['bloquear_stock_cero']) ? (int)$datos['bloquear_stock_cero'] : 0;
        $incluirComisionTarjeta = isset($datos['incluir_comision_tarjeta']) ? (int)$datos['incluir_comision_tarjeta'] : 0;
        $comisionTarjeta       = $incluirComisionTarjeta ? number_format((float)($datos['comision_tarjeta'] ?? 0), 2, '.', '') : '0.00';
        $ivaComision           = $incluirComisionTarjeta ? trim($datos['iva_comision'] ?? '0') : '0';

        // Arreglo con las variables clave-valor que vamos a guardar/actualizar
        $variablesAGuardar = [
            'simbolo_moneda'          => $simboloMoneda,
            'codigo_iso'              => $codigoIso,
            'redondear_precios'       => $redondearPrecios,
            'bloquear_stock_cero'     => $bloquearStockCero,
            'incluir_comision_tarjeta' => $incluirComisionTarjeta,
            'comision_tarjeta'        => $comisionTarjeta,
            'iva_comision'            => $ivaComision
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
            'simbolo_moneda'           => 'Símbolo monetario utilizado en la interfaz',
            'codigo_iso'               => 'Código ISO 4217 de la moneda principal',
            'redondear_precios'        => 'Indica si los precios se redondean automáticamente (1 = Sí, 0 = No)',
            'bloquear_stock_cero'      => 'Bloquea la venta si el producto cuenta con stock en cero (1 = Sí, 0 = No)',
            'incluir_comision_tarjeta' => 'Indica si se incluye la comisión de terminal bancaria (1 = Sí, 0 = No)',
            'comision_tarjeta'         => 'Porcentaje de comisión aplicado por la terminal bancaria',
            'iva_comision'             => 'Tasa o porcentaje de IVA aplicable sobre la comisión de la tarjeta'
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
function Obtener_Ajustes_Smtp(array $params = []): void {
    try {
        // 1. Intentar obtener los ajustes directamente desde las variables de entorno (.env)
        // Usamos getenv o $_ENV, con respaldos vacíos o valores por defecto seguros
        $host     = $_ENV['SMTP_HOST'] ?? getenv('SMTP_HOST') ?: '';
        $port     = $_ENV['SMTP_PORT'] ?? getenv('SMTP_PORT') ?: 587;
        $secure   = $_ENV['SMTP_SECURE'] ?? getenv('SMTP_SECURE') ?: 'tls';
        $username = $_ENV['SMTP_USERNAME'] ?? getenv('SMTP_USERNAME') ?: '';
        $password = Descifrar_Payload($_ENV['SMTP_PASSWORD'] ?? getenv('SMTP_PASSWORD')) ?: '';
        $fromName = $_ENV['SMTP_FROM_NAME'] ?? getenv('SMTP_FROM_NAME') ?: '';

        // Opcional: limpiar comillas si el .env guardó el from_name entre comillas dobles
        $fromName = trim($fromName, '"\'');

        // 2. Validar si al menos hay datos mínimos configurados para saber si "existe" configuración
        $existeConfiguracion = !empty($host) && !empty($username);

        // 3. Retornamos siempre una respuesta exitosa (sin lanzar errores si falta algo)
        JsonResponse::success("Ajustes SMTP obtenidos correctamente", [
            'host'      => $host,
            'port'      => (int)$port,
            'secure'    => $secure,
            'username'  => $username,
            'password'  => $password,
            'from_name' => $fromName,
            'existe'    => $existeConfiguracion
        ]);

    } catch (Throwable $e) {
        // Registramos el error internamente por si ocurre algo inesperado
        error_log("Error crítico al obtener los ajustes SMTP del entorno: " . $e->getMessage());
        
        // Retornamos una respuesta segura de éxito con datos vacíos para no romper la interfaz visual
        JsonResponse::success("No se pudieron cargar los ajustes SMTP, se usan valores por defecto", [
            'host'      => '',
            'port'      => 587,
            'secure'    => 'tls',
            'username'  => '',
            'password'  => '',
            'from_name' => '',
            'existe'    => false
        ]);
    }
}

function Guardar_Ajustes_Smtp(array $data): void {
    try {
        // 1. Validar y sanitizar los datos recibidos desde el cliente
        $host     = trim($data['host'] ?? '');
        $port     = filter_var($data['port'] ?? 587, FILTER_VALIDATE_INT);
        $secure   = trim($data['secure'] ?? 'tls');
        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? ''; 
        $fromName = trim($data['from_name'] ?? 'Etcétera de México');

        if (empty($host) || empty($username) || empty($password)) {
            JsonResponse::error("El host, el usuario y la contraseña son obligatorios.", null, 400);
            return;
        }

        if ($port === false || $port <= 0) {
            JsonResponse::error("El puerto SMTP especificado no es válido.", null, 400);
            return;
        }

        // 👉 2. CIFRAR LA CONTRASEÑA usando tu función AES-256-CBC
        $passwordCifrada = Cifrar_Payload($password);

        // 3. Ruta exacta y robusta al archivo .env (ubicado en src/env/.env)
        $rutaEnv = realpath(__DIR__ . '/../../../env') . '/.env';
        if (!file_exists($rutaEnv)) {
            $rutaEnv = __DIR__ . '/../../env/.env';
        }

        if (!file_exists($rutaEnv)) {
            $directorioEnv = dirname($rutaEnv);
            if (!is_dir($directorioEnv)) {
                mkdir($directorioEnv, 0755, true);
            }
            file_put_contents($rutaEnv, "# Archivo de entorno\n");
        }

        $contenidoEnv = file_get_contents($rutaEnv);
        if ($contenidoEnv === false) {
            JsonResponse::error("No se pudo leer el archivo de entorno (.env). Verifique permisos.", null, 500);
            return;
        }

        // 4. Mapeo de las variables. ENVOLVEMOS ENTRE COMILLAS para evitar errores de espacios en blanco al parsear.
        $variablesNuevas = [
            'SMTP_HOST'       => $host,
            'SMTP_USERNAME'   => $username,
            'SMTP_PASSWORD'   => "\"{$passwordCifrada}\"",
            'SMTP_PORT'       => (string)$port,
            'SMTP_SECURE'     => $secure,
            'SMTP_FROM_EMAIL' => $username,
            'SMTP_FROM_NAME'  => "\"{$fromName}\"" // <-- Evita el error "unexpected whitespace" con nombres compuestos
        ];

        // 5. Actualizar línea por línea en el .env
        $lineas = explode("\n", str_replace(["\r\n", "\r"], "\n", $contenidoEnv));
        foreach ($variablesNuevas as $clave => $valor) {
            $encontrado = false;
            foreach ($lineas as &$linea) {
                $lineaTrim = trim($linea);
                if (str_starts_with($lineaTrim, '#')) continue;
                if (str_starts_with($lineaTrim, $clave . '=')) {
                    $linea = "{$clave}={$valor}";
                    $encontrado = true;
                    break;
                }
            }
            unset($linea);

            if (!$encontrado) {
                $lineas[] = "{$clave}={$valor}";
            }
        }

        $nuevoContenidoEnv = implode("\n", $lineas);
        $resultadoEscritura = file_put_contents($rutaEnv, $nuevoContenidoEnv, LOCK_EX);

        if ($resultadoEscritura === false) {
            JsonResponse::error("No se pudo escribir en el archivo .env. Verifique permisos.", null, 500);
            return;
        }

        JsonResponse::success("Configuración SMTP guardada y cifrada correctamente en el .env", [
            'host'      => $host,
            'port'      => $port,
            'secure'    => $secure,
            'username'  => $username,
            'from_name' => $fromName
        ]);

    } catch (Throwable $e) {
        error_log("Error crítico al guardar los ajustes SMTP: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al guardar los ajustes SMTP", $e->getMessage(), 500);
    }
}

function Obtener_Ajustes_Imap(array $params = []): void {
    try {
        // 1. Intentar obtener los ajustes IMAP directamente desde las variables de entorno (.env)
        $host     = $_ENV['IMAP_HOST'] ?? getenv('IMAP_HOST') ?: '';
        $port     = $_ENV['IMAP_PORT'] ?? getenv('IMAP_PORT') ?: 993;
        $secure   = $_ENV['IMAP_SECURE'] ?? getenv('IMAP_SECURE') ?: 'tls';
        $username = $_ENV['IMAP_USERNAME'] ?? getenv('IMAP_USERNAME') ?: '';
        $password = Descifrar_Payload($_ENV['IMAP_PASSWORD'] ?? getenv('IMAP_PASSWORD')) ?: '';

        // 2. Validar si al menos hay datos mínimos configurados
        $existeConfiguracion = !empty($host) && !empty($username);

        // 3. Retornamos respuesta exitosa
        JsonResponse::success("Ajustes IMAP obtenidos correctamente", [
            'host'     => $host,
            'port'     => (int)$port,
            'secure'   => $secure,
            'username' => $username,
            'password' => $password,
            'existe'   => $existeConfiguracion
        ]);

    } catch (Throwable $e) {
        error_log("Error crítico al obtener los ajustes IMAP del entorno: " . $e->getMessage());
        
        JsonResponse::success("No se pudieron cargar los ajustes IMAP, se usan valores por defecto", [
            'host'     => '',
            'port'     => 993,
            'secure'   => 'tls',
            'username' => '',
            'password' => '',
            'existe'   => false
        ]);
    }
}

function Guardar_Ajustes_Imap(array $data): void {
    try {
        // 1. Validar y sanitizar los datos recibidos desde el cliente
        $host     = trim($data['host'] ?? '');
        $port     = filter_var($data['port'] ?? 993, FILTER_VALIDATE_INT);
        $secure   = trim($data['secure'] ?? 'tls');
        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? ''; 

        if (empty($host) || empty($username) || empty($password)) {
            JsonResponse::error("El host, el usuario y la contraseña son obligatorios.", null, 400);
            return;
        }

        if ($port === false || $port <= 0) {
            JsonResponse::error("El puerto IMAP especificado no es válido.", null, 400);
            return;
        }

        // 2. CIFRAR LA CONTRASEÑA
        $passwordCifrada = Cifrar_Payload($password);

        // 3. Ruta exacta al archivo .env
        $rutaEnv = realpath(__DIR__ . '/../../../env') . '/.env';
        if (!file_exists($rutaEnv)) {
            $rutaEnv = __DIR__ . '/../../env/.env';
        }

        if (!file_exists($rutaEnv)) {
            $directorioEnv = dirname($rutaEnv);
            if (!is_dir($directorioEnv)) {
                mkdir($directorioEnv, 0755, true);
            }
            file_put_contents($rutaEnv, "# Archivo de entorno\n");
        }

        $contenidoEnv = file_get_contents($rutaEnv);
        if ($contenidoEnv === false) {
            JsonResponse::error("No se pudo leer el archivo de entorno (.env). Verifique permisos.", null, 500);
            return;
        }

        // 4. Mapeo de las variables IMAP
        $variablesNuevas = [
            'IMAP_HOST'     => $host,
            'IMAP_USERNAME' => $username,
            'IMAP_PASSWORD' => "\"{$passwordCifrada}\"",
            'IMAP_PORT'     => (string)$port,
            'IMAP_SECURE'   => $secure
        ];

        // 5. Actualizar línea por línea en el .env
        $lineas = explode("\n", str_replace(["\r\n", "\r"], "\n", $contenidoEnv));
        foreach ($variablesNuevas as $clave => $valor) {
            $encontrado = false;
            foreach ($lineas as &$linea) {
                $lineaTrim = trim($linea);
                if (str_starts_with($lineaTrim, '#')) continue;
                if (str_starts_with($lineaTrim, $clave . '=')) {
                    $linea = "{$clave}={$valor}";
                    $encontrado = true;
                    break;
                }
            }
            unset($linea);

            if (!$encontrado) {
                $lineas[] = "{$clave}={$valor}";
            }
        }

        $nuevoContenidoEnv = implode("\n", $lineas);
        $resultadoEscritura = file_put_contents($rutaEnv, $nuevoContenidoEnv, LOCK_EX);

        if ($resultadoEscritura === false) {
            JsonResponse::error("No se pudo escribir en el archivo .env. Verifique permisos.", null, 500);
            return;
        }

        JsonResponse::success("Configuración IMAP guardada y cifrada correctamente en el .env", [
            'host'     => $host,
            'port'     => $port,
            'secure'   => $secure,
            'username' => $username
        ]);

    } catch (Throwable $e) {
        error_log("Error crítico al guardar los ajustes IMAP: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al guardar los ajustes IMAP", $e->getMessage(), 500);
    }
}

function Descargar_Backup_Dinamico_SQL(): void {
    // 1. Asegurar sesión activa
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $usuarioId = $_SESSION['usuario']['id'] ?? null;
    $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

    // Validación de autenticación base compatible con AjaxService / descargarArchivo
    if (!$usuarioId || !isset($_SESSION['seguridad']['autenticado'])) {
        JsonResponse::error("Error 401: Sesión expirada o usuario no autenticado.", null, 401);
        return;
    }

    // 2. Obtener instancia de PDO mediante la función del sistema
    $pdo = Conexion();
    if (!$pdo) {
        JsonResponse::error("No se pudo establecer conexión con el motor de base de datos.", null, 500);
        return;
    }

    // 3. Validación de permisos robusta utilizando la función global estandarizada
    $permisoRequerido = 'database';
    if (!TienePermiso($pdo, $permisoRequerido)) {
        JsonResponse::error("No tienes los privilegios necesarios para descargar respaldos de la base de datos.", null, 403);
        return;
    }

    // 4. Proceso de generación y streaming del archivo .SQL
    try {
        // Obtener el listado de todas las tablas activas de forma segura
        $tablas = [];
        $result = $pdo->query("SHOW TABLES");
        while ($row = $result->fetch(PDO::FETCH_NUM)) {
            $tablas[] = $row[0];
        }

        if (empty($tablas)) {
            JsonResponse::error("La base de datos no contiene tablas para respaldar.", null, 404);
            return;
        }

        // Preparar nombre del archivo descargable compatible con AjaxService.descargarArchivo
        $nombreArchivo = "backup_" . date("Y-m-d_H-i-s") . ".sql";

        // Limpieza absoluta de todos los buffers abiertos
        while (ob_get_level() > 0) {
            @ob_end_clean();
        }

        set_time_limit(0);
        ini_set('memory_limit', '512M'); 

        // Cabeceras HTTP nativas de descarga para el blob
        header('Content-Description: File Transfer');
        header('Content-Type: application/sql; charset=UTF-8'); 
        header('Content-Disposition: attachment; filename="' . $nombreArchivo . '"');
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');

        // Flujo de streaming continuo (php://output)
        $output = fopen('php://output', 'w');
        if ($output === false) {
            throw new Exception("No se pudo abrir el flujo de salida para la descarga.");
        }

        fwrite($output, "-- ==========================================================\n");
        fwrite($output, "-- RESPALDO DE BASE DE DATOS GENERADO AUTOMÁTICAMENTE\n");
        fwrite($output, "-- Solicitado por Usuario ID: $usuarioId\n");
        fwrite($output, "-- Sucursal ID: " . ($_SESSION['entorno']['sucursal_id'] ?? 'N/A') . "\n");
        fwrite($output, "-- Fecha: " . date("Y-m-d H:i:s") . "\n");
        fwrite($output, "-- ==========================================================\n\n");
        fwrite($output, "SET FOREIGN_KEY_CHECKS=0;\n\n");

        // Iterar tablas y escribir estructuras y registros al vuelo optimizando memoria
        foreach ($tablas as $tabla) {
            // Validar nombre de tabla seguro contra inyección estructural
            $tablaEscapada = '`' . str_replace('`', '``', $tabla) . '`';

            fwrite($output, "-- --------------------------------------------------------\n");
            fwrite($output, "-- Estructura para la tabla {$tablaEscapada}\n");
            fwrite($output, "-- --------------------------------------------------------\n");
            fwrite($output, "DROP TABLE IF EXISTS {$tablaEscapada};\n");
            
            $createTableStmt = $pdo->query("SHOW CREATE TABLE {$tablaEscapada}")->fetch(PDO::FETCH_NUM);
            if ($createTableStmt && isset($createTableStmt[1])) {
                fwrite($output, $createTableStmt[1] . ";\n\n");
            }

            // Volcado de datos estructurado por bloques (Inserts)
            fwrite($output, "-- Volcado de datos para la tabla {$tablaEscapada}\n");
            $rows = $pdo->query("SELECT * FROM {$tablaEscapada}", PDO::FETCH_ASSOC);
            
            foreach ($rows as $row) {
                $valores = array_map(function($val) use ($pdo) {
                    if ($val === null) return 'NULL';
                    return $pdo->quote($val);
                }, $row);

                $columnas = array_keys($row);
                $colsEscapadas = array_map(function($col) {
                    return '`' . str_replace('`', '``', $col) . '`';
                }, $columnas);

                $sqlInsert = "INSERT INTO {$tablaEscapada} (" . implode(", ", $colsEscapadas) . ") VALUES (" . implode(", ", $valores) . ");\n";
                fwrite($output, $sqlInsert);
            }
            fwrite($output, "\n\n");
        }

        fwrite($output, "SET FOREIGN_KEY_CHECKS=1;\n");
        fclose($output);

        // Registro de bitácora de la acción exitosa
        if (function_exists('RegistrarBitacoraAccion')) {
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'AJUSTES_DATABASE',
                'BACKUP',
                null,
                "Se generó y descargó un respaldo exitoso de la base de datos ({$nombreArchivo}).",
                null,
                ['archivo' => $nombreArchivo, 'total_tablas' => count($tablas)]
            );
        }

        exit;

    } catch (Throwable $e) {
        error_log("Error crítico al generar backup dinámico SQL: " . $e->getMessage());
        // Uso de la clase JsonResponse estandarizada para capturar el error limpiamente en el frontend
        JsonResponse::error('Falló la generación del script SQL: ' . $e->getMessage(), null, 500);
    }
}

function Importar_Backup_Dinamico_SQL(array $datosCrudos): void {
    // 1. Asegurar sesión activa
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    $usuarioId = $_SESSION['usuario']['id'] ?? null;
    $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

    // Validación de autenticación base compatible con AjaxService
    if (!$usuarioId || !isset($_SESSION['seguridad']['autenticado'])) {
        JsonResponse::error("Error 401: Sesión expirada o usuario no autenticado.", null, 401);
        return;
    }

    // 2. Obtener instancia de PDO mediante la función del sistema
    $pdo = Conexion();
    if (!$pdo) {
        JsonResponse::error("No se pudo establecer conexión con el motor de base de datos.", null, 500);
        return;
    }

    // 3. Validación de permisos estricta
    $permisoRequerido = 'database';
    if (!TienePermiso($pdo, $permisoRequerido)) {
        JsonResponse::error("No tienes los privilegios necesarios para restaurar respaldos de la base de datos.", null, 403);
        return;
    }

    // --- NORMALIZACIÓN DE ENTRADA DE ARCHIVOS ---
    $archivosFiles = $datosCrudos['archivos'] ?? ($_FILES ?? []);
    $archivoSql = null;

    foreach ($archivosFiles as $fileData) {
        if (is_array($fileData) && isset($fileData['name']) && !is_array($fileData['name'])) {
            if ($fileData['error'] === UPLOAD_ERR_OK) {
                $archivoSql = $fileData;
                break;
            }
        }
    }

    if (!$archivoSql) {
        JsonResponse::error('No se ha recibido ningún archivo SQL válido para restaurar.', null, 400);
        return;
    }

    $nombreOriginal = $archivoSql['name'];
    $tmpPath        = $archivoSql['tmp_name'];
    $extension      = strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION));

    if ($extension !== 'sql') {
        JsonResponse::error("El formato del archivo (.$extension) no es válido. Se requiere un archivo con extensión .sql.", null, 400);
        return;
    }

    // 4. Proceso de lectura y ejecución del script SQL
    try {
        set_time_limit(0);
        // Aumentar temporalmente el límite de memoria para archivos SQL grandes
        ini_set('memory_limit', '1024M');

        $contenidoSql = file_get_contents($tmpPath);
        if ($contenidoSql === false) {
            throw new Exception("No se pudo leer el contenido del archivo SQL subido.");
        }

        // Limpiar comentarios y normalizar saltos de línea
        $lineas = explode("\n", str_replace(["\r\n", "\r"], "\n", $contenidoSql));
        $sqlDepurado = "";
        
        foreach ($lineas as $linea) {
            $lineaTrim = trim($linea);
            // Omitir comentarios completos
            if ($lineaTrim === '' || str_starts_with($lineaTrim, '--') || str_starts_with($lineaTrim, '/*')) {
                continue;
            }
            $sqlDepurado .= $linea . "\n";
        }

        // Dividir sentencias de forma segura por punto y coma al final de línea
        $sentencias = array_filter(array_map('trim', explode(";\n", $sqlDepurado)));

        if (empty($sentencias)) {
            throw new Exception("El archivo SQL está vacío o no contiene sentencias válidas.");
        }

        $pdo->beginTransaction();

        // Desactivar temporalmente verificaciones de llaves foráneas y modo estricto si fuera necesario
        $pdo->exec("SET FOREIGN_KEY_CHECKS=0;");
        $pdo->exec("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';");

        $ejecutadas = 0;
        foreach ($sentencias as $sqlStmt) {
            if (empty($sqlStmt)) {
                continue;
            }
            
            // Ejecutar cada sentencia individualmente
            $pdo->exec($sqlStmt);
            $ejecutadas++;
        }

        $pdo->exec("SET FOREIGN_KEY_CHECKS=1;");
        $pdo->commit();

        // Registro de bitácora de la acción exitosa
        if (function_exists('RegistrarBitacoraAccion')) {
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'AJUSTES_DATABASE',
                'RESTAURAR',
                null,
                "Se restauró exitosamente la base de datos a partir del archivo ({$nombreOriginal}).",
                null,
                ['archivo' => $nombreOriginal, 'sentencias_ejecutadas' => $ejecutadas]
            );
        }

        JsonResponse::success("Base de datos restaurada correctamente desde el archivo SQL.", [
            "archivo" => $nombreOriginal,
            "sentencias" => $ejecutadas
        ], 200);

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
            try { $pdo->exec("SET FOREIGN_KEY_CHECKS=1;"); } catch (Throwable $ex) {}
        }

        error_log("Error crítico al restaurar backup SQL: " . $e->getMessage());
        JsonResponse::error('Falló la restauración de la base de datos: ' . $e->getMessage(), null, 500);
    }
}

function Gestionar_Ticket(array $datos): void {
    $rutaFuenteNueva = null; // Para borrarla si algo falla después de moverla
 
    try {
        // 1. Asegurar que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
 
        // 2. Obtener la instancia única de PDO
        $pdo = Conexion();
 
        // 3. Validar sesión activa y obtener usuario y sesión
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);
 
        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
        }
 
        // 4. Permisos (ajusta el nombre del permiso al que uses)
        if (!TienePermiso($pdo, 'configurar_ticket')) {
            JsonResponse::error('No cuentas con los permisos necesarios para modificar la configuración del ticket.', null, 403);
        }
 
        // 5. IP de origen (para la bitácora)
        $ipOrigen = $_SERVER['HTTP_CLIENT_IP']
                    ?? ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null);
        if ($ipOrigen === '::1') {
            $ipOrigen = '127.0.0.1';
        }
 
        // 6. Constantes de validación y almacenamiento (ajusta las rutas a tu proyecto)
        $raizProyecto    = dirname(__DIR__, 4);
        $dirFuentes      = $raizProyecto . '/public/uploads/fuentes';
        $rutaRelativaDir = 'public/uploads/fuentes/';
        $extPermitidas   = ['ttf', 'otf', 'woff', 'woff2'];
        $maxBytesFuente  = 2 * 1024 * 1024;
        $firmasFuente    = ["\x00\x01\x00\x00", 'true', 'OTTO', 'wOFF', 'wOF2']; // TTF, TTF (Mac), OTF, WOFF, WOFF2
        $fuentesBase     = ['Courier New', 'Plus Jakarta Sans', 'Montserrat', 'Arial', 'Consolas'];
        $alineaciones    = ['left', 'center', 'right'];
        $papeles         = ['58mm', '80mm'];
 
        // 7. Extraer y validar campos
        $bool = static fn(string $clave): int => !empty($datos[$clave]) ? 1 : 0;
        $entero = static fn(string $clave, int $min, int $max) => filter_var(
            $datos[$clave] ?? null,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => $min, 'max_range' => $max]]
        );
 
        $espaciadoInicio = $entero('espaciado_inicio', 0, 15);
        $espaciadoFinal  = $entero('espaciado_final', 0, 15);
        $fontSize        = $entero('font_size', 8, 16);
 
        if ($espaciadoInicio === false) {
            JsonResponse::error('Las líneas al principio deben estar entre 0 y 15.', null, 422);
        }
        if ($espaciadoFinal === false) {
            JsonResponse::error('Las líneas al final deben estar entre 0 y 15.', null, 422);
        }
        if ($fontSize === false) {
            JsonResponse::error('El tamaño de fuente debe estar entre 8 y 16 pt.', null, 422);
        }
 
        $tamanoPapel = trim($datos['tamano_papel'] ?? '');
        if (!in_array($tamanoPapel, $papeles, true)) {
            JsonResponse::error('El ancho de papel no es válido.', null, 422);
        }
 
        $alineacionEncabezado = trim($datos['alineacion_encabezado'] ?? '');
        $alineacionPie        = trim($datos['alineacion_pie'] ?? '');
        if (!in_array($alineacionEncabezado, $alineaciones, true) || !in_array($alineacionPie, $alineaciones, true)) {
            JsonResponse::error('La alineación seleccionada no es válida.', null, 422);
        }
 
        // El formulario envía `pie`; en la tabla es `leyenda_pie`. Vacío = NULL.
        $encabezado  = trim($datos['encabezado'] ?? '');
        $leyendaPie  = trim($datos['pie'] ?? '');
        $encabezado  = $encabezado === '' ? null : mb_substr($encabezado, 0, 200);
        $leyendaPie  = $leyendaPie === '' ? null : mb_substr($leyendaPie, 0, 200);
 
        $fontFamily = trim(str_replace(['"', "'", '\\'], '', $datos['font_family'] ?? ''));
        if ($fontFamily === '' || mb_strlen($fontFamily) > 100) {
            JsonResponse::error('La familia de fuente no es válida.', null, 422);
        }
 
        // 8. Configuración anterior (para conservar la fuente y para la bitácora)
        $stmtAnterior = $pdo->prepare("SELECT * FROM ticket WHERE id = 1 LIMIT 1");
        $stmtAnterior->execute();
        $anterior = $stmtAnterior->fetch(PDO::FETCH_ASSOC) ?: null;
 
        $rutaFuenteAnterior   = (string)($anterior['font_family_ruta'] ?? '');
        $familiaFuenteAnterior = (string)($anterior['font_family'] ?? '');
 
        // 9. Fuente: archivo nuevo, fuente personalizada anterior o fuente base
        $archivo = $_FILES['font_file'] ?? null;
        $haySubida = $archivo !== null && ($archivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
 
        if ($haySubida) {
            if ($archivo['error'] !== UPLOAD_ERR_OK) {
                JsonResponse::error('No se pudo subir la fuente (código ' . (int)$archivo['error'] . ').', null, 422);
            }
            if (!is_uploaded_file($archivo['tmp_name'])) {
                JsonResponse::error('El archivo de fuente no es válido.', null, 422);
            }
            if ($archivo['size'] > $maxBytesFuente) {
                JsonResponse::error('La fuente no puede pesar más de 2 MB.', null, 422);
            }
 
            $ext = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
            if (!in_array($ext, $extPermitidas, true)) {
                JsonResponse::error('La fuente debe ser .ttf, .otf, .woff o .woff2.', null, 422);
            }
 
            // Verificar el contenido real (primeros 4 bytes), no solo la extensión
            $gestor = fopen($archivo['tmp_name'], 'rb');
            $cabecera = $gestor ? fread($gestor, 4) : '';
            if ($gestor) {
                fclose($gestor);
            }
            if (!in_array($cabecera, $firmasFuente, true)) {
                JsonResponse::error('El archivo no parece ser una fuente válida.', null, 422);
            }
 
            if (!is_dir($dirFuentes) && !mkdir($dirFuentes, 0755, true) && !is_dir($dirFuentes)) {
                JsonResponse::error('No se pudo preparar la carpeta de fuentes.', null, 500);
            }
 
            $nombreArchivo = 'ticket_' . bin2hex(random_bytes(8)) . '.' . $ext;
            $destino = $dirFuentes . '/' . $nombreArchivo;
 
            if (!move_uploaded_file($archivo['tmp_name'], $destino)) {
                JsonResponse::error('No se pudo guardar el archivo de fuente.', null, 500);
            }
 
            $rutaFuenteNueva = $destino;
            $fontFamilyRuta  = $rutaRelativaDir . $nombreArchivo;
 
        } elseif ($rutaFuenteAnterior !== '' && $fontFamily === $familiaFuenteAnterior) {
            // Sigue usando la fuente personalizada que ya estaba guardada
            $fontFamilyRuta = $rutaFuenteAnterior;
 
        } elseif (in_array($fontFamily, $fuentesBase, true)) {
            // Fuente del sistema: no lleva archivo
            $fontFamilyRuta = '';
 
        } else {
            JsonResponse::error('La fuente seleccionada no es válida.', null, 422);
        }
 
        // Valores finales a guardar
        $valores = [
            'espaciado_inicio'        => $espaciadoInicio,
            'mostrar_logo'            => $bool('mostrar_logo'),
            'encabezado'              => $encabezado,
            'alineacion_encabezado'   => $alineacionEncabezado,
            'mostrar_vendedor'        => $bool('mostrar_vendedor'),
            'mostrar_cliente'         => $bool('mostrar_cliente'),
            'descripcion_completa'    => $bool('descripcion_completa'),
            'mostrar_precio_unitario' => $bool('mostrar_precio_unitario'),
            'tamano_papel'            => $tamanoPapel,
            'font_family_ruta'        => $fontFamilyRuta,
            'font_family'             => $fontFamily,
            'font_size'               => $fontSize,
            'leyenda_pie'             => $leyendaPie,
            'alineacion_pie'          => $alineacionPie,
            'espaciado_final'         => $espaciadoFinal,
        ];
 
        // 10. Guardar (una sola fila: id = 1) dentro de una transacción
        $pdo->beginTransaction();
 
        $sql = "INSERT INTO ticket (
                    id, espaciado_inicio, mostrar_logo, encabezado, alineacion_encabezado,
                    mostrar_vendedor, mostrar_cliente, descripcion_completa, mostrar_precio_unitario,
                    tamano_papel, font_family_ruta, font_family, font_size,
                    leyenda_pie, alineacion_pie, espaciado_final, modificado_por
                ) VALUES (
                    1, :espaciado_inicio, :mostrar_logo, :encabezado, :alineacion_encabezado,
                    :mostrar_vendedor, :mostrar_cliente, :descripcion_completa, :mostrar_precio_unitario,
                    :tamano_papel, :font_family_ruta, :font_family, :font_size,
                    :leyenda_pie, :alineacion_pie, :espaciado_final, :modificado_por
                )
                ON DUPLICATE KEY UPDATE
                    espaciado_inicio        = VALUES(espaciado_inicio),
                    mostrar_logo            = VALUES(mostrar_logo),
                    encabezado              = VALUES(encabezado),
                    alineacion_encabezado   = VALUES(alineacion_encabezado),
                    mostrar_vendedor        = VALUES(mostrar_vendedor),
                    mostrar_cliente         = VALUES(mostrar_cliente),
                    descripcion_completa    = VALUES(descripcion_completa),
                    mostrar_precio_unitario = VALUES(mostrar_precio_unitario),
                    tamano_papel            = VALUES(tamano_papel),
                    font_family_ruta        = VALUES(font_family_ruta),
                    font_family             = VALUES(font_family),
                    font_size               = VALUES(font_size),
                    leyenda_pie             = VALUES(leyenda_pie),
                    alineacion_pie          = VALUES(alineacion_pie),
                    espaciado_final         = VALUES(espaciado_final),
                    modificado_por          = VALUES(modificado_por)";
 
        $stmt = $pdo->prepare($sql);
        foreach ($valores as $clave => $valor) {
            $stmt->bindValue(':' . $clave, $valor, $valor === null ? PDO::PARAM_NULL : (is_int($valor) ? PDO::PARAM_INT : PDO::PARAM_STR));
        }
        $stmt->bindValue(':modificado_por', (int)$usuarioId, PDO::PARAM_INT);
        $stmt->execute();
 
        // Registro centralizado de bitácora y auditoría
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'TICKET',
            'ACTUALIZAR',
            null,
            "Se actualizó la configuración del ticket (IP: {$ipOrigen}).",
            $anterior,
            $valores
        );
 
        $pdo->commit();
 
        // 11. Con todo confirmado, borrar la fuente anterior si ya no se usa
        if ($rutaFuenteAnterior !== '' && $rutaFuenteAnterior !== $fontFamilyRuta) {
            $archivoViejo = realpath($raizProyecto . '/' . $rutaFuenteAnterior);
            $carpetaBase  = realpath($dirFuentes);
            if ($archivoViejo && $carpetaBase
                && strpos($archivoViejo, $carpetaBase . DIRECTORY_SEPARATOR) === 0
                && is_file($archivoViejo)) {
                @unlink($archivoViejo);
            }
        }
 
        JsonResponse::success('Configuración del ticket actualizada exitosamente.', [
            'ticket' => $valores
        ]);
 
    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if ($rutaFuenteNueva !== null && is_file($rutaFuenteNueva)) {
            @unlink($rutaFuenteNueva);
        }
        error_log("Error de BD al guardar la configuración del ticket: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);
 
    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if ($rutaFuenteNueva !== null && is_file($rutaFuenteNueva)) {
            @unlink($rutaFuenteNueva);
        }
        error_log("Error crítico al guardar la configuración del ticket: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}
function Obtener_Configuracion_Ticket(): array {
    try {
        $pdo = Conexion();
        
        $sql = "SELECT * FROM ticket WHERE id = 1 LIMIT 1";
        $stmt = $pdo->query($sql);
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$config) {
            $config = [
                'id' => 1,
                'espaciado_inicio' => 1,
                'mostrar_logo' => 1,
                'encabezado' => '',
                'alineacion_encabezado' => 'left',
                'mostrar_vendedor' => 1,
                'mostrar_cliente' => 0,
                'descripcion_completa' => 1,
                'mostrar_precio_unitario' => 1,
                'tamano_papel' => '80mm',
                'font_family_ruta' => '',
                'font_family' => 'Courier New',
                'font_size' => 10,
                'leyenda_pie' => '',
                'alineacion_pie' => 'center',
                'espaciado_final' => 3,
                'font_url' => ''
            ];
        } else {
            // Asignamos directamente la ruta limpiando barras iniciales sobrantes
            $rutaRelativa = trim($config['font_family_ruta'] ?? '');
            
            if (!empty($rutaRelativa)) {
                // Si la ruta no empieza con http ni con barra, aseguramos el formato web correcto
                if (!str_starts_with($rutaRelativa, 'http') && !str_starts_with($rutaRelativa, '/')) {
                    $config['font_url'] = '/' . ltrim($rutaRelativa, '/');
                } else {
                    $config['font_url'] = $rutaRelativa;
                }
            } else {
                $config['font_url'] = '';
            }
        }

        return $config;
    } catch (Throwable $e) {
        error_log("Error al obtener la configuración del ticket: " . $e->getMessage());
        JsonResponse::error('Error al cargar la configuración del ticket: ' . $e->getMessage(), null, 500);
        return [];
    }
}