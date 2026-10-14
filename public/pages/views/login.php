<?php
// 1. Definimos el título de la pestaña
$tituloPage = "Iniciar sesión";

// 2. Activamos el búfer para capturar todo el HTML que escribamos abajo
ob_start();
?>
<div class="w-p-100">
    
    <!-- Componente de autenticación -->
    <div class="w-p-100">
        <?php include_once __DIR__ . '/../components/auth.php'; ?>
    </div>

    <div class="w-p-100 mt-4 flex justify-end">
        <a class="btn btn-secondary w-p-100 flex flex-center fw-600" id="auth-boton-continuar">
            <span>Crear usuario</span>
        </a>
    </div>

</div>
<?php
// 3. Guardamos todo el HTML anterior en la variable $contenido
$contenido_columna = ob_get_clean();

include_once __DIR__ . '/../layouts/columna-400.php';
?>