const EstudianteModel  = require('../models/estudiante.model');
const MateriaModel     = require('../models/materia.model');
const PlanModel        = require('../models/plan.model');

// Patron Factory: centraliza la creacion de estrategias
const StrategyFactory  = require('../patterns/factory');
// Patron Observer: notifica a los observers cuando se genera un plan
const { eventBus }     = require('../patterns/observer');

const RecomendadorService = {

  async generar(estudianteId) {
    const estudiante = await EstudianteModel.findById(estudianteId);
    if (!estudiante) throw new Error('Estudiante no encontrado.');

    const disponibilidad = await EstudianteModel.getDisponibilidad(estudianteId);
    const disponibilidadTotal = this._disponibilidadTotal(disponibilidad);

    if (disponibilidadTotal === 0) {
      throw new Error(
        'No tenés horas de estudio configuradas. ' +
        'Completá tu disponibilidad semanal antes de generar una recomendación.'
      );
    }

    const aprobadas = await EstudianteModel.getMateriasAprobadas(estudianteId);
    const enCurso   = await EstudianteModel.getMateriasEnCurso(estudianteId);
    const yaCursadas = await EstudianteModel.getMateriasCursadasYAprobadas(estudianteId);
    const todasLasMaterias = await MateriaModel.findAll(estudiante.carrera_id);

    if (!todasLasMaterias.length) throw new Error('No hay materias cargadas para esta carrera.');

    // FILTRADO: Dejamos únicamente las materias que no estén cursadas/aprobadas ni se estén cursando ahora
    const materiasPendientes = todasLasMaterias.filter(m => 
      !yaCursadas.includes(m.id) && 
      !enCurso.includes(m.id)
    );

    // Patron Factory: crea la estrategia correcta segun el perfil del estudiante
    const estrategia = StrategyFactory.crearEstrategia(estudiante);
    console.log('[Factory] Estrategia creada:', estrategia.constructor.name);

    const resultado = estrategia.recomendar(
      estudiante, materiasPendientes, aprobadas, disponibilidad, enCurso
    );

    const {
      recomendadas, noRecomendadas,
      horasAcumuladas, horasCursada, cargaAcademicaTotal
    } = resultado;

    const estrategiaAplicada = estrategia._obtenerEtiquetaEstrategia(
      estudiante.objetivo || 'MANTENER_PROMEDIO', estudiante
    );

    const planResult = await PlanModel.create({ estudianteId, estrategia: estrategiaAplicada });
    const planId = planResult.lastID;

    for (const m of recomendadas) {
      await PlanModel.addMateria({
        planId, materiaId: m.id, recomendada: true,
        horasCursada: m.horas_semanales, horasEstudio: m.horas_estudio
      });
    }
    for (const m of noRecomendadas) {
      await PlanModel.addMateria({
        planId, materiaId: m.id, recomendada: false,
        motivoRechazo: m.motivo_rechazo
      });
    }

    const bloques = this._generarPlanSemanal(recomendadas, disponibilidad);
    for (const b of bloques) await PlanModel.addBloque({ planId, ...b });

    const explicacion = this._explicarPorReglas(
      estudiante, recomendadas, noRecomendadas, estrategiaAplicada,
      {
        horasEstudio: horasAcumuladas,
        horasCursada,
        cargaAcademicaTotal,
        disponibilidadEstudio: disponibilidadTotal
      }
    );

    await PlanModel.updateExplicacion(planId, explicacion, horasAcumuladas);

    // Patron Observer: notificar a todos los observers registrados
    eventBus.emitir('plan:generado', {
      estudianteId,
      planId,
      estrategia:           estrategiaAplicada,
      totalRecomendadas:    recomendadas.length,
      recomendadas,
      noRecomendadas,
      horasEstudio:         horasAcumuladas,
      horasCursada,
      disponibilidadEstudio: disponibilidadTotal
    });

    const planFinal = await PlanModel.findById(planId);
    return {
      ...planFinal,
      estrategia_detalle: estrategiaAplicada,
      resumen_carga: {
        horas_estudio:         horasAcumuladas,
        horas_cursada:         horasCursada,
        carga_academica_total: cargaAcademicaTotal
      }
    };
  },

  _generarPlanSemanal(materiasRec, disponibilidad) {
    const bloques = [];
    const dias = disponibilidad
      .filter(d => Number(d.horas_disponibles || 0) > 0)
      .map(d => ({ dia: d.dia, disponible: Number(d.horas_disponibles || 0), usado: 0 }));

    if (!dias.length || !materiasRec.length) return bloques;

    // Bloque orientativo de cursada por materia
    for (const m of materiasRec) {
      if (Number(m.horas_semanales || 0) > 0) {
        bloques.push({
          dia: 'LUNES',
          actividad: `Cursada: ${m.nombre} (${m.horas_semanales}hs/sem — según horario de la facultad)`,
          horas: Number(m.horas_semanales)
        });
      }
    }

    // Distribuir estudio autónomo: greedy por espacio disponible
    // El día con más horas libres absorbe primero (sábado/domingo primero)
    const pendientes = materiasRec
      .map(m => ({ nombre: m.nombre, restante: Number(m.horas_estudio || 0) }))
      .filter(m => m.restante > 0);

    for (const materia of pendientes) {
      while (materia.restante > 0) {
        const dia = dias
          .filter(d => d.disponible - d.usado > 0)
          .sort((a, b) => (b.disponible - b.usado) - (a.disponible - a.usado))[0];

        if (!dia) break;

        const capacidad = dia.disponible - dia.usado;
        const horas = Math.min(materia.restante, capacidad, 2);
        bloques.push({
          dia: dia.dia,
          actividad: `Estudio: ${materia.nombre}`,
          horas: Math.round(horas * 10) / 10
        });
        dia.usado += horas;
        materia.restante = Math.round((materia.restante - horas) * 10) / 10;
      }
    }

    return bloques;
  },

  _disponibilidadTotal(disponibilidad) {
    return disponibilidad.reduce((s, d) => s + Number(d.horas_disponibles || 0), 0);
  },

  _explicarPorReglas(estudiante, recomendadas, noRecomendadas, etiquetaEstrategia, totales) {
    const horasEstudio          = Number(totales.horasEstudio || 0);
    const horasCursada          = Number(totales.horasCursada || 0);
    const cargaTotal            = Number(totales.cargaAcademicaTotal || 0);
    const disponibilidadEstudio = Number(totales.disponibilidadEstudio || 0);

    const prefLabel = {
      INTENSIVA:   'en modo intensivo',
      EQUILIBRADA: 'de forma equilibrada',
      LIVIANA:     'de forma liviana'
    }[estudiante.preferencia_cursada] || 'de forma equilibrada';

    let txt = recomendadas.length
      ? `Con el enfoque "${etiquetaEstrategia}" y cursada ${prefLabel}, se recomiendan ` +
        `${recomendadas.length} materia(s): ${recomendadas.map(m => m.nombre).join(', ')}. `
      : 'No se encontraron materias recomendables con tu disponibilidad y perfil actuales. ';

    txt += `Se usarán ${horasEstudio.toFixed(1)}hs/semana de estudio autónomo ` +
           `sobre ${disponibilidadEstudio.toFixed(1)}hs disponibles. `;
    txt += `A eso se suman ${horasCursada.toFixed(1)}hs/semana de cursada, ` +
           `dando una carga académica total estimada de ${cargaTotal.toFixed(1)}hs/semana. `;

    if (noRecomendadas.length) {
      const motivos = [...new Set(noRecomendadas.map(m => m.motivo_rechazo).filter(Boolean))];
      txt += `Materias no incluidas por: ${motivos.join('; ')}. `;
    }

    if (estudiante.trabaja) {
      txt += 'Se aplicó un margen de seguridad por situación laboral sobre las horas libres de estudio.';
    }

    if (estudiante.regularizadas_habilitan) {
      txt += ' Las materias regularizadas cuentan como habilitantes de correlativas.';
    }

    return txt;
  }
};

module.exports = RecomendadorService;