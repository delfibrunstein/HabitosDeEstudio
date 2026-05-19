const { getDb } = require('../database/db');

const PlanesController = {
  async uploadExcel(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error:'No se recibio ningun archivo.' });
      const ExcelService = require('../services/excel.service');
      const { carreraId } = req.body;
      if (!carreraId) return res.status(400).json({ error:'Se requiere carreraId.' });
      const result = await ExcelService.parsearYGuardar(req.file.path, Number(carreraId), req.file.originalname);
      res.json({ ok:true, ...result });
    } catch(err){ next(err); }
  },
  async listar(req, res, next) {
    try {
      const db = await getDb();
      const planes = await db.all(`
        SELECT pe.*, c.nombre AS carrera_nombre
        FROM plan_estudio pe JOIN carrera c ON c.id=pe.carrera_id
        ORDER BY pe.fecha_carga DESC`);
      res.json({ ok:true, planes });
    } catch(err){ next(err); }
  }
};

module.exports = PlanesController;
