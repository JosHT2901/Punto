<?php
// Asegurar que la sesión esté iniciada
if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}

// Obtener la imagen de perfil y el nombre desde la sesión estructurada con respaldos seguros
$imagenUsuarioNavbar = $_SESSION['usuario']['imagen'] ?? '../../uploads/usuarios/default.png';
$nombreUsuarioNavbar = $_SESSION['usuario']['nombre'] ?? 'Usuario';

// Validar físicamente si la imagen del usuario existe en el servidor
if (!empty($imagenUsuarioNavbar) && strpos($imagenUsuarioNavbar, 'default') === false) {
    $rutaAbsolutaServidorNavbar = __DIR__ . '/../../' . ltrim(str_replace('../../', '', $imagenUsuarioNavbar), '/');
    if (!file_exists($rutaAbsolutaServidorNavbar)) {
        $imagenUsuarioNavbar = '../../uploads/usuarios/default.png';
    }
}
?>

<style>
    @media (max-width: 768px) {
        #navbar-reloj-fecha,
        #navbar-reloj-separador {
            display: none !important;
        }
    }
    @media (max-width: 480px) {
        #navbar-main-container {
            gap: 8px !important;
        }
        #navbar-reloj-icono {
            display: none !important;
        }
        #navbar-reloj-hora {
            font-size: 13px !important;
        }
    }
</style>

<div id="navbar-main-container" class="w-p-100 h-p-100 box-sizing p-2 flex items-center justify-between gap-4 bg-white">

    <!-- 1. Botón Abrir Menú -->
    <div class="flex-center shrink-0">
        <a class="btn w-40 h-40 btn-secondary rounded-md flex-center mx-auto cursor-pointer" id="menu-boton-abrir" title="Menú">
            <i class="vf-ic_fluent_grid_dots_24_filled fs-8"></i>
        </a>
    </div>

    <!-- 2. Reloj (Mantiene exactamente la estética limpia de la barra) -->
    <div class="flex-1 min-w-0 flex items-center justify-start" id="menu-contenedor-reloj">
        <div class="flex items-center gap-2 bg-gray-200 rounded-md px-3 h-40 min-w-0">
            <i id="navbar-reloj-icono" class="vf-ic_fluent_clock_24_filled fs-5 text-blue-03618d shrink-0"></i>
            <span id="navbar-reloj-hora" class="fw-600 fs-3 text-main" style="white-space: nowrap; font-variant-numeric: tabular-nums;">
                --:--:--
            </span>
            <span id="navbar-reloj-separador" class="text-gray-400">|</span>
            <span id="navbar-reloj-fecha" class="fs-2 fw-600 text-gray-500 texto-truncado">
                Cargando...
            </span>
        </div>
    </div>

    <!-- 3. Acciones de Usuario y Notificaciones -->
    <div class="flex items-center gap-1 shrink-0">
        <!-- Correo con Badge -->
        <a class="btn w-40 h-40 btn-ghost rounded-md flex-center position-relative cursor-pointer" title="Correos">
            <i class="fs-8 vf-ic_fluent_mail_24_filled"></i>
            <span id="badge-mail-main"
                class="position-absolute top-0 right-0 bg-danger text-white fw-bold rounded-full flex-center w-18 h-18 fs-0 border-white"
                style="display:none; transform: translate(0%, -5%);">
            </span>
        </a>

        <!-- Alertas con Badge -->
        <a class="btn w-40 h-40 btn-ghost rounded-md flex-center position-relative cursor-pointer" id="nuevo-usuario-boton-generar-usuario" title="Alertas">
            <i class="fs-8 vf-ic_fluent_alert_24_filled"></i>
            <span id="badge-mensajes-main"
                class="position-absolute top-0 right-0 bg-danger text-white fw-bold rounded-full flex-center w-18 h-18 fs-0 border-white"
                style="display:none; transform: translate(0%, -5%);">
                0
            </span>
        </a>
        
        <!-- Chat con Badge -->
        <a class="btn w-40 h-40 btn-ghost rounded-md flex-center position-relative cursor-pointer" id="nuevo-usuario-boton-chat" title="Chat">
            <i class="fs-8 vf-ic_fluent_chat_24_filled"></i>
            <span id="badge-chat-main"
                class="position-absolute top-0 right-0 bg-danger text-white fw-bold rounded-full flex-center w-18 h-18 fs-0 border-white"
                style="display:none; transform: translate(0%, -5%);">
                0
            </span>
        </a>
    </div>

    <!-- 4. Avatar / Botón de Perfil de Usuario -->
    <div class="flex-center shrink-0 px-2">
        <a class="w-40 h-40 rounded-circle btn btn-ghost flex-center p-0 overflow-hidden border border-gray-300 cursor-pointer position-relative" id="menu-boton-usuario" title="Perfil de <?= htmlspecialchars($nombreUsuarioNavbar) ?>">
            <?php if (!empty($imagenUsuarioNavbar) && strpos($imagenUsuarioNavbar, 'default') !== false): ?>
                <img src="<?= htmlspecialchars($imagenUsuarioNavbar) ?>" alt="Imagen de perfil" class="w-25 h-25 imagen_usuario" style="object-fit: contain;">
            <?php else: ?>
                <img src="<?= htmlspecialchars($imagenUsuarioNavbar) ?>" alt="Imagen de perfil" class="w-p-100 h-p-100 imagen_usuario" style="object-fit: cover;">
            <?php endif; ?>
        </a>
    </div>

</div>
