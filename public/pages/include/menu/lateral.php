<?php
include_once dirname(__DIR__, 4) . "/src/config/bootstrap.php";

$usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));

$modulosPermitidos = [];

if (!empty($usuarioId)) {
    // Consulta optimizada para traer los módulos permitidos del usuario en una sola ejecución
    $sql = "SELECT DISTINCT 
                COALESCE(NULLIF(TRIM(p.modulo), ''), SUBSTRING_INDEX(p.nombre_permiso, '.', 1)) AS modulo_calculado,
                p.nombre_permiso
            FROM usuarios_permisos up
            JOIN permisos p ON up.permiso_id = p.id
            WHERE up.usuario_id = ?";

    try {
        $resultado = Consultar_PDO($sql, [$usuarioId]);
        if (!empty($resultado)) {
            foreach ($resultado as $row) {
                $moduloKey = $row['modulo_calculado'] ?? ($row['MODULO'] ?? '');
                if (!empty($moduloKey)) {
                    $modulosPermitidos[] = strtolower(trim($moduloKey));
                }
            }
        }
    } catch (Throwable $e) {
        error_log("Error al obtener módulos permitidos con Consultar_PDO: " . $e->getMessage());
    }
}

function UsuarioTienePermisoModuloLocal($moduloRequerido, array $modulosPermitidos): bool {
    if (empty($moduloRequerido)) {
        return false;
    }
    $moduloLimpio = strtolower(trim($moduloRequerido));
    return in_array($moduloLimpio, $modulosPermitidos, true);
}

// Cargar Módulos
$path_modulos = __DIR__ . '/../../../../src/json/routes/menu.json';
$modulosCrudos = file_exists($path_modulos) ? json_decode(file_get_contents($path_modulos), true) : [];
if (!is_array($modulosCrudos)) $modulosCrudos = [];

$modulos = array_filter($modulosCrudos, function($item) use ($modulosPermitidos) {
    $modulo = $item['modulo'] ?? ($item['permiso'] ?? '');
    if (empty($modulo)) {
        return false; 
    }
    return UsuarioTienePermisoModuloLocal($modulo, $modulosPermitidos);
});

// Cargar Utilidades
$path_utilidades = __DIR__ . '/../../../../src/json/routes/utilidades.json';
$utilidadesCrudas = file_exists($path_utilidades) ? json_decode(file_get_contents($path_utilidades), true) : [];
if (!is_array($utilidadesCrudas)) $utilidadesCrudas = [];

$utilidades = array_filter($utilidadesCrudas, function($item) use ($modulosPermitidos) {
    $modulo = $item['modulo'] ?? ($item['permiso'] ?? '');
    if (empty($modulo)) {
        return false;
    }
    return UsuarioTienePermisoModuloLocal($modulo, $modulosPermitidos);
});
?>
<div class="w-300 h-vh-100 box-sizing p-2 flex flex-column bg-gray-100 position-absolute top-0 overflow-auto d-none"
id="menu-contenedor-lateral" style="z-index: 10000;">
    <!-- Contenedor Izquierdo: Botón Menú + Saludo -->
    <div class="flex items-center gap-2">
        <!-- 1. Botón Abrir Menú -->
        <a class="btn w-40 h-40 btn-secondary rounded-md flex-center" id="menu-boton-cerrar" title="Cerrar menú">
            <i class="icon vf-ic_fluent_grid_dots_24_filled fs-8"></i>
        </a>

        <!-- 2. Texto de Bienvenida -->
        <span class="fw-600 text-main fs-4">Bienvenido</span>
    </div>
    <!-- Contenedor principal -->
    <div class="w-p-100 flex-1 min-h-0 flex flex-column box-sizing">

        <!-- Sección de Módulos (Se oculta si no hay ninguno permitido) -->
        <?php if (!empty($modulos)): ?>
        <div class="w-p-100 flex-1 min-h-100 flex flex-column items-start justify-between py-2 box-sizing">
            <div class="h-30 px-3 flex items-center text-blue-03618d fs-3 bg-option rounded-2xl fw-600">
                <span class="texto-truncado">Módulos</span>
            </div>
            <div class="w-p-100 h-calc-100-30 flex items-start py-2 overflow-auto custom-scroll">
                <div class="flex-wrap justify-between flex gap-2 w-p-100">
                    <?php
                    usort($modulos, function ($a, $b) {
                        $tituloA = trim($a['titulo'] ?? '');
                        $tituloB = trim($b['titulo'] ?? '');

                        if (strcasecmp($tituloA, $tituloB) === 0) return 0;
                        if (strcasecmp($tituloA, 'Inicio') === 0) return -1;
                        if (strcasecmp($tituloB, 'Inicio') === 0) return 1;

                        return strcasecmp($tituloA, $tituloB);
                    });
                    foreach ($modulos as $item) {
                    ?>
                        <div class="btn w-120 h-120 rounded-4 p-2 box-sizing cursor-pointer btn-option flex flex-column justify-between mx-auto" 
                        <?= isset($item['id']) ? 'id="' . htmlspecialchars($item['id']) . '"' : '' ?>
                        <?= isset($item['href']) ? 'onclick="location.href=\'' . htmlspecialchars($item['href']) . '\'"' : '' ?>>

                            <!-- Icono del módulo -->
                            <div class="w-p-100 flex-1 min-h-0 flex-center">
                                <i class="<?= htmlspecialchars($item['icono'] ?? '') ?> fs-13"></i>
                            </div>

                            <!-- Texto de la tarjeta -->
                            <div class="w-p-100 h-30 flex-center fw-600 fs-3 text-center">
                                <span><?= htmlspecialchars($item['titulo'] ?? '') ?></span>
                            </div>

                        </div>
                    <?php
                    }
                    ?>
                </div>
            </div>
        </div>
        <?php endif; ?>

        <!-- Sección de Utilidades (Se oculta si no hay ninguna permitida) -->
        <?php if (!empty($utilidades)): ?>
        <div class="w-p-100 h-180 shrink-0 flex flex-column items-start justify-between py-2 box-sizing">
            <div class="h-30 px-3 flex items-center text-blue-03618d fs-3 bg-option rounded-2xl fw-600">
                <span class="texto-truncado">Utilidades</span>
            </div>
            <div class="w-p-100 flex-1 min-h-0 flex items-start overflow-auto py-2 custom-select">
                <div class="flex-wrap justify-between flex gap-2">
                    <?php
                    foreach ($utilidades as $item) {
                    ?>
                    <div class="btn w-120 h-120 rounded-4 p-2 box-sizing cursor-pointer btn-option flex flex-column justify-between"
                    <?= isset($item['id']) ? 'id="' . htmlspecialchars($item['id']) . '"' : '' ?>
                    <?= isset($item['href']) ? 'onclick="location.href=\'' . htmlspecialchars($item['href']) . '\'"' : '' ?>>

                        <!-- Icono del módulo -->
                        <div class="w-p-100 flex-1 min-h-0 flex-center">
                            <i class="icon <?= htmlspecialchars($item['icono'] ?? '') ?> fs-13"></i>
                        </div>

                        <!-- Texto de la tarjeta -->
                        <div class="w-p-100 h-30 flex-center fw-600 fs-3 text-center">
                            <span><?= htmlspecialchars($item['titulo'] ?? '') ?></span>
                        </div>

                    </div>
                    <?php
                    }
                    ?>
                </div>
            </div>
        </div>
        <?php endif; ?>

    </div>
</div>