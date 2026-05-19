import { useState } from 'react';
import { generarRecomendacion, explicarIA } from '../services/api';

const DIFICULTAD_BADGE = { BAJA:'badge-verde', MEDIA:'badge-azul', ALTA:'badge-naranja', CRITICA:'badge-rojo' };
const DIAS_LABEL = { LUNES:'Lun', MARTES:'Mar', MIERCOLES:'Mié', JUEVES:'Jue',
                     VIERNES:'Vie', SABADO:'Sáb', DOMINGO:'Dom' };

export default function Resultado({ estudianteId }) {
  const [plan,         setPlan]         = useState(null);
  const [explicacion,  setExplicacion]  = useState('');
  const [fuenteIA,     setFuenteIA]     = useState('');
  const [loading,      setLoading]      = useState(false);
  const [loadingIA,    setLoadingIA]    = useState(false);
  const [error,        setError]        = useState('');

  const handleGenerar = async () => {
    setLoading(true); setError(''); setPlan(null); setExplicacion('');
    try {
      const p = await generarRecomendacion(estudianteId);
      setPlan(p);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar la recomendación.');
    } finally { setLoading(false); }
  };

  const handleExplicar = async () => {
    if (!plan) return;
    setLoadingIA(true);
    try {
      const res = await explicarIA(plan.id);
      setExplicacion(res.texto);
      setFuenteIA(res.fuente);
    } catch { setExplicacion(plan.explicacion_ia || 'No hay explicación disponible.'); setFuenteIA('reglas'); }
    finally { setLoadingIA(false); }
  };

  const recomendadas  = plan?.materias?.filter(m => m.recomendada)  || [];
  const noRecomendadas= plan?.materias?.filter(m => !m.recomendada) || [];
  const totalHoras    = recomendadas.reduce((s, m) =>
    s + (m.horas_cursada || 0) + (m.horas_estudio || 0), 0);

  return (
    <div className="page">
      <h1>Recomendación de cursada</h1>
      <p>El sistema analiza tus materias aprobadas, disponibilidad y objetivo para sugerirte el mejor cuatrimestre.</p>

      {error && <div className="alert alert-error">{error}</div>}

      <button className="btn btn-primary btn-lg" onClick={handleGenerar} disabled={loading}>
        {loading ? <><span className="spinner" /> Generando...</> : '🎯 Generar recomendación'}
      </button>

      {plan && (
        <>
          {/* Resumen */}
          <div className="card mt-3">
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Materias recomendadas', value: recomendadas.length, color: '#16a34a' },
                { label: 'Horas totales/semana',  value: `${totalHoras.toFixed(1)}hs`, color: '#2563eb' },
                { label: 'Estrategia aplicada',   value: plan.estrategia?.replace('_',' ').toLowerCase(), color: '#7c3aed' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, minWidth: '120px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
                  <div className="text-muted" style={{ fontSize: '.8rem' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Materias recomendadas */}
          {recomendadas.length > 0 && (
            <div className="card">
              <h2>✅ Materias recomendadas</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Materia</th><th>Dificultad</th><th>Cursada</th><th>Estudio</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {recomendadas.map(m => (
                      <tr key={m.materia_id}>
                        <td><strong>{m.nombre}</strong><br/><span className="text-muted" style={{fontSize:'.75rem'}}>{m.codigo}</span></td>
                        <td><span className={`badge ${DIFICULTAD_BADGE[m.dificultad]||'badge-gris'}`}>{m.dificultad}</span></td>
                        <td>{m.horas_cursada}hs</td>
                        <td>{Number(m.horas_estudio).toFixed(1)}hs</td>
                        <td><strong>{(m.horas_cursada + m.horas_estudio).toFixed(1)}hs</strong></td>
                      </tr>
                    ))}
                    <tr style={{ background: '#eff6ff' }}>
                      <td colSpan={4}><strong>Total semanal</strong></td>
                      <td><strong style={{ color: '#2563eb' }}>{totalHoras.toFixed(1)}hs</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No recomendadas */}
          {noRecomendadas.length > 0 && (
            <div className="card">
              <h2>❌ Materias no recomendadas</h2>
              {noRecomendadas.map(m => (
                <div key={m.materia_id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '.5rem 0', borderBottom: '1px solid #f3f4f6', gap: '1rem'
                }}>
                  <div>
                    <strong style={{ fontSize: '.9rem' }}>{m.nombre}</strong>
                    <div className="text-muted" style={{ fontSize: '.75rem' }}>{m.codigo}</div>
                  </div>
                  <span className="badge badge-rojo" style={{ whiteSpace: 'nowrap', fontSize: '.72rem', maxWidth: '220px', textAlign: 'right' }}>
                    {m.motivo_rechazo}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Plan semanal */}
          {plan.bloques?.length > 0 && (
            <div className="card">
              <h2>📅 Plan semanal sugerido</h2>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Día</th><th>Actividad</th><th>Horas</th></tr></thead>
                  <tbody>
                    {plan.bloques.map((b, i) => (
                      <tr key={i}>
                        <td><strong>{DIAS_LABEL[b.dia] || b.dia}</strong></td>
                        <td>{b.actividad}</td>
                        <td>{b.horas}hs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Asistente IA */}
          <div className="card">
            <h2>🤖 Asistente académico</h2>
            {!explicacion && (
              <button className="btn btn-outline" onClick={handleExplicar} disabled={loadingIA}>
                {loadingIA ? <><span className="spinner" style={{ borderTopColor: '#2563eb', borderColor: '#bfdbfe' }} /> Consultando...</> : '💬 Explicame esta recomendación'}
              </button>
            )}
            {explicacion && (
              <div>
                <div className="alert alert-info" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {explicacion}
                </div>
                <span className="text-muted" style={{ fontSize: '.75rem' }}>
                  Fuente: {fuenteIA === 'ollama' ? '🟢 Ollama (IA local)' : '🔵 Reglas del sistema'}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
