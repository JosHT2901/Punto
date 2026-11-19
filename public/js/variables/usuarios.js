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
        CrearVentanaIframe(
            'Importar esquemas',
            '../components/carga.archivo.php',
            '600px',
            true,
            true,
            function (iframeElement) {
                let datos = {
                    multiple: false,
                    mostrar_plantilla: true,
                    url_plantilla: '/../../../../public/docs/usuarios.xlsx',
                    tipo_archivos: '.xlsx,.xls,.csv',
                    nombre_plantilla:'plantilla_usuarios.xlsx'
                };

                $.messenger.send(iframeElement, 'datos_iniciales', datos);

                $.messenger.on('Archivos_cargados', function (data, sourceWindow, origin) {
                    ModalAPI.cerrar();
                    MostrarCargando('Procesando...', false);
                    Procesar_Archivo_Importar_Usuarios(data.data);
                });
            }
        );
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
        texto: 'Ver movimientos',
        icono: 'vf-ic_fluent_history_24_filled text-info',
        permiso: 'ver_movimientos_usuario',
        callback: (id, elemento) => {
            window.location.href = "movimientos.php?id=" + id;
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
    }
];



window.botones_opciones_habilitado=[
    {
        id: 'btn-eliminar-masivo',
        icon: 'vf-ic_fluent_delete_24_filled',
        title: 'Eliminar seleccionados',
        permiso:'eliminar_clientes',
        onclick: 'Eliminar_Usuarios_Masivo()'
    },
    {
        id: 'btn-exportar-masivo',
        icon: 'vf-ic_fluent_arrow_export_24_filled',
        title: 'Exportar seleccionados',
        onclick: 'Exportar_Usuarios_Masivos()'
    }
]

window.botones_opciones_deshabilitado=[
    {
        id: 'btn-habilitar-masivo',
        icon: 'vf-ic_fluent_arrow_clockwise_24_filled',
        title: 'Habiltar seleccionados',
        permiso:'exportar_usuarios',
        onclick: 'Habilitar_Usuarios_Masivo()'
    }
]

window.ordenUsuarios = window.ordenUsuarios || {
    columna: 'ID',
    direccion: 'DESC'
};

window.opcionesMenuOrdenar = [
    {
        id: 'recientes',
        texto: 'Más recientes primero',
        icono: 'fa-solid fa-arrow-down-1-9',
        callback: (id, elemento) => {
            window.ordenUsuarios = {
                columna: 'ID',
                direccion: 'DESC'
            };
            window.pagina = 1;
            CargarUsuarios();
        }
    },
    {
        id: 'antiguos',
        texto: 'Más antiguos primero',
        icono: 'fa-solid fa-arrow-up-9-1',
        callback: (id, elemento) => {
            window.ordenUsuarios = {
                columna: 'ID',
                direccion: 'ASC'
            };
            window.pagina = 1;
            CargarUsuarios();
        }
    },
    {
        id: 'nombre_asc',
        texto: 'Nombre (A - Z)',
        icono: 'fa-solid fa-arrow-down-a-z',
        callback: (id, elemento) => {
            window.ordenUsuarios = {
                columna: 'nombre',
                direccion: 'ASC'
            };
            window.pagina = 1;
            CargarUsuarios();
        }
    },
    {
        id: 'nombre_desc',
        texto: 'Nombre (Z - A)',
        icono: 'fa-solid fa-arrow-up-z-a',
        callback: (id, elemento) => {
            window.ordenUsuarios = {
                columna: 'nombre',
                direccion: 'DESC'
            };
            window.pagina = 1;
            CargarUsuarios();
        }
    },
    {
        id: 'usuario_asc',
        texto: 'Usuario de acceso (A - Z)',
        icono: 'fa-solid fa-user-check',
        callback: (id, elemento) => {
            window.ordenUsuarios = {
                columna: 'nombre_usuario',
                direccion: 'ASC'
            };
            window.pagina = 1;
            CargarUsuarios();
        }
    }
];