const EstudianteModel = require('../models/estudiante.model');
const MateriaModel = require('../models/materia.model');
const PlanModel = require('../models/plan.model');
const EstrAvanceRapido = require('../strategies/EstrAvanceRapido');
const EstrAvanceModerado = require('../strategies/EstrAvanceModerado');
const EstrAvanceLento = require('../strategies/EstrAvanceLento');

const ESTRATEGIAS = {
  AVANZAR_RAPIDO: () => new EstrAvanceRapido(),
  MANTENER_PROMEDIO: () => new EstrAvanceModerado(),
  EVITAR_SOBRECARGA: () => new EstrAvanceLento(),
  ORDENAR_HABITOS: () => new EstrAvanceLento()
};

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

const RecomendadorService = {
  async generar(estudianteId) {
    const estudiante = await EstudianteModel.findById(estudianteId);
    if (!estudiante) throw new Error('Estudiante no encontrado.');

    const disponibilidad = await EstudianteModel.getDisponibilidad(estudianteId);
    const aprobadas = await EstudianteModel.getMateriasAprobadas(estudianteId);
    const materias = await MateriaModel.findAll(estudiante.carrera_id);

    if (!materias.length) throw new Error('No hay materias cargadas para esta carrera.');

    const objetivo = estudiante.objetivo || 'MANTENER_PROMEDIO';

    // El objetivo académico define la estrategia principal.
    // La situación laboral no reemplaza la estrategia: solo ajusta límites internos.
    const estrategia = ESTRATEGIAS[objetivo] ? ESTRATEGIAS[objetivo]() : new EstrAvanceModerado();

    const resultado = estrategia.recomendar(estudiante, materias, aprobadas, disponibilidad);
    const {
      recomendadas,
      noRecomendadas,
      horasAcumuladas,
      horasCursada,
      cargaAcademicaTotal
    } = resultado;

    const estrategiaAplicada = estrategia._obtenerEtiquetaEstrategia(objetivo, estudiante);

    const planResult = await PlanModel.create({ estudianteId, estrategia: estrategiaAplicada });
    const planId = planResult.lastID;

    for (const m of recomendadas) {
      await PlanModel.addMateria({
        planId,
        materiaId: m.id,
        recomendada: true,
        horasCursada: m.horas_semanales,
        horasEstudio: m.horas_estudio
      });
    }

    for (const m of noRecomendadas) {
      await PlanModel.addMateria({
        planId,
        materiaId: m.id,
        recomendada: false,
        motivoRechazo: m.motivo_rechazo
      });
    }

    const bloques = this._generarPlanSemanal(recomendadas, disponibilidad);
    for (const b of bloques) await PlanModel.addBloque({ planId, ...b });

    const explicacion = this._explicarPorReglas(
      estudiante,
      recomendadas,
      noRecomendadas,
      estrategiaAplicada,
      {
        horasEstudio: horasAcumuladas,
        horasCursada,
        cargaAcademicaTotal,
        disponibilidadEstudio: this._disponibilidadTotal(disponibilidad)
      }
    );

    // horas_estudio_semanales guarda solo estudio fuera de cursada.
    await PlanModel.updateExplicacion(planId, explicacion, horasAcumuladas);

    const planFinal = await PlanModel.findById(planId);
    return {
      ...planFinal,
      estrategia_detalle: estrategiaAplicada,
      resumen_carga: {
        horas_estudio: horasAcumuladas,
        horas_cursada: horasCursada,
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

    // El plan semanal distribuye SOLO estudio autónomo.
    // No crea bloques de cursada porque la app todavía no conoce horarios reales de clase.
    const pendientes = materiasRec.map(m => ({
      nombre: m.nombre,
      restante: Number(m.horas_estudio || 0)
    })).filter(m => m.restante > 0);

    let diaIndex = 0;

    for (const materia of pendientes) {
      while (materia.restante > 0) {
        const dia = dias[diaIndex % dias.length];
        const capacidad = Math.max(0, dia.disponible - dia.usado);

        if (capacidad > 0) {
          const horas = Math.min(materia.restante, capacidad, 2);
          bloques.push({
            dia: dia.dia,
            actividad: `Estudio: ${materia.nombre}`,
            horas: Math.round(horas * 10) / 10
          });
          dia.usado += horas;
          materia.restante = Math.round((materia.restante - horas) * 10) / 10;
        }

        diaIndex++;

        // Corte defensivo: si por redondeos no queda capacidad, se evita loop infinito.
        const capacidadTotalRestante = dias.reduce((s, d) => s + Math.max(0, d.disponible - d.usado), 0);
        if (capacidadTotalRestante <= 0 && materia.restante > 0) break;
      }
    }

    return bloques;
  },

  _disponibilidadTotal(disponibilidad) {
    return disponibilidad.reduce((s, d) => s + Number(d.horas_disponibles || 0), 0);
  },

  _explicarPorReglas(estudiante, recomendadas, noRecomendadas, etiquetaEstrategia, totales) {
    const horasEstudio = Number(totales.horasEstudio || 0);
    const horasCursada = Number(totales.horasCursada || 0);
    const cargaTotal = Number(totales.cargaAcademicaTotal || 0);
    const disponibilidadEstudio = Number(totales.disponibilidadEstudio || 0);

    let txt = recomendadas.length
      ? `Bajo el enfoque de "${etiquetaEstrategia}", se recomiendan ${recomendadas.length} materia(s): ${recomendadas.map(m => m.nombre).join(', ')}. `
      : 'No se encontraron materias recomendables con tu disponibilidad actual. ';

    txt += `La recomendación usa ${horasEstudio.toFixed(1)}hs/semana de estudio fuera de cursada sobre ${disponibilidadEstudio.toFixed(1)}hs declaradas disponibles. `;
    txt += `Además, implica ${horasCursada.toFixed(1)}hs/semana de cursada y una carga académica total estimada de ${cargaTotal.toFixed(1)}hs/semana. `;

    if (noRecomendadas.length) {
      const motivos = [...new Set(noRecomendadas.map(m => m.motivo_rechazo).filter(Boolean))];
      txt += `Algunas materias no se incluyeron por: ${motivos.join('; ')}.`;
    }

    if (estudiante.trabaja) {
      txt += ' Se aplicó un margen de seguridad por situación laboral, sin contar la cursada dentro de las horas libres de estudio.';
    }

    return txt;
  }
};

module.exports = RecomendadorService;
