const { getDb } = require('../database/db');

const PlanModel = {

  async create({ estudianteId, cuatrimestreObjetivo, estrategia }) {
    const db = await getDb();
    return db.run(
      `INSERT INTO plan (estudiante_id,cuatrimestre_objetivo,estrategia) VALUES (?,?,?)`,
      [estudianteId, cuatrimestreObjetivo||null, estrategia||null]
    );
  },

  async findById(id) {
    const db = await getDb();
    const plan = await db.get(`SELECT * FROM plan WHERE id = ?`, [id]);
    if (!plan) return null;
    const materias = await db.all(`
      SELECT pm.*, m.codigo,m.nombre,m.anio,m.cuatrimestre,m.horas_semanales,m.dificultad
      FROM plan_materia pm JOIN materia m ON m.id=pm.materia_id
      WHERE pm.plan_id=?`, [id]);
    const bloques = await db.all(`
      SELECT * FROM plan_semanal WHERE plan_id=?
      ORDER BY CASE dia
        WHEN 'LUNES' THEN 1 WHEN 'MARTES' THEN 2 WHEN 'MIERCOLES' THEN 3
        WHEN 'JUEVES' THEN 4 WHEN 'VIERNES' THEN 5 WHEN 'SABADO' THEN 6
        WHEN 'DOMINGO' THEN 7 END, id`, [id]);
    return { ...plan, materias, bloques };
  },

  async addMateria({ planId,materiaId,recomendada,motivoRechazo,horasCursada,horasEstudio }) {
    const db = await getDb();
    return db.run(
      `INSERT OR REPLACE INTO plan_materia
        (plan_id,materia_id,recomendada,motivo_rechazo,horas_cursada,horas_estudio)
       VALUES (?,?,?,?,?,?)`,
      [planId,materiaId,recomendada?1:0,motivoRechazo||null,horasCursada||null,horasEstudio||null]
    );
  },

  async addBloque({ planId,dia,actividad,horas }) {
    const db = await getDb();
    return db.run(
      `INSERT INTO plan_semanal (plan_id,dia,actividad,horas) VALUES (?,?,?,?)`,
      [planId,dia,actividad,horas]
    );
  },

  async updateExplicacion(planId, explicacion, horasEstudioSemanales) {
    const db = await getDb();
    return db.run(
      `UPDATE plan SET explicacion_ia=?,horas_estudio_semanales=? WHERE id=?`,
      [explicacion, horasEstudioSemanales, planId]
    );
  }
};

module.exports = PlanModel;
