const PlanModel = require('../models/plan.model');

const RecomendacionesController = {
  async generar(req, res, next) {
    try {
      const RecomendadorService = require('../services/recomendador.service');
      const { estudianteId } = req.body;
      if (!estudianteId) return res.status(400).json({ error:'Se requiere estudianteId.' });
      const plan = await RecomendadorService.generar(Number(estudianteId));
      res.status(201).json({ ok:true, plan });
    } catch(err){ next(err); }
  },
  async obtener(req, res, next) {
    try {
      const plan = await PlanModel.findById(Number(req.params.id));
      if (!plan) return res.status(404).json({ error:'Plan no encontrado.' });
      res.json({ ok:true, plan });
    } catch(err){ next(err); }
  }
};

module.exports = RecomendacionesController;
