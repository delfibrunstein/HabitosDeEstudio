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

  const totalHorasCursada  = recomendadas.reduce((s, m) => s + Number(m.horas_cursada  || 0), 0);
  const totalHorasEstudio  = recomendadas.reduce((s, m) => s + Number(m.horas_estudio  || 0), 0);
  const totalHoras         = totalHorasCursada + totalHorasEstudio;

  // Bug #4 + #9 fix: usar estrategia_detalle si existe, sino estrategia (ya es legible)
  const etiquetaEstrategia = plan?.estrategia_detalle || plan?.estrategia || '—';

  return (
    <div className="page">
      <h1>Recomendación de cursada</h1>
      <p>El sistema analiza tus materias aprobadas, disponibilidad y objetivo para sugerirte el mejor cuatrimestre.</p>

      {/* Bug #10 fix: aviso de pasos incompletos */}
      {!plan && !loading && !error && (
        <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
          Asegurate de haber completado: <strong>Perfil → Plan de estudios → Materias → Disponibilidad</strong> antes de generar.
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
          {error.includes('disponibilidad') && (
            <div style={{ marginTop: '.5rem' }}>
              <button className="btn btn-outline" style={{ fontSize: '.8rem' }}
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
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Materias recomendadas', value: recomendadas.length,            color: '#16a34a' },
                { label: 'Cursada / semana',       value: `${totalHorasCursada.toFixed(1)}hs`, color: '#0369a1' },
                { label: 'Estudio / semana',        value: `${totalHorasEstudio.toFixed(1)}hs`,  color: '#7c3aed' },
                { label: 'Carga total / semana',    value: `${totalHoras.toFixed(1)}hs`,          color: '#b45309' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, minWidth: '110px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{value}</div>
                  <div className="text-muted" style={{ fontSize: '.8rem' }}>{label}</div>
                </div>
              ))}
            </div>
            {/* Bug #4 + #9 fix: estrategia legible */}
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
              <span className="text-muted" style={{ fontSize: '.8rem' }}>Estrategia aplicada: </span>
              <strong style={{ fontSize: '.9rem', color: '#7c3aed' }}>{etiquetaEstrategia}</strong>
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
                          <strong>{m.nombre}</strong>
                          <br /><span className="text-muted" style={{ fontSize: '.75rem' }}>{m.codigo}</span>
                        </td>
                        <td>
                          <span className={`badge ${DIFICULTAD_BADGE[m.dificultad] || 'badge-gris'}`}>
                            {m.dificultad}
                          </span>
                        </td>
                        <td>{Number(m.horas_cursada || 0).toFixed(1)}hs</td>
                        <td>{Number(m.horas_estudio || 0).toFixed(1)}hs</td>
                        <td>
                          <strong>
                            {(Number(m.horas_cursada || 0) + Number(m.horas_estudio || 0)).toFixed(1)}hs
                          </strong>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#eff6ff' }}>
                      <td colSpan={2}><strong>Total semanal</strong></td>
                      <td><strong>{totalHorasCursada.toFixed(1)}hs</strong></td>
                      <td><strong>{totalHorasEstudio.toFixed(1)}hs</strong></td>
                      <td><strong style={{ color: '#2563eb' }}>{totalHoras.toFixed(1)}hs</strong></td>
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
                  <span className="badge badge-rojo"
                    style={{ whiteSpace: 'nowrap', fontSize: '.72rem', maxWidth: '240px', textAlign: 'right' }}>
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
                  <h3 style={{ fontSize: '.95rem', color: '#0369a1', marginBottom: '.5rem' }}>
                    🏫 Carga de cursada (horarios según la facultad)
                  </h3>
                  <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
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
                  <h3 style={{ fontSize: '.95rem', color: '#7c3aed', marginBottom: '.5rem' }}>
                    📚 Estudio autónomo sugerido
                  </h3>
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
                  ? <><span className="spinner" style={{ borderTopColor: '#2563eb', borderColor: '#bfdbfe' }} /> Consultando...</>
                  : '💬 Explicame esta recomendación'}
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
