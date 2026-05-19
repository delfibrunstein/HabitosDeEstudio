import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearEstudiante, actualizarEstudiante, getEstudiante, getCarreras } from '../services/api';

const OBJETIVOS = [
  { value: 'AVANZAR_RAPIDO',    label: 'Avanzar rápido' },
  { value: 'MANTENER_PROMEDIO', label: 'Mantener promedio' },
  { value: 'EVITAR_SOBRECARGA', label: 'Evitar sobrecarga' },
  { value: 'ORDENAR_HABITOS',   label: 'Ordenar hábitos' },
];
const PREFERENCIAS = [
  { value: 'INTENSIVA',   label: 'Intensiva' },
  { value: 'EQUILIBRADA', label: 'Equilibrada' },
  { value: 'LIVIANA',     label: 'Liviana' },
];

const INITIAL = {
  nombre: '', dni: '', email: '', edad: '', legajo: '',
  trabaja: false, horasLaborales: 0, horasTransporte: 0,
  objetivo: 'MANTENER_PROMEDIO', preferenciaCursada: 'EQUILIBRADA', carreraId: ''
};

export default function Perfil({ onLogin, estudianteId }) {
  const nav = useNavigate();
  const [form, setForm]     = useState(INITIAL);
  const [carreras, setCarreras] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    getCarreras().then(setCarreras).catch(() => {});
    if (estudianteId) {
      getEstudiante(estudianteId).then(e => setForm({
        nombre:           e.nombre || '',
        dni:              e.dni || '',
        email:            e.email || '',
        edad:             e.edad || '',
        legajo:           e.legajo || '',
        trabaja:          !!e.trabaja,
        horasLaborales:   e.horas_laborales || 0,
        horasTransporte:  e.horas_transporte || 0,
        objetivo:         e.objetivo || 'MANTENER_PROMEDIO',
        preferenciaCursada: e.preferencia_cursada || 'EQUILIBRADA',
        carreraId:        e.carrera_id || ''
      })).catch(() => {});
    }
  }, [estudianteId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre || !form.legajo || !form.carreraId)
      return setError('Nombre, legajo y carrera son requeridos.');
    setLoading(true);
    try {
      let estudiante;
      if (estudianteId) {
        estudiante = await actualizarEstudiante(estudianteId, form);
      } else {
        estudiante = await crearEstudiante(form);
      }
      onLogin(estudiante.id);
      nav('/plan');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el perfil.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <h1>{estudianteId ? 'Editar perfil' : 'Crear perfil'}</h1>
      <p>Completá tus datos para comenzar la planificación.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre completo *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan Pérez" />
            </div>
            <div className="form-group">
              <label>Legajo *</label>
              <input value={form.legajo} onChange={e => set('legajo', e.target.value)} placeholder="SIS001" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>DNI</label>
              <input value={form.dni} onChange={e => set('dni', e.target.value)} placeholder="12345678" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="juan@email.com" />
            </div>
          </div>

          <div className="form-group">
            <label>Carrera *</label>
            <select value={form.carreraId} onChange={e => set('carreraId', e.target.value)}>
              <option value="">Seleccioná una carrera</option>
              {carreras.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.universidad_nombre}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.trabaja} onChange={e => set('trabaja', e.target.checked)} />
              Trabajo actualmente
            </label>
          </div>

          {form.trabaja && (
            <div className="form-row">
              <div className="form-group">
                <label>Horas laborales / semana</label>
                <input type="number" min="0" max="80" value={form.horasLaborales}
                  onChange={e => set('horasLaborales', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Horas de transporte / día</label>
                <input type="number" min="0" max="10" step=".5" value={form.horasTransporte}
                  onChange={e => set('horasTransporte', Number(e.target.value))} />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Objetivo académico</label>
              <select value={form.objetivo} onChange={e => set('objetivo', e.target.value)}>
                {OBJETIVOS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Preferencia de cursada</label>
              <select value={form.preferenciaCursada} onChange={e => set('preferenciaCursada', e.target.value)}>
                {PREFERENCIAS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-1 mt-2">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" /> Guardando...</> : 'Guardar y continuar →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
