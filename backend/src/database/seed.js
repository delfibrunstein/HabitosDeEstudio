require('dotenv').config();
const { initDatabase } = require('./init');
const { getDb } = require('./db');

async function seed() {
  await initDatabase();
  const db = await getDb();

  console.log('[SEED] Insertando datos de prueba...');

  // Universidad
  await db.run(`INSERT OR IGNORE INTO universidad (nombre) VALUES (?)`, ['Universidad Tecnologica Nacional']);
  const uni = await db.get(`SELECT id FROM universidad WHERE nombre = ?`, ['Universidad Tecnologica Nacional']);

  // Carrera
  await db.run(`INSERT OR IGNORE INTO carrera (nombre, universidad_id) VALUES (?,?)`, ['Ingenieria en Sistemas de Informacion', uni.id]);
  const carrera = await db.get(`SELECT id FROM carrera WHERE nombre = ?`, ['Ingenieria en Sistemas de Informacion']);
  const carreraId = carrera.id;

  // Materias
  const materias = [
    { codigo:'ANA1', nombre:'Analisis Matematico 1',         anio:1, cuatri:1, hs:6, dif:'ALTA',   prom:0, corrs:[] },
    { codigo:'ALG1', nombre:'Algebra y Geometria Analitica', anio:1, cuatri:1, hs:6, dif:'ALTA',   prom:0, corrs:[] },
    { codigo:'SIS1', nombre:'Sistemas y Organizaciones',     anio:1, cuatri:1, hs:4, dif:'BAJA',   prom:1, corrs:[] },
    { codigo:'TEC1', nombre:'Tecnologia de la Informacion',  anio:1, cuatri:1, hs:4, dif:'BAJA',   prom:1, corrs:[] },
    { codigo:'ANA2', nombre:'Analisis Matematico 2',         anio:1, cuatri:2, hs:6, dif:'ALTA',   prom:0, corrs:['ANA1'] },
    { codigo:'ALG2', nombre:'Algebra Lineal',                anio:1, cuatri:2, hs:4, dif:'MEDIA',  prom:0, corrs:['ALG1'] },
    { codigo:'FIS1', nombre:'Fisica 1',                      anio:1, cuatri:2, hs:6, dif:'ALTA',   prom:0, corrs:['ANA1'] },
    { codigo:'PROG1',nombre:'Programacion 1',                anio:2, cuatri:1, hs:6, dif:'MEDIA',  prom:1, corrs:['TEC1'] },
    { codigo:'EDA',  nombre:'Estructura de Datos',           anio:2, cuatri:1, hs:6, dif:'ALTA',   prom:0, corrs:['PROG1'] },
    { codigo:'BD1',  nombre:'Bases de Datos 1',              anio:2, cuatri:2, hs:6, dif:'MEDIA',  prom:1, corrs:['PROG1'] },
    { codigo:'PROG2',nombre:'Programacion 2',                anio:2, cuatri:2, hs:6, dif:'ALTA',   prom:0, corrs:['PROG1'] },
    { codigo:'SO1',  nombre:'Sistemas Operativos 1',         anio:3, cuatri:1, hs:4, dif:'MEDIA',  prom:0, corrs:['EDA'] },
    { codigo:'REDES',nombre:'Redes y Comunicaciones',        anio:3, cuatri:1, hs:4, dif:'MEDIA',  prom:0, corrs:['FIS1'] },
    { codigo:'ING1', nombre:'Ingenieria de Software 1',      anio:3, cuatri:2, hs:6, dif:'MEDIA',  prom:1, corrs:['BD1','PROG2'] },
    { codigo:'BD2',  nombre:'Bases de Datos 2',              anio:3, cuatri:2, hs:4, dif:'CRITICA',prom:0, corrs:['BD1'] },
  ];

  for (const m of materias) {
    await db.run(
      `INSERT OR IGNORE INTO materia (codigo,nombre,anio,cuatrimestre,horas_semanales,dificultad,promocionable,carrera_id)
       VALUES (?,?,?,?,?,?,?,?)`,
      [m.codigo, m.nombre, m.anio, m.cuatri, m.hs, m.dif, m.prom, carreraId]
    );
  }

  // Correlatividades
  for (const m of materias) {
    const mat = await db.get(`SELECT id FROM materia WHERE codigo=? AND carrera_id=?`, [m.codigo, carreraId]);
    if (!mat) continue;
    for (const cCod of m.corrs) {
      const corr = await db.get(`SELECT id FROM materia WHERE codigo=? AND carrera_id=?`, [cCod, carreraId]);
      if (corr) await db.run(
        `INSERT OR IGNORE INTO correlatividad (materia_id, correlativa_id) VALUES (?,?)`,
        [mat.id, corr.id]
      );
    }
  }

  // Estudiante de prueba
  await db.run(
    `INSERT OR IGNORE INTO estudiante
      (nombre,dni,email,trabaja,legajo,horas_laborales,horas_transporte,objetivo,preferencia_cursada,carrera_id)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    ['Juan Perez','12345678','juan@email.com',1,'SIS001',30,1,'EVITAR_SOBRECARGA','EQUILIBRADA',carreraId]
  );
  const est = await db.get(`SELECT id FROM estudiante WHERE legajo='SIS001'`);

  // Disponibilidad semanal
  const diasHoras = [['LUNES',2],['MARTES',0],['MIERCOLES',3],['JUEVES',0],['VIERNES',3],['SABADO',5],['DOMINGO',4]];
  for (const [dia, hs] of diasHoras) {
    await db.run(
      `INSERT OR IGNORE INTO disponibilidad_usuario (estudiante_id,dia,horas_disponibles) VALUES (?,?,?)`,
      [est.id, dia, hs]
    );
  }

  // Materias aprobadas (primer año completo)
  for (const cod of ['ANA1','ALG1','SIS1','TEC1','ANA2','ALG2','FIS1']) {
    const mat = await db.get(`SELECT id FROM materia WHERE codigo=? AND carrera_id=?`, [cod, carreraId]);
    if (mat) await db.run(
      `INSERT OR IGNORE INTO materia_aprobada (estudiante_id,materia_id,nota,estado,cuatrimestre_aprobado) VALUES (?,?,?,?,?)`,
      [est.id, mat.id, 7, 'APROBADA', 1]
    );
  }
  // PROG1 regularizada
  const prog1 = await db.get(`SELECT id FROM materia WHERE codigo='PROG1' AND carrera_id=?`, [carreraId]);
  if (prog1) await db.run(
    `INSERT OR IGNORE INTO materia_aprobada (estudiante_id,materia_id,estado) VALUES (?,?,?)`,
    [est.id, prog1.id, 'REGULARIZADA']
  );

  console.log(`[SEED] Listo. Estudiante ID: ${est.id} | Carrera ID: ${carreraId}`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
