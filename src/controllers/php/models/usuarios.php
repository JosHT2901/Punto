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

        // 3. Whitelists de seguridad adaptadas a la tabla usuarios (añadiendo nombre_usuario para soporte de ordenamiento)
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
                'id',
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

function Eliminar_Usuarios_Masivo(array $datos): void {
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

        if (!TienePermiso($pdo, 'editar_usuarios')) { // Ajusta el permiso según tu sistema
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
            JsonResponse::error('No se seleccionó ningún usuario válido para eliminar.');
            return;
        }

        $pdo->beginTransaction();

        $processed = [];
        $failed = [];
        $nuevoEstado = 0; // 0 para Habilitado = 0 (Inactivo)

        $stmtUpdate = $pdo->prepare("UPDATE usuarios 
                                   SET Habilitado = :habilitado, Ultima_modificacion = NOW() 
                                   WHERE ID = :id");

        foreach ($idsLimpios as $idUsuarioTarget) {
            // Evitar que el usuario se elimine a sí mismo
            if ((int)$idUsuarioTarget === (int)$usuarioId) {
                $failed[] = [
                    'id' => $idUsuarioTarget,
                    'nombre' => "Usuario ID #{$idUsuarioTarget}",
                    'reason' => 'No puedes eliminar tu propia cuenta de usuario activa.'
                ];
                continue;
            }

            $stmtAnt = $pdo->prepare("SELECT * FROM usuarios WHERE ID = :id LIMIT 1");
            $stmtAnt->execute([':id' => $idUsuarioTarget]);
            $usuario = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario) {
                $failed[] = [
                    'id' => $idUsuarioTarget,
                    'nombre' => "Usuario ID #{$idUsuarioTarget}",
                    'reason' => 'El usuario no existe.'
                ];
                continue;
            }

            $usrId = (int)$usuario['ID'];
            $usrNombre = trim(($usuario['nombre'] ?? '') . ' ' . ($usuario['apellido_paterno'] ?? '')) ?: ($usuario['nombre_usuario'] ?? "Usuario #{$usrId}");
            $usrHabilitado = (int)($usuario['Habilitado'] ?? 1);

            if ($usrHabilitado === $nuevoEstado) {
                $failed[] = [
                    'id' => $usrId,
                    'nombre' => $usrNombre,
                    'reason' => 'El usuario ya se encuentra inactivo.'
                ];
                continue;
            }

            $stmtUpdate->execute([
                ':habilitado' => $nuevoEstado,
                ':id'         => $usrId
            ]);

            if ($stmtUpdate->rowCount() > 0) {
                if (function_exists('RegistrarBitacoraAccion')) {
                    RegistrarBitacoraAccion(
                        $usuarioId,
                        $sesionId,
                        'USUARIOS',
                        'ELIMINAR_LOGICO',
                        $usrId,
                        "Se inactivó al usuario ID: {$usrId} ('{$usrNombre}')",
                        $usuario,
                        ['Habilitado' => $nuevoEstado]
                    );
                }

                $processed[] = [
                    'id' => $usrId,
                    'nombre' => $usrNombre
                ];
            } else {
                $failed[] = [
                    'id' => $usrId,
                    'nombre' => $usrNombre,
                    'reason' => 'No se pudo actualizar el estado del usuario en la base de datos.'
                ];
            }
        }

        $pdo->commit();

        $mensajeResumen = count($failed) === 0 
            ? "Usuarios eliminados correctamente." 
            : "Proceso completado con algunas observaciones.";

        JsonResponse::massive($mensajeResumen, $processed, $failed, 200);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al eliminar usuarios: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al eliminar usuarios: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Exportar_Usuarios_Masivo($datos)
{
    $formato   = $datos['formato'] ?? 'csv';
    $seleccion = $datos['seleccion'] ?? [];

    $sql = "SELECT 
                nombre AS 'Nombre', 
                apellido_paterno AS 'Apellido Paterno', 
                apellido_materno AS 'Apellido Materno', 
                nombre_usuario AS 'Nombre de Usuario',
                correo AS 'Correo Electrónico', 
                telefono AS 'Teléfono', 
                curp AS 'CURP', 
                rfc AS 'RFC', 
                fecha_nacimiento AS 'Fecha de Nacimiento',
                Fecha_registro AS 'Fecha de Registro', 
                Ultima_modificacion AS 'Última Modificación'
            FROM usuarios";
    
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
        'Listado de Usuarios', 
        'usuarios_reporte'    
    );
}


function Habilitar_Usuarios_Masivo(array $datos): void {
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

        if (!TienePermiso($pdo, 'editar_usuarios')) {
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
            JsonResponse::error('No se seleccionó ningún usuario válido para habilitar.');
            return;
        }

        $pdo->beginTransaction();

        $processed = [];
        $failed = [];
        $nuevoEstado = 1; // 1 para Habilitado = 1 (Activo)

        $stmtUpdate = $pdo->prepare("UPDATE usuarios 
                                   SET Habilitado = :habilitado, Ultima_modificacion = NOW() 
                                   WHERE ID = :id");

        foreach ($idsLimpios as $idUsuarioTarget) {
            $stmtAnt = $pdo->prepare("SELECT * FROM usuarios WHERE ID = :id LIMIT 1");
            $stmtAnt->execute([':id' => $idUsuarioTarget]);
            $usuario = $stmtAnt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario) {
                $failed[] = [
                    'id' => $idUsuarioTarget,
                    'nombre' => "Usuario ID #{$idUsuarioTarget}",
                    'reason' => 'El usuario no existe.'
                ];
                continue;
            }

            $usrId = (int)$usuario['ID'];
            $usrNombre = trim(($usuario['nombre'] ?? '') . ' ' . ($usuario['apellido_paterno'] ?? '')) ?: ($usuario['nombre_usuario'] ?? "Usuario #{$usrId}");
            $usrHabilitado = (int)($usuario['Habilitado'] ?? 0);

            if ($usrHabilitado === $nuevoEstado) {
                $failed[] = [
                    'id' => $usrId,
                    'nombre' => $usrNombre,
                    'reason' => 'El usuario ya se encuentra activo.'
                ];
                continue;
            }

            $stmtUpdate->execute([
                ':habilitado' => $nuevoEstado,
                ':id'         => $usrId
            ]);

            if ($stmtUpdate->rowCount() > 0) {
                if (function_exists('RegistrarBitacoraAccion')) {
                    RegistrarBitacoraAccion(
                        $usuarioId,
                        $sesionId,
                        'USUARIOS',
                        'HABILITAR',
                        $usrId,
                        "Se habilitó al usuario ID: {$usrId} ('{$usrNombre}')",
                        $usuario,
                        ['Habilitado' => $nuevoEstado]
                    );
                }

                $processed[] = [
                    'id' => $usrId,
                    'nombre' => $usrNombre
                ];
            } else {
                $failed[] = [
                    'id' => $usrId,
                    'nombre' => $usrNombre,
                    'reason' => 'No se pudo actualizar el estado del usuario en la base de datos.'
                ];
            }
        }

        $pdo->commit();

        $mensajeResumen = count($failed) === 0 
            ? "Usuarios habilitados correctamente." 
            : "Proceso completado con algunas observaciones.";

        JsonResponse::massive($mensajeResumen, $processed, $failed, 200);

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error de BD al habilitar usuarios: " . $e->getMessage());
        JsonResponse::error('Error de BD: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al habilitar usuarios: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}

function Importar_Usuarios(array $datosCrudos): void {
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

        // 4. Validar permiso estrictamente para edición/creación de usuarios
        if (!TienePermiso($pdo, 'crear_usuarios')) {
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
                            // Omitir cabecera (fila 1) y subcabecera de metadatos (fila 2 si empieza con '[')
                            if ($filaNum === 1) continue;
                            if ($filaNum === 2 && isset($datosFila[0]) && str_starts_with(trim($datosFila[0]), '[')) continue;
                            if (empty(array_filter($datosFila))) continue;
                            $filasDatos[] = ['fila_excel' => $filaNum, 'datos' => $datosFila];
                        }
                        fclose($gestor);
                    }
                } elseif (in_array($extension, ['xlsx', 'xls'])) {
                    if (class_exists('\PhpOffice\PhpSpreadsheet\IOFactory')) {
                        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($tmpPath);
                        $sheet = $spreadsheet->getSheetByName('Plantilla Importación') ?? $spreadsheet->getActiveSheet();
                        $filasTotales = $sheet->toArray();
                        
                        foreach ($filasTotales as $idx => $datosFila) {
                            // Omitir fila 1 (cabecera) y fila 2 (metadatos '[nombre]...')
                            if ($idx === 0) continue;
                            if ($idx === 1 && isset($datosFila[0]) && str_starts_with(trim((string)$datosFila[0]), '[')) continue;
                            if (empty(array_filter($datosFila, fn($v) => $v !== null && trim((string)$v) !== ''))) continue;
                            $filasDatos[] = ['fila_excel' => $idx + 1, 'datos' => $datosFila];
                        }
                    } else {
                        throw new Exception("La librería phpspreadsheet no está disponible en el servidor.");
                    }
                }

                $stmtInsert = $pdo->prepare("
                    INSERT INTO usuarios (
                        nombre, apellido_paterno, apellido_materno, fecha_nacimiento,
                        curp, rfc, telefono, correo, correo_verificado,
                        nombre_usuario, Fecha_registro, Ultima_modificacion, Habilitado
                    ) VALUES (
                        :nombre, :apellido_paterno, :apellido_materno, :fecha_nacimiento,
                        :curp, :rfc, :telefono, :correo, 0,
                        :nombre_usuario, NOW(), NOW(), 1
                    )
                ");

                $stmtCheckUnicos = $pdo->prepare("
                    SELECT 
                        SUM(CASE WHEN correo = :correo THEN 1 ELSE 0 END) AS dup_correo,
                        SUM(CASE WHEN nombre_usuario = :nombre_usuario THEN 1 ELSE 0 END) AS dup_usuario,
                        SUM(CASE WHEN :telefono IS NOT NULL AND telefono = :telefono THEN 1 ELSE 0 END) AS dup_telefono,
                        SUM(CASE WHEN :curp IS NOT NULL AND curp = :curp THEN 1 ELSE 0 END) AS dup_curp,
                        SUM(CASE WHEN :rfc IS NOT NULL AND rfc = :rfc THEN 1 ELSE 0 END) AS dup_rfc
                    FROM usuarios
                ");

                foreach ($filasDatos as $item) {
                    $numFilaExcel    = $item['fila_excel'];
                    $fila            = $item['datos'];

                    // Mapeo exacto según columnas de Usuarios.xlsx (Plantilla Importación)
                    $nombre          = trim((string)($fila[0] ?? ''));
                    $apellidoPaterno = trim((string)($fila[1] ?? ''));
                    $apellidoMaterno = trim((string)($fila[2] ?? ''));
                    $fechaNacimiento = trim((string)($fila[3] ?? ''));
                    $curp            = strtoupper(trim((string)($fila[4] ?? '')));
                    $rfc             = strtoupper(trim((string)($fila[5] ?? '')));
                    $telefono        = trim((string)($fila[6] ?? ''));
                    $correo          = strtolower(trim((string)($fila[7] ?? '')));
                    $nombreUsuario   = trim((string)($fila[8] ?? ''));

                    $nombreCompleto = trim("$nombre $apellidoPaterno $apellidoMaterno");
                    $etiquetaUsuario = !empty($nombreCompleto) ? $nombreCompleto : (!empty($nombreUsuario) ? $nombreUsuario : "Usuario en fila #{$numFilaExcel}");

                    // 1. Validación de campos obligatorios (NOT NULL en BD)
                    if (empty($nombre) || empty($correo) || empty($nombreUsuario)) {
                        $failed[] = [
                            "id"     => "Fila #{$numFilaExcel}",
                            "nombre" => $etiquetaUsuario,
                            "reason" => "Faltan campos obligatorios (Nombre, Correo Electrónico o Nombre de Usuario)."
                        ];
                        continue;
                    }

                    // 2. Validaciones de formato y longitud según esquema de BD
                    if (mb_strlen($nombre) > 50 || mb_strlen($apellidoPaterno) > 50 || mb_strlen($apellidoMaterno) > 50 || mb_strlen($nombreUsuario) > 50) {
                        $failed[] = [
                            "id"     => "Fila #{$numFilaExcel}",
                            "nombre" => $etiquetaUsuario,
                            "reason" => "Nombre, apellidos o nombre de usuario exceden el límite de 50 caracteres."
                        ];
                        continue;
                    }

                    if (!filter_var($correo, FILTER_VALIDATE_EMAIL) || mb_strlen($correo) > 100) {
                        $failed[] = [
                            "id"     => "Fila #{$numFilaExcel}",
                            "nombre" => $etiquetaUsuario,
                            "reason" => "El correo electrónico ('$correo') no tiene un formato válido o excede 100 caracteres."
                        ];
                        continue;
                    }

                    // Normalizar nulos para columnas opcionales con UNIQUE INDEX
                    $apellidoPaternoDb = $apellidoPaterno !== '' ? $apellidoPaterno : null;
                    $apellidoMaternoDb = $apellidoMaterno !== '' ? $apellidoMaterno : null;
                    $curpDb            = $curp !== '' ? $curp : null;
                    $rfcDb             = $rfc !== '' ? $rfc : null;
                    $telefonoDb        = $telefono !== '' ? $telefono : null;
                    $fechaNacDb        = null;

                    if ($fechaNacimiento !== '') {
                        $dt = DateTime::createFromFormat('Y-m-d', $fechaNacimiento);
                        if ($dt && $dt->format('Y-m-d') === $fechaNacimiento) {
                            $fechaNacDb = $fechaNacimiento;
                        } else {
                            $failed[] = [
                                "id"     => "Fila #{$numFilaExcel}",
                                "nombre" => $etiquetaUsuario,
                                "reason" => "La fecha de nacimiento ('$fechaNacimiento') debe tener el formato AAAA-MM-DD."
                            ];
                            continue;
                        }
                    }

                    if ($curpDb !== null && strlen($curpDb) !== 18) {
                        $failed[] = [
                            "id"     => "Fila #{$numFilaExcel}",
                            "nombre" => $etiquetaUsuario,
                            "reason" => "La CURP ('$curpDb') debe tener exactamente 18 caracteres."
                        ];
                        continue;
                    }

                    if ($rfcDb !== null && !in_array(strlen($rfcDb), [12, 13])) {
                        $failed[] = [
                            "id"     => "Fila #{$numFilaExcel}",
                            "nombre" => $etiquetaUsuario,
                            "reason" => "El RFC ('$rfcDb') debe tener 12 o 13 caracteres."
                        ];
                        continue;
                    }

                    if ($telefonoDb !== null && (!preg_match('/^\+[1-9]\d{6,14}$/', $telefonoDb) || strlen($telefonoDb) > 15)) {
                        $failed[] = [
                            "id"     => "Fila #{$numFilaExcel}",
                            "nombre" => $etiquetaUsuario,
                            "reason" => "El teléfono ('$telefonoDb') debe incluir prefijo internacional (ej. +522461234567) y máximo 15 caracteres."
                        ];
                        continue;
                    }

                    // 3. Validación de índices únicos (correo, nombre_usuario, telefono, curp, rfc)
                    $stmtCheckUnicos->execute([
                        ':correo'         => $correo,
                        ':nombre_usuario' => $nombreUsuario,
                        ':telefono'       => $telefonoDb,
                        ':curp'           => $curpDb,
                        ':rfc'            => $rfcDb
                    ]);
                    $duplicados = $stmtCheckUnicos->fetch(PDO::FETCH_ASSOC);

                    $motivosDuplicado = [];
                    if ((int)($duplicados['dup_correo'] ?? 0) > 0)   $motivosDuplicado[] = "correo ('$correo')";
                    if ((int)($duplicados['dup_usuario'] ?? 0) > 0)  $motivosDuplicado[] = "nombre de usuario ('$nombreUsuario')";
                    if ((int)($duplicados['dup_telefono'] ?? 0) > 0) $motivosDuplicado[] = "teléfono ('$telefonoDb')";
                    if ((int)($duplicados['dup_curp'] ?? 0) > 0)     $motivosDuplicado[] = "CURP ('$curpDb')";
                    if ((int)($duplicados['dup_rfc'] ?? 0) > 0)      $motivosDuplicado[] = "RFC ('$rfcDb')";

                    if (!empty($motivosDuplicado)) {
                        $failed[] = [
                            "id"     => "Fila #{$numFilaExcel}",
                            "nombre" => $etiquetaUsuario,
                            "reason" => "Ya existe un usuario registrado con el mismo " . implode(', ', $motivosDuplicado) . "."
                        ];
                        continue;
                    }

                    // 4. Inserción en la tabla usuarios
                    $stmtInsert->execute([
                        ':nombre'           => $nombre,
                        ':apellido_paterno' => $apellidoPaternoDb,
                        ':apellido_materno' => $apellidoMaternoDb,
                        ':fecha_nacimiento' => $fechaNacDb,
                        ':curp'             => $curpDb,
                        ':rfc'              => $rfcDb,
                        ':telefono'         => $telefonoDb,
                        ':correo'           => $correo,
                        ':nombre_usuario'   => $nombreUsuario
                    ]);

                    $nuevoId = (int)$pdo->lastInsertId();

                    $processed[] = [
                        "id"     => $nuevoId,
                        "codigo" => $nombreUsuario,
                        "nombre" => $etiquetaUsuario
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
                'USUARIOS',
                'IMPORTAR_MASIVO',
                null,
                "Proceso de importación masiva de usuarios completado.",
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

        JsonResponse::success("Usuarios importados correctamente.", $dataRespuesta, 200);

    } catch (Throwable $e) {
        error_log("Error crítico al importar usuarios masivos: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error inesperado al procesar la importación masiva: ' . strtolower($e->getMessage()), null, 500);
    }
}

function Actualizar_Password_Reset_Usuario_Actual(array $data): void
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Obtener el ID del usuario desde la sesión estructurada actual
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? null));

        if (empty($usuarioId)) {
            JsonResponse::error("No hay una sesión de usuario activa.", null, 401);
            return;
        }

        // 2. Recibir y validar únicamente password y confirmar del POST
        $password  = trim($data['password'] ?? '');
        $confirmar = trim($data['confirmar'] ?? '');

        if (empty($password) || empty($confirmar)) {
            JsonResponse::error("Todos los campos son obligatorios.", null, 400);
            return;
        }

        if ($password !== $confirmar) {
            JsonResponse::error("Las contraseñas no coinciden.", null, 400);
            return;
        }

        // Validación estricta de seguridad de la nueva contraseña
        if (
            strlen($password) < 10 ||
            !preg_match('/[A-Z]/', $password) ||
            !preg_match('/[a-z]/', $password) ||
            !preg_match('/\d/', $password) ||
            !preg_match('/[$@$!%*?&#._-]/', $password)
        ) {
            JsonResponse::error("La contraseña no cumple con los requisitos mínimos de seguridad (mínimo 10 caracteres, mayúsculas, minúsculas, números y símbolos).", null, 400);
            return;
        }

        // 3. Consultar la contraseña actual de la base de datos para validar que no sea idéntica
        $sqlPassActual = "SELECT password FROM usuarios_password WHERE usuario_id = :id LIMIT 1";
        $resPassActual = Consultar_PDO($sqlPassActual, [':id' => $usuarioId]);

        if (!empty($resPassActual) && !empty($resPassActual[0]['password'])) {
            if (password_verify($password, $resPassActual[0]['password'])) {
                JsonResponse::error("La nueva contraseña no puede ser igual a la contraseña actual.", null, 400);
                return;
            }
        }

        // 4. Generar el hash seguro de la nueva contraseña
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        // 5. Obtener datos para la bitácora (IP de origen y sesión)
        $ipOrigen = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $sesionId = session_id() ?: null;

        // 6. Transacción segura en la base de datos
        $pdo = Conexion();
        $pdo->beginTransaction();

        try {
            // Actualizar la contraseña y la fecha de modificación en la tabla usuarios_password
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

            // Registrar la acción en la bitácora del sistema
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'SEGURIDAD_ACCESO',
                'ACTUALIZAR',
                null,
                "El usuario actualizó su contraseña desde su perfil (IP: {$ipOrigen}).",
                null,
                ['usuario_id' => $usuarioId]
            );

            $pdo->commit();
        } catch (Throwable $txEx) {
            $pdo->rollBack();
            throw $txEx;
        }

        // 7. Responder de manera exitosa manteniendo la sesión activa
        JsonResponse::success("Contraseña actualizada exitosamente.", [
            'actualizado' => true
        ], 200);

    } catch (Throwable $e) {
        error_log("Error en Actualizar_Password_Reset_Usuario_Actual: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al actualizar la contraseña.", $e->getMessage(), 500);
    }
}

function Actualizar_Pin_Reset_Usuario_Actual(array $data): void
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Obtener el ID del usuario desde la sesión estructurada actual
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? null));

        if (empty($usuarioId)) {
            JsonResponse::error("No hay una sesión de usuario activa.", null, 401);
            return;
        }

        // 2. Recibir y validar el PIN y su confirmación del POST
        $pin       = trim($data['pin'] ?? '');
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

        // 3. Consultar el PIN actual de la base de datos para validar que no sea idéntico
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
            // Actualizar o insertar el PIN en la tabla usuarios_password
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

            // Registrar la acción en la bitácora del sistema
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'SEGURIDAD_ACCESO',
                'ACTUALIZAR',
                null,
                "El usuario actualizó su PIN desde su perfil (IP: {$ipOrigen}).",
                null,
                ['usuario_id' => $usuarioId]
            );

            $pdo->commit();
        } catch (Throwable $txEx) {
            $pdo->rollBack();
            throw $txEx;
        }

        // 7. Responder de manera exitosa manteniendo la sesión activa
        JsonResponse::success("PIN actualizado exitosamente.", [
            'actualizado' => true
        ], 200);

    } catch (Throwable $e) {
        error_log("Error en Actualizar_Pin_Reset_Usuario_Actual: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al actualizar el PIN.", $e->getMessage(), 500);
    }
}


function Cerrar_Sesion_Usuario(array $data = []): void
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Obtener el ID del usuario actual desde la sesión estructurada
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? null));

        if (empty($usuarioId)) {
            JsonResponse::error("No hay una sesión de usuario activa.", null, 401);
            return;
        }

        $ipOrigen = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        $sesionPhpId = session_id() ?: null;
        
        // 2. Determinar si se cierra la sesión 'actual' o 'todas' (por defecto toma 'actual')
        $tipo = $data['tipo'] ?? 'actual';

        $pdo = Conexion();
        $pdo->beginTransaction();

        try {
            if ($tipo === 'todas') {
                // A. Cerrar todas las sesiones activas del usuario en la base de datos
                Consultar_PDO("UPDATE sesiones SET sesion_activa = 0, cierre_sesion = NOW() WHERE usuario_id = :usuario_id AND sesion_activa = 1", [
                    ':usuario_id' => $usuarioId
                ]);

                RegistrarBitacoraAccion(
                    $usuarioId,
                    $sesionPhpId,
                    'SEGURIDAD_ACCESO',
                    'CERRAR_SESION',
                    null,
                    "El usuario cerró todas sus sesiones activas (IP: {$ipOrigen}).",
                    null,
                    ['usuario_id' => $usuarioId]
                );

                $pdo->commit();

            } else {
                // B. Cerrar únicamente la sesión actual registrada en la base de datos (por token de sesión PHP o IP/User-Agent reciente)
                // Si tienes guardado el ID de la sesión de BD en $_SESSION['sesion_db_id'], lo usamos de forma precisa:
                if (!empty($_SESSION['sesion_db_id'])) {
                    Consultar_PDO("UPDATE sesiones SET sesion_activa = 0, cierre_sesion = NOW() WHERE ID = :sesion_id AND usuario_id = :usuario_id", [
                        ':sesion_id'  => (int)$_SESSION['sesion_db_id'],
                        ':usuario_id' => $usuarioId
                    ]);
                } else {
                    // Respaldo por si no guardas el ID de la BD en sesión: cierra la más reciente de este navegador/IP
                    $user剤 = $_SERVER['HTTP_USER_AGENT'] ?? '';
                    Consultar_PDO("UPDATE sesiones SET sesion_activa = 0, cierre_sesion = NOW() WHERE usuario_id = :usuario_id AND IP = :ip AND user_agent = :ua AND sesion_activa = 1 ORDER BY inicio_sesion DESC LIMIT 1", [
                        ':usuario_id' => $usuarioId,
                        ':ip'         => $ipOrigen,
                        ':ua'         => $user剤
                    ]);
                }

                RegistrarBitacoraAccion(
                    $usuarioId,
                    $sesionPhpId,
                    'SEGURIDAD_ACCESO',
                    'CERRAR_SESION',
                    null,
                    "El usuario cerró su sesión actual (IP: {$ipOrigen}).",
                    null,
                    ['usuario_id' => $usuarioId]
                );

                $pdo->commit();
            }

            // 3. Destruir por completo la sesión de PHP y cookies locales
            $_SESSION = [];
            if (ini_get("session.use_cookies")) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000,
                    $params["path"], $params["domain"],
                    $params["secure"], $params["httponly"]
                );
            }
            session_destroy();

            // 4. Responder con éxito y la ruta de redirección para el frontend
            JsonResponse::success("Sesión finalizada correctamente.",null, 200);
            return;

        } catch (Throwable $txEx) {
            $pdo->rollBack();
            throw $txEx;
        }

    } catch (Throwable $e) {
        error_log("Error en Cerrar_Sesion_Usuario: " . $e->getMessage());
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
        JsonResponse::error("Ocurrió un error inesperado al cerrar la sesión.", $e->getMessage(), 500);
    }
}

function Obtener_Informacion_Usuario_Actual()
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Obtener el ID del usuario actual desde la sesión estructurada (con respaldos seguros)
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? null));

        if (empty($usuarioId)) {
            JsonResponse::error("No hay una sesión de usuario activa.", null, 401);
            return;
        }

        // 2. Conexión a la base de datos y consulta con los campos exactos de la tabla usuarios
        $pdo = Conexion();
        $stmt = $pdo->prepare("
            SELECT 
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
                Habilitado 
            FROM usuarios 
            WHERE ID = :id
        ");
        
        $stmt->execute([':id' => $usuarioId]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($usuario) {
            // 3. Respuesta exitosa estructurada para el frontend
            JsonResponse::success("Información obtenida correctamente", $usuario, 200);
        } else {
            JsonResponse::error("Usuario no encontrado en el sistema.", null, 404);
        }

    } catch (Throwable $e) {
        error_log("Error en Obtener_Informacion_Usuario_Actual: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al obtener la información del usuario.", $e->getMessage(), 500);
    }
}

function Actualizar_Informacion_Usuario_Actual($data)
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Obtener ID del usuario actual desde la sesión
        $usuarioIdSesion = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? null));

        if (empty($usuarioIdSesion)) {
            JsonResponse::error("No hay una sesión de usuario activa.", null, 401);
            return;
        }

        // Asegurarnos de que $data seja un arreglo
        if (!is_array($data)) {
            $data = [];
        }

        $seccion = $data['seccion'] ?? '';
        $idUsuarioForm = $data['id'] ?? $usuarioIdSesion;

        // Comparación segura de IDs
        if ((string)$usuarioIdSesion !== (string)$idUsuarioForm) {
            JsonResponse::error("No tienes permisos para modificar este usuario.", null, 403);
            return;
        }

        $pdo = Conexion();

        // 2. Procesar según la sección recibida
        if ($seccion === 'personal') {
            $nombre = trim(strtoupper($data['nombre'] ?? ''));
            $apellidoPaterno = trim(strtoupper($data['apellido_paterno'] ?? ''));
            $apellidoMaterno = trim(strtoupper($data['apellido_materno'] ?? ''));
            $fechaNacimiento = trim($data['fecha_nacimiento'] ?? '');
            $curp = trim(strtoupper($data['curp'] ?? ''));
            $rfc = trim(strtoupper($data['rfc'] ?? ''));

            if (empty($nombre) || empty($apellidoPaterno) || empty($fechaNacimiento) || empty($curp) || empty($rfc)) {
                JsonResponse::error("Todos los campos obligatorios de información básica deben estar llenos.", null, 400);
                return;
            }

            // Verificar duplicados de CURP excluyendo al usuario actual
            $stmtCurp = $pdo->prepare("SELECT ID FROM usuarios WHERE curp = :curp AND ID != :id");
            $stmtCurp->execute([':curp' => $curp, ':id' => $usuarioIdSesion]);
            if ($stmtCurp->fetch()) {
                JsonResponse::error("El C.U.R.P. ya se encuentra registrado por otro usuario.", null, 409);
                return;
            }

            // Verificar duplicados de RFC excluyendo al usuario actual
            $stmtRfc = $pdo->prepare("SELECT ID FROM usuarios WHERE rfc = :rfc AND ID != :id");
            $stmtRfc->execute([':rfc' => $rfc, ':id' => $usuarioIdSesion]);
            if ($stmtRfc->fetch()) {
                JsonResponse::error("El R.F.C. ya se encuentra registrado por otro usuario.", null, 409);
                return;
            }

            $stmtUpdate = $pdo->prepare("
                UPDATE usuarios 
                SET 
                    nombre = :nombre,
                    apellido_paterno = :apellido_paterno,
                    apellido_materno = :apellido_materno,
                    fecha_nacimiento = :fecha_nacimiento,
                    curp = :curp,
                    rfc = :rfc,
                    Ultima_modificacion = NOW()
                WHERE ID = :id
            ");

            $resultado = $stmtUpdate->execute([
                ':nombre' => $nombre,
                ':apellido_paterno' => $apellidoPaterno,
                ':apellido_materno' => $apellidoMaterno ?: null,
                ':fecha_nacimiento' => $fechaNacimiento,
                ':curp' => $curp,
                ':rfc' => $rfc,
                ':id' => $usuarioIdSesion
            ]);

            if ($resultado) {
                JsonResponse::success("Información personal actualizada correctamente.", ['id' => $usuarioIdSesion], 200);
            } else {
                JsonResponse::error("No se pudo actualizar la información personal.", null, 500);
            }

        } elseif ($seccion === 'contacto') {
            $telefono = trim($data['telefono'] ?? '');
            // Nota: Es mejor guardar los correos en minúsculas estándar en la BD para evitar duplicados por mayúsculas
            $correoNuevo = trim(strtolower($data['correo'] ?? '')); 

            if (empty($telefono) || empty($correoNuevo)) {
                JsonResponse::error("El teléfono y el correo son obligatorios.", null, 400);
                return;
            }

            if (!filter_var($correoNuevo, FILTER_VALIDATE_EMAIL)) {
                JsonResponse::error("El formato del correo electrónico no es válido.", null, 400);
                return;
            }

            // 🔍 CONSULTAR EL CORREO ACTUAL EN LA BASE DE DATOS PARA SABER SI CAMBIÓ O LO MANTUVO
            $stmtUser = $pdo->prepare("SELECT correo FROM usuarios WHERE ID = :id LIMIT 1");
            $stmtUser->execute([':id' => $usuarioIdSesion]);
            $usuarioActualDb = $stmtUser->fetch(PDO::FETCH_ASSOC);
            
            $correoOriginalDb = trim(strtolower($usuarioActualDb['correo'] ?? ''));

            // Comparamos si el correo es distinto (ignorando mayúsculas/minúsculas)
            $correoCambiado = (strcasecmp($correoOriginalDb, $correoNuevo) !== 0);

            // Verificar duplicados de Teléfono excluyendo al usuario actual
            $stmtTel = $pdo->prepare("SELECT ID FROM usuarios WHERE telefono = :telefono AND ID != :id");
            $stmtTel->execute([':telefono' => $telefono, ':id' => $usuarioIdSesion]);
            if ($stmtTel->fetch()) {
                JsonResponse::error("El teléfono ya se encuentra registrado por otro usuario.", null, 409);
                return;
            }

            // Verificar duplicados de Correo excluyendo al usuario actual (solo si cambió o si se quiere validar siempre)
            $stmtMail = $pdo->prepare("SELECT ID FROM usuarios WHERE correo = :correo AND ID != :id");
            $stmtMail->execute([':correo' => $correoNuevo, ':id' => $usuarioIdSesion]);
            if ($stmtMail->fetch()) {
                JsonResponse::error("El correo electrónico ya se encuentra registrado por otro usuario.", null, 409);
                return;
            }

            $stmtUpdate = $pdo->prepare("
                UPDATE usuarios 
                SET 
                    telefono = :telefono,
                    correo = :correo,
                    Ultima_modificacion = NOW()
                WHERE ID = :id
            ");

            $resultado = $stmtUpdate->execute([
                ':telefono' => $telefono,
                ':correo' => $correoNuevo,
                ':id' => $usuarioIdSesion
            ]);

            if ($resultado) {
                // Devolvemos en los datos de respuesta si el correo cambió o lo mantuvo
                JsonResponse::success("Información de contacto actualizada correctamente.", [
                    'id' => $usuarioIdSesion,
                    'correo_cambiado' => $correoCambiado
                ], 200);
            } else {
                JsonResponse::error("No se pudo actualizar la información de contacto.", null, 500);
            }

        } else {
            JsonResponse::error("Sección no válida o no especificada.", null, 400);
        }

    } catch (Throwable $e) {
        error_log("Error en Actualizar_Informacion_Usuario_Actual: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al procesar la solicitud.", $e->getMessage(), 500);
    }
}

function Obtener_Imagen_Usuario()
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Obtener ID del usuario actual desde la sesión
        $usuarioIdSesion = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? null));

        if (empty($usuarioIdSesion)) {
            JsonResponse::error("No hay una sesión de usuario activa.", null, 401);
            return;
        }

        // 2. Consultar la imagen principal o tipo avatar usando Consultar_PDO
        $resultados = Consultar_PDO(
            "SELECT ruta, nombre_archivo 
             FROM usuarios_imagenes 
             WHERE usuario_id = :usuario_id AND (principal = 1 OR tipo = 'avatar') 
             ORDER BY principal DESC, id DESC 
             LIMIT 1",
            [':usuario_id' => $usuarioIdSesion]
        );

        $imagenReg = $resultados[0] ?? null;

        // Si no tiene ninguna imagen registrada
        if (!$imagenReg || empty($imagenReg['ruta'])) {
            JsonResponse::success("El usuario no cuenta con una imagen registrada.", [
                'imagen_base64' => null,
                'ruta' => null
            ], 200);
            return;
        }

        // 3. Construir la ruta física exacta usando __DIR__ (consistente con el guardado)
        // El controlador está en src/controllers/php/models/, subimos 4 niveles para llegar a la raíz del proyecto
        $proyectoRoot = realpath(__DIR__ . '/../../../../');
        $rutaFisica = $proyectoRoot ? ($proyectoRoot . '/' . ltrim($imagenReg['ruta'], '/')) : (rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/' . ltrim($imagenReg['ruta'], '/'));

        $imagenBase64 = null;

        if (file_exists($rutaFisica) && is_file($rutaFisica)) {
            $tipoMime = mime_content_type($rutaFisica) ?: 'image/jpeg';
            $datosArchivo = file_get_contents($rutaFisica);
            
            if ($datosArchivo !== false) {
                // Convertimos a Base64 con su respectivo Data URI scheme listo para renderizar en Croppie
                $imagenBase64 = 'data:' . $tipoMime . ';base64,' . base64_encode($datosArchivo);
            }
        }

        // 4. Responder con éxito incluyendo el Base64 exacto
        JsonResponse::success("Imagen obtenida correctamente.", [
            'imagen_base64' => $imagenBase64,
            'ruta' => $imagenReg['ruta'],
            'nombre_archivo' => $imagenReg['nombre_archivo']
        ], 200);

    } catch (Throwable $e) {
        error_log("Error en Obtener_Imagen_Usuario: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al obtener la imagen.", $e->getMessage(), 500);
    }
}

/**
 * Guarda o actualiza la imagen de perfil (avatar) del usuario usando Consultar_PDO
 */
function Gestionar_Imagen_Usuario(array $datos = [])
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Obtener ID del usuario actual desde la sesión
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? null));
        if (empty($usuarioId)) {
            JsonResponse::error("No hay una sesión de usuario activa.", null, 401);
            return;
        }

        // 2. Obtener la imagen desde el parámetro $datos recibido
        $imagenBase64 = $datos['imagen'] ?? null;

        if (empty($imagenBase64)) {
            JsonResponse::error("No se proporcionó ninguna imagen.", null, 400);
            return;
        }

        // 3. Validar y decodificar el formato Base64
        if (preg_match('/^data:image\/(\w+);base64,/', $imagenBase64, $type)) {
            $base64Data = substr($imagenBase64, strpos($imagenBase64, ',') + 1);
            $tipoExtension = strtolower($type[1]); // png, jpg, jpeg

            if (!in_array($tipoExtension, ['jpg', 'jpeg', 'png'])) {
                JsonResponse::error("Formato de imagen no permitido. Solo JPG, JPEG y PNG.", null, 400);
                return;
            }

            $dataBinaria = base64_decode($base64Data);
            if ($dataBinaria === false) {
                JsonResponse::error("Error al decodificar la imagen Base64.", null, 400);
                return;
            }
        } else {
            JsonResponse::error("Formato de imagen inválido.", null, 400);
            return;
        }

        // 4. Definir la ruta física de destino (Subiendo 4 niveles desde models/ hasta la raíz, luego a public/uploads/usuarios/)
        $directorioRelativo = 'public/uploads/usuarios/';
        $proyectoRoot = realpath(__DIR__ . '/../../../../');
        $directorioFisico = ($proyectoRoot ? $proyectoRoot : rtrim($_SERVER['DOCUMENT_ROOT'], '/')) . '/' . $directorioRelativo;

        if (!file_exists($directorioFisico)) {
            if (!mkdir($directorioFisico, 0755, true)) {
                JsonResponse::error("No se pudo crear el directorio 'public/uploads/usuarios/' en el servidor.", null, 500);
                return;
            }
        }

        // 5. Verificar si el usuario ya tiene una imagen registrada de tipo 'avatar'
        $imagenExistente = Consultar_PDO(
            "SELECT id, ruta FROM usuarios_imagenes WHERE usuario_id = :usuario_id AND tipo = 'avatar' LIMIT 1",
            [':usuario_id' => $usuarioId]
        );

        $registroAnterior = $imagenExistente[0] ?? null;

        // 6. Eliminar físicamente la imagen anterior del servidor si existe
        if ($registroAnterior && !empty($registroAnterior['ruta'])) {
            if ($proyectoRoot) {
                $rutaFisicaAntigua = $proyectoRoot . '/' . ltrim($registroAnterior['ruta'], '/');
                if (file_exists($rutaFisicaAntigua) && is_file($rutaFisicaAntigua)) {
                    @unlink($rutaFisicaAntigua); // Borra el archivo anterior del disco
                }
            }
        }

        // 7. Nombre único para el nuevo archivo
        $nombreArchivo = 'avatar_' . $usuarioId . '_' . time() . '.' . $tipoExtension;
        $rutaFisicaNueva = $directorioFisico . $nombreArchivo;
        $rutaRelativaNueva = $directorioRelativo . $nombreArchivo; // Ej: public/uploads/usuarios/avatar_48_...

        // Guardar el nuevo archivo físico en el servidor
        $guardadoExitoso = @file_put_contents($rutaFisicaNueva, $dataBinaria);
        
        if ($guardadoExitoso === false) {
            $errorPhp = error_get_last();
            error_log("Fallo al guardar archivo físico en perfil. Ruta: {$rutaFisicaNueva} | Motivo: " . ($errorPhp['message'] ?? 'Desconocido'));
            JsonResponse::error("No se pudo guardar el archivo en el servidor por un error de permisos.", null, 500);
            return;
        }

        // 8. Actualizar o insertar el registro único en la base de datos
        if ($registroAnterior) {
            Consultar_PDO(
                "UPDATE usuarios_imagenes 
                 SET ruta = :ruta, nombre_archivo = :nombre_archivo, principal = 1, updated_at = NOW() 
                 WHERE id = :id",
                [
                    ':ruta' => $rutaRelativaNueva,
                    ':nombre_archivo' => $nombreArchivo,
                    ':id' => $registroAnterior['id']
                ]
            );
        } else {
            Consultar_PDO(
                "UPDATE usuarios_imagenes SET principal = 0 WHERE usuario_id = :usuario_id AND tipo = 'avatar'",
                [':usuario_id' => $usuarioId]
            );

            Consultar_PDO(
                "INSERT INTO usuarios_imagenes (usuario_id, tipo, ruta, nombre_archivo, principal) 
                 VALUES (:usuario_id, 'avatar', :ruta, :nombre_archivo, 1)",
                [
                    ':usuario_id' => $usuarioId,
                    ':ruta' => $rutaRelativaNueva,
                    ':nombre_archivo' => $nombreArchivo
                ]
            );
        }

        // 9. ACTUALIZAR LA SESIÓN DEL USUARIO
        if (!isset($_SESSION['usuario']) || !is_array($_SESSION['usuario'])) {
            $_SESSION['usuario'] = [];
        }
        
        // Si prefieres guardar la ruta relativa limpia en sesión:
        $_SESSION['usuario']['imagen'] = $rutaRelativaNueva;

        // O si prefieres guardar directamente el Base64 en sesión para lectura instantánea:
        // $_SESSION['usuario']['imagen'] = $imagenBase64;

        // 10. Responder con éxito incluyendo la ruta y el base64 para el frontend
        JsonResponse::success("Imagen de perfil actualizada correctamente.", [
            'ruta' => $rutaRelativaNueva,
            'nombre_archivo' => $nombreArchivo,
            'imagen_base64' => $imagenBase64
        ], 200);

    } catch (Throwable $e) {
        error_log("Error crítico en Gestionar_Imagen_Usuario: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al procesar la imagen.", $e->getMessage(), 500);
    }
}

/**
 * Elimina la imagen de perfil (avatar) del usuario usando Consultar_PDO
 */
function Eliminar_Imagen_Usuario()
{
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 1. Obtener ID del usuario actual
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? null));
        if (empty($usuarioId)) {
            JsonResponse::error("No hay una sesión de usuario activa.", null, 401);
            return;
        }

        // 2. Buscar la imagen principal de tipo 'avatar' del usuario
        $resultados = Consultar_PDO(
            "SELECT id, ruta FROM usuarios_imagenes WHERE usuario_id = :usuario_id AND principal = 1 AND tipo = 'avatar' LIMIT 1",
            [':usuario_id' => $usuarioId]
        );
        
        $imagen = $resultados[0] ?? null;

        if ($imagen) {
            // 3. Eliminar archivo físico del servidor si existe
            $rutaFisica = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/' . ltrim($imagen['ruta'], '/');
            if (file_exists($rutaFisica)) {
                @unlink($rutaFisica);
            }

            // 4. Eliminar el registro de la base de datos
            Consultar_PDO(
                "DELETE FROM usuarios_imagenes WHERE id = :id",
                [':id' => $imagen['id']]
            );
        }

        JsonResponse::success("Imagen de perfil eliminada correctamente.", null, 200);

    } catch (Throwable $e) {
        error_log("Error en eliminar_imagen_usuario: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al eliminar la imagen.", $e->getMessage(), 500);
    }
}

function Obtener_Movimientos_Paginados(array $params = []): void {
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Conexión a la BD
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

        if (!$conexionDb instanceof PDO) {
            throw new RuntimeException('No se pudo obtener la conexión a la base de datos.');
        }

        // ---- Separar la acción del endpoint del filtro por acción ----
        // $params['accion'] trae el nombre del endpoint ('obtener_movimientos_paginados');
        // el filtro por acción viaja en filtros.accion, filtro_accion o accion_filtro.
        $filtrosAnidados = (isset($params['filtros']) && is_array($params['filtros'])) ? $params['filtros'] : [];

        $filtroAccion = $filtrosAnidados['accion']
            ?? $params['filtro_accion']
            ?? $params['accion_filtro']
            ?? null;

        unset($params['accion'], $params['filtro_accion'], $params['accion_filtro'], $params['filtros']);
        unset($filtrosAnidados['accion']);

        // Unificamos el resto de filtros anidados con los planos
        $params = array_merge($params, $filtrosAnidados);

        // Helper para construir condiciones IN (...) o = ... de forma segura
        $construirCondicionLista = function (string $columnaSQL, $valor) use ($conexionDb): ?string {
            if ($valor === null) {
                return null;
            }

            $valores = is_array($valor) ? $valor : [$valor];
            $limpios = [];

            foreach ($valores as $item) {
                if (is_array($item) || is_object($item)) {
                    continue;
                }
                $str = trim((string)$item);
                if ($str !== '') {
                    $limpios[$str] = $conexionDb->quote($str);
                }
            }

            if (empty($limpios)) {
                return null;
            }

            if (count($limpios) === 1) {
                return "{$columnaSQL} = " . reset($limpios);
            }

            return "{$columnaSQL} IN (" . implode(', ', array_values($limpios)) . ")";
        };

        // 1. Condiciones personalizadas
        $condicionesExtra = [];

        // Filtro por ID del movimiento
        $movimientoFiltroId = (int)($params['id'] ?? $params['movimiento_id'] ?? 0);
        if ($movimientoFiltroId > 0) {
            $condicionesExtra[] = "t.movimiento_id = " . $movimientoFiltroId;
        }
        unset($params['id'], $params['movimiento_id']);

        // Filtro por ID del usuario
        $usuarioFiltroId = (int)($params['usuario_id'] ?? $params['id_usuario'] ?? 0);
        if ($usuarioFiltroId > 0) {
            $condicionesExtra[] = "t.usuario_id = " . $usuarioFiltroId;
        }
        unset($params['usuario_id'], $params['id_usuario']);

        // Filtro por módulo (string o arreglo)
        if (array_key_exists('modulo', $params)) {
            $condModulo = $construirCondicionLista('t.modulo', $params['modulo']);
            if ($condModulo !== null) {
                $condicionesExtra[] = $condModulo;
            }
            unset($params['modulo']);
        }

        // Filtro por acción (string o arreglo)
        $condAccion = $construirCondicionLista('t.accion', $filtroAccion);
        if ($condAccion !== null) {
            $condicionesExtra[] = $condAccion;
        }

        $customWhereSQL = '';
        if (!empty($condicionesExtra)) {
            $customWhereSQL = implode(' AND ', $condicionesExtra);
            $params['custom_where'] = $customWhereSQL;
        }

        // 2. Orden: se normaliza y se valida contra la whitelist
        //    (el menú de orden del frontend manda columna y direccion)
        $columnasOrdenPermitidas = [
            't.movimiento_id',
            't.fecha',
            't.modulo',
            't.accion'
        ];

        // Nombres antiguos o sin alias que se aceptan y se convierten
        $aliasColumnasOrden = [
            'm.ID'          => 't.movimiento_id',
            'ID'            => 't.movimiento_id',
            'id'            => 't.movimiento_id',
            't.id'          => 't.movimiento_id',
            'movimiento_id' => 't.movimiento_id',
            'm.fecha'       => 't.fecha',
            'fecha'         => 't.fecha',
            'm.modulo'      => 't.modulo',
            'modulo'        => 't.modulo',
            'm.accion'      => 't.accion',
            'accion'        => 't.accion'
        ];

        $columnaSolicitada = trim((string)($params['columna'] ?? ''));
        $columnaOrden = $aliasColumnasOrden[$columnaSolicitada] ?? $columnaSolicitada;

        if (!in_array($columnaOrden, $columnasOrdenPermitidas, true)) {
            $columnaOrden = 't.movimiento_id';
        }

        $direccionOrden = strtoupper(trim((string)($params['direccion'] ?? 'DESC'))) === 'ASC' ? 'ASC' : 'DESC';

        $params['columna']   = $columnaOrden;
        $params['direccion'] = $direccionOrden;

        // 3. Whitelists de seguridad
        $configuracionSeguridad = [
            'columnas_busqueda' => [
                't.movimiento_id',
                't.nombre',
                't.apellido_paterno',
                't.modulo',
                't.accion',
                't.descripcion'
            ],
            'filtros_permitidos' => [],
            'columnas_orden' => $columnasOrdenPermitidas
        ];

        // Tabla derivada: movimiento_id evita el choque de ID entre movimientos y usuarios.
        // Solo se exponen las columnas necesarias (sin CURP, RFC, correo, etc.).
        $tablaConJoins = "(
            SELECT
                m.ID AS movimiento_id,
                m.usuario_id,
                m.sesion_id,
                m.modulo,
                m.entidad_id,
                m.accion,
                m.descripcion,
                m.fecha,
                u.nombre,
                u.apellido_paterno,
                CONCAT_WS(' ', u.nombre, u.apellido_paterno) AS usuario_nombre
            FROM movimientos m
            INNER JOIN usuarios u ON m.usuario_id = u.ID
        ) t";

        // 4. Paginación estándar
        $resultado = PaginacionService::obtenerPaginados($tablaConJoins, $params, $configuracionSeguridad);

        if (empty($resultado['exito'])) {
            JsonResponse::error("Ocurrió un error al consultar los movimientos", null, 500);
            return;
        }

        $datos = (!empty($resultado['datos']) && is_array($resultado['datos'])) ? $resultado['datos'] : [];

        // 5. Origen de cada movimiento (movimientos.sesion_id -> sesiones -> sucursales)
        $formatearFecha = function ($valor) {
            return (!empty($valor) && function_exists('FormatearFechaEspanol'))
                ? FormatearFechaEspanol($valor, true, true)
                : $valor;
        };

        $sesionesPorMovimiento = [];
        $idsMovimientos = [];
        foreach ($datos as $fila) {
            $idMov = (int)($fila['movimiento_id'] ?? 0);
            if ($idMov > 0) {
                $idsMovimientos[] = $idMov;
            }
        }

        if (!empty($idsMovimientos)) {
            try {
                $placeholders = implode(',', array_fill(0, count($idsMovimientos), '?'));

                $stmtSesiones = $conexionDb->prepare("
                    SELECT
                        m.ID AS movimiento_id,
                        s.sucursal_id,
                        su.nombre AS sucursal_nombre,
                        s.IP,
                        s.user_agent,
                        s.aplicativo
                    FROM movimientos m
                    INNER JOIN sesiones s ON s.ID = m.sesion_id
                    LEFT JOIN sucursales su ON su.ID = s.sucursal_id
                    WHERE m.ID IN ($placeholders)
                ");
                $stmtSesiones->execute($idsMovimientos);

                foreach ($stmtSesiones->fetchAll(PDO::FETCH_ASSOC) as $s) {
                    $sesionesPorMovimiento[(int)$s['movimiento_id']] = [
                        'sucursal_id' => $s['sucursal_id'] !== null ? (int)$s['sucursal_id'] : null,
                        'sucursal'    => $s['sucursal_nombre'],
                        'IP'          => $s['IP'],
                        'user_agent'  => $s['user_agent'],
                        'aplicativo'  => $s['aplicativo']
                    ];
                }
            } catch (Throwable $exSesion) {
                error_log("Aviso al consultar el origen de los movimientos: " . $exSesion->getMessage());
            }
        }

        // 6. Formatear fecha y adjuntar el origen a cada movimiento
        foreach ($datos as &$movimiento) {
            $idMov = (int)($movimiento['movimiento_id'] ?? 0);

            if (!empty($movimiento['fecha'])) {
                $movimiento['fecha'] = $formatearFecha($movimiento['fecha']);
            }

            $movimiento['sesion'] = $sesionesPorMovimiento[$idMov] ?? null;
        }
        unset($movimiento);

        // 7. Universo completo de IDs filtrados
        $todosLosIds = [];
        try {
            $whereParts = [];
            $bind = [];

            if ($customWhereSQL !== '') {
                $whereParts[] = $customWhereSQL;
            }

            $terminoBusqueda = trim((string)($params['buscar'] ?? $params['search'] ?? ''));
            if ($terminoBusqueda !== '') {
                $like = '%' . $terminoBusqueda . '%';
                $whereParts[] = "(t.movimiento_id LIKE ? OR t.nombre LIKE ? OR t.apellido_paterno LIKE ? OR t.modulo LIKE ? OR t.accion LIKE ? OR t.descripcion LIKE ?)";
                $bind = array_fill(0, 6, $like);
            }

            $sqlTodosIds = "SELECT t.movimiento_id FROM $tablaConJoins";
            if (!empty($whereParts)) {
                $sqlTodosIds .= " WHERE " . implode(" AND ", $whereParts);
            }

            $stmtIds = $conexionDb->prepare($sqlTodosIds);
            $stmtIds->execute($bind);
            $todosLosIds = array_map('strval', $stmtIds->fetchAll(PDO::FETCH_COLUMN));
        } catch (Throwable $exQuery) {
            error_log("Aviso al consultar IDs globales de movimientos: " . $exQuery->getMessage());
        }

        if (empty($todosLosIds) && !empty($datos)) {
            $todosLosIds = array_map(function ($row) {
                return strval($row['movimiento_id'] ?? '');
            }, $datos);
        }

        // 8. Respuesta (sin exponer el SQL interno)
        $paramsRespuesta = $params;
        unset($paramsRespuesta['custom_where']);

        JsonResponse::success("Movimientos obtenidos correctamente", [
            'datos'         => $datos,
            'paginacion'    => $resultado['paginacion'],
            'todos_los_ids' => $todosLosIds,
            'params'        => $paramsRespuesta
        ]);

    } catch (Throwable $e) {
        error_log("Error en Obtener_Movimientos_Paginados: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al obtener los movimientos", $e->getMessage(), 500);
    }
}

function Obtener_Modulos_Y_Acciones_Movimientos(): void {
    try {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Obtenemos pares únicos de módulo y acción ordenados alfabéticamente
        $sql = "
            SELECT DISTINCT
                TRIM(modulo) AS modulo,
                TRIM(accion) AS accion
            FROM movimientos
            WHERE modulo IS NOT NULL AND TRIM(modulo) <> ''
              AND accion IS NOT NULL AND TRIM(accion) <> ''
            ORDER BY modulo ASC, accion ASC
        ";

        $filas = Consultar_PDO($sql);

        $modulos = [];
        $acciones = [];
        $accionesPorModulo = [];

        foreach ($filas as $fila) {
            $modulo = (string)$fila['modulo'];
            $accion = (string)$fila['accion'];

            if (!in_array($modulo, $modulos, true)) {
                $modulos[] = $modulo;
            }

            if (!in_array($accion, $acciones, true)) {
                $acciones[] = $accion;
            }

            if (!isset($accionesPorModulo[$modulo])) {
                $accionesPorModulo[$modulo] = [];
            }

            if (!in_array($accion, $accionesPorModulo[$modulo], true)) {
                $accionesPorModulo[$modulo][] = $accion;
            }
        }

        JsonResponse::success("Módulos y acciones obtenidos correctamente", [
            'modulos'             => $modulos,
            'acciones'            => $acciones,
            'acciones_por_modulo' => $accionesPorModulo
        ]);

    } catch (Throwable $e) {
        error_log("Error en Obtener_Modulos_Y_Acciones_Movimientos: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al obtener los módulos y acciones", $e->getMessage(), 500);
    }
}


function Exportar_Movimientos(array $datos = []): void
{
    $formato   = (string)($datos['formato'] ?? 'csv');
    $seleccion = $datos['seleccion'] ?? ($datos['ids'] ?? []);

    if (is_string($seleccion) && $seleccion !== '') {
        $decoded = json_decode($seleccion, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $seleccion = $decoded;
        } else {
            $seleccion = explode(',', $seleccion);
        }
    }

    $sql = "SELECT
                m.ID AS ID_Movimiento,
                COALESCE(
                    NULLIF(TRIM(CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno)), ''),
                    u.nombre_usuario
                ) AS Usuario,
                u.nombre_usuario AS Nombre_Usuario,
                m.modulo AS Modulo,
                m.accion AS Accion,
                m.entidad_id AS ID_Entidad,
                m.descripcion AS Descripcion,
                m.fecha AS Fecha,
                su.nombre AS Sucursal,
                su.tipo AS Tipo_Sucursal,
                s.IP AS IP_Sesion,
                s.aplicativo AS Aplicativo
            FROM movimientos m
            LEFT JOIN usuarios u ON u.ID = m.usuario_id
            LEFT JOIN sesiones s ON s.ID = m.sesion_id
            LEFT JOIN sucursales su ON su.ID = s.sucursal_id";

    $params = [];

    $idsLimpios = [];
    if (is_array($seleccion)) {
        foreach ($seleccion as $item) {
            if (is_array($item) || is_object($item)) {
                $arr = (array)$item;
                $item = $arr['ID'] ?? $arr['id'] ?? $arr['movimiento_id'] ?? reset($arr);
            }
            $num = (int)preg_replace('/\D+/', '', (string)$item);
            if ($num > 0) {
                $idsLimpios[] = $num;
            }
        }
        $idsLimpios = array_values(array_unique($idsLimpios));
    }

    if (!empty($idsLimpios)) {
        $placeholders = implode(',', array_fill(0, count($idsLimpios), '?'));
        $sql .= " WHERE m.ID IN ({$placeholders})";
        $params = $idsLimpios;
    }

    $sql .= " ORDER BY m.ID DESC";

    EjecutarExportacion(
        $formato,
        $sql,
        $params,
        'Listado de Movimientos',
        'movimientos_reporte'
    );
}