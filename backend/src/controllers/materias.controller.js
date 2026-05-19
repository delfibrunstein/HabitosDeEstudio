const MateriaModel = require('../models/materia.model');

const MateriasController = {
  async listar(req, res, next) {
    try {
      const { carreraId } = req.query;
      if (!carreraId) return res.status(400).json({ error:'Se requiere carreraId.' });
      const materias = await MateriaModel.findAll(Number(carreraId));
      res.json({ ok:true, materias });
    } catch(err){ next(err); }
  },
  async obtener(req, res, next) {
    try {
      const materia = await MateriaModel.findById(Number(req.params.id));
      if (!materia) return res.status(404).json({ error:'Materia no encontrada.' });
      res.json({ ok:true, materia });
    } catch(err){ next(err); }
  }
};

module.exports = MateriasController;
