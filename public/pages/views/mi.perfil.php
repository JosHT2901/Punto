<?php
include_once dirname(__DIR__, 3) . "/src/config/bootstrap.php";
include_once dirname(__DIR__, 3) . "/src/controllers/php/helpers/time.php";
$tituloPage = "Mi cuenta";
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
// 1. Obtener el ID del usuario desde la sesión estructurada (con respaldo a 48)
$usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 48));

// 2. Imagen por default si no se encuentra ninguna
$imagenDefault = '../../uploads/usuarios/default.png';

// 3. Datos base iniciales respaldados con la información de la sesión activa
$datosUsuario = [
    'id' => $usuarioId,
    'nombre' => $_SESSION['usuario']['nombre'] ?? 'Josthin',
    'apellido_paterno' => $_SESSION['usuario']['apellido_paterno'] ?? 'Hernandez',
    'apellido_materno' => $_SESSION['usuario']['apellido_materno'] ?? 'Tehozol',
    'nombre_usuario' => $_SESSION['usuario']['nombre_usuario'] ?? 'jos2901',
    'correo' => $_SESSION['usuario']['correo'] ?? 'tehozolhernandezjosthin@gmail.com',
    'correo_verificado' => 1,
    'imagen' => $_SESSION['usuario']['imagen'] ?? $imagenDefault,
    'telefono' => '246 218 71 41',
    'curp' => 'HETJ000129HTLXR01',
    'rfc' => 'HETJ0001297K8',
    'fecha_nacimiento' => '2000-01-29',
    'Fecha_registro' => '2026-04-15 08:30:00',
    'ultima_modificacion_password' => 'Sin registros',
    'ultima_modificacion_pin' => 'Sin configurar'
];

$sesionesActivas = [];
$primeraSesion = null;

// Función para transformar la cadena técnica del navegador en un formato limpio
$limpiarUserAgent = function($userAgent) {
    if (empty($userAgent)) return 'Navegador Web';
    
    $navegador = 'Navegador Web';
    $sistema = 'Dispositivo desconocido';

    if (strpos($userAgent, 'Firefox') !== false) {
        $navegador = 'Firefox';
    } elseif (strpos($userAgent, 'Edg') !== false) {
        $navegador = 'Microsoft Edge';
    } elseif (strpos($userAgent, 'Chrome') !== false) {
        $navegador = 'Google Chrome';
    } elseif (strpos($userAgent, 'Safari') !== false) {
        $navegador = 'Safari';
    } elseif (strpos($userAgent, 'Opera') !== false || strpos($userAgent, 'OPR') !== false) {
        $navegador = 'Opera';
    }

    if (strpos($userAgent, 'Windows NT 10.0') !== false) {
        $sistema = 'Windows';
    } elseif (strpos($userAgent, 'Windows NT 6.1') !== false) {
        $sistema = 'Windows 7';
    } elseif (strpos($userAgent, 'Macintosh') !== false || strpos($userAgent, 'Mac OS X') !== false) {
        $sistema = 'macOS';
    } elseif (strpos($userAgent, 'Android') !== false) {
        $sistema = 'Android';
    } elseif (strpos($userAgent, 'iPhone') !== false || strpos($userAgent, 'iPad') !== false) {
        $sistema = 'iOS';
    } elseif (strpos($userAgent, 'Linux') !== false) {
        $sistema = 'Linux';
    }

    return "$navegador en $sistema";
};

if (!empty($usuarioId)) {
    $sql = "SELECT 
                u.ID, u.nombre, u.apellido_paterno, u.apellido_materno, 
                u.fecha_nacimiento, u.curp, u.rfc, u.telefono, u.correo, 
                u.correo_verificado, u.nombre_usuario, u.Fecha_registro,
                up.ultima_modificacion_password, up.ultima_modificacion_pin,
                ui.ruta AS imagen_perfil
            FROM usuarios u
            LEFT JOIN usuarios_password up ON u.ID = up.usuario_id
            LEFT JOIN usuarios_imagenes ui ON u.ID = ui.usuario_id AND ui.principal = 1
            WHERE u.ID = ? LIMIT 1";

    try {
        $resultado = Consultar_PDO($sql, [$usuarioId]);
        if (!empty($resultado) && is_array($resultado)) {
            $datosUsuario = array_merge($datosUsuario, array_filter($resultado[0], function ($val) {
                return $val !== null;
            }));
        }

        $formatearFechaSegura = function ($fecha, $mostrarHora = false, $formatoCorto = false, $mostrarDiaSemana = false, $default = 'Sin registros') {
            if (empty($fecha) || $fecha === '0000-00-00 00:00:00' || $fecha === '0000-00-00') {
                return $default;
            }
            try {
                return FormatearFechaEspanol($fecha, $mostrarHora, $formatoCorto, $mostrarDiaSemana);
            } catch (Throwable $ex) {
                return $fecha;
            }
        };

        $datosUsuario['fecha_nacimiento_formateada'] = $formatearFechaSegura($datosUsuario['fecha_nacimiento'] ?? '', false, false, false, 'No especificada');
        $datosUsuario['Fecha_registro_formateada'] = $formatearFechaSegura($datosUsuario['Fecha_registro'] ?? '', true, false, false);
        $datosUsuario['password_updated_at_formateada'] = $formatearFechaSegura($datosUsuario['ultima_modificacion_password'] ?? '', true, false, false, 'Sin registros');
        $datosUsuario['pin_updated_at_formateada'] = $formatearFechaSegura($datosUsuario['ultima_modificacion_pin'] ?? '', true, false, false, 'Sin configurar');

        $rutaImagenBD = $datosUsuario['imagen_perfil'] ?? '';
        if (!empty($rutaImagenBD)) {
            // 1. Construimos la ruta absoluta exacta en el disco duro
            $proyectoRoot = realpath(__DIR__ . '/../../../');
            $rutaAbsolutaServidor = rtrim($proyectoRoot, '/') . '/' . ltrim($rutaImagenBD, '/');
            // 2. Verificamos que el archivo exista físicamente
            if (file_exists($rutaAbsolutaServidor) && is_file($rutaAbsolutaServidor)) {
                // 3. Obtenemos el tipo MIME (ej: image/jpeg, image/png)
                $tipoMime = mime_content_type($rutaAbsolutaServidor) ?: 'image/jpeg';
                
                // 4. Leemos el contenido binario del archivo y lo convertimos a Base64
                $contenidoBinario = file_get_contents($rutaAbsolutaServidor);
                if ($contenidoBinario !== false) {
                    $datosUsuario['imagen'] = 'data:' . $tipoMime . ';base64,' . base64_encode($contenidoBinario);
                } else {
                    $datosUsuario['imagen'] = $imagenDefault;
                }
            } else {
                $datosUsuario['imagen'] = $imagenDefault;
            }
        } else {
            $datosUsuario['imagen'] = $imagenDefault;
        }
        // 1. Consultar sesiones activas normales
        $sqlSesiones = "SELECT ID, inicio_sesion, IP, user_agent, aplicativo 
                        FROM sesiones 
                        WHERE usuario_id = ? AND sesion_activa = 1 
                        ORDER BY inicio_sesion DESC";
        $sesionesActivas = Consultar_PDO($sqlSesiones, [$usuarioId]) ?: [];

        // 2. Consultar la primera sesión histórica del usuario (la más antigua registrada)
        $sqlPrimeraSesion = "SELECT ID, inicio_sesion, IP, user_agent, aplicativo 
                             FROM sesiones 
                             WHERE usuario_id = ? 
                             ORDER BY inicio_sesion ASC LIMIT 1";
        $resPrimera = Consultar_PDO($sqlPrimeraSesion, [$usuarioId]);
        if (!empty($resPrimera)) {
            $primeraSesion = $resPrimera[0];
            $primeraSesion['inicio_sesion_formateada'] = $formatearFechaSegura($primeraSesion['inicio_sesion'] ?? '', true, false, false);
        }

        if (empty($sesionesActivas)) {
            $sesionesActivas[] = [
                'ID' => 0,
                'inicio_sesion' => date('Y-m-d H:i:s'),
                'IP' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Navegador Web',
                'aplicativo' => 'Web'
            ];
        }

        foreach ($sesionesActivas as &$sesion) {
            $sesion['inicio_sesion_formateada'] = $formatearFechaSegura($sesion['inicio_sesion'] ?? '', true, false, false);
        }
        unset($sesion);
    } catch (Throwable $e) {
        error_log("Error al obtener datos del perfil para el usuario $usuarioId: " . $e->getMessage());
        $datosUsuario['imagen'] = $imagenDefault;
    }
}

ob_start();
?>
<div class="w-p-100 h-p-100 overflow-auto flex flex-column box-sizing">

    <!-- Header Superior de Acciones / Accesos Rápidos -->
    <div class="w-p-100 flex justify-end items-center p-1 mb-4 box-sizing">
        <div class="flex items-center gap-2">
            <a class="h-35 px-3 flex justify-center items-center rounded-md btn btn-secondary flex-shrink-0 cursor-pointer"
                id="boton-cambiar-pin">
                <i class="icon vf-ic_fluent_password_24_filled fs-4 mr-2 text-blue-03618d"></i>
                <span class="fs-2 fw-600">Cambiar PIN</span>
            </a>
            <a class="h-35 px-3 flex justify-center items-center rounded-md btn btn-secondary flex-shrink-0 cursor-pointer"
                id="boton-cambiar-password">
                <i class="icon vf-ic_fluent_key_24_filled fs-4 mr-2 text-blue-03618d"></i>
                <span class="fs-2 fw-600">Cambiar Contraseña</span>
            </a>
        </div>
    </div>

    <!-- Banner Principal de Perfil -->
    <div class="w-p-100 bg-white p-4 rounded-8 shadow-sm border border-gray-200 flex items-center gap-4 mb-4 box-sizing position-relative">
        <div class="position-absolute top-0 left-0 w-p-100 h-6 bg-blue-03618d"></div>
        <div class="w-70 h-70 bg-gray-100 border border-blue-03618d-20 flex-shrink-0 flex-center position-relative overflow-hidden contenedor-avatar-hover" style="border-radius: 50%;">
            <?php if (strpos($datosUsuario['imagen'], 'default') !== false): ?>
                <img src="<?= htmlspecialchars($datosUsuario['imagen']) ?>" alt="Imagen de perfil" class="w-40 h-40" style="object-fit: contain;">
            <?php else: ?>
                <img src="<?= htmlspecialchars($datosUsuario['imagen']) ?>" alt="Imagen de perfil" class="w-p-100 h-p-100 imagen_usuario" style="object-fit: cover;">
            <?php endif; ?>

            <div class="position-absolute w-p-100 h-p-100 top-0 left-0 flex justify-center items-center transition-all" style="background-color:#0000008f; border-radius:50%; opacity: 0; transition: opacity 0.2s ease-in-out;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">
                <a class="btn w-40 h-40 btn-secondary rounded-md flex-center position-relative cursor-pointer" id="btn-cambiar-imagen" title="Cambiar imagen">
                    <i class="fs-7 vf-ic_fluent_scan_camera_24_filled"></i>
                </a>
            </div>
        </div>
        <div class="flex-1 flex flex-column justify-center row-gap-1">
            <div class="flex items-center row-gap-3">
                <span class="fw-700 fs-5 text-main"><?= htmlspecialchars($datosUsuario['nombre'] . ' ' . $datosUsuario['apellido_paterno'] . ' ' . $datosUsuario['apellido_materno']) ?></span>
            </div>
            <span class="fw-600 fs-3 text-brand">@<?= htmlspecialchars($datosUsuario['nombre_usuario']) ?></span>
        </div>
    </div>

    <!-- Contenedor Principal de Secciones -->
    <div class="flex-1 overflow-auto custom-scroll flex flex-column row-gap-3">

        <!-- Información Personal -->
        <div class="w-p-100 bg-white rounded-8 shadow-sm border border-gray-200 box-sizing">
            <div class="w-p-100 px-4 py-3 flex justify-between items-center border-bottom border-gray-100">
                <div class="flex-1 flex justify-start items-center gap-2">
                    <i class="fs-5 text-blue-03618d vf-ic_fluent_person_24_regular"></i>
                    <span class="fw-700 fs-4 text-main">Información personal</span>
                </div>
                <a class="btn w-35 h-35 btn-secondary rounded-md flex-center position-relative transition-all cursor-pointer" id="btn-editar-info-personal" title="Editar información">
                    <i class="fs-6 vf-ic_fluent_edit_24_filled"></i>
                </a>
            </div>

            <div class="w-p-100 p-4 overflow-auto row-gap-2 flex flex-column">
                <div class="w-p-100 flex items-center p-2 box-sizing border-bottom border-gray-100">
                    <div class="flex justify-start items-center w-200 fw-600 fs-3 text-gray-500 px-2">
                        <span>Nombre completo</span>
                    </div>
                    <div class="flex justify-start items-center flex-1 px-2 fw-600 fs-3 text-main">
                        <span><?= htmlspecialchars($datosUsuario['nombre'] . ' ' . $datosUsuario['apellido_paterno'] . ' ' . $datosUsuario['apellido_materno']) ?></span>
                    </div>
                </div>
                <div class="w-p-100 flex items-center p-2 box-sizing border-bottom border-gray-100">
                    <div class="flex justify-start items-center w-200 fw-600 fs-3 text-gray-500 px-2">
                        <span>Fecha de nacimiento</span>
                    </div>
                    <div class="flex justify-start items-center flex-1 px-2 fw-500 fs-3 text-main">
                        <span><?= htmlspecialchars($datosUsuario['fecha_nacimiento_formateada']) ?></span>
                    </div>
                </div>
                <div class="w-p-100 flex items-center p-2 box-sizing border-bottom border-gray-100">
                    <div class="flex justify-start items-center w-200 fw-600 fs-3 text-gray-500 px-2">
                        <span>C.U.R.P.</span>
                    </div>
                    <div class="flex justify-start items-center flex-1 px-2 fw-500 fs-3 text-main">
                        <span><?= htmlspecialchars($datosUsuario['curp'] ?? 'No registrada') ?></span>
                    </div>
                </div>
                <div class="w-p-100 flex items-center p-2 box-sizing">
                    <div class="flex justify-start items-center w-200 fw-600 fs-3 text-gray-500 px-2">
                        <span>R.F.C.</span>
                    </div>
                    <div class="flex justify-start items-center flex-1 px-2 fw-500 fs-3 text-main">
                        <span><?= htmlspecialchars($datosUsuario['rfc'] ?? 'No registrado') ?></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Contacto -->
        <div class="w-p-100 bg-white rounded-8 shadow-sm border border-gray-200 box-sizing">
            <div class="w-p-100 px-4 py-3 flex justify-between items-center border-bottom border-gray-100">
                <div class="flex-1 flex justify-start items-center gap-2">
                    <i class="fs-5 text-blue-03618d vf-ic_fluent_call_24_regular"></i>
                    <span class="fw-700 fs-4 text-main">Contacto</span>
                </div>
                <a class="btn w-35 h-35 btn-secondary rounded-md flex-center position-relative transition-all cursor-pointer" id="btn-editar-contacto" title="Editar información">
                    <i class="fs-6 vf-ic_fluent_edit_24_filled"></i>
                </a>
            </div>

            <div class="w-p-100 p-4 overflow-auto row-gap-2 flex flex-column">
                <div class="w-p-100 flex items-center p-2 box-sizing border-bottom border-gray-100">
                    <div class="flex justify-start items-center w-200 fw-600 fs-3 text-gray-500 px-2">
                        <span>Teléfono</span>
                    </div>
                    <div class="flex justify-start items-center flex-1 px-2 fw-500 fs-3 text-main">
                        <span><?= htmlspecialchars($datosUsuario['telefono'] ?? 'No registrado') ?></span>
                    </div>
                </div>
                <div class="w-p-100 flex items-center p-2 box-sizing">
                    <div class="flex justify-start items-center w-200 fw-600 fs-3 text-gray-500 px-2">
                        <span>Correo</span>
                    </div>
                    <div class="flex justify-start items-center flex-1 px-2 fw-500 fs-3 text-main">
                        <div class="flex-1 h-p-100 flex justify-start items-center">
                            <span><?= htmlspecialchars($datosUsuario['correo']) ?></span>
                        </div>
                        <div class="w-30 h-p-100 flex justify-center items-center">
                            <?php if (!empty($datosUsuario['correo_verificado'])): ?>
                                <i class="vf-ic_fluent_checkmark_circle_24_filled text-success fs-6" title="Correo verificado"></i>
                            <?php else: ?>
                                <i class="vf-ic_fluent_dismiss_circle_24_filled text-danger fs-6" title="Correo no verificado"></i>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cuenta y Actividad -->
        <div class="w-p-100 bg-white rounded-8 shadow-sm border border-gray-200 box-sizing">
            <div class="w-p-100 px-4 py-3 flex justify-between items-center border-bottom border-gray-100">
                <div class="flex-1 flex justify-start items-center gap-2">
                    <i class="fs-5 text-blue-03618d vf-ic_fluent_shield_key_24_regular"></i>
                    <span class="fw-700 fs-4 text-main">Cuenta y Actividad</span>
                </div>
            </div>

            <div class="w-p-100 p-4 overflow-auto row-gap-2 flex flex-column">
                <div class="w-p-100 flex items-center p-2 box-sizing border-bottom border-gray-100">
                    <div class="flex justify-start items-center w-200 fw-600 fs-3 text-gray-500 px-2">
                        <span>Nombre de usuario</span>
                    </div>
                    <div class="flex justify-start items-center flex-1 px-2 fw-500 fs-3 text-main">
                        <span><?= htmlspecialchars($datosUsuario['nombre_usuario']) ?></span>
                    </div>
                </div>
                <div class="w-p-100 flex items-center p-2 box-sizing">
                    <div class="flex justify-start items-center w-200 fw-600 fs-3 text-gray-500 px-2">
                        <span>Fecha de registro</span>
                    </div>
                    <div class="flex justify-start items-center flex-1 px-2 fw-500 fs-3 text-main">
                        <span><?= htmlspecialchars($datosUsuario['Fecha_registro_formateada']) ?></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Seguridad y Acceso -->
        <div class="w-p-100 bg-white rounded-8 shadow-sm border border-gray-200 box-sizing">
            <div class="w-p-100 px-4 py-3 flex justify-between items-center border-bottom border-gray-100">
                <div class="flex-1 flex justify-start items-center gap-2">
                    <i class="fs-5 text-blue-03618d vf-ic_fluent_lock_closed_24_regular"></i>
                    <span class="fw-700 fs-4 text-main">Seguridad y acceso</span>
                </div>
            </div>

            <div class="w-p-100 p-4 overflow-auto row-gap-2 flex flex-column">
                <div class="w-p-100 flex items-center p-2 box-sizing border-bottom border-gray-100">
                    <div class="flex justify-start items-center w-200 fw-600 fs-3 text-gray-500 px-2">
                        <span>Contraseña</span>
                    </div>
                    <div class="flex justify-between items-center flex-1 px-2 fw-500 fs-3 text-main">
                        <span>••••••••••••</span>
                        <span class="fs-2 text-gray-500">Última modificación: <?= htmlspecialchars($datosUsuario['password_updated_at_formateada']) ?></span>
                    </div>
                </div>
                <div class="w-p-100 flex items-center p-2 box-sizing">
                    <div class="flex justify-start items-center w-200 fw-600 fs-3 text-gray-500 px-2">
                        <span>PIN de acceso rápido</span>
                    </div>
                    <div class="flex justify-between items-center flex-1 px-2 fw-500 fs-3 text-main">
                        <span>••••</span>
                        <span class="fs-2 text-gray-500">Última modificación: <?= htmlspecialchars($datosUsuario['pin_updated_at_formateada']) ?></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Primera Sesión Registrada (Tarjeta Extra Unificada) -->
        <div class="w-p-100 bg-white rounded-8 shadow-sm border border-gray-200 box-sizing">
            <div class="w-p-100 px-4 py-3 flex justify-between items-center border-bottom border-gray-100">
                <div class="flex-1 flex justify-start items-center gap-2">
                    <i class="fs-5 text-blue-03618d vf-ic_fluent_history_24_regular"></i>
                    <span class="fw-700 fs-4 text-main">Primer inicio de sesión registrado</span>
                </div>
            </div>

            <div class="w-p-100 p-4 overflow-auto row-gap-2 flex flex-column">
                <?php if ($primeraSesion): ?>
                    <div class="w-p-100 flex items-center bg-gray-50 rounded-md border border-gray-200 p-3 box-sizing">
                        <div class="flex justify-center items-center w-35 h-35 bg-blue-03618d-10 text-blue-03618d rounded-circle mr-3 flex-shrink-0">
                            <i class="fs-5 vf-ic_fluent_history_24_filled"></i>
                        </div>
                        <div class="flex-1 flex flex-column row-gap-2">
                            <div class="flex items-center gap-2">
                                <span class="fw-600 fs-3 text-main"><?= htmlspecialchars($primeraSesion['aplicativo']) ?></span>
                                <span class="fs-2 text-gray-400">•</span>
                                <span class="fs-2 text-gray-600"><?= htmlspecialchars($limpiarUserAgent($primeraSesion['user_agent'] ?? '')) ?></span>
                            </div>
                            <span class="fs-2 text-gray-500">
                                IP: <?= htmlspecialchars($primeraSesion['IP'] ?? 'Desconocida') ?> 
                                <span class="mx-1">•</span> 
                                Fecha: <?= htmlspecialchars($primeraSesion['inicio_sesion_formateada']) ?>
                            </span>
                        </div>
                    </div>
                <?php else: ?>
                    <div class="w-p-100 p-2 text-center">
                        <span class="fs-3 text-gray-500">No hay registros históricos de inicio de sesión.</span>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Sesiones Activas -->
        <div class="w-p-100 bg-white rounded-8 shadow-sm border border-gray-200 box-sizing">
            <div class="w-p-100 px-4 py-3 flex justify-between items-center border-bottom border-gray-100">
                <div class="flex-1 flex justify-start items-center gap-2">
                    <i class="fs-5 text-blue-03618d vf-ic_fluent_desktop_24_regular"></i>
                    <span class="fw-700 fs-4 text-main">Sesiones activas</span>
                </div>
                <?php if (!empty($sesionesActivas) && count($sesionesActivas) > 1): ?>
                    <a class="btn btn-danger px-3 py-1.5 rounded-md fs-2 cursor-pointer transition-all fw-600" id="btn-cerrar-otras-sesiones" title="Cerrar todas las demás sesiones">Cerrar otras sesiones</a>
                <?php endif; ?>
            </div>

            <div class="w-p-100 p-4 overflow-auto row-gap-2 flex flex-column">
                <?php if (!empty($sesionesActivas)): ?>
                    <?php foreach ($sesionesActivas as $index => $sesion): ?>
                        <div class="w-p-100 flex items-center bg-gray-50 rounded-md border <?= $index === 0 ? 'border-blue-03618d-30 shadow-2xs' : 'border-gray-200' ?> p-3 box-sizing transition-all">
                            
                            <div class="flex justify-center items-center w-35 h-35 <?= $index === 0 ? 'bg-blue-03618d-10 text-blue-03618d' : 'bg-gray-200 text-gray-600' ?> rounded-circle mr-3 flex-shrink-0">
                                <i class="fs-5 <?= $index === 0 ? 'vf-ic_fluent_desktop_24_filled' : 'vf-ic_fluent_phone_24_regular' ?>"></i>
                            </div>
                            
                            <div class="flex-1 flex flex-column row-gap-2">
                                <div class="flex items-center gap-2">
                                    <span class="fw-600 fs-3 text-main"><?= htmlspecialchars($sesion['aplicativo']) ?></span>
                                    <span class="fs-2 text-gray-400">•</span>
                                    <span class="fs-2 text-gray-600"><?= htmlspecialchars($limpiarUserAgent($sesion['user_agent'] ?? '')) ?></span>
                                </div>
                                <span class="fs-2 text-gray-500">
                                    IP: <?= htmlspecialchars($sesion['IP'] ?? 'Desconocida') ?> 
                                    <span class="mx-1">•</span> 
                                    Iniciada: <?= htmlspecialchars($sesion['inicio_sesion_formateada']) ?>
                                </span>
                            </div>

                            <div class="flex items-center ml-3">
                                <?php if ($index === 0): ?>
                                    <span class="badge bg-success-10 text-success px-2 py-1 rounded-4 fs-2 fw-600">Actual</span>
                                <?php else: ?>
                                    <a class="btn btn-secondary px-2.5 py-1 rounded-md fs-2 cursor-pointer text-danger" href="../actions/cerrar_sesion.php?id=<?= $sesion['ID'] ?>">Cerrar</a>
                                <?php endif; ?>
                            </div>

                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="w-p-100 p-2 text-center">
                        <span class="fs-3 text-gray-500">No hay sesiones activas registradas.</span>
                    </div>
                <?php endif; ?>
            </div>
        </div>

    </div>
</div>
<?php
$contenido_protegido = ob_get_clean();

include_once __DIR__ . '/../layouts/protegido.php';
?>

<script src="../../../public/js/components/pages/views/mi.perfil.js" ></script>