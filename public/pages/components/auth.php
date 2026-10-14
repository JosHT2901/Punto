<?php
ob_start();
?>

<div class="w-p-100 overflow-auto flex-column">
        <form class="flex flex-col gap-3">
            <div id="auth-contenedor-usuario" class=" row-gap-0 flex flex-column">
                <label class="block fw-500 mb-1 fs-3 fw-600 pl-2">Usuario</label>
                <input class="w-p-100 h-40" id="auth-input-usuario" placeholder="Ingresa usuario" autocomplete="off">
            </div>
            <div class=" row-gap-0 flex flex-column">
                <label class="block fw-500 mb-1 fs-3 fw-600 pl-2">Contraseña o PIN</label>
                <div class="flex items-center gap-2">
                    <input type="password" class="w-p-100 h-40" id="auth-input-password" placeholder="Ingresa tu contraseña o pin" autocomplete="off">

                    <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40 boton-ver-password" id="auth-boton-ver-password" title="Ver contraseña">
                        <i class="icon vf-ic_fluent_eye_24_filled fs-6"></i>
                    </a>
                </div>
            </div>
        </form>
        <div class="w-p-100 flex justify-end mt-4">
            <a class="btn btn-primary fw-600" id="auth-boton-continuar">
                <span>Continuar</span>
            </a>
        </div>
</div>
<?php
// 3. Guardamos todo el bloque anterior en la variable del layout
$contenido_componente = ob_get_clean();

// 4. Llamamos a nuestro layout especializado para componentes
include_once __DIR__ . '/../layouts/componente.php';
?>