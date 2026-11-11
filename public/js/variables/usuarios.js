window.filtrosConfiguracionUsuarios = [
    {
        id: 'f-correo-verificado',
        texto: 'Verificación de Correo',
        opciones: [
            {
                id: '1',
                texto: 'Verificado'
            },
            {
                id: '0',
                texto: 'No verificado'
            }
        ],
        config: {
            multiple: false,
            buscador: false
        }
    },
    {
        id: 'f-estado',
        texto: 'Estado',
        opciones: [
            {
                id: '1',
                texto: 'Activos'
            },
            {
                id: '0',
                texto: 'Inactivos'
            }
        ],
        config: {
            multiple: false,
            buscador: false
        }
    },
];


window.botonesToolbarConfig = [{
    text: 'Nuevo usuario',
    class: 'btn btn-primary fw-600 flex',
    id: 'usuario-boton-nuevo',
    icon: 'vf-ic_fluent_add_24_filled',
    onClick: (e, $btn) => {
        CrearVentanaIframe(
            'Nuevo usuario',
            '../components/crear.usuario.php',
            '600px',
            true,
            true
        );
    }
},
{
    text: 'Importar',
    class: 'btn btn-secondary fw-600 flex',
    id: 'btn-finalizar',
    icon: 'vf-ic_fluent_arrow_import_24_filled',
    onClick: (e, $btn) => {
      
    }
}
];

// Opciones para usuarios HABILITADOS (activos)
window.opcionesUsuarioHabilitado = [
    {
        texto: 'Editar información básica',
        icono: 'vf-ic_fluent_person_24_filled',
        permiso: 'editar_usuarios',
        callback: (id, elemento) => {
            Editar_Usuario(id,'básica')
        }
    },
    {
        texto: 'Editar identificación',
        icono: 'vf-ic_fluent_share_screen_person_24_filled',
        permiso: 'editar_usuarios',
        callback: (id, elemento) => {
            Editar_Usuario(id,'identidad')
        }
    },
    {
        texto: 'Editar contacto',
        icono: 'vf-ic_fluent_call_24_filled',
        permiso: 'editar_usuarios',
        callback: (id, elemento) => {
            Editar_Usuario(id,'contacto')
        }
    },
    {
        texto: 'Reestablecer contraseña',
        icono: 'vf-ic_fluent_key_24_filled',
        permiso: 'editar_usuarios',
        callback: (id, elemento) => {
            Solicitar_Correo_Reestablecimiento(id,'password')
        }
    },
    {
        texto: 'Reestablecer PIN',
        icono: 'vf-ic_fluent_password_24_filled',
        permiso: 'editar_usuarios',
        callback: (id, elemento) => {
            Solicitar_Correo_Reestablecimiento(id,'pin')
        }
    },
    {
        texto: 'Gestionar permisos',
        icono: 'vf-ic_fluent_shield_keyhole_24_filled text-warning',
        permiso: 'editar_permisos_usuarios',
        callback: (id, elemento) => {
            const id_cifrado = Cifrar_Payload(id);
            window.location.href = 'permisos.usuarios.php?id=' + encodeURIComponent(id_cifrado);
        }
    },
    {
        texto: 'Deshabilitar usuario',
        icono: 'vf-ic_fluent_prohibited_24_filled text-danger',
        permiso: 'eliminar_usuarios',
        callback: (id, elemento) => {
            Deshabilitar_Usuario(id)
        }
    }
];

// Opciones para usuarios DESHABILITADOS (inactivos)
window.opcionesUsuarioDeshabilitado = [
    {
        texto: 'Habilitar usuario',
        icono: 'vf-ic_fluent_checkmark_circle_24_filled text-success',
        permiso: 'editar_usuarios',
        callback: (id, elemento) => {
            Habilitar_Usuario(id)
        }
    },
    {
        texto: 'Eliminar permanentemente',
        icono: 'vf-ic_fluent_delete_24_filled text-danger',
        permiso: 'eliminar_usuarios',
        callback: (id, elemento) => {
            Eliminar_Usuario_Permanente(id)
        }
    }
];

