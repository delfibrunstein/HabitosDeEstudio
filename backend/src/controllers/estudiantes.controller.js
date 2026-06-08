const EstudianteModel = require('../models/estudiante.model');
const { getDb } = require('../database/db');

const EstudiantesController = {

  async crear(req, res, next) {
    try {
      const result = await EstudianteModel.create(req.body);
      const estudiante = await EstudianteModel.findById(result.lastID);
      res.status(201).json({ ok: true, estudiante });
    } catch (err) {
      if (err.message?.includes('UNIQUE'))
        return res.status(409).json({ error: 'Ya existe un estudiante con ese legajo o DNI.' });
      next(err);
    }
  },

  async actualizar(req, res, next) {
    try {
      await EstudianteModel.update(Number(req.params.id), req.body);
      const estudiante = await EstudianteModel.findById(Number(req.params.id));
      if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado.' });
      res.json({ ok: true, estudiante });
    } catch (err) { next(err); }
  },

  async obtener(req, res, next) {
    try {
      const estudiante = await EstudianteModel.findById(Number(req.params.id));
      if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado.' });
      res.json({ ok: true, estudiante });
    } catch (err) { next(err); }
  },

  // Login por legajo — sin contraseña, para uso académico
  async loginPorLegajo(req, res, next) {
    try {
      const legajo = req.params.legajo?.trim().toUpperCase();
      if (!legajo) return res.status(400).json({ error: 'Legajo requerido.' });
      const estudiante = await EstudianteModel.findByLegajo(legajo);
      if (!estudiante) return res.status(404).json({ error: 'No se encontró ningún estudiante con ese legajo.' });
      res.json({ ok: true, estudiante });
    } catch (err) { next(err); }
  },

  async guardarDisponibilidad(req, res, next) {
    try {
      const estudianteId = Number(req.params.id);
      const { disponibilidad } = req.body;
      const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
      for (const item of disponibilidad) {
        if (!DIAS.includes(item.dia)) continue;
        await EstudianteModel.upsertDisponibilidad(estudianteId, item.dia, item.horasDisponibles);
      }
      const guardado = await EstudianteModel.getDisponibilidad(estudianteId);
      res.json({ ok: true, disponibilidad: guardado });
    } catch (err) { next(err); }
  },

  async obtenerDisponibilidad(req, res, next) {
    try {
      const disponibilidad = await EstudianteModel.getDisponibilidad(Number(req.params.id));
      res.json({ ok: true, disponibilidad });
    } catch (err) { next(err); }
  },

  async guardarMaterias(req, res, next) {
    try {
      const estudianteId = Number(req.params.id);
      const { materias } = req.body;
      for (const m of materias) {
        await EstudianteModel.upsertMateriaEstado(estudianteId, m.materiaId, m.estado, m.nota, m.cuatrimestreAprobado);
      }
      res.json({ ok: true, guardadas: materias.length });
    } catch (err) { next(err); }
  },

  async obtenerMaterias(req, res, next) {
    try {
      const materias = await EstudianteModel.getMateriasConEstado(Number(req.params.id));
      res.json({ ok: true, materias });
    } catch (err) { next(err); }
  },

  async listarCarreras(req, res, next) {
    try {
      const db = await getDb();
      const carreras = await db.all(`
        SELECT c.*, u.nombre AS universidad_nombre
        FROM carrera c JOIN universidad u ON u.id = c.universidad_id
        ORDER BY c.nombre`);
      res.json({ ok: true, carreras });
    } catch (err) { next(err); }
  }
};

module.exports = EstudiantesController;