const { getDb } = require('../database/db');

const MateriaModel = {

  async findAll(carreraId) {
    const db = await getDb();
    const materias = await db.all(`
      SELECT m.*,
        GROUP_CONCAT(c.correlativa_id) AS correlativas_ids
      FROM materia m
      LEFT JOIN correlatividad c ON c.materia_id = m.id
      WHERE m.carrera_id = ?
      GROUP BY m.id
      ORDER BY m.anio, m.cuatrimestre, m.nombre
    `, [carreraId]);
    return materias.map(m => ({
      ...m,
      promocionable: m.promocionable === 1,
      correlativas_ids: m.correlativas_ids ? m.correlativas_ids.split(',').map(Number) : []
    }));
  },

  async findById(id) {
    const db = await getDb();
    const m = await db.get(`SELECT * FROM materia WHERE id = ?`, [id]);
    if (!m) return null;
    const corrs = await db.all(`SELECT correlativa_id FROM correlatividad WHERE materia_id = ?`, [id]);
    return { ...m, promocionable: m.promocionable === 1, correlativas_ids: corrs.map(c => c.correlativa_id) };
  },

  async findByCodigoYCarrera(codigo, carreraId) {
    const db = await getDb();
    return db.get(`SELECT * FROM materia WHERE codigo = ? AND carrera_id = ?`, [codigo, carreraId]);
  },

  async create({ codigo, nombre, anio, cuatrimestre, horasSemanales, dificultad, promocionable, carreraId }) {
    const db = await getDb();
    return db.run(
      `INSERT INTO materia (codigo,nombre,anio,cuatrimestre,horas_semanales,dificultad,promocionable,carrera_id)
       VALUES (?,?,?,?,?,?,?,?)`,
      [codigo, nombre, anio, cuatrimestre, horasSemanales, dificultad, promocionable ? 1 : 0, carreraId]
    );
  },

  async insertCorrelatividad(materiaId, correlativaId) {
    const db = await getDb();
    return db.run(
      `INSERT OR IGNORE INTO correlatividad (materia_id, correlativa_id) VALUES (?,?)`,
      [materiaId, correlativaId]
    );
  },

  async deleteByCarrera(carreraId) {
    const db = await getDb();
    return db.run(`DELETE FROM materia WHERE carrera_id = ?`, [carreraId]);
  }
};

module.exports = MateriaModel;
