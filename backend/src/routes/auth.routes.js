const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const AuthController   = require('../controllers/auth.controller');
const { verificarToken } = require('../middlewares/jwtMiddleware');

const router = Router();

const verificarErrores = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty())
    return res.status(400).json({ error: errs.array()[0].msg });
  next();
};

// POST /api/auth/registro
router.post('/registro', [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.')
    .isAlpha('es-ES', { ignore: ' ' }).withMessage('El nombre solo puede contener letras y espacios.')
    .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres.'),
  body('legajo').trim().notEmpty().withMessage('El legajo es obligatorio.')
    .isAlphanumeric().withMessage('El legajo debe ser alfanumérico.'),
  body('email').trim().notEmpty().withMessage('El email es obligatorio.')
    .isEmail().withMessage('Formato de email inválido.'),
  body('carreraId').notEmpty().withMessage('La carrera es obligatoria.')
    .isInt({ min: 1 }).withMessage('ID de carrera inválido.'),
  verificarErrores
], AuthController.registro);

// POST /api/auth/login
router.post('/login', [
  body('password').notEmpty().withMessage('La contraseña es requerida.'),
  verificarErrores
], AuthController.login);

// POST /api/auth/cambiar-password  (requiere JWT)
router.post('/cambiar-password', verificarToken, [
  body('passwordActual').notEmpty().withMessage('La contraseña actual es requerida.'),
  body('passwordNuevo').isLength({ min: 4 }).withMessage('La nueva contraseña debe tener al menos 4 caracteres.'),
  verificarErrores
], AuthController.cambiarPassword);

module.exports = router;
