/**
 * Clase base del patrón Strategy para el motor de recomendación.
 *
 * Regla de dominio importante:
 * - horas_semanales de una materia = horas de cursada.
 * - disponibilidad_usuario.horas_disponibles = horas libres para estudiar fuera de cursada.
 *
 * Por eso, la disponibilidad del estudiante se compara SOLO contra horas de estudio.
 * Las horas de cursada se conservan como dato informativo para calcular carga académica total,
 * pero no deben consumir la disponibilidad declarada por el usuario.
 *
 * Firma actualizada de recomendar():
 *   recomendar(estudiante, materias, aprobadas, disponibilidad, enCurso=[])
 *
 * enCurso: array de IDs de materias con estado EN_CURSO. Se excluyen de las pendientes
 * para no recomendar algo que el estudiante ya está cursando.
 */
class StrategyRecomendacion {
  static SITUACIONES_LABORALES = {
    NO_TRABAJA: {
      factor: 1.00,
      etiqueta: 'no trabaja',
      maxMaterias: { AVANZAR_RAPIDO: 5, MANTENER_PROMEDIO: 4, EVITAR_SOBRECARGA: 2, ORDENAR_HABITOS: 2 },
      maxAltas:    { AVANZAR_RAPIDO: 3, MANTENER_PROMEDIO: 2, EVITAR_SOBRECARGA: 1, ORDENAR_HABITOS: 1 }
    },
    PASANTE_4HS: {
      factor: 0.90,
      etiqueta: 'pasante 4hs',
      maxMaterias: { AVANZAR_RAPIDO: 4, MANTENER_PROMEDIO: 3, EVITAR_SOBRECARGA: 2, ORDENAR_HABITOS: 2 },
      maxAltas:    { AVANZAR_RAPIDO: 2, MANTENER_PROMEDIO: 2, EVITAR_SOBRECARGA: 1, ORDENAR_HABITOS: 1 }
    },
    FREELANCE_VARIABLE: {
      factor: 0.80,
      etiqueta: 'freelance variable',
      maxMaterias: { AVANZAR_RAPIDO: 4, MANTENER_PROMEDIO: 3, EVITAR_SOBRECARGA: 2, ORDENAR_HABITOS: 2 },
      maxAltas:    { AVANZAR_RAPIDO: 2, MANTENER_PROMEDIO: 2, EVITAR_SOBRECARGA: 1, ORDENAR_HABITOS: 1 }
    },
    RELACION_DEPENDENCIA_FULLTIME: {
      factor: 0.70,
      etiqueta: 'relación de dependencia full-time',
      maxMaterias: { AVANZAR_RAPIDO: 3, MANTENER_PROMEDIO: 3, EVITAR_SOBRECARGA: 2, ORDENAR_HABITOS: 2 },
      maxAltas:    { AVANZAR_RAPIDO: 2, MANTENER_PROMEDIO: 1, EVITAR_SOBRECARGA: 1, ORDENAR_HABITOS: 1 }
    }
  };

  static ETIQUETAS_OBJETIVOS = {
    AVANZAR_RAPIDO:    'avanzar rápido',
    MANTENER_PROMEDIO: 'mantener promedio',
    EVITAR_SOBRECARGA: 'evitar sobrecarga',
    ORDENAR_HABITOS:   'ordenar hábitos'
  };

  // Las subclases DEBEN implementar este método.
  // enCurso: array de IDs (puede ser vacío).
  recomendar(estudiante, materias, aprobadas, disponibilidad, enCurso = []) {
    throw new Error('recomendar() debe implementarse en la estrategia concreta.');
  }

  _materiaHabilitada(materia, aprobadasSet) {
    if (!materia.correlativas_ids || materia.correlativas_ids.length === 0) return true;
    return materia.correlativas_ids.every(id => aprobadasSet.has(id));
  }

  _contarDesbloqueadas(materia, todasLasMaterias, aprobadasSet) {
    return todasLasMaterias.filter(m =>
      m.id !== materia.id &&
      !aprobadasSet.has(m.id) &&
      m.correlativas_ids &&
      m.correlativas_ids.includes(materia.id)
    ).length;
  }

  _calcularHorasEstudio(materia) {
    const multiplicadores = { BAJA: 0.75, MEDIA: 1.0, ALTA: 1.5, CRITICA: 2.0 };
    return Number(materia.horas_semanales || 0) * (multiplicadores[materia.dificultad] || 1.0);
  }

  _calcularCargaMateria(materia) {
    const horasCursada = Number(materia.horas_semanales || 0);
    const horasEstudio = Number(materia.horas_estudio ?? this._calcularHorasEstudio(materia));
    return { horasCursada, horasEstudio, horasTotales: horasCursada + horasEstudio };
  }

  _totalHorasEstudio(materias) {
    return materias.reduce((sum, m) => sum + Number(m.horas_estudio ?? this._calcularHorasEstudio(m)), 0);
  }

  _totalHorasCursada(materias) {
    return materias.reduce((sum, m) => sum + Number(m.horas_semanales || 0), 0);
  }

  _totalCargaAcademica(materias) {
    return materias.reduce((sum, m) => sum + this._calcularCargaMateria(m).horasTotales, 0);
  }

  _disponibilidadTotal(disponibilidad) {
    return disponibilidad.reduce((s, d) => s + Number(d.horas_disponibles || 0), 0);
  }

  _obtenerSituacionLaboral(estudiante) {
    // Bug #1 fix: usar situacion_laboral si está seteado explícitamente
    if (estudiante.situacion_laboral) return estudiante.situacion_laboral;

    // Fallback para datos previos sin situacion_laboral
    if (!estudiante.trabaja) return 'NO_TRABAJA';
    const horasLaborales = Number(estudiante.horas_laborales || 0);
    if (horasLaborales > 0 && horasLaborales <= 20) return 'PASANTE_4HS';
    if (horasLaborales > 20 && horasLaborales <= 30) return 'FREELANCE_VARIABLE';
    return 'RELACION_DEPENDENCIA_FULLTIME';
  }

  _obtenerAjusteLaboral(estudiante) {
    const situacion = this._obtenerSituacionLaboral(estudiante);
    return StrategyRecomendacion.SITUACIONES_LABORALES[situacion]
      || StrategyRecomendacion.SITUACIONES_LABORALES.NO_TRABAJA;
  }

  _obtenerEtiquetaEstrategia(objetivo, estudiante) {
    const objEtiqueta = StrategyRecomendacion.ETIQUETAS_OBJETIVOS[objetivo] || 'equilibrado';
    const ajuste      = this._obtenerAjusteLaboral(estudiante);
    return `${objEtiqueta} · ${ajuste.etiqueta}`;
  }

  _maxMateriasPara(objetivo, estudiante, fallback) {
    const ajuste = this._obtenerAjusteLaboral(estudiante);
    return ajuste.maxMaterias?.[objetivo] ?? fallback;
  }

  _maxAltasPara(objetivo, estudiante, fallback) {
    const ajuste = this._obtenerAjusteLaboral(estudiante);
    return ajuste.maxAltas?.[objetivo] ?? fallback;
  }

  _limiteEstudioDisponible(disponibilidad, estudiante, factorObjetivo = 1) {
    const disponibilidadEstudio = this._disponibilidadTotal(disponibilidad);
    const ajusteLaboral         = this._obtenerAjusteLaboral(estudiante);
    return disponibilidadEstudio * ajusteLaboral.factor * factorObjetivo;
  }

  _construirNoHabilitadas(pendientes, aprobadasSet) {
    return pendientes
      .filter(m => !this._materiaHabilitada(m, aprobadasSet))
      .map(m => ({ ...m, motivo_rechazo: 'Correlativa pendiente.' }));
  }

  _resultado(recomendadas, noRecomendadas) {
    return {
      recomendadas,
      noRecomendadas,
      horasAcumuladas:     this._totalHorasEstudio(recomendadas),
      horasCursada:        this._totalHorasCursada(recomendadas),
      cargaAcademicaTotal: this._totalCargaAcademica(recomendadas)
    };
  }
}

module.exports = StrategyRecomendacion;
