const { Router } = require('express');
const ctrl = require('../controllers/estudiantes.controller');

const router = Router();

router.get('/carreras',                     ctrl.listarCarreras);
router.get('/login/:legajo',                ctrl.loginPorLegajo);  // ← nuevo
router.post('/',                            ctrl.crear);
router.get('/:id',                          ctrl.obtener);
router.put('/:id',                          ctrl.actualizar);
router.get('/:id/disponibilidad',           ctrl.obtenerDisponibilidad);
router.post('/:id/disponibilidad',          ctrl.guardarDisponibilidad);
router.get('/:id/materias',                 ctrl.obtenerMaterias);
router.post('/:id/materias',                ctrl.guardarMaterias);

module.exports = router;