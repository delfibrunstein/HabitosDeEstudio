const { Router } = require('express');
const ctrl = require('../controllers/estudiantes.controller');
const { validarRegistro, validarActualizacion } = require('../middlewares/authValidator');

const router = Router();

router.get('/carreras',                     ctrl.listarCarreras);
router.get('/login/:legajo',                ctrl.loginPorLegajo);
router.post('/', validarRegistro,           ctrl.crear);
router.get('/:id',                          ctrl.obtener);
router.put('/:id', validarActualizacion,     ctrl.actualizar);
router.get('/:id/disponibilidad',           ctrl.obtenerDisponibilidad);
router.post('/:id/disponibilidad',          ctrl.guardarDisponibilidad);
router.get('/:id/materias',                 ctrl.obtenerMaterias);
router.post('/:id/materias',                ctrl.guardarMaterias);

module.exports = router;