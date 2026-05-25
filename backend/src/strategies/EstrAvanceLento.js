const StrategyRecomendacion = require('./StrategyRecomendacion');

class EstrAvanceLento extends StrategyRecomendacion {
  recomendar(estudiante, materias, aprobadas, disponibilidad) {
    const objetivo = estudiante.objetivo === 'ORDENAR_HABITOS' ? 'ORDENAR_HABITOS' : 'EVITAR_SOBRECARGA';
    const aprobadasSet = new Set(aprobadas);
    const limiteEstudio = this._limiteEstudioDisponible(disponibilidad, estudiante, 0.70);
    const maxMaterias = this._maxMateriasPara(objetivo, estudiante, 2);
    const maxAltas = this._maxAltasPara(objetivo, estudiante, 1);

    const pendientes = materias.filter(m => !aprobadasSet.has(m.id));
    const recomendadas = [];
    const noRecomendadas = [];
    let horasEstudioAcumuladas = 0;
    let altasYCriticas = 0;

    const habilitadas = pendientes
      .filter(m => this._materiaHabilitada(m, aprobadasSet))
      .sort((a, b) => {
        const ord = { BAJA: 1, MEDIA: 2, ALTA: 3, CRITICA: 4 };
        const difDiff = (ord[a.dificultad] || 2) - (ord[b.dificultad] || 2);
        if (difDiff !== 0) return difDiff;
        return this._contarDesbloqueadas(b, materias, aprobadasSet)
             - this._contarDesbloqueadas(a, materias, aprobadasSet);
      });

    for (const m of habilitadas) {
      const hsEstudio = this._calcularHorasEstudio(m);
      const esAlta = ['ALTA', 'CRITICA'].includes(m.dificultad);

      if (recomendadas.length >= maxMaterias) {
        noRecomendadas.push({ ...m, motivo_rechazo: `Modo liviano: máximo sugerido de ${maxMaterias} materia(s).` });
        continue;
      }

      if (esAlta && altasYCriticas >= maxAltas) {
        noRecomendadas.push({ ...m, motivo_rechazo: 'Modo liviano: se evita acumular materias de alta dificultad.' });
        continue;
      }

      if (horasEstudioAcumuladas + hsEstudio > limiteEstudio) {
        noRecomendadas.push({ ...m, motivo_rechazo: `Exceso de horas de estudio fuera de cursada. Límite ajustado: ${limiteEstudio.toFixed(1)}hs.` });
        continue;
      }

      recomendadas.push({ ...m, horas_estudio: hsEstudio });
      horasEstudioAcumuladas += hsEstudio;
      if (esAlta) altasYCriticas++;
    }

    noRecomendadas.push(...this._construirNoHabilitadas(pendientes, aprobadasSet));
    return this._resultado(recomendadas, noRecomendadas);
  }
}

module.exports = EstrAvanceLento;
