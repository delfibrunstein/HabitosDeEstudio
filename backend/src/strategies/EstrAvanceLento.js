const StrategyRecomendacion = require('./StrategyRecomendacion');

class EstrAvanceLento extends StrategyRecomendacion {

  recomendar(estudiante, materias, aprobadas, disponibilidad) {
    const aprobadasSet     = new Set(aprobadas);
    const horasDisponibles = this._disponibilidadTotal(disponibilidad);
    // Liviano: máximo 60% de disponibilidad y máximo 2 materias
    const limiteHoras  = horasDisponibles * 0.60;
    const limiteMateri = 2;

    const pendientes     = materias.filter(m => !aprobadasSet.has(m.id));
    const recomendadas   = [];
    const noRecomendadas = [];
    let horasAcumuladas  = 0;

    // Orden: dificultad baja primero, luego desbloqueantes
    const habilitadas = pendientes
      .filter(m => this._materiaHabilitada(m, aprobadasSet))
      .sort((a, b) => {
        const ord = { BAJA:1, MEDIA:2, ALTA:3, CRITICA:4 };
        const difDiff = (ord[a.dificultad]||2) - (ord[b.dificultad]||2);
        if (difDiff !== 0) return difDiff;
        return this._contarDesbloqueadas(b, materias, aprobadasSet)
             - this._contarDesbloqueadas(a, materias, aprobadasSet);
      });

    const noHabilitadas = pendientes.filter(m => !this._materiaHabilitada(m, aprobadasSet));

    for (const m of habilitadas) {
      if (recomendadas.length >= limiteMateri) {
        noRecomendadas.push({ ...m, motivo_rechazo: 'Baja disponibilidad semanal (modo liviano, max 2 materias).' });
        continue;
      }

      const hsEstudio = this._calcularHorasEstudio(m);
      const hsTotales = m.horas_semanales + hsEstudio;

      if (horasAcumuladas + hsTotales > limiteHoras) {
        noRecomendadas.push({ ...m, motivo_rechazo: 'Exceso de carga horaria (modo liviano).' });
        continue;
      }

      recomendadas.push({ ...m, horas_estudio: hsEstudio });
      horasAcumuladas += hsTotales;
    }

    for (const m of noHabilitadas) {
      noRecomendadas.push({ ...m, motivo_rechazo: 'Correlativa pendiente.' });
    }

    return { recomendadas, noRecomendadas, horasAcumuladas };
  }
}

module.exports = EstrAvanceLento;
