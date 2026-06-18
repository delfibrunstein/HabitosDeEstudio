import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  registrarEstudiante, actualizarEstudiante,
  getEstudiante, getCarreras, cambiarPassword
} from '../services/api';

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

const SITUACIONES_LABORALES = [
  { value: 'NO_TRABAJA',                    label: 'No trabajo' },
  { value: 'PASANTE_4HS',                   label: 'Pasante / part-time (hasta 20hs)' },
  { value: 'FREELANCE_VARIABLE',            label: 'Freelance o carga variable (20-30hs)' },
  { value: 'RELACION_DEPENDENCIA_FULLTIME', label: 'Relación de dependencia full-time (35hs+)' },
];

const INITIAL = {
  nombre: '', dni: '', email: '', edad: '', legajo: '',
  trabaja: false,
  situacionLaboral: 'NO_TRABAJA',
  horasLaborales: 0, horasTransporte: 0,
  objetivo: 'MANTENER_PROMEDIO',
  preferenciaCursada: 'EQUILIBRADA',
  carreraId: '',
  regularizadasHabilitan: false,
};

export default function Perfil({ onLogin, estudianteId }) {
  const nav = useNavigate();
  const [form, setForm]         = useState(INITIAL);
  const [carreras, setCarreras] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // Sección cambio de contraseña (solo en edición)
  const [showPass, setShowPass]       = useState(false);
  const [passActual, setPassActual]   = useState('');
  const [passNuevo, setPassNuevo]     = useState('');
  const [passConfirm, setPassConfirm] = useState('');
  const [passError, setPassError]     = useState('');
  const [passOk, setPassOk]           = useState('');

  useEffect(() => {
    getCarreras().then(setCarreras).catch(() => {});
    if (estudianteId) {
      getEstudiante(estudianteId).then(e => setForm({
        nombre:                e.nombre || '',
        dni:                   e.dni || '',
        email:                 e.email || '',
        edad:                  e.edad || '',
        legajo:                e.legajo || '',
        trabaja:               !!e.trabaja,
        situacionLaboral:      e.situacion_laboral || 'NO_TRABAJA',
        horasLaborales:        e.horas_laborales || 0,
        horasTransporte:       e.horas_transporte || 0,
        objetivo:              e.objetivo || 'MANTENER_PROMEDIO',
        preferenciaCursada:    e.preferencia_cursada || 'EQUILIBRADA',
        carreraId:             e.carrera_id || '',
        regularizadasHabilitan: !!e.regularizadas_habilitan,
      })).catch(() => {});
    }
  }, [estudianteId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSituacion = (val) => {
    set('situacionLaboral', val);
    set('trabaja', val !== 'NO_TRABAJA');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.nombre || !form.legajo || !form.carreraId)
      return setError('Nombre, legajo y carrera son requeridos.');
    if (!estudianteId && !form.email)
      return setError('El email es requerido para el registro.');
    setLoading(true);
    try {
      if (estudianteId) {
        await actualizarEstudiante(estudianteId, form);
        setSuccess('Perfil actualizado correctamente.');
      } else {
        // Registro nuevo: usa la nueva ruta auth
        const { estudiante, token } = await registrarEstudiante(form);
        localStorage.setItem('authToken', token);
        onLogin(estudiante.id);
        nav('/plan');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el perfil.');
    } finally { setLoading(false); }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setPassError(''); setPassOk('');
    if (passNuevo !== passConfirm) return setPassError('Las contraseñas nuevas no coinciden.');
    if (passNuevo.length < 4) return setPassError('La contraseña debe tener al menos 4 caracteres.');
    try {
      await cambiarPassword({ passwordActual: passActual, passwordNuevo: passNuevo });
      setPassOk('Contraseña cambiada correctamente.');
      setPassActual(''); setPassNuevo(''); setPassConfirm('');
      setShowPass(false);
    } catch (err) {
      setPassError(err.response?.data?.error || 'Error al cambiar la contraseña.');
    }
  };

  return (
    <div className="page">
      <h1>{estudianteId ? 'Editar perfil' : 'Crear perfil'}</h1>
      <p>
        {estudianteId
          ? 'Actualizá tus datos personales y preferencias académicas.'
          : 'Completá tus datos para comenzar la planificación personalizada. Tu contraseña inicial será tu legajo en mayúsculas.'}
      </p>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <p className="section-label">Datos personales</p>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre completo *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan Pérez" />
            </div>
            <div className="form-group">
              <label>Legajo *</label>
              <input
                value={form.legajo}
                onChange={e => set('legajo', e.target.value)}
                placeholder="SIS001"
                readOnly={!!estudianteId}
                style={estudianteId ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>DNI</label>
              <input value={form.dni} onChange={e => set('dni', e.target.value)} placeholder="12345678" />
            </div>
            <div className="form-group">
              <label>Email {!estudianteId && '*'}</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="juan@email.com"
              />
            </div>
          </div>

          {!estudianteId && (
            <div className="alert" style={{ background: 'var(--bg-alt, #f0f4ff)', border: '1px solid var(--primary, #4f6ef2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '0.88rem' }}>
              🔑 Tu contraseña inicial será tu legajo en mayúsculas (ej: <strong>SIS001</strong>). Podés cambiarla desde tu perfil después de ingresar.
            </div>
          )}

          <div className="form-group">
            <label>Carrera *</label>
            <select value={form.carreraId} onChange={e => set('carreraId', e.target.value)}>
              <option value="">Seleccioná una carrera</option>
              {carreras.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} — {c.universidad_nombre}</option>
              ))}
            </select>
          </div>

          <p className="section-label">Situación laboral</p>

          <div className="form-row">
            <div className="form-group">
              <label>Situación laboral</label>
              <select value={form.situacionLaboral} onChange={e => handleSituacion(e.target.value)}>
                {SITUACIONES_LABORALES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            {form.trabaja && (
              <div className="form-group">
                <label>Horas de transporte / día</label>
                <input type="number" min="0" max="10" step=".5" value={form.horasTransporte}
                  onChange={e => set('horasTransporte', Number(e.target.value))} />
              </div>
            )}
          </div>

          <p className="section-label">Preferencias académicas</p>

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

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.regularizadasHabilitan}
                onChange={e => set('regularizadasHabilitan', e.target.checked)}
              />
              <span>Las materias regularizadas habilitan correlativas en mi carrera</span>
            </label>
            <small>Activá esto si tu facultad permite cursar materias superiores con la regularidad previa.</small>
          </div>

          <div className="flex gap-2 mt-2">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading
                ? <><span className="spinner" /> Guardando...</>
                : estudianteId ? 'Guardar cambios' : 'Crear cuenta →'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Cambio de contraseña (solo para estudiantes existentes) ── */}
      {estudianteId && (
        <div className="card" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="section-label" style={{ margin: 0 }}>🔒 Cambiar contraseña</p>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              onClick={() => { setShowPass(v => !v); setPassError(''); setPassOk(''); }}
            >
              {showPass ? 'Cancelar' : 'Cambiar'}
            </button>
          </div>

          {passError && <div className="alert alert-error" style={{ marginTop: '12px' }}>{passError}</div>}
          {passOk    && <div className="alert alert-success" style={{ marginTop: '12px' }}>{passOk}</div>}

          {showPass && (
            <form onSubmit={handleCambiarPassword} style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Contraseña actual</label>
                <input
                  type="password"
                  value={passActual}
                  onChange={e => setPassActual(e.target.value)}
                  placeholder="Tu contraseña actual"
                  autoComplete="current-password"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Nueva contraseña</label>
                  <input
                    type="password"
                    value={passNuevo}
                    onChange={e => setPassNuevo(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label>Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={passConfirm}
                    onChange={e => setPassConfirm(e.target.value)}
                    placeholder="Repetí la nueva contraseña"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Actualizar contraseña
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
