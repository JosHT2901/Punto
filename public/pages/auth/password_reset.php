<?php

declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Incluir bootstrap y dependencias necesarias
require_once dirname(__DIR__) . '/../../src/config/bootstrap.php';
require_once dirname(__DIR__) . '/../../src/controllers/php/helpers/cifrado.php';
// 1. Validar que llegue el token por la URL
$tokenCifrado = $_GET['token'] ?? '';
if (empty($tokenCifrado)) {
    header("Location: ../errores/link_expired.php");
    exit;
}
try {

    $tokenPlano = Descifrar_Payload($tokenCifrado);
    if (empty($tokenPlano)) {
        header("Location: ../errores/link_expired.php");
        exit;
    }

    // 3. Buscar el token en la base de datos (asumiendo que manejas 'password_reset' o 'pin_reset')
    $sql = "SELECT t.id AS token_id, t.usuario_id, t.tipo, t.usado, t.fecha_expiracion, 
                   u.ID, u.Habilitado
            FROM tokens_usuarios t
            INNER JOIN usuarios u ON t.usuario_id = u.ID
            WHERE t.token = :token AND t.tipo = 'password_reset'
            LIMIT 1";

    $resultado = Consultar_PDO($sql, [
        ':token' => $tokenPlano
    ]);
    // Si no existe el token
    if (empty($resultado)) {
        header("Location: ../errores/link_expired.php");
        exit;
    }

    $registro = $resultado[0];

    // 4. Validaciones de seguridad (usado, expirado o usuario deshabilitado)
    $esUsado = (int)$registro['usado'] === 1;
    $estaHabilitado = (int)$registro['Habilitado'] === 1;

    $ahora = new DateTime();
    $fechaExpiracion = new DateTime($registro['fecha_expiracion']);
    $haExpirado = $ahora > $fechaExpiracion;

    if ($esUsado || $haExpirado || !$estaHabilitado) {
        header("Location: ../errores/link_expired.php");
        exit;
    }
    unset($_SESSION['token_reset_valido'], $_SESSION['usuario_reset_id'], $_SESSION['token_reset_id']);

    // Asignamos de forma única y estricta los datos correspondientes a ESTE token específico
    $_SESSION['token_reset_id'] = (int)$registro['token_id'];
    $_SESSION['token_reset_valido'] = $tokenPlano;
    $_SESSION['usuario_reset_id'] = (int)$registro['usuario_id'];
} catch (Throwable $e) {
    echo $e->getMessage();
    error_log("Error al validar el token de restablecimiento: " . $e->getMessage());
}
$tituloPage = 'Restablecer contraseña';
ob_start();
?>
<div class="w-p-100 overflow-auto">
    <div class="flex-center mb-3" style="font-size: 48px; color: #03618d;">
        <i class="icon vf-ic_fluent_key_24_filled"></i>
    </div>
    <div class="flex justify-center items-center fw-700 fs-5 my-2">
        <span>Restablece tu contraseña</span>
    </div>
    <div class="flex justify-center items-center fs-3 fw-600 text-center text-gray-500">
        <span>Ingresa y confirma tu nueva contraseña para completar el proceso.</span>
    </div>
    <form action="" class="my-4" id="form-restablecer-password">
        <!-- Nuevos campos para la contraseña -->
        <div class="row-gap-0 flex flex-column mb-3">
            <label for="nueva-password" class="block mb-1 fs-3 fw-600 pl-2 text-left">Nueva contraseña</label>
            <input type="password" id="nueva-password" class="form-control h-40" placeholder="Nueva contraseña" required>
        </div>
        <div class="w-p-100 my-3 py-2" id="reglas-container"></div>
        <div class="row-gap-0 flex flex-column mb-3">
            <label for="confirmar-password" class="block mb-1 fs-3 fw-600 pl-2 text-left">Confirmar nueva contraseña</label>
            <input type="password" id="confirmar-password" class="form-control h-40" placeholder="Confirma tu contraseña" required>
        </div>
        <div class="w-p-100 my-2 flex justify-start items-center">
            <label class="h-40 min-w-100 flex justify-start items-center gap-2 px-3 rounded-md btn btn-option flex-shrink-0 fw-600 cursor-pointer">
                <input type="checkbox" class="checkbox-round" id="input-check-password">
                <span class="fs-3">Mostrar contraseñas</span>
            </label>
        </div>

        <div class="w-p-100 flex mt-4">
            <button type="button" class="btn btn-primary fw-600 flex shrink-0 gap-2 items-center justify-center w-p-100 h-40" id="boton-confirmar-reset">
                <span>Actualizar Contraseña</span>
            </button>
        </div>
    </form>
</div>
<?php
$contenido_columna = ob_get_clean();
include_once __DIR__ . '/../layouts/columna-400.php';
?>
<script src="../../../public/js/ajax/auth/password_reset.js" defer></script>
<script src="../../../public/js/components/auth/password_reset.js" defer></script>