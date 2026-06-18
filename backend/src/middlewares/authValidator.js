const { body, param, validationResult } = require('express-validator');

// Función auxiliar que intercepta los errores detectados por express-validator
const verificarErrores = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    // Tomamos el primer error para mantener el formato simple que usa tu App
    return res.status(400).json({ 
      error: `${errores.array()[0].msg} (Campo: ${errores.array()[0].path})` 
    });
  }
  next();
};

const authValidator = {
  validarRegistro: [
    body('nombre')
      .trim()
      .notEmpty().withMessage('El nombre es obligatorio.')
      .isAlpha('es-ES', { ignore: ' ' }).withMessage('El nombre solo puede contener letras y espacios.')
      .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres.'),
    
    body('dni')
      .trim()
      .notEmpty().withMessage('El DNI es obligatorio.')
      .isNumeric().withMessage('El DNI debe contener solo números.'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('El correo electrónico es obligatorio.')
      .isEmail().withMessage('El formato de correo electrónico no es válido.'),
    
    body('legajo')
      .trim()
      .notEmpty().withMessage('El legajo es obligatorio.')
      .isAlphanumeric().withMessage('El legajo debe ser alfanumérico.'),
    
    body('carreraId')
      .notEmpty().withMessage('La carrera es obligatoria.')
      .isInt({ min: 1 }).withMessage('ID de carrera inválido.'),
      
    verificarErrores
  ],

  validarActualizacion: [
    body('nombre')
      .optional({ checkFalsy: true })
      .trim()
      .isAlpha('es-ES', { ignore: ' ' }).withMessage('El nombre solo puede contener letras y espacios.')
      .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres.'),
    
    body('dni')
      .optional({ checkFalsy: true })
      .trim()
      .isNumeric().withMessage('El DNI debe contener solo números.'),
    
    body('email')
      .optional({ checkFalsy: true })
      .trim()
      .isEmail().withMessage('El formato de correo electrónico no es válido.'),
    
    body('legajo')
      .optional({ checkFalsy: true })
      .trim()
      .isAlphanumeric().withMessage('El legajo debe ser alfanumérico.'),
    
    body('carreraId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 }).withMessage('ID de carrera inválido.'),
      
    verificarErrores
  ]
};

module.exports = authValidator;