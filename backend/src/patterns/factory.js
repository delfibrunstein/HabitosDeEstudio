/**
 * PATRÓN FACTORY METHOD
 * ───────────────────────────────────────────────────────────────────────────
 * Centraliza la creación de las estrategias de recomendación en un único
 * lugar, desacoplando al RecomendadorService de las clases concretas.
 *
 * Contexto en el TPO:
 * El RecomendadorService necesita instanciar una estrategia según el objetivo
 * del estudiante y su situación laboral. Sin Factory, el service tiene un
 * objeto de mapeo hardcodeado con `require` directo a cada estrategia.
 * Con Factory Method, agregar una nueva estrategia solo requiere modificar
 * este archivo, sin tocar el service.
 *
 * Participantes:
 *   - StrategyFactory (Creator)       → clase con el factory method
 *   - crearEstrategia() (factory method) → decide qué clase instanciar
 *   - EstrAvanceRapido, etc. (ConcreteProduct) → las estrategias concretas
 *
 * Ejemplo de uso:
 *   const estrategia = StrategyFactory.crearEstrategia(estudiante);
 *   const resultado   = estrategia.recomendar(...);
 */

const EstrAvanceRapido     = require('../strategies/EstrAvanceRapido');
const EstrAvanceModerado   = require('../strategies/EstrAvanceModerado');
const EstrAvanceLento      = require('../strategies/EstrAvanceLento');
const EstrAvanceConTrabajo = require('../strategies/EstrAvanceConTrabajo');

// Mapa objetivo → clase de estrategia base (sin considerar trabajo)
const ESTRATEGIAS_BASE = {
  AVANZAR_RAPIDO:    EstrAvanceRapido,
  MANTENER_PROMEDIO: EstrAvanceModerado,
  EVITAR_SOBRECARGA: EstrAvanceLento,
  ORDENAR_HABITOS:   EstrAvanceLento
};

// Situaciones laborales que fuerzan el uso de EstrAvanceConTrabajo
const SITUACIONES_CON_TRABAJO = new Set([
  'PASANTE_4HS',
  'FREELANCE_VARIABLE',
  'RELACION_DEPENDENCIA_FULLTIME'
]);

class StrategyFactory {

  /**
   * Factory Method principal.
   * Decide qué estrategia instanciar según el perfil del estudiante.
   *
   * Reglas de selección (en orden de prioridad):
   * 1. Si el estudiante trabaja (cualquier modalidad) → EstrAvanceConTrabajo
   * 2. Si el objetivo es reconocido → la estrategia correspondiente
   * 3. Fallback → EstrAvanceModerado
   *
   * @param {Object} estudiante  - Datos del estudiante con objetivo y situacion_laboral
   * @returns {StrategyRecomendacion} Instancia de la estrategia apropiada
   */
  static crearEstrategia(estudiante) {
    const situacionLaboral = estudiante.situacion_laboral
      || (estudiante.trabaja ? 'RELACION_DEPENDENCIA_FULLTIME' : 'NO_TRABAJA');

    // Si trabaja → estrategia especial para trabajadores
    if (SITUACIONES_CON_TRABAJO.has(situacionLaboral)) {
      return new EstrAvanceConTrabajo();
    }

    const objetivo = estudiante.objetivo || 'MANTENER_PROMEDIO';
    const ClaseEstrategia = ESTRATEGIAS_BASE[objetivo];

    if (!ClaseEstrategia) {
      console.warn(
        `[StrategyFactory] Objetivo desconocido: "${objetivo}". ` +
        `Usando EstrAvanceModerado como fallback.`
      );
      return new EstrAvanceModerado();
    }

    return new ClaseEstrategia();
  }

  /**
   * Crea una estrategia por nombre de clase explícito.
   * Útil para tests o cuando se quiere forzar una estrategia específica.
   *
   * @param {string} nombreClase - 'EstrAvanceRapido' | 'EstrAvanceModerado' | etc.
   * @returns {StrategyRecomendacion}
   */
  static crearPorNombre(nombreClase) {
    const mapa = {
      EstrAvanceRapido,
      EstrAvanceModerado,
      EstrAvanceLento,
      EstrAvanceConTrabajo
    };

    const Clase = mapa[nombreClase];
    if (!Clase) {
      throw new Error(
        `StrategyFactory: nombre de estrategia desconocido: "${nombreClase}". ` +
        `Opciones válidas: ${Object.keys(mapa).join(', ')}.`
      );
    }

    return new Clase();
  }

  /**
   * Devuelve los nombres de todas las estrategias disponibles.
   * Útil para documentación o endpoints de diagnóstico.
   */
  static estrategiasDisponibles() {
    return Object.keys(ESTRATEGIAS_BASE).map(objetivo => ({
      objetivo,
      estrategia: ESTRATEGIAS_BASE[objetivo].name
    })).concat([{
      objetivo: '(trabajador)',
      estrategia: EstrAvanceConTrabajo.name
    }]);
  }
}

module.exports = StrategyFactory;
