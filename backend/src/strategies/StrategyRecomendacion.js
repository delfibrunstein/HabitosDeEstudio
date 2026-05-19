/**
 * Interfaz base del patrón Strategy para el motor de recomendación.
 * Cada estrategia concreta debe implementar el método recomendar().
 */
class StrategyRecomendacion {
  /**
   * @param {Object} estudiante  - Datos del estudiante con disponibilidad y objetivo
   * @param {Array}  materias    - Todas las materias de la carrera con correlativas
   * @param {Array}  aprobadas   - IDs de materias aprobadas por el estudiante
   * @returns {{ recomendadas: Array, noRecomendadas: Array }}
   */
  recomendar(estudiante, materias, aprobadas) {
    throw new Error('recomendar() debe implementarse en la estrategia concreta.');
  }

  /**
   * Filtra las materias que el estudiante puede cursar
   * (todas sus correlativas están aprobadas).
   */
  _materiaHabilitada(materia, aprobadasSet) {
    if (!materia.correlativas_ids || materia.correlativas_ids.length === 0) return true;
    return materia.correlativas_ids.every(id => aprobadasSet.has(id));
  }

  /**
   * Cuántas materias futuras desbloquea esta materia.
   */
  _contarDesbloqueadas(materia, todasLasMaterias, aprobadasSet) {
    return todasLasMaterias.filter(m =>
      m.id !== materia.id &&
      !aprobadasSet.has(m.id) &&
      m.correlativas_ids && m.correlativas_ids.includes(materia.id)
    ).length;
  }

  /**
   * Horas de estudio sugeridas según dificultad (regla del dominio).
   */
  _calcularHorasEstudio(materia) {
    const multiplicadores = { BAJA: 0.75, MEDIA: 1.0, ALTA: 1.5, CRITICA: 2.0 };
    return materia.horas_semanales * (multiplicadores[materia.dificultad] || 1.0);
  }

  /**
   * Total de horas semanales (cursada + estudio) de una lista de materias.
   */
  _totalHoras(materias) {
    return materias.reduce((sum, m) => {
      return sum + m.horas_semanales + this._calcularHorasEstudio(m);
    }, 0);
  }

  /**
   * Horas disponibles totales del estudiante por semana.
   */
  _disponibilidadTotal(disponibilidad) {
    return disponibilidad.reduce((s, d) => s + (d.horas_disponibles || 0), 0);
  }
}

module.exports = StrategyRecomendacion;
