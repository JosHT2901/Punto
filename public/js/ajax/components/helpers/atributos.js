$(document).ready(async function(e)
{
    const [atributos] = await Promise.all([
        window.AjaxService.enviar('../../../src/controllers/php/controllers/categorias.php', {
            accion: 'obtener_atributos',
            id_categoria:1
        })
    ]);
    window.atributos=atributos
    $(document).trigger('datosListos');

})