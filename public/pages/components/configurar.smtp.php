<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Configuración SMTP";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<div class="w-p-100 h-p-100 p-1 flex flex-column gap-3">
    <div class="w-p-100 rounded-16  bg-brand-soft flex text-brand-dark my-3">
        <div class=" flex-1 flex justify-center items-center text-center fs-3 fw-600 py-2">
            <span>Inserta las configuraciones de SMTP</span>
        </div>
    </div>
    <div class="w-p-100 flex-1 flex flex-col">
        <!-- Servidor (Host) -->
        <div class="row-gap-0 flex flex-column">
            <label for="smtp-input-host" class="block mb-1 fs-3 fw-600 pl-2">Servidor (Host)</label>
            <div class="flex items-center gap-2">
                <input type="text" name="host" class="w-p-100 h-40 input-100" id="smtp-input-host" placeholder="ej. smtp.gmail.com" autocomplete="off" maxlength="200">
            </div>
        </div>

        <!-- Puerto y Seguridad (Dos columnas) -->
        <div class="flex gap-3">
            <div class="row-gap-0 flex flex-column w-p-50">
                <label for="smtp-input-port" class="block mb-1 fs-3 fw-600 pl-2">Puerto</label>
                <div class="flex items-center gap-2">
                    <input type="text" name="port" class="w-p-100 h-40" id="smtp-input-port" placeholder="587" autocomplete="off" maxlength="5">
                </div>
            </div>
            <div class="row-gap-0 flex flex-column w-p-50">
                <label for="smtp-input-secure" class="block mb-1 fs-3 fw-600 pl-2">Seguridad</label>
                <div class="flex items-center gap-2 h-40" id="contenedor-select-seguridad">
                </div>
            </div>
        </div>

        <!-- Usuario / Correo -->
        <div class="row-gap-0 flex flex-column">
            <label for="smtp-input-username" class="block mb-1 fs-3 fw-600 pl-2">Usuario / Correo Electrónico</label>
            <div class="flex items-center gap-2">
                <input type="email" name="username" class="w-p-100 h-40 input-100" id="smtp-input-username" placeholder="tucorreo@tudominio.com" autocomplete="off" maxlength="200">
            </div>
        </div>

        <!-- Contraseña con botón ver/ocultar -->
        <div class="row-gap-0 flex flex-column">
            <label for="smtp-input-password" class="block mb-1 fs-3 fw-600 pl-2">Contraseña / Token</label>
            <div class="flex items-center gap-2">
                <input type="password" name="password" class="w-p-100 h-40 input-100" id="smtp-input-password" placeholder="Ingresa tu contraseña o token" autocomplete="off" maxlength="200">
                <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40" id="smtp-boton-ver-password" title="Ver contraseña">
                    <i class="icon vf-ic_fluent_eye_24_filled fs-6"></i>
                </a>
            </div>
        </div>

        <!-- Nombre del Remitente -->
        <div class="row-gap-0 flex flex-column">
            <label for="smtp-input-from-name" class="block mb-1 fs-3 fw-600 pl-2">Nombre del Remitente</label>
            <div class="flex items-center gap-2">
                <input type="text" name="from_name" class="w-p-100 h-40 input-100" id="smtp-input-from-name" placeholder="Ej. Sistema" autocomplete="off" maxlength="200">
            </div>
        </div>
    </div>

    <!-- Botón Guardar -->
    <div class="w-p-100 flex justify-end items-center mt-3">
        <a type="button" class="btn btn-primary fw-600 flex shrink-0 gap-2 items-center" style="flex-shrink: 0; white-space: nowrap;" id="smtp-boton-guardar">
            <i class="icon vf-ic_fluent_save_24_filled fs-5"></i>
            <span>Guardar Configuración</span>
        </a>
    </div>
</div>
<?php
$contenido_componente = ob_get_clean();
$incluir_carga = false;
include_once __DIR__ . '/../layouts/componente.php';
?>
<script src="../../../public/js/ajax/components/configurar.smtp.js"></script>
<script src="../../../public/js/components/pages/components/configurar.smtp.js" defer></script>