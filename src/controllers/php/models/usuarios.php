<?php 
/**
 * Obtiene el listado completo de usuarios registrados en el sistema, 
 * marcando con una bandera (es_usuario_actual) al usuario que tiene la sesión activa.
 * 
 * @return array Arreglo asociativo con los datos de los usuarios.
 */
function Obtener_Usuarios(): array {
    try {
        // Asegurarse de que la sesión esté iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Extraemos el ID del usuario actual basándonos en tu estructura de sesión
        $usuarioActualId = (int)($_SESSION['usuario']['id'] ?? $_SESSION['usuario_id'] ?? $_SESSION['ID'] ?? 0);

        $sql = "SELECT 
                    ID, 
                    nombre, 
                    apellido_paterno, 
                    apellido_materno, 
                    fecha_nacimiento, 
                    curp, 
                    rfc, 
                    telefono, 
                    correo, 
                    correo_verificado, 
                    nombre_usuario, 
                    Fecha_registro, 
                    Ultima_modificacion, 
                    Habilitado,
                    CASE 
                        WHEN ID = $usuarioActualId THEN 1 
                        ELSE 0 
                    END AS es_usuario_actual
                FROM usuarios 
                ORDER BY ID DESC";

        // Ejecutamos la consulta con tu helper
        $usuarios = Consultar_PDO($sql);

        // Verificamos que el resultado sea un arreglo válido
        return is_array($usuarios) ? $usuarios : [];

    } catch (Throwable $e) {
        // Registramos el error internamente y retornamos un array vacío
        error_log("Error crítico al obtener usuarios: " . $e->getMessage());
        return [];
    }
}
/**
 * Genera un nombre de usuario aleatorio y limpio basado en un arreglo de parámetros ($params).
 * 
 * @param array $params Arreglo con 'nombre', 'apellido_paterno', 'apellido_materno' y 'fecha_nacimiento'.
 * @return string Nombre de usuario generado en minúsculas y sin acentos.
 */
function Generar_Usuario_Aleatorio(array $params): string {
    // 1. Extracción y saneamiento inicial desde el array de parámetros
    $nombre          = trim($params['nombre'] ?? '');
    $apellidoPaterno = trim($params['apellido_paterno'] ?? '');
    $apellidoMaterno = trim($params['apellido_materno'] ?? '');
    $fechaNacimiento = trim($params['fecha_nacimiento'] ?? '');

    // 2. Función interna para limpiar acentos, espacios y caracteres especiales
    $limpiarTexto = function(string $texto): string {
        $texto = trim(mb_strtolower($texto, 'UTF-8'));
        $originales  = ['à', 'è', 'ì', 'ò', 'ù', 'á', 'é', 'í', 'ó', 'ú', 'ñ', 'ä', 'ë', 'ï', 'ö', 'ü'];
        $modificadas = ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'i', 'o', 'u', 'n', 'a', 'e', 'i', 'o', 'u'];
        $texto = str_replace($originales, $modificadas, $texto);
        return preg_replace('/[^a-z0-9]/', '', $texto);
    };

    $nombreLimpio  = $limpiarTexto($nombre);
    $paternoLimpio = $limpiarTexto($apellidoPaterno);
    $maternoLimpio = $limpiarTexto($apellidoMaterno);

    // 3. Extraer inicial del nombre y primer apellido completo (ej. jhernandez)
    $inicialNombre = !empty($nombreLimpio) ? mb_substr($nombreLimpio, 0, 1) : 'u';
    $baseUsuario   = $inicialNombre . $paternoLimpio;

    // Si el apellido paterno está vacío, intentamos usar parte del nombre
    if ($paternoLimpio === '') {
        $baseUsuario = !empty($nombreLimpio) ? mb_substr($nombreLimpio, 0, 4) : 'user';
    }

    // 4. Extraer los últimos 2 dígitos del año de nacimiento si se proporciona una fecha válida
    $sufijoFecha = '';
    if (!empty($fechaNacimiento)) {
        try {
            $date = new DateTime($fechaNacimiento);
            $sufijoFecha = $date->format('y'); // Ej: 98 (para 1998)
        } catch (Exception $e) {
            // Si la fecha es inválida, se omite el sufijo
        }
    }

    // 5. Agregar un número aleatorio corto de 2 dígitos para garantizar unicidad
    $sufijoAleatorio = mt_rand(10, 99);

    return $baseUsuario . $sufijoFecha . $sufijoAleatorio;
}

function Gestionar_Usuario($data) {
    $ejecutar         = $data['ejecutar'] ?? '';
    $usuarioSesionId = $data['sesion_usuario_id'] ?? null;
    $sesionId        = $data['sesion_id'] ?? null;
    $id_usuario      = $data['id'] ?? null;

    $nombre           = trim($data['nombre'] ?? '');
    $apellido_paterno = trim($data['apellido_paterno'] ?? '');
    $apellido_materno = trim($data['apellido_materno'] ?? '');
    $fecha_nacimiento = !empty($data['fecha_nacimiento']) ? $data['fecha_nacimiento'] : null;
    $curp             = trim($data['curp'] ?? '');
    $rfc              = trim($data['rfc'] ?? '');
    $telefono         = trim($data['telefono'] ?? '');
    $correo           = trim($data['correo'] ?? '');
    $usuario          = trim($data['usuario'] ?? '');

    if (!empty($correo) && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        JsonResponse::error('El formato del correo electrónico no es válido.');
    }

    try {
        if ($ejecutar === 'crear_usuario') {
            $password       = $data['password'] ?? '';
            $confirmar_pass = $data['confirmar_password'] ?? '';
            $pin            = trim($data['pin'] ?? '');
            $confirmar_pin  = trim($data['confirmar_pin'] ?? '');

            if (empty($password) || $password !== $confirmar_pass) {
                JsonResponse::error('Las contraseñas no coinciden o están vacías.');
            }
            if (empty($pin) || $pin !== $confirmar_pin) {
                JsonResponse::error('El PIN de seguridad no coincide o está vacío.');
            }

            $passwordHash = password_hash($password, PASSWORD_BCRYPT);
            $pinHash      = password_hash($pin, PASSWORD_BCRYPT);

            // A. Insertar usuario completo
            $sqlUser = "INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, fecha_nacimiento, curp, rfc, telefono, correo, nombre_usuario) 
                        VALUES (:nombre, :ap_pat, :ap_mat, :fec_nac, :curp, :rfc, :tel, :correo, :usuario)";
            
            $paramsUser = [
                ':nombre'  => $nombre !== '' ? $nombre : null,
                ':ap_pat'  => $apellido_paterno !== '' ? $apellido_paterno : null,
                ':ap_mat'  => $apellido_materno !== '' ? $apellido_materno : null,
                ':fec_nac' => $fecha_nacimiento,
                ':curp'    => $curp !== '' ? $curp : null,
                ':rfc'     => $rfc !== '' ? $rfc : null,
                ':tel'     => $telefono !== '' ? $telefono : null,
                ':correo'  => $correo !== '' ? $correo : null,
                ':usuario' => $usuario !== '' ? $usuario : null,
            ];

            $nuevoIdUsuario = Consultar_PDO($sqlUser, $paramsUser, true);
            if (!$nuevoIdUsuario) {
                JsonResponse::error('No se pudo registrar el usuario en la base de datos.');
            }

            // B. Insertar credenciales
            $sqlPass = "INSERT INTO usuarios_password (usuario_id, password, pin, ultima_modificacion_password, ultima_modificacion_pin) 
                        VALUES (:u_id, :pass, :pin, NOW(), NOW())";
            Consultar_PDO($sqlPass, [':u_id' => $nuevoIdUsuario, ':pass' => $passwordHash, ':pin' => $pinHash]);

            // C. Permisos automáticos si es el primer usuario
            if ($nuevoIdUsuario == 1) {
                $todosPermisos = Consultar_PDO("SELECT id FROM permisos", []);
                if (!empty($todosPermisos)) {
                    foreach ($todosPermisos as $permiso) {
                        Consultar_PDO("INSERT IGNORE INTO usuarios_permisos (usuario_id, permiso_id) VALUES (:u_id, :p_id)", [
                            ':u_id' => $nuevoIdUsuario, ':p_id' => $permiso['id']
                        ]);
                    }
                }
            }

            // D. REGISTRO DE BITÁCORA
            $actorId = $usuarioSesionId ?: $nuevoIdUsuario;
            RegistrarBitacoraAccion(
                $actorId, $sesionId, 'USUARIOS', 'CREAR', $nuevoIdUsuario, 
                "Se creó el usuario: {$usuario} (ID: {$nuevoIdUsuario})", null, $paramsUser
            );

            JsonResponse::success('Usuario creado exitosamente.', $usuario);

        } 
        // =========================================================
        // EDICIÓN POR SECCIONES
        // =========================================================
        else if ($ejecutar === 'editar_informacion_basica' || $ejecutar === 'editar_identidad' || $ejecutar === 'editar_contacto' || $ejecutar === 'editar_usuario') {
            if (empty($id_usuario)) {
                JsonResponse::error('ID de usuario no proporcionado para la actualización.');
            }

            $actorId = $usuarioSesionId ?: $id_usuario;

            // 1. SECCIÓN: INFORMACIÓN BÁSICA (Nombre, Apellidos, Fecha de nacimiento)
            if ($ejecutar === 'editar_informacion_basica') {
                $valorAnteriorData = Consultar_PDO("SELECT nombre, apellido_paterno, apellido_materno, fecha_nacimiento FROM usuarios WHERE ID = :id", [':id' => $id_usuario], false);

                $sqlUser = "UPDATE usuarios SET nombre = :nombre, apellido_paterno = :ap_pat, apellido_materno = :ap_mat, fecha_nacimiento = :fec_nac WHERE ID = :id";
                $paramsUser = [
                    ':nombre'  => $nombre !== '' ? $nombre : null,
                    ':ap_pat'  => $apellido_paterno !== '' ? $apellido_paterno : null,
                    ':ap_mat'  => $apellido_materno !== '' ? $apellido_materno : null,
                    ':fec_nac' => $fecha_nacimiento,
                    ':id'      => $id_usuario
                ];

                Consultar_PDO($sqlUser, $paramsUser);

                RegistrarBitacoraAccion(
                    $actorId, $sesionId, 'USUARIOS', 'EDITAR_BASICA', $id_usuario, 
                    "Se actualizó la información básica del usuario ID: {$id_usuario}", $valorAnteriorData, $paramsUser
                );

                JsonResponse::success('Información básica actualizada correctamente.');
            }

            // 2. SECCIÓN: IDENTIDAD (CURP, RFC)
            else if ($ejecutar === 'editar_identidad') {
                $valorAnteriorData = Consultar_PDO("SELECT curp, rfc FROM usuarios WHERE ID = :id", [':id' => $id_usuario], false);

                $sqlUser = "UPDATE usuarios SET curp = :curp, rfc = :rfc WHERE ID = :id";
                $paramsUser = [
                    ':curp' => $curp !== '' ? $curp : null,
                    ':rfc'  => $rfc !== '' ? $rfc : null,
                    ':id'   => $id_usuario
                ];

                Consultar_PDO($sqlUser, $paramsUser);

                RegistrarBitacoraAccion(
                    $actorId, $sesionId, 'USUARIOS', 'EDITAR_IDENTIDAD', $id_usuario, 
                    "Se actualizó la identidad (CURP/RFC) del usuario ID: {$id_usuario}", $valorAnteriorData, $paramsUser
                );

                JsonResponse::success('Identidad actualizada correctamente.');
            }

            // 3. SECCIÓN: CONTACTO (Teléfono, Correo)
            else if ($ejecutar === 'editar_contacto') {
                $valorAnteriorData = Consultar_PDO("SELECT telefono, correo FROM usuarios WHERE ID = :id", [':id' => $id_usuario], false);

                $sqlUser = "UPDATE usuarios SET telefono = :tel, correo = :correo WHERE ID = :id";
                $paramsUser = [
                    ':tel'    => $telefono !== '' ? $telefono : null,
                    ':correo' => $correo !== '' ? $correo : null,
                    ':id'     => $id_usuario
                ];

                Consultar_PDO($sqlUser, $paramsUser);

                RegistrarBitacoraAccion(
                    $actorId, $sesionId, 'USUARIOS', 'EDITAR_CONTACTO', $id_usuario, 
                    "Se actualizó la información de contacto del usuario ID: {$id_usuario}", $valorAnteriorData, $paramsUser
                );

                JsonResponse::success('Información de contacto actualizada correctamente.');
            }

            // 4. EDICIÓN GENERAL (Por si mantienes un botón global que actualiza todo)
            else {
                $valorAnteriorData = Consultar_PDO("SELECT nombre, apellido_paterno, apellido_materno, fecha_nacimiento, curp, rfc, telefono, correo, nombre_usuario FROM usuarios WHERE ID = :id", [':id' => $id_usuario], false);

                $sqlUser = "UPDATE usuarios SET nombre = :nombre, apellido_paterno = :ap_pat, apellido_materno = :ap_mat, fecha_nacimiento = :fec_nac, curp = :curp, rfc = :rfc, telefono = :tel, correo = :correo, nombre_usuario = :usuario WHERE ID = :id";
                
                $paramsUser = [
                    ':nombre'  => $nombre !== '' ? $nombre : null,
                    ':ap_pat'  => $apellido_paterno !== '' ? $apellido_paterno : null,
                    ':ap_mat'  => $apellido_materno !== '' ? $apellido_materno : null,
                    ':fec_nac' => $fecha_nacimiento,
                    ':curp'    => $curp !== '' ? $curp : null,
                    ':rfc'     => $rfc !== '' ? $rfc : null,
                    ':tel'     => $telefono !== '' ? $telefono : null,
                    ':correo'  => $correo !== '' ? $correo : null,
                    ':usuario' => $usuario !== '' ? $usuario : null,
                    ':id'      => $id_usuario
                ];

                Consultar_PDO($sqlUser, $paramsUser);

                RegistrarBitacoraAccion(
                    $actorId, $sesionId, 'USUARIOS', 'EDITAR', $id_usuario, 
                    "Se actualizaron todos los datos del usuario ID: {$id_usuario}", $valorAnteriorData, $paramsUser
                );

                JsonResponse::success('Usuario actualizado correctamente.', $usuario);
            }
        } else {
            JsonResponse::error('Acción no reconocida.');
        }

    } catch (Exception $e) {
        $mensajeError = $e->getMessage();
        $respuestaAmigable = 'Ocurrió un error al procesar la solicitud.';
        if (strpos($mensajeError, '23000') !== false || strpos($mensajeError, 'Duplicate entry') !== false) {
            $respuestaAmigable = 'El correo, nombre de usuario, teléfono, CURP o RFC ya se encuentran registrados.';
        }
        JsonResponse::error($respuestaAmigable, $mensajeError, 500);
    }
}

function Obtener_Usuarios_Paginados(array $params = []): void {
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Obtener el ID del usuario actual logueado desde la sesión (por defecto 0 si no existe)
        $usuarioActualId = (int)($_SESSION['usuario']['id'] ?? ($_SESSION['user_id'] ?? ($_SESSION['id_usuario'] ?? ($_SESSION['id'] ?? 0))));

        // Unificamos si los filtros vienen anidados o planos desde el request JS
        if (isset($params['filtros']) && is_array($params['filtros'])) {
            $params = array_merge($params, $params['filtros']);
        }

        // Array para acumular todas las condiciones SQL personalizadas
        $condicionesExtra = [];

        // 1. Procesamiento de Estado / Habilitado
        if (isset($params['Habilitado']) || isset($params['habilitado'])) {
            $estadoVal = $params['Habilitado'] ?? $params['habilitado'];
            if ($estadoVal !== '' && $estadoVal !== null) {
                $condicionesExtra[] = "Habilitado = " . (int)$estadoVal;
            }
            unset($params['Habilitado'], $params['habilitado']);
        }

        // 2. Procesamiento de Verificación de Correo
        if (isset($params['f-correo-verificado']) || isset($params['correo_verificado'])) {
            $verifVal = $params['f-correo-verificado'] ?? $params['correo_verificado'];
            if ($verifVal !== '' && $verifVal !== null) {
                $condicionesExtra[] = "correo_verificado = " . (int)$verifVal;
            }
            unset($params['f-correo-verificado'], $params['correo_verificado']);
        }

        // Inyectamos todas las condiciones acumuladas en custom_where
        $customWhereSQL = "";
        if (!empty($condicionesExtra)) {
            $customWhereSQL = implode(" AND ", $condicionesExtra);
            $params['custom_where'] = $customWhereSQL;
        }

        // 3. Whitelists de seguridad adaptadas a la tabla usuarios
        $configuracionSeguridad = [
            'columnas_busqueda' => [
                'nombre', 
                'apellido_paterno', 
                'apellido_materno', 
                'nombre_usuario', 
                'correo', 
                'rfc', 
                'curp',
                'telefono'
            ],
            'filtros_permitidos' => [],
            'columnas_orden' => [
                'ID', 
                'nombre', 
                'apellido_paterno', 
                'nombre_usuario', 
                'correo', 
                'Fecha_registro'
            ]
        ];

        // 4. Ejecutamos la paginación normal para la tabla usuarios
        $resultado = PaginacionService::obtenerPaginados('usuarios', $params, $configuracionSeguridad);

        if ($resultado['exito']) {
            // Procesar los datos de la página actual
            if (!empty($resultado['datos']) && is_array($resultado['datos'])) {
                foreach ($resultado['datos'] as &$usuario) {
                    $idUsuario = (int)($usuario['ID'] ?? $usuario['id'] ?? 0);
                    
                    // 🌟 Bandera de usuario actual (1 si coincide, 0 si no)
                    $usuario['es_actual'] = ($idUsuario === $usuarioActualId) ? 1 : 0;

                    // Construir nombre completo
                    $partes = [
                        $usuario['nombre'] ?? '',
                        $usuario['apellido_paterno'] ?? '',
                        $usuario['apellido_materno'] ?? ''
                    ];
                    $usuario['nombre_completo'] = trim(implode(' ', array_filter($partes)));

                    // Formato de verificación de correo
                    $verificado = (int)($usuario['correo_verificado'] ?? 0);
                    $usuario['correo_verificado_fmt'] = $verificado === 1 ? 'VERIFICADO' : 'NO VERIFICADO';

                    // Formatear la fecha de registro si existe la función
                    if (!empty($usuario['Fecha_registro']) && function_exists('FormatearFechaEspanol')) {
                        $usuario['Fecha_registro'] = FormatearFechaEspanol($usuario['Fecha_registro'], true, true);
                    }
                }
                unset($usuario);

                // 🌟 Ordenar para que el usuario actual aparezca siempre en la primera posición del array
                if ($usuarioActualId > 0) {
                    usort($resultado['datos'], function($a, $b) use ($usuarioActualId) {
                        $idA = (int)($a['ID'] ?? $a['id'] ?? 0);
                        $idB = (int)($b['ID'] ?? $b['id'] ?? 0);

                        if ($idA === $usuarioActualId) return -1;
                        if ($idB === $usuarioActualId) return 1;
                        return 0;
                    });
                }
            }

            // 5. OBTENER EL UNIVERSO COMPLETO DE IDS FILTRADOS DE TODAS LAS PÁGINAS
            $todosLosIds = [];
            
            try {
                $sqlTodosIds = "SELECT ID FROM usuarios";
                $whereParts = [];

                if (!empty($customWhereSQL)) {
                    $whereParts[] = $customWhereSQL;
                }

                $terminoBusqueda = $params['buscar'] ?? $params['search'] ?? '';
                if (!empty($terminoBusqueda)) {
                    $terminoEscapado = '%' . addslashes($terminoBusqueda) . '%';
                    $whereParts[] = "(nombre LIKE '$terminoEscapado' OR apellido_paterno LIKE '$terminoEscapado' OR apellido_materno LIKE '$terminoEscapado' OR nombre_usuario LIKE '$terminoEscapado' OR correo LIKE '$terminoEscapado' OR rfc LIKE '$terminoEscapado' OR curp LIKE '$terminoEscapado' OR telefono LIKE '$terminoEscapado')";
                }

                if (!empty($whereParts)) {
                    $sqlTodosIds .= " WHERE " . implode(" AND ", $whereParts);
                }

                // Obtención de la conexión PDO priorizando el helper global Conexion()
                $conexionDb = null;
                if (function_exists('Conexion')) {
                    $conexionDb = Conexion();
                } elseif (class_exists('Database') && method_exists('Database', 'getConnection')) {
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
                error_log("Aviso al consultar todos los IDs globales de usuarios: " . $exQuery->getMessage());
            }

            // Fallback de seguridad: Si la consulta global falló, extraemos los IDs del resultado paginado actual
            if (empty($todosLosIds) && !empty($resultado['datos'])) {
                $todosLosIds = array_map(function($row) { 
                    return strval($row['ID'] ?? $row['id'] ?? ''); 
                }, $resultado['datos']);
            }

            // 6. Respuesta exitosa incluyendo 'todos_los_ids' y 'usuario_actual_id'
            JsonResponse::success("Usuarios obtenidos correctamente", [
                'datos' => $resultado['datos'],
                'paginacion' => $resultado['paginacion'],
                'todos_los_ids' => $todosLosIds,
                'usuario_actual_id' => $usuarioActualId,
                'params' => $params
            ]);
        } else {
            JsonResponse::error("Ocurrió un error al consultar los usuarios", null, 500);
        }

    } catch (Throwable $e) {
        error_log("Error en Obtener_Usuarios_Paginados: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al obtener los usuarios", $e->getMessage(), 500);
    }
}

function Obtener_Informacion_Usuario($datos): void {
    try {
        // 1. Obtener y validar el ID enviado por el request
        $id = (int)($datos['id'] ?? 0);

        if ($id <= 0) {
            JsonResponse::error('ID de usuario no válido.');
            return;
        }

        // 2. Definir la consulta SQL para la tabla usuarios
        $sql = "SELECT 
                    ID, 
                    nombre, 
                    apellido_paterno, 
                    apellido_materno, 
                    nombre_usuario, 
                    correo, 
                    correo_verificado,
                    telefono, 
                    curp,
                    rfc,
                    fecha_nacimiento,
                    Habilitado, 
                    Fecha_registro, 
                    TRIM(CONCAT(nombre, ' ', COALESCE(apellido_paterno, ''), ' ', COALESCE(apellido_materno, ''))) AS nombre_completo
                FROM usuarios 
                WHERE ID = :id 
                LIMIT 1";

        // 3. Ejecutar mediante el helper Consultar_PDO
        $resultado = Consultar_PDO($sql, [':id' => $id]);

        // 4. Validar si se encontró el registro
        if (is_array($resultado) && count($resultado) > 0) {
            JsonResponse::success('Usuario obtenido correctamente.', $resultado[0]);
        } else {
            JsonResponse::error('El usuario solicitado no existe.', null, 404);
        }

    } catch (Throwable $e) {
        // 5. Manejo de excepciones y registro interno
        error_log("Error crítico al obtener el usuario por ID: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error en el servidor al obtener la información del usuario.', null, 500);
    }
}



function Procesar_Reset_Administrador($data): void
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Recibir parámetros POST
        $usuarioId = (int)($data['usuario_id'] ?? 0);
        $tipoReseteo = trim($data['tipo'] ?? 'password'); // 'password' o 'pin'

        if ($usuarioId <= 0) {
            JsonResponse::error("ID de usuario inválido.", null, 400);
            return;
        }

        // Mapear el tipo de reseteo al tipo de token en base de datos
        $tipoToken = ($tipoReseteo === 'pin') ? 'pin_reset' : 'password_reset';
        $etiquetaTipo = ($tipoReseteo === 'pin') ? 'PIN' : 'Contraseña';

        // 2. Buscar al usuario y validar correo
        $sqlUser = "SELECT ID, correo, nombre_usuario, Habilitado FROM usuarios WHERE ID = :id LIMIT 1";
        $resultadoUser = Consultar_PDO($sqlUser, [':id' => $usuarioId]);

        if (empty($resultadoUser)) {
            JsonResponse::error("El usuario no existe en el sistema.", null, 404);
            return;
        }

        $usuario = $resultadoUser[0];

        if ((int)$usuario['Habilitado'] === 0) {
            JsonResponse::error("No se puede procesar: la cuenta está deshabilitada.", null, 403);
            return;
        }

        $correoDestino = $usuario['correo'];
        if (empty($correoDestino)) {
            JsonResponse::error("El usuario no cuenta con un correo electrónico registrado.", null, 400);
            return;
        }

        // PASO 1: Generar o recuperar el token vigente mediante tu función modular
        $minutosExpiracion = 30;
        $resultadoToken = Generar_Y_Guardar_Token($usuarioId, $tipoToken, $minutosExpiracion);

        if (!$resultadoToken || empty($resultadoToken['token'])) {
            JsonResponse::error("No se pudo obtener el código de restablecimiento.", null, 500);
            return;
        }

        $tokenGenerado = $resultadoToken['token'];

        // Consultar la fecha de expiración real directamente de la base de datos
        $sqlExpiracion = "SELECT fecha_expiracion FROM tokens_usuarios 
                          WHERE usuario_id = :usuario_id AND tipo = :tipo AND token = :token AND usado = 0 
                          LIMIT 1";
        
        $resTokenDb = Consultar_PDO($sqlExpiracion, [
            'usuario_id' => $usuarioId,
            'tipo'       => $tipoToken,
            'token'      => $tokenGenerado
        ]);

        if (!empty($resTokenDb)) {
            $fechaExpDb = $resTokenDb[0]['fecha_expiracion'];
            $horaExpira = date('H:i:s', strtotime($fechaExpDb));
        } else {
            $horaExpira = date('H:i:s', time() + ($minutosExpiracion * 60));
        }

        // Obtener el dominio dinámicamente de forma segura
        $protocolo = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        
        // Obtener la ruta base del proyecto de manera dinámica (opcional, ajusta según la estructura de tus carpetas)
        $directorioScript = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
        // O si prefieres apuntar directamente a una ruta estática dentro de tu app:
        $rutaBase = $protocolo . $host; 

        // Cifrar el token usando tu función Cifrar_Payload()
        $tokenCifrado = Cifrar_Payload($tokenGenerado);

        // Construir el enlace de restablecimiento dinámico con el token cifrado
        $enlace = "{$rutaBase}/punto_1/public/pages/auth/{$tipoToken}.php?token=" . urlencode($tokenCifrado);

        // Obtener el nombre del remitente desde las variables de entorno con respaldo
        $nombreRemitente = $_ENV['SMTP_FROM_NAME'] ?? getenv('SMTP_FROM_NAME') ?? 'Sistema';

        // PASO 2: Preparar la plantilla HTML integrando el botón y el remitente dinámico
        $cuerpoHtml = '
            <div style="font-family:\'Montserrat\', Arial, sans-serif; max-width:600px; margin:auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color:#03618d; text-align:center;">Restablecimiento de ' . $etiquetaTipo . '</h2>
                <p>Hola <strong>{{nombre}}</strong>,</p>
                <p>Un administrador ha solicitado restablecer tu ' . strtolower($etiquetaTipo) . '. Haz clic en el siguiente botón para continuar:</p>
                
                <div style="text-align:center; margin:25px 0;">
                    <a href="{{enlace}}" style="background-color:#03618d; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">Restablecer ' . $etiquetaTipo . '</a>
                </div>

                <p style="font-size:13px; color:#555; text-align:center; word-break:break-all;">
                    O copia y pega este enlace en tu navegador:<br><a href="{{enlace}}" style="color:#03618d;">{{enlace}}</a>
                </p>

                <p style="text-align:center; background:#c7e0f4; padding:10px; border-radius:8px; color:#0f172a; margin-top:20px;">
                    Válido hasta las <strong>{{hora_expira}}</strong> ({{minutos}} minutos)
                </p>
                <p style="font-size:13px; color:#555; margin-top: 20px;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
                <p style="margin-top: 30px; font-weight: bold; color: #334155;">{{remitente}}</p>
            </div>
        ';

        // Estructura de datos que espera tu función Enviar_Correo($data)
        $datosCorreo = [
            'destinatario_email'  => $correoDestino,
            'destinatario_nombre' => $usuario['nombre_usuario'],
            'asunto'              => "Restablecimiento de {$etiquetaTipo} - {$nombreRemitente}",
            'cuerpo_html'         => $cuerpoHtml,
            'variables'           => [
                'nombre'       => $usuario['nombre_usuario'],
                'enlace'       => $enlace,
                'hora_expira'  => $horaExpira,
                'minutos'      => $minutosExpiracion,
                'remitente'    => $nombreRemitente
            ]
        ];

        // Llamamos a tu servicio centralizado de correo
        Enviar_Correo($datosCorreo);

    } catch (Throwable $e) {
        error_log("Error en Procesar_Reset_Administrador: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al procesar el restablecimiento.", $e->getMessage(), 500);
    }
}

function Actualizar_Password_Reset(array $data): void
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Validar que existan las variables de sesión del token validado sin traslapes
        if (empty($_SESSION['token_reset_valido']) || empty($_SESSION['usuario_reset_id']) || empty($_SESSION['token_reset_id'])) {
            JsonResponse::error("La sesión de restablecimiento ha expirado o no es válida.", null, 401);
            return;
        }

        $tokenPlano = $_SESSION['token_reset_valido'];
        $usuarioId = (int)$_SESSION['usuario_reset_id'];
        $tokenId = (int)$_SESSION['token_reset_id'];

        // 2. Recibir y validar las contraseñas del POST
        $password = trim($data['password'] ?? '');
        $confirmar = trim($data['confirmar'] ?? '');

        if (empty($password) || empty($confirmar)) {
            JsonResponse::error("Todos los campos son obligatorios.", null, 400);
            return;
        }

        if ($password !== $confirmar) {
            JsonResponse::error("Las contraseñas no coinciden.", null, 400);
            return;
        }

        // Validación estricta de seguridad de la contraseña
        if (
            strlen($password) < 10 ||
            !preg_match('/[A-Z]/', $password) ||
            !preg_match('/[a-z]/', $password) ||
            !preg_match('/\d/', $password) ||
            !preg_match('/[$@$!%*?&#._-]/', $password)
        ) {
            JsonResponse::error("La contraseña no cumple con los requisitos mínimos de seguridad.", null, 400);
            return;
        }

        // 3. Verificar que la nueva contraseña no sea idéntica a la actual
        $sqlPassActual = "SELECT password FROM usuarios_password WHERE usuario_id = :id LIMIT 1";
        $resPassActual = Consultar_PDO($sqlPassActual, [':id' => $usuarioId]);

        if (!empty($resPassActual) && !empty($resPassActual[0]['password'])) {
            if (password_verify($password, $resPassActual[0]['password'])) {
                JsonResponse::error("La nueva contraseña no puede ser igual a la contraseña actual.", null, 400);
                return;
            }
        }

        // 4. Generar el hash seguro de la contraseña
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        // 5. Obtener datos para la bitácora (IP de origen y sesión)
        $ipOrigen = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $sesionId = session_id() ?: null;

        // 6. Transacción segura en la base de datos
        $pdo = Conexion();
        $pdo->beginTransaction();

        try {
            // A. Actualizar la contraseña en la tabla usuarios_password (o insertarla si no existiera registro previo)
            if (!empty($resPassActual)) {
                Consultar_PDO("UPDATE usuarios_password SET password = :pass, ultima_modificacion_password = NOW() WHERE usuario_id = :id", [
                    ':pass' => $passwordHash,
                    ':id'   => $usuarioId
                ]);
            } else {
                Consultar_PDO("INSERT INTO usuarios_password (usuario_id, password, ultima_modificacion_password) VALUES (:id, :pass, NOW())", [
                    ':id'   => $usuarioId,
                    ':pass' => $passwordHash
                ]);
            }

            // B. Marcar específicamente este token como usado mediante su ID único
            Consultar_PDO("UPDATE tokens_usuarios SET usado = 1 WHERE id = :token_id AND usuario_id = :usuario_id", [
                ':token_id'   => $tokenId,
                ':usuario_id' => $usuarioId
            ]);

            // C. Registrar la acción en la bitácora del sistema
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'SEGURIDAD_ACCESO',
                'ACTUALIZAR',
                null,
                "Se actualizó la contraseña del usuario mediante enlace de recuperación (IP: {$ipOrigen}).",
                null,
                ['usuario_id' => $usuarioId]
            );

            $pdo->commit();
        } catch (Throwable $txEx) {
            $pdo->rollBack();
            throw $txEx;
        }

        // 7. Limpiar las variables de sesión del reseteo para evitar re-envíos o traslapes
        unset($_SESSION['token_reset_valido'], $_SESSION['usuario_reset_id'], $_SESSION['token_reset_id']);

        // 8. Responder de manera exitosa
        JsonResponse::success("Contraseña actualizada exitosamente. Ya puedes iniciar sesión.", [
            'redirigir' => 'login.php'
        ], 200);

    } catch (Throwable $e) {
        error_log("Error en Actualizar_Password_Reset: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al actualizar la contraseña.", $e->getMessage(), 500);
    }
}

function Actualizar_Pin_Reset(array $data): void
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Validar que existan las variables de sesión del token validado sin traslapes
        if (empty($_SESSION['token_reset_valido']) || empty($_SESSION['usuario_reset_id']) || empty($_SESSION['token_reset_id'])) {
            JsonResponse::error("La sesión de restablecimiento ha expirado o no es válida.", null, 401);
            return;
        }

        $tokenPlano = $_SESSION['token_reset_valido'];
        $usuarioId = (int)$_SESSION['usuario_reset_id'];
        $tokenId = (int)$_SESSION['token_reset_id'];

        // 2. Recibir y validar el PIN del POST
        $pin = trim($data['pin'] ?? '');
        $confirmar = trim($data['confirmar'] ?? '');

        if (empty($pin) || empty($confirmar)) {
            JsonResponse::error("Todos los campos son obligatorios.", null, 400);
            return;
        }

        if ($pin !== $confirmar) {
            JsonResponse::error("Los PINs no coinciden.", null, 400);
            return;
        }

        // Validación estricta del PIN (exactamente 4 dígitos numéricos)
        if (!preg_match('/^\d{4}$/', $pin)) {
            JsonResponse::error("El PIN debe ser exactamente de 4 dígitos numéricos.", null, 400);
            return;
        }

        // Validar números consecutivos y repetidos en servidor por seguridad
        $ascendentes = "012345678901234567890123456789";
        $descendentes = "987654321098765432109876543210";
        $esConsecutivo = false;
        for ($i = 0; $i <= strlen($ascendentes) - 4; $i++) {
            if ($pin === substr($ascendentes, $i, 4) || $pin === substr($descendentes, $i, 4)) {
                $esConsecutivo = true;
                break;
            }
        }

        $esRepetido = (string)$pin[0] === (string)$pin[1] && 
                      (string)$pin[1] === (string)$pin[2] && 
                      (string)$pin[2] === (string)$pin[3];

        if ($esConsecutivo || $esRepetido) {
            JsonResponse::error("El PIN no cumple con las políticas de seguridad (consecutivos o repetidos).", null, 400);
            return;
        }

        // 3. Verificar que el nuevo PIN no sea idéntico al actual
        $sqlPinActual = "SELECT pin FROM usuarios_password WHERE usuario_id = :id LIMIT 1";
        $resPinActual = Consultar_PDO($sqlPinActual, [':id' => $usuarioId]);

        if (!empty($resPinActual) && !empty($resPinActual[0]['pin'])) {
            if (password_verify($pin, $resPinActual[0]['pin'])) {
                JsonResponse::error("El nuevo PIN no puede ser igual al PIN actual.", null, 400);
                return;
            }
        }

        // 4. Generar el hash seguro del PIN
        $pinHash = password_hash($pin, PASSWORD_BCRYPT);

        // 5. Obtener datos para la bitácora (IP de origen y sesión)
        $ipOrigen = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $sesionId = session_id() ?: null;

        // 6. Transacción segura en la base de datos
        $pdo = Conexion();
        $pdo->beginTransaction();

        try {
            // A. Actualizar o insertar el PIN en la tabla usuarios_password
            if (!empty($resPinActual)) {
                Consultar_PDO("UPDATE usuarios_password SET pin = :pin, ultima_modificacion_pin = NOW() WHERE usuario_id = :id", [
                    ':pin' => $pinHash,
                    ':id'  => $usuarioId
                ]);
            } else {
                Consultar_PDO("INSERT INTO usuarios_password (usuario_id, pin, ultima_modificacion_pin) VALUES (:id, :pin, NOW())", [
                    ':id'  => $usuarioId,
                    ':pin' => $pinHash
                ]);
            }

            // B. Marcar específicamente este token como usado mediante su ID único
            Consultar_PDO("UPDATE tokens_usuarios SET usado = 1 WHERE id = :token_id AND usuario_id = :usuario_id", [
                ':token_id'   => $tokenId,
                ':usuario_id' => $usuarioId
            ]);

            // C. Registrar la acción en la bitácora del sistema
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'SEGURIDAD_ACCESO',
                'ACTUALIZAR',
                null,
                "Se actualizó el PIN del usuario mediante enlace de recuperación (IP: {$ipOrigen}).",
                null,
                ['usuario_id' => $usuarioId]
            );

            $pdo->commit();
        } catch (Throwable $txEx) {
            $pdo->rollBack();
            throw $txEx;
        }

        // 7. Limpiar las variables de sesión del reseteo para evitar re-envíos o traslapes
        unset($_SESSION['token_reset_valido'], $_SESSION['usuario_reset_id'], $_SESSION['token_reset_id']);

        // 8. Responder de manera exitosa
        JsonResponse::success("PIN actualizado exitosamente. Ya puedes iniciar sesión.", [
            'redirigir' => 'login.php'
        ], 200);

    } catch (Throwable $e) {
        error_log("Error en Actualizar_Pin_Reset: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al actualizar el PIN.", $e->getMessage(), 500);
    }
}

function Actualizar_Permisos_Usuario($data)
{
    try {
        // Asegurarse de que la sesión esté activa para leer al administrador
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Validar sesión del administrador actual
        $adminId = isset($_SESSION['usuario']['id']) ? (int)$_SESSION['usuario']['id'] : 0;
        if ($adminId <= 0) {
            JsonResponse::error('No autorizado. La sesión del administrador no es válida.', null, 401);
        }

        // El parámetro recibido ($data) ya trae la estructura con 'payload'
        $payload = isset($data['payload']) ? $data['payload'] : $data;

        // 2. Extraer el usuario_id cifrado y descifrarlo
        $usuarioIdCifrado = isset($payload['usuario_id']) ? $payload['usuario_id'] : null;
        if (!$usuarioIdCifrado) {
            JsonResponse::error('El ID de usuario cifrado no está presente.', $data, 400);
        }

        $usuarioIdPlano = Descifrar_Payload($usuarioIdCifrado);
        $usuarioId = (int)$usuarioIdPlano;

        if ($usuarioId <= 0) {
            JsonResponse::error('No se pudo descifrar el ID de usuario o no es válido.', null, 400);
        }

        // 3. Extraer los permisos nuevos (vienen planos en un arreglo)
        $nuevosPermisos = isset($payload['permisos']) && is_array($payload['permisos']) ? array_map('intval', $payload['permisos']) : [];

        $ipOrigen = $_SERVER['REMOTE_ADDR'] ?? null;

        // 4. Abrir conexión PDO exclusivamente para la transacción
        $pdo = Conexion();
        $pdo->beginTransaction();

        try {
            // Obtener los permisos actuales de la BD usando Consultar_PDO
            $sqlActuales = "SELECT permiso_id FROM usuarios_permisos WHERE usuario_id = ?";
            $resActuales = Consultar_PDO($sqlActuales, [$usuarioId]);
            
            $permisosActuales = [];
            foreach ($resActuales as $row) {
                $permisosActuales[] = (int)$row['permiso_id'];
            }

            // Calcular diferencias
            $aAsignar = array_diff($nuevosPermisos, $permisosActuales);
            $aRetirar = array_diff($permisosActuales, $nuevosPermisos);

            if (empty($aAsignar) && empty($aRetirar)) {
                $pdo->rollBack();
                JsonResponse::success('No se detectaron cambios en los permisos.', null, 200);
            }

            // 5. Ejecutar eliminaciones (Retirados)
            if (!empty($aRetirar)) {
                $placeholders = implode(',', array_fill(0, count($aRetirar), '?'));
                
                // Eliminar permisos
                Consultar_PDO(
                    "DELETE FROM usuarios_permisos WHERE usuario_id = ? AND permiso_id IN ($placeholders)",
                    array_merge([$usuarioId], $aRetirar)
                );

                // Registrar en bitácora
                $sqlBitacora = "INSERT INTO usuarios_permisos_bitacora (administrador_id, usuario_id, permiso_id, accion, ip_origen) VALUES (?, ?, ?, 'Retirado', ?)";
                foreach ($aRetirar as $permisoId) {
                    Consultar_PDO($sqlBitacora, [$adminId, $usuarioId, $permisoId, $ipOrigen]);
                }
            }

            // 6. Ejecutar inserciones (Asignados)
            if (!empty($aAsignar)) {
                $sqlIns = "INSERT INTO usuarios_permisos (usuario_id, permiso_id) VALUES (?, ?)";
                $sqlBitacora = "INSERT INTO usuarios_permisos_bitacora (administrador_id, usuario_id, permiso_id, accion, ip_origen) VALUES (?, ?, ?, 'Asignado', ?)";

                foreach ($aAsignar as $permisoId) {
                    Consultar_PDO($sqlIns, [$usuarioId, $permisoId]);
                    Consultar_PDO($sqlBitacora, [$adminId, $usuarioId, $permisoId, $ipOrigen]);
                }
            }

            // 7. Generar notificación automática para el usuario afectado
            $tipoNotif = 'actualizacion_permisos';
            $tituloNotif = 'Tus permisos han sido actualizados';
            $mensajeNotif = 'Un administrador ha modificado los permisos de tu cuenta. Revisa tu panel para ver los cambios disponibles.';
            $jsonData = json_encode(['origen' => 'modulo_permisos', 'actualizado_por' => $adminId]);

            Consultar_PDO(
                "INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, data, es_eliminable) VALUES (?, ?, ?, ?, ?, 1)",
                [$usuarioId, $tipoNotif, $tituloNotif, $mensajeNotif, $jsonData]
            );

            // Todo exitoso, confirmamos cambios globales de la transacción
            $pdo->commit();

            // 8. Responder con la estructura JSON estándar
            JsonResponse::success('Permisos actualizados correctamente.', null, 200);

        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

    } catch (Throwable $e) {
        error_log("Error crítico en actualización de permisos: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error interno al intentar actualizar los permisos.', ['error_real' => $e->getMessage()], 500);
    }
}

function Deshabilitar_Usuario($data)
{
    try {
        // Asegurarse de que la sesión esté activa para leer al administrador
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Validar sesión del administrador actual
        $adminId = isset($_SESSION['usuario']['id']) ? (int)$_SESSION['usuario']['id'] : 0;
        if ($adminId <= 0) {
            JsonResponse::error('No autorizado. La sesión del administrador no es válida.', null, 401);
        }

        // 2. Extraer el ID de usuario directamente de $data
        $usuarioId = isset($data['usuario_id']) ? (int)$data['usuario_id'] : 0;

        if ($usuarioId <= 0) {
            JsonResponse::error('El ID de usuario no es válido.', null, 400);
        }

        // Evitar que el administrador se deshabilite a sí mismo
        if ($usuarioId === $adminId) {
            JsonResponse::error('No puedes deshabilitar tu propia cuenta de administrador.', null, 400);
        }

        // 3. Abrir conexión PDO exclusivamente para la transacción
        $pdo = Conexion();
        $pdo->beginTransaction();

        try {
            // 4. REGLA DE NEGOCIO: Validar si el usuario tiene sesiones activas en 'usuarios_activos'
            $sqlActivos = "SELECT COUNT(*) as total FROM usuarios_activos WHERE usuario_id = ?";
            $resultadoActivos = Consultar_PDO($sqlActivos, [$usuarioId]);
            $sesionesActivas = isset($resultadoActivos[0]['total']) ? (int)$resultadoActivos[0]['total'] : 0;

            if ($sesionesActivas > 0) {
                $pdo->rollBack();
                JsonResponse::error('No se puede deshabilitar el usuario porque actualmente tiene una sesión activa en el sistema.', [
                    'sesiones_activas' => $sesionesActivas
                ], 400);
            }

            // 5. Verificar que el usuario exista y obtener sus datos actuales
            $sqlUser = "SELECT ID, nombre, nombre_usuario, Habilitado FROM usuarios WHERE ID = ?";
            $usuarioDb = Consultar_PDO($sqlUser, [$usuarioId]);

            if (empty($usuarioDb)) {
                $pdo->rollBack();
                JsonResponse::error('El usuario especificado no existe.', null, 404);
            }

            $nombreUsuario = $usuarioDb[0]['nombre_usuario'] ?? $usuarioDb[0]['nombre'];
            $estatusAnterior = (int)$usuarioDb[0]['Habilitado'];

            if ($estatusAnterior === 0) {
                $pdo->rollBack();
                JsonResponse::success('El usuario ya se encontraba deshabilitado.', null, 200);
            }

            // 6. Actualizar el estatus a deshabilitado (Habilitado = 0)
            Consultar_PDO(
                "UPDATE usuarios SET Habilitado = 0, Ultima_modificacion = NOW() WHERE ID = ?",
                [$usuarioId]
            );

            // 7. Registrar el evento utilizando tu función exacta RegistrarBitacoraAccion
            $sesionId = isset($_SESSION['sesion_id']) ? (int)$_SESSION['sesion_id'] : null;
            
            RegistrarBitacoraAccion(
                $adminId, 
                $sesionId, 
                'USUARIOS', 
                'DESHABILITAR', 
                $usuarioId, 
                "Se deshabilitó el usuario: {$nombreUsuario} (ID: {$usuarioId})", 
                ['Habilitado' => $estatusAnterior], 
                ['Habilitado' => 0]
            );

            // Confirmar transacción
            $pdo->commit();

            // 8. Responder con éxito
            JsonResponse::success('Usuario deshabilitado correctamente.', null, 200);

        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

    } catch (Throwable $e) {
        error_log("Error crítico al deshabilitar usuario: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error interno al intentar deshabilitar el usuario.', ['error_real' => $e->getMessage()], 500);
    }
}

function Eliminar_Usuario_Permanente($data)
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Validar sesión del administrador actual
        $adminId = isset($_SESSION['usuario']['id']) ? (int)$_SESSION['usuario']['id'] : 0;
        if ($adminId <= 0) {
            JsonResponse::error('No autorizado. La sesión del administrador no es válida.', null, 401);
        }

        // Extraer el ID de usuario directamente de $data
        $usuarioId = isset($data['usuario_id']) ? (int)$data['usuario_id'] : 0;

        if ($usuarioId <= 0) {
            JsonResponse::error('El ID de usuario no es válido.', null, 400);
        }

        // Evitar que el administrador se elimine a sí mismo
        if ($usuarioId === $adminId) {
            JsonResponse::error('No puedes eliminar permanentemente tu propia cuenta de administrador.', null, 400);
        }

        // 2. Abrir conexión PDO para la transacción
        $pdo = Conexion();
        $pdo->beginTransaction();

        try {
            // 3. REGLA DE NEGOCIO: Validar si el usuario tiene sesiones activas
            $sqlActivos = "SELECT COUNT(*) as total FROM usuarios_activos WHERE usuario_id = ?";
            $resultadoActivos = Consultar_PDO($sqlActivos, [$usuarioId]);
            $sesionesActivas = isset($resultadoActivos[0]['total']) ? (int)$resultadoActivos[0]['total'] : 0;

            if ($sesionesActivas > 0) {
                $pdo->rollBack();
                JsonResponse::error('No se puede eliminar el usuario porque actualmente tiene una sesión activa en el sistema.', [
                    'sesiones_activas' => $sesionesActivas
                ], 400);
            }

            // 4. Verificar que el usuario exista y obtener sus datos para la bitácora
            $sqlUser = "SELECT ID, nombre, nombre_usuario, correo FROM usuarios WHERE ID = ?";
            $usuarioDb = Consultar_PDO($sqlUser, [$usuarioId]);

            if (empty($usuarioDb)) {
                $pdo->rollBack();
                JsonResponse::error('El usuario especificado no existe.', null, 404);
            }

            $nombreUsuario = $usuarioDb[0]['nombre_usuario'] ?? $usuarioDb[0]['nombre'];
            $datosAnteriores = $usuarioDb[0];

            // 5. Ejecutar el borrado definitivo en la tabla usuarios 
            // (Las tablas dependientes con FK ON DELETE CASCADE como usuarios_permisos se limpian solas)
            Consultar_PDO("DELETE FROM usuarios WHERE ID = ?", [$usuarioId]);

            // 6. Registrar el evento en la bitácora del sistema
            $sesionId = isset($_SESSION['sesion_id']) ? (int)$_SESSION['sesion_id'] : null;
            
            RegistrarBitacoraAccion(
                $adminId, 
                $sesionId, 
                'USUARIOS', 
                'ELIMINAR', 
                $usuarioId, 
                "Se eliminó permanentemente el usuario: {$nombreUsuario} (ID: {$usuarioId})", 
                $datosAnteriores, 
                null
            );

            // Confirmar transacción
            $pdo->commit();

            // 7. Responder con éxito
            JsonResponse::success('Usuario eliminado permanentemente del sistema.', null, 200);

        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

    } catch (Throwable $e) {
        error_log("Error crítico al eliminar usuario permanentemente: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error interno al intentar eliminar el usuario.', ['error_real' => $e->getMessage()], 500);
    }
}

function Habilitar_Usuario($data)
{
    try {
        // Asegurarse de que la sesión esté activa para leer al administrador
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Validar sesión del administrador actual
        $adminId = isset($_SESSION['usuario']['id']) ? (int)$_SESSION['usuario']['id'] : 0;
        if ($adminId <= 0) {
            JsonResponse::error('No autorizado. La sesión del administrador no es válida.', null, 401);
        }

        // 2. Extraer el ID de usuario directamente de $data
        $usuarioId = isset($data['usuario_id']) ? (int)$data['usuario_id'] : 0;

        if ($usuarioId <= 0) {
            JsonResponse::error('El ID de usuario no es válido.', null, 400);
        }

        // 3. Abrir conexión PDO exclusivamente para la transacción
        $pdo = Conexion();
        $pdo->beginTransaction();

        try {
            // 4. Verificar que el usuario exista y obtener sus datos actuales
            $sqlUser = "SELECT ID, nombre, nombre_usuario, Habilitado FROM usuarios WHERE ID = ?";
            $usuarioDb = Consultar_PDO($sqlUser, [$usuarioId]);

            if (empty($usuarioDb)) {
                $pdo->rollBack();
                JsonResponse::error('El usuario especificado no existe.', null, 404);
            }

            $nombreUsuario = $usuarioDb[0]['nombre_usuario'] ?? $usuarioDb[0]['nombre'];
            $estatusAnterior = (int)$usuarioDb[0]['Habilitado'];

            if ($estatusAnterior === 1) {
                $pdo->rollBack();
                JsonResponse::success('El usuario ya se encuentra habilitado.', null, 200);
            }

            // 5. Actualizar el estatus a habilitado (Habilitado = 1)
            Consultar_PDO(
                "UPDATE usuarios SET Habilitado = 1, Ultima_modificacion = NOW() WHERE ID = ?",
                [$usuarioId]
            );

            // 6. Registrar el evento utilizando tu función exacta RegistrarBitacoraAccion
            $sesionId = isset($_SESSION['sesion_id']) ? (int)$_SESSION['sesion_id'] : null;
            
            RegistrarBitacoraAccion(
                $adminId, 
                $sesionId, 
                'USUARIOS', 
                'HABILITAR', 
                $usuarioId, 
                "Se habilitó el usuario: {$nombreUsuario} (ID: {$usuarioId})", 
                ['Habilitado' => $estatusAnterior], 
                ['Habilitado' => 1]
            );

            // Confirmar transacción
            $pdo->commit();

            // 7. Responder con éxito
            JsonResponse::success('Usuario habilitado correctamente.', null, 200);

        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

    } catch (Throwable $e) {
        error_log("Error crítico al habilitar usuario: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error interno al intentar habilitar el usuario.', ['error_real' => $e->getMessage()], 500);
    }
}