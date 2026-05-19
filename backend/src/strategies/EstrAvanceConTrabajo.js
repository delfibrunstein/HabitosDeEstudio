const StrategyRecomendacion = require('./StrategyRecomendacion');

class EstrAvanceConTrabajo extends StrategyRecomendacion {

  recomendar(estudiante, materias, aprobadas, disponibilidad) {
    const aprobadasSet     = new Set(aprobadas);
    const horasDisponibles = this._disponibilidadTotal(disponibilidad);

    // Regla: si trabaja más de 30hs, forzar moderado/liviano
    const horasLab = estudiante.horas_laborales || 0;
    let factorLimite = 0.75;
    if (horasLab > 40) factorLimite = 0.50;
    else if (horasLab > 30) factorLimite = 0.65;

    const limiteHoras  = horasDisponibles * factorLimite;
    const limiteMateri = horasLab > 30 ? 2 : 3;

    const pendientes     = materias.filter(m => !aprobadasSet.has(m.id));
    const recomendadas   = [];
    const noRecomendadas = [];
    let horasAcumuladas  = 0;
    let altasYCriticas   = 0;
    // Con trabajo se permite max 1 materia alta/crítica
    const maxAltas = horasLab > 30 ? 1 : 2;

    // Orden: desbloqueantes primero, preferir dificultad baja/media
    const habilitadas = pendientes
      .filter(m => this._materiaHabilitada(m, aprobadasSet))
      .sort((a, b) => {
        const dA = this._contarDesbloqueadas(a, materias, aprobadasSet);
        const dB = this._contarDesbloqueadas(b, materias, aprobadasSet);
        if (dB !== dA) return dB - dA;
        const ord = { BAJA:4, MEDIA:3, ALTA:2, CRITICA:1 };
        return (ord[b.dificultad] || 0) - (ord[a.dificultad] || 0);
      });

    const noHabilitadas = pendientes.filter(m => !this._materiaHabilitada(m, aprobadasSet));

    for (const m of habilitadas) {
      if (recomendadas.length >= limiteMateri) {
        noRecomendadas.push({ ...m, motivo_rechazo: `Limite de materias para estudiante con trabajo (max ${limiteMateri}).` });
        continue;
      }

      const esAlta    = ['ALTA','CRITICA'].includes(m.dificultad);
      const hsEstudio = this._calcularHorasEstudio(m);
      const hsTotales = m.horas_semanales + hsEstudio;

      if (esAlta && altasYCriticas >= maxAltas) {
        noRecomendadas.push({ ...m, motivo_rechazo: `Dificultad acumulada muy alta (max ${maxAltas} para estudiante con trabajo).` });
        continue;
      }
      if (horasAcumuladas + hsTotales > limiteHoras) {
        noRecomendadas.push({ ...m, motivo_rechazo: 'Exceso de carga horaria (considerando trabajo y transporte).' });
        continue;
      }

      recomendadas.push({ ...m, horas_estudio: hsEstudio });
      horasAcumuladas += hsTotales;
      if (esAlta) altasYCriticas++;
    }

    for (const m of noHabilitadas) {
      noRecomendadas.push({ ...m, motivo_rechazo: 'Correlativa pendiente.' });
    }

    return { recomendadas, noRecomendadas, horasAcumuladas };
  }
}

module.exports = EstrAvanceConTrabajo;
