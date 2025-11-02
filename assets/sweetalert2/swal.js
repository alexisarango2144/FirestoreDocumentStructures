export function sAlert(type, title, content = null, confirmText = 'Ok', cancelText = null, denyText = null, confirmCallback = null, denyCallback = null) {
    let confirmButtonColorClass, cancelButtonColorClass;
    switch (type) {
        case 'info':
            confirmButtonColorClass = btn - primary;
            break;
        case 'success':
            confirmButtonColorClass = 'btn-success';
            break;
        case 'warning':
            confirmButtonColorClass = 'btn-warning';
            cancelButtonColorClass = 'btn-secondary';
            break;
        case 'error':
            confirmButtonColorClass = 'btn-danger';
            break;
        case 'question':
            confirmButtonColorClass = 'btn-info';
            if (confirmText === 'Ok') { confirmText = 'Si' };
            if (!denyText) { denyText = 'No' };
            break;
        default:
            type = 'info';
    }

    Swal.fire({
        theme: 'bootstrap-5',
        title: title,
        icon: type,
        html: content,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        showCloseButton: false,
        showCancelButton: cancelText ? true : false,
        denyButtonText: denyText,
        showDenyButton: denyText ? true : false,
        focusConfirm: true,
        customClass: {
            confirmButton: `btn ${confirmButtonColorClass}`,
            cancelButton: `btn ${cancelButtonColorClass}`,
            denyButton: 'btn btn-secondary',
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Validación de existencia y ejecución de la función)
            confirmCallback && confirmCallback();
        } else if (result.isDenied) {
            denyCallback && denyCallback();
        }
    });
}


export function sToast(type, title, content = null, timer = 5000, position = 'top-end', confirmText = null, denyText = null, confirmCallback = null, denyCallback = null) {
    let confirmButtonColorClass, cancelButtonColorClass;
    switch (type) {
        case 'info':
            confirmButtonColorClass = btn - primary;
            break;
        case 'success':
            confirmButtonColorClass = 'btn-success';
            break;
        case 'warning':
            confirmButtonColorClass = 'btn-warning';
            cancelButtonColorClass = 'btn-secondary';
            break;
        case 'error':
            confirmButtonColorClass = 'btn-danger';
            break;
        case 'question':
            confirmButtonColorClass = 'btn-info';
            if (confirmText === 'Ok') { confirmText = 'Si' };
            if (!denyText) { denyText = 'No' };
            break;
        default:
            type = 'info';
    }
    Swal.fire({
        theme: 'bootstrap-5',
        toast: true,
        position: position, // Posición: top-start, top-end, bottom-start
        icon: type,
        title: title, 
        html: content, 
        showConfirmButton: confirmText ? true : false,
        confirmButtonText: confirmText,
        showDenyButton: true,
        denyButtonText: denyText || 'Cerrar',
        customClass: {
            confirmButton: `btn ${confirmButtonColorClass}`,
            cancelButton: `btn ${cancelButtonColorClass}`,
            denyButton: 'btn btn-secondary'
        },
        timer: timer,
        timerProgressBar: timer ? true : false,
    });
}