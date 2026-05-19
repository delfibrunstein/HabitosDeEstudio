const { Router } = require('express');
const ctrl = require('../controllers/materias.controller');

const router = Router();

router.get('/',     ctrl.listar);
router.get('/:id',  ctrl.obtener);

module.exports = router;
