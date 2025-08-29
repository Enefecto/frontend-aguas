export const formatNumberCL = (num) =>
    (num ?? 0).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 2 });