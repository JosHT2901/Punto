<?php
if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}
include_once dirname(__DIR__, 3) . "/src/config/bootstrap.php";

$tituloPage = "Preferencias";
$idBotonAtras = "preferencias-boton-atras";
$idBotonGuardar = "preferencias-boton-guardar";

// 1. Verificar si el usuario tiene AL MENOS UN permiso asignado en general
$usuarioId = (int) ($_SESSION['usuario']['id'] ?? $_SESSION['usuario']['ID'] ?? 0);
$tieneAlgunPermiso = false;

if (!empty($_SESSION['usuario']['permisos']) && is_array($_SESSION['usuario']['permisos'])) {
    $tieneAlgunPermiso = count($_SESSION['usuario']['permisos']) > 0;
} elseif ($usuarioId > 0 && function_exists('Consultar_PDO')) {
    try {
        $resultadoPermiso = Consultar_PDO(
            "SELECT 1 FROM usuarios_permisos WHERE usuario_id = :usuario_id LIMIT 1",
            [':usuario_id' => $usuarioId]
        );
        $tieneAlgunPermiso = !empty($resultadoPermiso);
    } catch (Throwable $e) {
        error_log("Error al verificar permisos en preferencias: " . $e->getMessage());
        $tieneAlgunPermiso = false;
    }
}

ob_start();
?>

<div class="w-p-100 overflow-auto flex-column h-p-100 p-3 custom-scroll">

    <?php if ($tieneAlgunPermiso): ?>
        <!-- Acordeón 1: Sucursal Predeterminada -->
        <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container flex flex-column">
            <div class="w-p-100  fw-600 min-h-40 py-2 px-3 box-sizing bg-blue-03618d rounded-md card-header js-header-toggle cursor-pointer flex items-center justify-between gap-2">
                <span class="texto-truncado">Sucursal predeterminada</span>
            </div>

            <div class="flex-1 min-h-0 my-2 card-body js-panel-toggle">
                <div class="flex flex-column gap-4">

                    <!-- Selector de sucursal -->
                    <div class="row-gap-1 flex flex-column">
                        <label for="preferencias-select-sucursal" class="block fs-3 fw-600 pl-1">Sucursal predeterminada</label>
                        <div class="flex items-center gap-2 h-40 w-p-100" id="contenedor-select-sucursal">
                        </div>
                    </div>

                    <!-- Botones de comportamiento -->
                    <div class="row-gap-1 flex flex-column">
                        <label class="block fs-3 fw-600 pl-1">Al cambiar de sucursal en inventario u otras tablas</label>
                        <div class="flex items-center gap-2 w-p-100 flex-wrap" id="grupo-comportamiento-sucursal">

                            <!-- Opción 1: Solo esta sesión -->
                            <label class="btn btn-option fw-600 flex-1 min-h-40 flex items-center justify-center gap-2 cursor-pointer"
                                style="min-width: 190px;"
                                data-valor="sesion">
                                <input type="radio" name="sucursal_comportamiento" value="sesion" class="checkbox-round">
                                <span class="flex-1">Solo esta sesión</span>
                            </label>

                            <!-- Opción 2: Actualizar predeterminada -->
                            <label class="btn btn-option fw-600 flex-1 min-h-40 flex items-center justify-center gap-2 cursor-pointer"
                                style="min-width: 190px;"
                                data-valor="actualizar">
                                <input type="radio" name="sucursal_comportamiento" value="actualizar" class="checkbox-round">
                                <span class="flex-1">Actualizar predeterminada</span>
                            </label>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    <?php endif; ?>

    <!-- Acordeón 2: Seguridad -->
    <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container flex flex-column">
        <div class="w-p-100  fw-600 min-h-40 py-2 px-3 box-sizing bg-blue-03618d rounded-md card-header js-header-toggle cursor-pointer flex items-center justify-between gap-2">
            <span class="texto-truncado">Seguridad</span>
        </div>

        <div class="flex-1 min-h-0 my-2 card-body js-panel-toggle">
            <div class="flex flex-column gap-3">

                <!-- Bloqueo por inactividad -->
                <div class="flex items-center justify-between flex-wrap gap-2 bg-gray-200 p-3 rounded-md">
                    <div class="flex-1 flex justify-start items-center" style="min-width: 200px;">
                        <label for="input-tiempo-inactividad" class="block mb-0 fs-3 fw-600 pl-1 pointer">
                            Bloquear sesión tras inactividad (min)
                        </label>
                    </div>
                    <div class="flex items-center justify-end shrink-0 w-80">
                        <input type="text" id="input-tiempo-inactividad">
                    </div>
                </div>

                <!-- Verificación en 2 pasos -->
                <div class="flex items-center justify-between gap-2 bg-gray-200 p-3 rounded-md">
                    <div class="flex-1 flex justify-start items-center min-w-0">
                        <label for="check-verificacion-dos-pasos" class="block mb-0 fs-3 fw-600 pl-1 pointer">
                            Verificación en 2 pasos
                        </label>
                    </div>
                    <div class="flex items-center shrink-0">
                        <label class="toggle-switch pointer mx-2">
                            <input type="checkbox" id="check-verificacion-dos-pasos">
                            <div class="toggle-switch-background">
                                <div class="toggle-switch-handle"></div>
                            </div>
                        </label>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Acordeón 3: Fecha y hora -->
    <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container flex flex-column">
        <div class="w-p-100  fw-600 min-h-40 py-2 px-3 box-sizing bg-blue-03618d rounded-md card-header js-header-toggle cursor-pointer flex items-center justify-between gap-2">
            <span class="texto-truncado">Fecha y hora</span>
        </div>

        <div class="flex-1 min-h-0 my-2 card-body js-panel-toggle">
            <div class="flex flex-column gap-3">
                <div class="flex items-center justify-between flex-wrap gap-2 bg-gray-200 p-3 rounded-md">
                    <div class="flex-1 flex justify-start items-center" style="min-width: 200px;">
                        <label for="select-formato-fecha" class="block mb-0 fs-3 fw-600 pl-1 pointer">
                            Formato de fecha
                        </label>
                    </div>
                    <div class="flex items-center justify-end shrink-0 w-200" id="contenedor-select-formato-fecha">
                    </div>
                </div>
                <!-- Formato de Hora (12h vs 24h) -->
                <div class="flex items-center justify-between flex-wrap gap-2 bg-gray-200 p-3 rounded-md">
                    <div class="flex-1 flex justify-start items-center" style="min-width: 200px;">
                        <label for="select-formato-hora" class="block mb-0 fs-3 fw-600 pl-1 pointer">
                            Formato de hora
                        </label>
                    </div>
                    <div class="flex items-center justify-end shrink-0 w-200" id="contenedor-select-formato-hora">
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- Acordeón 4: Paginación de tablas -->
    <div class="w-p-100 my-2 bg-white rounded-8 box-sizing row-gap-1 p-3 card js-acordeon-container flex flex-column">
        <div class="w-p-100  fw-600 min-h-40 py-2 px-3 box-sizing bg-blue-03618d rounded-md card-header js-header-toggle cursor-pointer flex items-center justify-between gap-2">
            <span class="texto-truncado">Paginación</span>
        </div>

        <div class="flex-1 min-h-0 my-2 card-body js-panel-toggle">
            <div class="flex flex-column gap-3">
                <div class="flex items-center justify-between flex-wrap gap-2 bg-gray-200 p-3 rounded-md">
                    <div class="flex-1 flex justify-start items-center" style="min-width: 200px;">
                        <label for="select-paginacion-tabla" class="block mb-0 fs-3 fw-600 pl-1 pointer">
                            Registros por página en tablas
                        </label>
                    </div>
                    <div class="flex items-center justify-end shrink-0 w-200" id="contenedor-select-paginacion">
                    </div>
                </div>
            </div>
        </div>
    </div>

</div>

<?php
// Guardamos todo el contenido en la variable del layout
$contenido_componente = ob_get_clean();

// Llamamos al layout especializado
include_once __DIR__ . '/../layouts/protegido.boton.guardar.php';
?>

<script src="../../../public/js/ajax/pages/preferencias.js" defer></script>
<script src="../../../public/js/components/pages/views/preferencias.js" defer></script>