const { Router } = require('express');
const ctrl = require('../controllers/ia.controller');

const router = Router();

router.post('/explicar', ctrl.explicar);

module.exports = router;
