const EstudianteModel  = require('../models/estudiante.model');
const MateriaModel     = require('../models/materia.model');
const PlanModel        = require('../models/plan.model');
const EstrAvanceRapido     = require('../strategies/EstrAvanceRapido');
const EstrAvanceModerado   = require('../strategies/EstrAvanceModerado');
const EstrAvanceLento      = require('../strategies/EstrAvanceLento');
const EstrAvanceConTrabajo = require('../strategies/EstrAvanceConTrabajo');

const ESTRATEGIAS = {
  AVANZAR_RAPIDO:    () => new EstrAvanceRapido(),
  MANTENER_PROMEDIO: () => new EstrAvanceModerado(),
  EVITAR_SOBRECARGA: () => new EstrAvanceLento(),
  ORDENAR_HABITOS:   () => new EstrAvanceLento(),
};
const DIAS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];

const RecomendadorService = {
  async generar(estudianteId) {
    const estudiante    = await EstudianteModel.findById(estudianteId);
    if (!estudiante) throw new Error('Estudiante no encontrado.');
    const disponibilidad = await EstudianteModel.getDisponibilidad(estudianteId);
    const aprobadas      = await EstudianteModel.getMateriasAprobadas(estudianteId);
    const materias       = await MateriaModel.findAll(estudiante.carrera_id);
    if (!materias.length) throw new Error('No hay materias cargadas para esta carrera.');

    const objetivo   = estudiante.objetivo || 'MANTENER_PROMEDIO';
    const usaTrabajo = estudiante.trabaja && (estudiante.horas_laborales||0) > 0;
    const estrategia = usaTrabajo
      ? new EstrAvanceConTrabajo()
      : (ESTRATEGIAS[objetivo] ? ESTRATEGIAS[objetivo]() : new EstrAvanceModerado());

    const { recomendadas, noRecomendadas, horasAcumuladas } =
      estrategia.recomendar(estudiante, materias, aprobadas, disponibilidad);

    const planResult = await PlanModel.create({ estudianteId, estrategia: objetivo });
    const planId = planResult.lastID;

    for (const m of recomendadas) {
      await PlanModel.addMateria({ planId, materiaId:m.id, recomendada:true,
        horasCursada:m.horas_semanales, horasEstudio:m.horas_estudio });
    }
    for (const m of noRecomendadas) {
      await PlanModel.addMateria({ planId, materiaId:m.id, recomendada:false, motivoRechazo:m.motivo_rechazo });
    }

    const bloques = this._generarPlanSemanal(recomendadas, disponibilidad);
    for (const b of bloques) await PlanModel.addBloque({ planId, ...b });

    const explicacion = this._explicarPorReglas(estudiante, recomendadas, noRecomendadas, objetivo);
    await PlanModel.updateExplicacion(planId, explicacion, horasAcumuladas);

    return PlanModel.findById(planId);
  },

  _generarPlanSemanal(materiasRec, disponibilidad) {
    const bloques = [];
    const diasConHoras = DIAS.filter(d => {
      const disp = disponibilidad.find(x => x.dia === d);
      return disp && disp.horas_disponibles > 0;
    });
    if (!diasConHoras.length || !materiasRec.length) return bloques;
    let idx = 0;
    for (const m of materiasRec) {
      bloques.push({ dia:diasConHoras[idx%diasConHoras.length], actividad:`Cursada: ${m.nombre}`, horas:m.horas_semanales });
      idx++;
      if ((m.horas_estudio||0) > 0) {
        bloques.push({ dia:diasConHoras[idx%diasConHoras.length], actividad:`Estudio: ${m.nombre}`, horas:Math.round(m.horas_estudio*10)/10 });
        idx++;
      }
    }
    return bloques;
  },

  _explicarPorReglas(estudiante, recomendadas, noRecomendadas, objetivo) {
    const LABELS = { AVANZAR_RAPIDO:'avanzar rápido', MANTENER_PROMEDIO:'mantener promedio',
                     EVITAR_SOBRECARGA:'evitar sobrecarga', ORDENAR_HABITOS:'ordenar hábitos' };
    const label = LABELS[objetivo] || 'equilibrado';
    const total = recomendadas.reduce((s,m)=>s+m.horas_semanales+(m.horas_estudio||0),0);
    let txt = recomendadas.length
      ? `Para tu objetivo de "${label}", se recomiendan ${recomendadas.length} materia(s): ${recomendadas.map(m=>m.nombre).join(', ')}. Carga total estimada: ${total.toFixed(1)}hs/semana.`
      : `No se encontraron materias recomendables con tu disponibilidad actual.`;
    if (noRecomendadas.length) {
      const motivos = [...new Set(noRecomendadas.map(m=>m.motivo_rechazo).filter(Boolean))];
      txt += ` Algunas materias no se incluyeron por: ${motivos.join('; ')}.`;
    }
    if (estudiante.trabaja && (estudiante.horas_laborales||0)>30) {
      txt += ` Se consideró que trabajás más de 30hs semanales.`;
    }
    return txt;
  }
};

module.exports = RecomendadorService;
