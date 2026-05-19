const { Router } = require('express');
const ctrl = require('../controllers/recomendaciones.controller');

const router = Router();

router.post('/generar', ctrl.generar);
router.get('/:id',      ctrl.obtener);

module.exports = router;
