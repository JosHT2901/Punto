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
    $ejecutar        = $data['ejecutar'] ?? '';
    $usuarioSesionId = $data['sesion_usuario_id'] ?? null;
    $sesionId        = $data['sesion_id'] ?? null;

    $nombre           = trim($data['nombre'] ?? '');
    $apellido_paterno = trim($data['apellido_paterno'] ?? '');
    $apellido_materno = trim($data['apellido_materno'] ?? '');
    $fecha_nacimiento = !empty($data['fecha_nacimiento']) ? $data['fecha_nacimiento'] : null;
    $curp             = trim($data['curp'] ?? '');
    $rfc              = trim($data['rfc'] ?? '');
    $telefono         = trim($data['telefono'] ?? '');
    $correo           = trim($data['correo'] ?? '');
    $usuario          = trim($data['usuario'] ?? '');
    $id_usuario       = $data['id'] ?? null;

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

            // A. Insertar usuario
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

            // D. REGISTRO CENTRALIZADO DE BITÁCORA Y AUDITORÍA
            $actorId = $usuarioSesionId ?: $nuevoIdUsuario;
            RegistrarBitacoraAccion(
                $actorId, 
                $sesionId, 
                'USUARIOS', 
                'CREAR', 
                $nuevoIdUsuario, 
                "Se creó el usuario: {$usuario} (ID: {$nuevoIdUsuario})", 
                null, 
                $paramsUser
            );

            JsonResponse::success('Usuario creado exitosamente.', $usuario);

        } else if ($ejecutar === 'editar_usuario') {
            if (empty($id_usuario)) {
                JsonResponse::error('ID de usuario no proporcionado para la actualización.');
            }

            // Obtener valores anteriores para la auditoría comparativa
            $valorAnteriorData = Consultar_PDO("SELECT nombre, apellido_paterno, apellido_materno, fecha_nacimiento, curp, rfc, telefono, correo, nombre_usuario FROM usuarios WHERE ID = :id", [':id' => $id_usuario], false);

            // Actualizar datos
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

            // REGISTRO CENTRALIZADO DE BITÁCORA Y AUDITORÍA
            $actorId = $usuarioSesionId ?: $id_usuario;
            RegistrarBitacoraAccion(
                $actorId, 
                $sesionId, 
                'USUARIOS', 
                'EDITAR', 
                $id_usuario, 
                "Se actualizaron los datos del usuario ID: {$id_usuario}", 
                $valorAnteriorData, 
                $paramsUser
            );

            JsonResponse::success('Usuario actualizado correctamente.', $usuario);
        }

        JsonResponse::error('Acción no reconocida.');

    } catch (Exception $e) {
        $mensajeError = $e->getMessage();
        $respuestaAmigable = 'Ocurrió al procesar la solicitud.';
        if (strpos($mensajeError, '23000') !== false || strpos($mensajeError, 'Duplicate entry') !== false) {
            $respuestaAmigable = 'El correo, nombre de usuario, teléfono, CURP o RFC ya se encuentran registrados.';
        }
        JsonResponse::error($respuestaAmigable, $mensajeError, 500);
    }
}

function Obtener_Usuarios_Paginados(array $params = []): void {
    try {
        // Aseguramos que la sesión esté activa para leer variables globales ($_SESSION)
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Detectamos el ID del usuario actual desde la sesión (ajusta la llave según tu estructura de login, ej: 'user_id', 'id_usuario', 'id')
        $usuarioActualId = $_SESSION['user_id'] ?? $_SESSION['id_usuario'] ?? $_SESSION['id'] ?? null;

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
            // 🌟 4.1. Enriquecemos cada usuario con su 'nombre_completo' y formato de verificación
            if (!empty($resultado['datos']) && is_array($resultado['datos'])) {
                foreach ($resultado['datos'] as &$usuario) {
                    $partes = [
                        $usuario['nombre'] ?? '',
                        $usuario['apellido_paterno'] ?? '',
                        $usuario['apellido_materno'] ?? ''
                    ];
                    // Filtramos valores vacíos y unimos con espacio
                    $usuario['nombre_completo'] = trim(implode(' ', array_filter($partes)));
                    $verificado = (int)($usuario['correo_verificado'] ?? 0);
                    $usuario['correo_verificado_fmt'] = $verificado === 1 ? 'VERIFICADO' : 'NO VERIFICADO';
                    
                    // Indicador bandera útil en frontend si este registro es el usuario logueado actual
                    if ($usuarioActualId && (string)$usuario['ID'] === (string)$usuarioActualId) {
                        $usuario['es_usuario_actual'] = true;
                    } else {
                        $usuario['es_usuario_actual'] = false;
                    }
                }
                unset($usuario);
            }

            // 🌟 5. OBTENER EL UNIVERSO COMPLETO DE IDS FILTRADOS DE TODAS LAS PÁGINAS
            $todosLosIds = [];
            
            try {
                // Construimos la consulta independiente para extraer todos los IDs filtrados
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
                error_log("Aviso al consultar todos los IDs globales de usuarios: " . $exQuery->getMessage());
            }

            // Fallback de seguridad: Si la consulta global falló, extraemos los IDs del resultado paginado actual
            if (empty($todosLosIds) && !empty($resultado['datos'])) {
                $todosLosIds = array_map(function($row) { 
                    return strval($row['ID'] ?? $row['id'] ?? ''); 
                }, $resultado['datos']);
            }

            // 6. Respuesta exitosa incluyendo el ID del usuario actual en la metadata de la respuesta
            JsonResponse::success("Usuarios obtenidos correctamente", [
                'datos' => $resultado['datos'],
                'paginacion' => $resultado['paginacion'],
                'todos_los_ids' => $todosLosIds,
                'usuario_actual_id' => $usuarioActualId ? (string)$usuarioActualId : null, // <--- ID del usuario en sesión
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
?>