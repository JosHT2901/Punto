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
        texto: 'Editar usuario',
        icono: 'vf-ic_fluent_edit_24_filled text-primary',
        permiso: 'editar_usuarios',
        callback: (id, elemento) => {
            console.log("Editando usuario ID:", id);
            // Ejemplo: AbrirModalEditarUsuario(id);
        }
    },
    {
        texto: 'Gestionar permisos',
        icono: 'vf-ic_fluent_shield_keyhole_24_filled text-warning',
        permiso: 'gestionar_permisos_usuarios',
        callback: (id, elemento) => {
            console.log("Gestionando permisos para usuario ID:", id);
            // Ejemplo: AbrirModalPermisosUsuario(id);
        }
    },
    {
        texto: 'Deshabilitar usuario',
        icono: 'vf-ic_fluent_prohibited_24_filled text-danger',
        permiso: 'deshabilitar_usuarios',
        callback: (id, elemento) => {
            console.log("Deshabilitando usuario ID:", id);
            // Ejemplo: DeshabilitarUsuario(id);
        }
    }
];

// Opciones para usuarios DESHABILITADOS (inactivos)
window.opcionesUsuarioDeshabilitado = [
    {
        texto: 'Habilitar usuario',
        icono: 'vf-ic_fluent_checkmark_circle_24_filled text-success',
        permiso: 'habilitar_usuarios',
        callback: (id, elemento) => {
            console.log("Habilitando usuario ID:", id);
            // Ejemplo: HabilitarUsuario(id);
        }
    },
    {
        texto: 'Eliminar permanentemente',
        icono: 'vf-ic_fluent_delete_24_filled text-danger',
        permiso: 'eliminar_usuarios',
        callback: (id, elemento) => {
            console.log("Eliminando usuario ID:", id);
            // Ejemplo: EliminarUsuarioPermanente(id);
        }
    }
];