const StrategyRecomendacion = require('./StrategyRecomendacion');

class EstrAvanceModerado extends StrategyRecomendacion {
  recomendar(estudiante, materias, aprobadas, disponibilidad, enCurso = []) {
    const objetivo      = 'MANTENER_PROMEDIO';
    const aprobadasSet  = new Set(aprobadas);
    const enCursoSet    = new Set(enCurso);
    const limiteEstudio = this._limiteEstudioDisponible(disponibilidad, estudiante, 0.90);
    const maxMaterias   = this._maxMateriasPara(objetivo, estudiante, 4);
    const maxAltas      = this._maxAltasPara(objetivo, estudiante, 2);

    const pendientes     = materias.filter(m => !aprobadasSet.has(m.id) && !enCursoSet.has(m.id));
    const recomendadas   = [];
    const noRecomendadas = [];
    let horasEstudioAcumuladas = 0;
    let altasYCriticas = 0;

    const enCursoInfo = materias
      .filter(m => enCursoSet.has(m.id))
      .map(m => ({ ...m, motivo_rechazo: 'Ya en curso este cuatrimestre.' }));

    const habilitadas = pendientes
      .filter(m => this._materiaHabilitada(m, aprobadasSet))
      .sort((a, b) => {
        const dA = this._contarDesbloqueadas(a, materias, aprobadasSet);
        const dB = this._contarDesbloqueadas(b, materias, aprobadasSet);
        if (dB !== dA) return dB - dA;
        // Modo equilibrado: prioriza dificultad MEDIA
        const ord = { MEDIA: 4, BAJA: 3, ALTA: 2, CRITICA: 1 };
        return (ord[b.dificultad] || 0) - (ord[a.dificultad] || 0);
      });

    for (const m of habilitadas) {
      const hsEstudio = this._calcularHorasEstudio(m);
      const esAlta    = ['ALTA', 'CRITICA'].includes(m.dificultad);

      if (recomendadas.length >= maxMaterias) {
        noRecomendadas.push({ ...m, motivo_rechazo: `Límite sugerido para cursada equilibrada (${maxMaterias}).` });
        continue;
      }
      if (esAlta && altasYCriticas >= maxAltas) {
        noRecomendadas.push({ ...m, motivo_rechazo: `Dificultad acumulada alta para modo equilibrado (máximo ${maxAltas}).` });
        continue;
      }
      if (horasEstudioAcumuladas + hsEstudio > limiteEstudio) {
        noRecomendadas.push({ ...m, motivo_rechazo: `Excede las horas de estudio disponibles. Límite: ${limiteEstudio.toFixed(1)}hs.` });
        continue;
      }

      recomendadas.push({ ...m, horas_estudio: hsEstudio });
      horasEstudioAcumuladas += hsEstudio;
      if (esAlta) altasYCriticas++;
    }

    noRecomendadas.push(...this._construirNoHabilitadas(pendientes, aprobadasSet));
    noRecomendadas.push(...enCursoInfo);
    return this._resultado(recomendadas, noRecomendadas);
  }
}

module.exports = EstrAvanceModerado;
