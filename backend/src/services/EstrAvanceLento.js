const StrategyRecomendacion = require('./StrategyRecomendacion');

class EstrAvanceLento extends StrategyRecomendacion {
  recomendar(estudiante, materias, aprobadas, disponibilidad, enCurso = []) {
    const objetivo      = estudiante.objetivo === 'ORDENAR_HABITOS' ? 'ORDENAR_HABITOS' : 'EVITAR_SOBRECARGA';
    const aprobadasSet  = new Set(aprobadas);
    const enCursoSet    = new Set(enCurso);
    const limiteEstudio = this._limiteEstudioDisponible(disponibilidad, estudiante, 0.70);
    const maxMaterias   = this._maxMateriasPara(objetivo, estudiante, 2);
    const maxAltas      = this._maxAltasPara(objetivo, estudiante, 1);

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
        // Modo liviano: las más fáciles primero; desempate por desbloqueantes
        const ord = { BAJA: 1, MEDIA: 2, ALTA: 3, CRITICA: 4 };
        const difDiff = (ord[a.dificultad] || 2) - (ord[b.dificultad] || 2);
        if (difDiff !== 0) return difDiff;
        return this._contarDesbloqueadas(b, materias, aprobadasSet)
             - this._contarDesbloqueadas(a, materias, aprobadasSet);
      });

    for (const m of habilitadas) {
      const hsEstudio = this._calcularHorasEstudio(m);
      const esAlta    = ['ALTA', 'CRITICA'].includes(m.dificultad);

      if (recomendadas.length >= maxMaterias) {
        noRecomendadas.push({ ...m, motivo_rechazo: `Modo liviano: máximo sugerido de ${maxMaterias} materia(s).` });
        continue;
      }
      if (esAlta && altasYCriticas >= maxAltas) {
        noRecomendadas.push({ ...m, motivo_rechazo: 'Modo liviano: se evita acumular materias de alta dificultad.' });
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

module.exports = EstrAvanceLento;
