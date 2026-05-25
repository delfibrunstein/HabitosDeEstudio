const { getDb } = require('../database/db');

const EstudianteModel = {

  async findById(id) {
    const db = await getDb();
    return db.get(`
      SELECT e.*, c.nombre AS carrera_nombre
      FROM estudiante e LEFT JOIN carrera c ON c.id = e.carrera_id
      WHERE e.id = ?`, [id]);
  },

  async findByLegajo(legajo) {
    const db = await getDb();
    return db.get(`SELECT * FROM estudiante WHERE legajo = ?`, [legajo]);
  },

  async create(data) {
    const db = await getDb();
    const { nombre,dni,email,edad,nacimiento,trabaja,legajo,
            horasLaborales,horasTransporte,situacionLaboral,objetivo,preferenciaCursada,carreraId } = data;
    return db.run(
      `INSERT INTO estudiante
        (nombre,dni,email,edad,nacimiento,trabaja,legajo,horas_laborales,horas_transporte,situacion_laboral,objetivo,preferencia_cursada,carrera_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [nombre,dni,email,edad,nacimiento,trabaja?1:0,legajo,
       horasLaborales||0,horasTransporte||0,situacionLaboral||null,
       objetivo||'MANTENER_PROMEDIO',preferenciaCursada||'EQUILIBRADA',carreraId]
    );
  },

  async update(id, data) {
    const db = await getDb();
    const allowed = {
      nombre:'nombre',dni:'dni',email:'email',edad:'edad',nacimiento:'nacimiento',
      trabaja:'trabaja',legajo:'legajo',horasLaborales:'horas_laborales',
      horasTransporte:'horas_transporte',situacionLaboral:'situacion_laboral',objetivo:'objetivo',
      preferenciaCursada:'preferencia_cursada',carreraId:'carrera_id'
    };
    const fields = [], values = [];
    for (const [key,col] of Object.entries(allowed)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = ?`);
        values.push(key==='trabaja' ? (data[key]?1:0) : data[key]);
      }
    }
    if (!fields.length) return null;
    values.push(id);
    return db.run(`UPDATE estudiante SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  async getDisponibilidad(estudianteId) {
    const db = await getDb();
    return db.all(`
      SELECT * FROM disponibilidad_usuario WHERE estudiante_id = ?
      ORDER BY CASE dia
        WHEN 'LUNES' THEN 1 WHEN 'MARTES' THEN 2 WHEN 'MIERCOLES' THEN 3
        WHEN 'JUEVES' THEN 4 WHEN 'VIERNES' THEN 5 WHEN 'SABADO' THEN 6
        WHEN 'DOMINGO' THEN 7 END`, [estudianteId]);
  },

  async upsertDisponibilidad(estudianteId, dia, horasDisponibles) {
    const db = await getDb();
    return db.run(
      `INSERT INTO disponibilidad_usuario (estudiante_id,dia,horas_disponibles)
       VALUES (?,?,?)
       ON CONFLICT(estudiante_id,dia) DO UPDATE SET horas_disponibles=excluded.horas_disponibles`,
      [estudianteId, dia, horasDisponibles]
    );
  },

  async getMateriasConEstado(estudianteId) {
    const db = await getDb();
    return db.all(`
      SELECT m.*, ma.estado, ma.nota, ma.cuatrimestre_aprobado
      FROM materia m
      LEFT JOIN materia_aprobada ma ON ma.materia_id=m.id AND ma.estudiante_id=?
      WHERE m.carrera_id=(SELECT carrera_id FROM estudiante WHERE id=?)
      ORDER BY m.anio, m.cuatrimestre`, [estudianteId, estudianteId]);
  },

  async upsertMateriaEstado(estudianteId, materiaId, estado, nota, cuatrimestreAprobado) {
    const db = await getDb();
    return db.run(
      `INSERT INTO materia_aprobada (estudiante_id,materia_id,estado,nota,cuatrimestre_aprobado)
       VALUES (?,?,?,?,?)
       ON CONFLICT(estudiante_id,materia_id)
       DO UPDATE SET estado=excluded.estado,nota=excluded.nota,cuatrimestre_aprobado=excluded.cuatrimestre_aprobado`,
      [estudianteId, materiaId, estado, nota||null, cuatrimestreAprobado||null]
    );
  },

  async getMateriasAprobadas(estudianteId) {
    const db = await getDb();
    const rows = await db.all(
      `SELECT materia_id FROM materia_aprobada WHERE estudiante_id=? AND estado='APROBADA'`,
      [estudianteId]
    );
    return rows.map(r => r.materia_id);
  }
};

module.exports = EstudianteModel;
