const StrategyRecomendacion = require('./StrategyRecomendacion');

class EstrAvanceRapido extends StrategyRecomendacion {

  recomendar(estudiante, materias, aprobadas, disponibilidad) {
    const aprobadasSet    = new Set(aprobadas);
    const horasDisponibles = this._disponibilidadTotal(disponibilidad);

    // Materias que el estudiante aún no cursó
    const pendientes = materias.filter(m => !aprobadasSet.has(m.id));

    const recomendadas   = [];
    const noRecomendadas = [];
    let horasAcumuladas  = 0;
    let altasYCriticas   = 0;

    // Orden: desbloqueantes primero, luego dificultad descendente
    const habilitadas = pendientes
      .filter(m => this._materiaHabilitada(m, aprobadasSet))
      .sort((a, b) => {
        const dA = this._contarDesbloqueadas(a, materias, aprobadasSet);
        const dB = this._contarDesbloqueadas(b, materias, aprobadasSet);
        if (dB !== dA) return dB - dA;
        const ord = { CRITICA:4, ALTA:3, MEDIA:2, BAJA:1 };
        return (ord[b.dificultad] || 0) - (ord[a.dificultad] || 0);
      });

    const noHabilitadas = pendientes.filter(m => !this._materiaHabilitada(m, aprobadasSet));

    for (const m of habilitadas) {
      const hsEstudio = this._calcularHorasEstudio(m);
      const hsTotales = m.horas_semanales + hsEstudio;
      const esAlta    = ['ALTA','CRITICA'].includes(m.dificultad);

      // Regla: máximo 2 materias de dificultad alta/crítica
      if (esAlta && altasYCriticas >= 2) {
        noRecomendadas.push({ ...m, motivo_rechazo: 'Dificultad acumulada muy alta (max 2 por cuatrimestre).' });
        continue;
      }

      // Regla: no superar disponibilidad
      if (horasAcumuladas + hsTotales > horasDisponibles) {
        noRecomendadas.push({ ...m, motivo_rechazo: 'Exceso de carga horaria semanal.' });
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

module.exports = EstrAvanceRapido;
