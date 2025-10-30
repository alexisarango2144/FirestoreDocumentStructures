
// ***************************************************************
// *******      Data de ejemplo para "patientsMain"     **********
// ***************************************************************


let primerNombre = new field('primerNombre', 0, 'string', 'Primer Nombre', 'First Name', 50, true, true, true, false, true);
let segundoNombre = new field('segundoNombre', 1, 'string', 'Segundo Nombre', 'Second Name', 50, false, true, true, false, true);
let primerApellido = new field('primerApellido', 2, 'string', 'Primer Apellido', 'Last Name', 50, true, true, true, false, true);
let segundoApellido = new field('segundoApellido', 3, 'string', 'Segundo Apellido', 'Second Last Name', 50, false, true, true, false, true);
let tipoIdentificacion = new field('tipoIdentificacion', 4, 'string', 'Tipo de Identificación', 'Identification Type', 20, true, true, true, false, true);
let numeroIdentificacion = new field('numeroIdentificacion', 5, 'string', 'Número de Identificación', 'Identification Number', 20, true, true, true, false, true);
let fechaNacimiento = new field('fechaNacimiento', 6, 'date', 'Fecha de Nacimiento', 'Date of Birth', null, true, true, true, false, true);
let entidadResponsable = new field('entidadResponsable', 7, 'string', 'Entidad Responsable', 'Responsible Entity', 100, true, true, true, false, true);

let patientsFieldList = new fieldList();
patientsFieldList.addFields([primerNombre, segundoNombre, primerApellido, segundoApellido, tipoIdentificacion, numeroIdentificacion, fechaNacimiento, entidadResponsable]);

let patientsMainTable = new dataDocument('patientsMain', 'Pacientes', 'Patients', patientsFieldList, true, true, true);

// Ejemplo de resultado de field structure()
console.log('Ejemplo de objeto generado por el constructor de field:');
console.log(entidadResponsable.structure());
console.log('Objeto en JSON: ' + JSON.stringify(entidadResponsable.structure(), null, 2));

// Ejemplo de resultado de dataDocument structure()
console.log('Ejemplo de objeto generado por el constructor de dataDocument:');
console.log(patientsMainTable.structure());
console.log('Objeto en JSON: ' + JSON.stringify(patientsMainTable.structure(), null, 2));

// Acceder a los datos
console.log('Descripción ES:', patientsMainTable.tableDescriptionEs);
console.log('Descripción EN:', patientsMainTable.tableDescriptionEn);

console.log("Campos ordenados por índice:");
console.log('Campos:', patientsMainTable.listFieldKeys());
console.log('Primer nombre (ES):', patientsMainTable.getField('primerNombre')?.value('es'));
console.log('Primer nombre (EN):', patientsMainTable.getField('primerNombre')?.value('en'));

console.log("Campos ordenados por índice:");
console.log(patientsMainTable.returnFields());


console.log("Nombre y clave de los campos ordenados:");
console.log(patientsMainTable.listFieldKeyNames());