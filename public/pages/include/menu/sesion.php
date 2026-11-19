<?php
// Asegurar que la sesión esté iniciada
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
// Obtener los datos del usuario desde la sesión estructurada (con respaldos seguros)
$nombreUsuarioMenu = $_SESSION['usuario']['nombre'] ?? 'Josthin';
$correoUsuarioMenu = $_SESSION['usuario']['correo'] ?? 'tehozolhernandezjosthin@gmail.com';
$imagenPorDefecto = '../../../public/uploads/usuarios/default.png';
$imagenUsuarioMenu = $_SESSION['usuario']['imagen'] ?? $imagenPorDefecto;

// Validar físicamente si la imagen del usuario existe en el servidor
$rutaImagenSesion = $_SESSION['usuario']['imagen'] ?? '';
if (!empty($rutaImagenSesion) && strpos($rutaImagenSesion, 'default') === false) {
    // Calculamos la ruta absoluta real en el disco duro (subiendo los niveles necesarios)
    $proyectoRoot = realpath(__DIR__ . '/../../../');
    $rutaAbsolutaServidorMenu = ($proyectoRoot ? $proyectoRoot : rtrim($_SERVER['DOCUMENT_ROOT'], '/')) . '/' . ltrim($rutaImagenSesion, '/');

    // Si el archivo físico no existe en el disco, usamos la imagen por defecto
    if (!file_exists($rutaAbsolutaServidorMenu) || !is_file($rutaAbsolutaServidorMenu)) {
        $imagenUsuarioMenu = $imagenPorDefecto;
    }
} else {
    $imagenUsuarioMenu = $imagenPorDefecto;
}
?>

<div class="w-300 bg-gray-200 shadow-md position-absolute box-sizing p-2 rounded-b-16 dropdown-menu right-0 d-none"
style="z-index: 10000;" id="menu-contenedor-usuario">
    <div class="w-p-100 flex items-center box-sizing gap-2 py-2">
        <!-- Contenedor izquierdo (Avatar del usuario o icono por defecto) -->
        <div class="w-60 h-60 flex-center rounded-circle shrink-0 overflow-hidden bg-gray-100 border border-gray-300">
            <?php if (!empty($imagenUsuarioMenu) && strpos($imagenUsuarioMenu, 'default') !== false): ?>
                <img src="<?= htmlspecialchars($imagenUsuarioMenu) ?>" alt="Imagen de perfil" class="w-35 h-35 imagen_usuario" style="object-fit: contain;">
            <?php else: ?>
                <img src="<?= htmlspecialchars($imagenUsuarioMenu) ?>" alt="Imagen de perfil" class="w-p-100 h-p-100" style="object-fit: cover;">
            <?php endif; ?>
        </div>

        <!-- Contenedor derecho (Nombre y Correo dinámicos de la sesión) -->
        <div class="flex-1 flex flex-column min-w-0">
            <span class="fw-600 fs-3 texto-truncado text-main"><?= htmlspecialchars($nombreUsuarioMenu) ?></span>
            <span class="fs-1 texto-truncado fw-600 text-gray-500"><?= htmlspecialchars($correoUsuarioMenu) ?></span>
        </div>
    </div>

    <div class="border-t-1 border-default flex flex-column py-2 row-gap-1">
        <a class="h-40 min-w-100 flex justify-start items-center rounded-md btn btn-option flex-shrink-0 cursor-pointer" href="../views/mi.perfil.php" id="menu-link-perfil">
            <i class="icon vf-ic_fluent_person_24_filled fs-5 w-20"></i>
            <span class="fs-3">Perfil</span>
        </a>
        <a class="h-40 min-w-100 flex justify-start items-center rounded-md btn btn-option flex-shrink-0 cursor-pointer" id="menu-link-preferencias">
            <i class="icon vf-ic_fluent_options_24_filled fs-5 w-20"></i>
            <span class="fs-3">Preferencias</span>
        </a>
        <a class="h-40 min-w-100 flex justify-start items-center rounded-md btn btn-option flex-shrink-0 cursor-pointer" id="menu-link-movimientos">
            <i class="icon vf-ic_fluent_arrow_swap_24_filled fs-5 w-20"></i>
            <span class="fs-3">Mis movimientos</span>
        </a>
        <a class="h-40 min-w-100 flex justify-start items-center rounded-md btn btn-option flex-shrink-0 cursor-pointer" id="menu-link-ayuda">
            <i class="icon ph ph-info fs-5 w-20"></i>
            <span class="fs-3">Ayuda</span>
        </a>
    </div>

    <div class="border-t-1 border-default flex flex-column py-2 row-gap-1">
        <a class="h-40 min-w-100 flex justify-start items-center rounded-md btn btn-option flex-shrink-0 cursor-pointer" id="menu-link-bloquear">
            <i class="icon ph ph-lock fs-5 w-20"></i>
            <span class="fs-3">Bloquear</span>
        </a>
        <a class="h-40 min-w-100 flex justify-start items-center rounded-md btn text-danger btn-option flex-shrink-0 cursor-pointer" id="menu-cerrar-sesion">
            <i class="icon ph ph-sign-out fs-5 w-20 h-20"></i>
            <span class="fs-3">Cerrar sesión</span>
        </a>
    </div>
</div>