const IaController = {
  async explicar(req, res, next) {
    try {
      const IaService = require('../services/ia.service');
      const { planId } = req.body;
      if (!planId) return res.status(400).json({ error: 'Se requiere planId.' });
      const explicacion = await IaService.explicar(Number(planId));
      res.json({ ok: true, explicacion });
    } catch (err) { next(err); }
  }
};

module.exports = IaController;
