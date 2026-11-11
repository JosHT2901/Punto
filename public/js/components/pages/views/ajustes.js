$("#card-smtp").off('click').on('click',function(e)
{
    CrearVentanaIframe(
        'Editar SMTP',
        '../components/configurar.smtp.php',
        '620px',
        true,
        true
    );
})
$("#card-imap").off('click').on('click',function(e)
{
    CrearVentanaIframe(
        'Editar IMAP',
        '../components/configurar.imap.php',
        '620px',
        true,
        true
    );
})