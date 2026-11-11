<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once dirname(__DIR__, 3) . '/src/config/bootstrap.php';
$tituloPage = 'Ajustes';
ob_start();

// Obtenemos el ID de forma precisa según la estructura de tu sesión
$usuarioId = $_SESSION['usuario']['id'] ?? 0;

// Función para obtener todos los permisos del usuario en una sola consulta de golpe
if (!function_exists('ObtenerPermisosUsuario')) {
    function ObtenerPermisosUsuario($usuarioId): array {
        if (empty($usuarioId)) return [];

        $sql = "SELECT p.nombre_permiso 
                FROM usuarios_permisos up
                JOIN permisos p ON up.permiso_id = p.id
                WHERE up.usuario_id = ?";

        try {
            $resultados = Consultar_PDO($sql, [$usuarioId]);
            if (empty($resultados)) return [];
            
            // Retornamos un arreglo asociativo para búsqueda rápida O(1)
            $permisosMap = [];
            foreach ($resultados as $row) {
                if (!empty($row['nombre_permiso'])) {
                    $permisosMap[$row['nombre_permiso']] = true;
                }
            }
            return $permisosMap;
        } catch (Throwable $e) {
            return [];
        }
    }
}

// Cargamos el archivo JSON de configuración desde src/json/routes/ajustes.json
$jsonRuta = dirname(__DIR__, 3) . '/src/json/routes/ajustes.json';
$tarjetasAjustes = [];

if (file_exists($jsonRuta)) {
    $contenidoJson = file_get_contents($jsonRuta);
    $tarjetasAjustes = json_decode($contenidoJson, true) ?? [];
}

// Obtenemos todos los permisos del usuario una sola vez al inicio
$permisosUsuario = function_exists('Consultar_PDO') ? ObtenerPermisosUsuario($usuarioId) : [];
// Filtramos las tarjetas en memoria comparando contra el arreglo cargado
$tarjetasFiltradas = array_filter($tarjetasAjustes, function($card) use ($permisosUsuario) {
    $permisoRequerido = $card['permiso'] ?? ($card['permisos'] ?? '');
    
    // Si la tarjeta no requiere ningún permiso, se muestra por defecto
    if (empty($permisoRequerido)) return true;
    
    // Verificamos si el permiso existe dentro del mapa de permisos del usuario
    return isset($permisosUsuario[$permisoRequerido]);
});
?>
<div class="w-p-100 p-3 box-sizing overflow-auto" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));">
    <?php foreach ($tarjetasFiltradas as $card): 
        $tieneHref = !empty($card['href']);
    ?>
        <a class="h-160 box-sizing p-4 flex justify-center items-center rounded-8 btn btn-option cursor-pointer transition-all border border-gray-100 text-decoration-none" 
           <?= !empty($card['id']) ? 'id="' . htmlspecialchars($card['id']) . '"' : '' ?> 
           <?= $tieneHref ? 'data-href="' . htmlspecialchars($card['href']) . '"' : '' ?>
           <?= !empty($card['permiso']) ? 'data-permiso="' . htmlspecialchars($card['permiso']) . '"' : '' ?>
           <?= $tieneHref ? 'onclick="location.href=\'' . htmlspecialchars($card['href'], ENT_QUOTES) . '\'"' : '' ?>>
            
            <!-- Icono con contenedor redondeado -->
            <div class="w-60 h-p-100 flex justify-center items-center shrink-0">
                <div class="w-50 h-50 rounded-xl bg-blue-50 flex-center">
                    <i class="icon <?= htmlspecialchars($card['icono'] ?? 'vf-ic_fluent_options_24_filled') ?> fs-12 text-blue-03618d"></i>
                </div>
            </div>

            <!-- Información -->
            <div class="w-calc-100-60 h-p-100 flex flex-column justify-center items-start box-sizing pl-3">
                <div class="w-p-100 flex justify-between items-center mb-1">
                    <span class="fs-4 fw-700 text-gray-700 texto-truncado"><?= htmlspecialchars($card['titulo'] ?? '') ?></span>
                    <i class="icon vf-ic_fluent_chevron_right_24_regular fs-4 text-gray-400"></i>
                </div>
                <div class="w-p-100 flex justify-start items-center">
                    <span class="fw-600 fs-2 word-break-all text-gray-500"><?= htmlspecialchars($card['descripcion'] ?? '') ?></span>
                </div>
            </div>
        </a>
    <?php endforeach; ?>
</div>
<?php
$contenido_protegido = ob_get_clean();

include_once __DIR__ . '/../layouts/protegido.php';
?>

<script src="../../../public/js/components/pages/views/ajustes.js" defer></script>