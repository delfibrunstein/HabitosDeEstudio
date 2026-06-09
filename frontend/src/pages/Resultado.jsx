import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generarRecomendacion, explicarIA } from '../services/api';

const DIFICULTAD_BADGE = {
  BAJA: 'badge-verde', MEDIA: 'badge-azul',
  ALTA: 'badge-naranja', CRITICA: 'badge-rojo'
};
const DIAS_LABEL = {
  LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié',
  JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb', DOMINGO: 'Dom'
};

export default function Resultado({ estudianteId }) {
  const nav = useNavigate();
  const [plan,        setPlan]        = useState(null);
  const [explicacion, setExplicacion] = useState('');
  const [fuenteIA,    setFuenteIA]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [loadingIA,   setLoadingIA]   = useState(false);
  const [error,       setError]       = useState('');

  const handleGenerar = async () => {
    setLoading(true); setError(''); setPlan(null); setExplicacion('');
    try {
      const p = await generarRecomendacion(estudianteId);
      setPlan(p);
    } catch (err) {
      // Bug #10 fix: el error del backend ahora es descriptivo; mostrarlo directo
      setError(err.response?.data?.error || 'Error al generar la recomendación.');
    } finally { setLoading(false); }
  };

  const handleExplicar = async () => {
    if (!plan) return;
    setLoadingIA(true);
    try {
      const res = await explicarIA(plan.id);
      // ia.controller devuelve { ok, explicacion: { fuente, texto } }
      setExplicacion(res.explicacion?.texto || res.texto || '');
      setFuenteIA(res.explicacion?.fuente || res.fuente || 'reglas');
    } catch {
      setExplicacion(plan.explicacion_ia || 'No hay explicación disponible.');
      setFuenteIA('reglas');
    } finally { setLoadingIA(false); }
  };

  const recomendadas   = plan?.materias?.filter(m => m.recomendada)  || [];
  const noRecomendadas = plan?.materias?.filter(m => !m.recomendada) || [];

  // Bug #3 fix: separar bloques de cursada vs estudio en el plan semanal
  const bloquesCursada = plan?.bloques?.filter(b => b.actividad?.startsWith('Cursada:')) || [];
  const bloquesEstudio = plan?.bloques?.filter(b => b.actividad?.startsWith('Estudio:'))  || [];

  const totalHorasCursada = recomendadas.reduce((s, m) => s + Number(m.horas_cursada  || 0), 0);
  const totalHorasEstudio = recomendadas.reduce((s, m) => s + Number(m.horas_estudio  || 0), 0);
  const totalHoras        = totalHorasCursada + totalHorasEstudio;

  // Bug #4 + #9 fix: usar estrategia_detalle si existe, sino estrategia (ya es legible)
  const etiquetaEstrategia = plan?.estrategia_detalle || plan?.estrategia || '—';

  return (
    <div className="page">
      <h1>Recomendación de cursada</h1>
      <p>El sistema analiza tus materias aprobadas, disponibilidad y objetivo para sugerirte el mejor cuatrimestre.</p>

      {/* Bug #10 fix: aviso de pasos incompletos */}
      {!plan && !loading && !error && (
        <div className="alert alert-info">
          Asegurate de haber completado: <strong>Perfil → Plan de estudios → Materias → Disponibilidad</strong> antes de generar.
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
          {error.includes('disponibilidad') && (
            <div style={{ marginTop: '10px' }}>
              <button className="btn btn-outline" style={{ fontSize: '13px', height: '34px' }}
                onClick={() => nav('/disponibilidad')}>
                Ir a configurar disponibilidad →
              </button>
            </div>
          )}
        </div>
      )}

      <button className="btn btn-primary btn-lg" onClick={handleGenerar} disabled={loading}>
        {loading ? <><span className="spinner" /> Generando...</> : '🎯 Generar recomendación'}
      </button>

      {plan && (
        <>
          {/* Resumen */}
          <div className="card mt-3">
            <div className="stat-grid">
              {[
                { label: 'Recomendadas',      value: recomendadas.length,                color: 'var(--success)' },
                { label: 'Cursada / semana',  value: `${totalHorasCursada.toFixed(1)}hs`, color: 'var(--info)' },
                { label: 'Estudio / semana',  value: `${totalHorasEstudio.toFixed(1)}hs`, color: '#7C3AED' },
                { label: 'Carga total',       value: `${totalHoras.toFixed(1)}hs`,        color: 'var(--warning)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="stat-cell">
                  <div className="stat-value" style={{ color }}>{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Bug #4 + #9 fix: estrategia legible */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
              <span className="text-faint">Estrategia:</span>
              <span className="badge badge-azul" style={{ fontSize: '12px' }}>{etiquetaEstrategia}</span>
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
                        <td>
                          <div style={{ fontWeight: 560, fontSize: '13.5px' }}>{m.nombre}</div>
                          <div className="text-faint">{m.codigo}</div>
                        </td>
                        <td>
                          <span className={`badge ${DIFICULTAD_BADGE[m.dificultad] || 'badge-gris'}`}>
                            {m.dificultad}
                          </span>
                        </td>
                        <td>{Number(m.horas_cursada || 0).toFixed(1)}hs</td>
                        <td>{Number(m.horas_estudio || 0).toFixed(1)}hs</td>
                        <td style={{ fontWeight: 600 }}>
                          {(Number(m.horas_cursada || 0) + Number(m.horas_estudio || 0)).toFixed(1)}hs
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--primary-light)' }}>
                      <td colSpan={2} style={{ fontWeight: 600 }}>Total semanal</td>
                      <td style={{ fontWeight: 600 }}>{totalHorasCursada.toFixed(1)}hs</td>
                      <td style={{ fontWeight: 600 }}>{totalHorasEstudio.toFixed(1)}hs</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{totalHoras.toFixed(1)}hs</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {recomendadas.length === 0 && (
            <div className="alert alert-info">
              No hay materias recomendables con tu perfil y disponibilidad actuales.
              Revisá que tengas materias aprobadas y disponibilidad horaria cargada.
            </div>
          )}

          {/* No recomendadas */}
          {noRecomendadas.length > 0 && (
            <div className="card">
              <h2>Materias no recomendadas</h2>
              {noRecomendadas.map(m => (
                <div key={m.materia_id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '10px 0', borderBottom: '1px solid var(--border-soft)', gap: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 550 }}>{m.nombre}</div>
                    <div className="text-faint">{m.codigo}</div>
                  </div>
                  <span className="badge badge-rojo" style={{ flexShrink: 0, maxWidth: '220px', textAlign: 'right', whiteSpace: 'normal', lineHeight: 1.4 }}>
                    {m.motivo_rechazo}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Plan semanal — Bug #3 fix: cursada y estudio separados */}
          {(bloquesCursada.length > 0 || bloquesEstudio.length > 0) && (
            <div className="card">
              <h2>📅 Plan semanal sugerido</h2>

              {bloquesCursada.length > 0 && (
                <>
                  <h3 style={{ color: 'var(--info)' }}>Carga de cursada</h3>
                  <div className="table-wrap" style={{ marginBottom: '20px' }}>
                    <table>
                      <thead><tr><th>Materia</th><th>Hs/semana</th></tr></thead>
                      <tbody>
                        {bloquesCursada.map((b, i) => (
                          <tr key={i}>
                            <td>{b.actividad.replace('Cursada: ', '').replace(/ \(.*\)$/, '')}</td>
                            <td>{b.horas}hs</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {bloquesEstudio.length > 0 && (
                <>
                  <h3 style={{ color: '#7C3AED' }}>Estudio autónomo sugerido</h3>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Día</th><th>Actividad</th><th>Horas</th></tr></thead>
                      <tbody>
                        {bloquesEstudio.map((b, i) => (
                          <tr key={i}>
                            <td><strong>{DIAS_LABEL[b.dia] || b.dia}</strong></td>
                            <td>{b.actividad}</td>
                            <td>{b.horas}hs</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Asistente IA */}
          <div className="card">
            <h2>🤖 Asistente académico</h2>
            {!explicacion && (
              <button className="btn btn-outline" onClick={handleExplicar} disabled={loadingIA}>
                {loadingIA
                  ? <><span className="spinner" style={{ borderTopColor: 'var(--primary)', borderColor: 'var(--primary-light)' }} /> Consultando...</>
                  : '💬 Explicame esta recomendación'}
              </button>
            )}
            {explicacion && (
              <div>
                <div className="alert alert-info" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {explicacion}
                </div>
                <span className="text-faint">
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
