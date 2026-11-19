<?php
$tituloPage = 'Restablecer pin';
ob_start();
?>
<div class="w-p-100 overflow-auto h-p-100 bg-white flex flex-column">

    <div class="flex-1 overflow-auto">
        <div class="row-gap-0 flex flex-column mb-2">
            <label for="nuevo-pin" class="block mb-1 fs-3 fw-600 pl-2 text-left">Nuevo PIN</label>
            <div class="flex items-center gap-2 p-1" id="contenedor-pin">
                <!-- Inputs dinámicos del PIN (generados por JS) -->
            </div>
        </div>
        <div class="w-p-100 my-1 py-2" id="reglas-container-pin"></div>
        <div class="row-gap-0 flex flex-column mb-2">
            <label for="nuevo-pin" class="block mb-1 fs-3 fw-600 pl-2 text-left">Confirma el nuevo PIN</label>
            <div class="flex items-center gap-2 p-1" id="contenedor-pin-confirmacion">
                <!-- Inputs dinámicos del PIN (generados por JS) -->
            </div>
        </div>
        <div class="w-p-100 my-1 flex justify-start items-center">
            <label class="h-40 min-w-100 flex justify-start items-center gap-2 px-3 rounded-md btn btn-option flex-shrink-0 fw-600 cursor-pointer">
                <input type="checkbox" class="checkbox-round" id="input-check-pin">
                <span class="fs-3">Mostrar pin</span>
            </label>
        </div>

    </div>
    <div class="w-p-100 flex mt-4">
        <button type="button" class="btn btn-primary fw-600 flex shrink-0 gap-2 items-center justify-center w-p-100 h-40" id="boton-confirmar-reset">
            <span>Actualizar PIN</span>
        </button>
    </div>
</div>
<?php
$contenido_componente = ob_get_clean();
$incluir_carga = false;
include_once __DIR__ . '/../layouts/componente.php';
?>

<script src="../../../public/js/ajax/auth/pin.reset.usuario.js" defer></script>
<script src="../../../public/js/components/auth/pin.reset.usuario.js" defer></script>