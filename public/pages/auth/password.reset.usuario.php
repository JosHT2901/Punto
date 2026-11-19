<?php

$tituloPage = 'Restablecer contraseña';
ob_start();
?>
<div class="w-p-100 overflow-auto flex flex-column h-p-100 bg-white">
    <div class="my-2 flex-1 overflow-auto">
        <!-- Nuevos campos para la contraseña -->
        <div class="row-gap-0 flex flex-column mb-2">
            <label for="nueva-password" class="block mb-1 fs-3 fw-600 pl-2 text-left">Nueva contraseña</label>
            <input type="password" id="nueva-password" class="form-control h-40" placeholder="Nueva contraseña" required>
        </div>
        <div class="w-p-100 my-3 py-2" id="reglas-container"></div>
        <div class="row-gap-0 flex flex-column mb-2">
            <label for="confirmar-password" class="block mb-1 fs-3 fw-600 pl-2 text-left">Confirmar nueva contraseña</label>
            <input type="password" id="confirmar-password" class="form-control h-40" placeholder="Confirma tu contraseña" required>
        </div>
        <div class="w-p-100 my-2 flex justify-start items-center">
            <label class="h-40 min-w-100 flex justify-start items-center gap-2 px-3 rounded-md btn btn-option flex-shrink-0 fw-600 cursor-pointer">
                <input type="checkbox" class="checkbox-round" id="input-check-password">
                <span class="fs-3">Mostrar contraseñas</span>
            </label>
        </div>
    </div>
    <div>
        <button type="button" class="btn btn-primary fw-600 flex shrink-0 gap-2 items-center justify-center w-p-100 h-40" id="boton-confirmar-reset">
            <span>Actualizar Contraseña</span>
        </button>
    </div>
</div>
<?php
$contenido_componente = ob_get_clean();
$incluir_carga = false;
include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../../public/js/ajax/auth/password.reset.usuario.js" defer></script>
<script src="../../../public/js/components/auth/password.reset.usuario.js" defer></script>