<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Asegúrate de incluir tu bootstrap y conexión
require_once dirname(__DIR__) . '../../../src/config/bootstrap.php';

// Validar que exista sesión de usuario
if (!isset($_SESSION['usuario']['id'])) {
    header("Location: ../../index.php");
    exit;
}

$usuarioId = (int)$_SESSION['usuario']['id'];

try {
    // Consulta directa a la base de datos
    $sql = "SELECT correo_verificado FROM usuarios WHERE ID = :id LIMIT 1";
    $resultado = Consultar_PDO($sql, [':id' => $usuarioId]);

    if (!empty($resultado)) {
        $correoVerificado = (int)$resultado[0]['correo_verificado'];

        // Si ya está verificado en la base de datos, lo sacamos de la página de inmediato
        if ($correoVerificado === 1) {
            header("Location: ../../index.php"); // O a la ruta de bienvenida/dashboard que corresponda
            exit;
        }
    }
} catch (Throwable $e) {
    error_log("Error al verificar el estado del correo al cargar la página: " . $e->getMessage());
}

$tituloPage = 'Verificar correo';
ob_start();
?>
<div class="w-p-100 overflow-auto">
    <div class="flex-center mb-3" style="font-size: 48px; color: #03618d;">
        <i class="icon vf-ic_fluent_mail_24_filled"></i>
    </div>
    <div class="flex justify-center items-center fw-700 fs-5 my-2">
        <span>Verifíca tu correo electrónico</span>
    </div>
    <div class="flex justify-center items-center fs-3 fw-600 text-center text-gray-500">
        <span>Hemos enviado un código de verificación de 6 dígitos a tu dirección de correo electrónico registrada.</span>
    </div>
    <form action="" class="my-4">
        <div class="row-gap-0 flex flex-column">
            <label for="input-codigo-verificacion" class="block mb-1 fs-3 fw-600 pl-2 text-left">Ingrésalo para continuar</label>
            <div class="flex items-center gap-2 p-3" id="contenedor-inputs-codigo">
               
            </div>
        </div>
        <div class="w-p-100 flex mt-2">
            <button type="button" class="btn btn-primary fw-600 flex shrink-0 gap-2 items-center justify-center w-p-100 h-40" id="boton-confirmar-verificacion">
                <span>Verificar Código</span>
            </button>
        </div>

        <!-- Opción para reenviar código -->
        <div class="flex justify-center items-center mt-3">
            <span class="text-muted fs-3">¿No recibiste el código? </span>
            <a href="#" class="text-primary fw-600 ml-1" id="link-reenviar-codigo" style="text-decoration: none; font-size: 13px;"> Reenviar</a>
        </div>
    </form>
</div>
<?php
$contenido_columna = ob_get_clean();
include_once __DIR__ . '/../layouts/columna-400.php';
?>
<script src="../../../public/js/ajax/pages/verificar.correo.js" defer></script>
<script src="../../../public/js/components/pages/views/verificar.correo.js" defer></script>

