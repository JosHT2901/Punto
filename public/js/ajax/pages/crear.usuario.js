$(document).ready(function(e)
{
    $.messenger.on('usuario_creado', function(data, sourceWindow, origin) {
        window.location.href = 'login.php';
    });
})
