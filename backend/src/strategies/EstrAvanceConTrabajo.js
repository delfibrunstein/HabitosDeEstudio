const EstrAvanceModerado = require('./EstrAvanceModerado');

/**
 * Clase conservada por compatibilidad con la arquitectura original.
 *
 * Ya no debe usarse para pisar el objetivo académico del estudiante.
 * La situación laboral ahora se calcula dentro de cada estrategia concreta
 * mediante los factores definidos en StrategyRecomendacion.
 */
class EstrAvanceConTrabajo extends EstrAvanceModerado {}

module.exports = EstrAvanceConTrabajo;
