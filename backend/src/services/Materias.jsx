import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMateriasEstudiante, guardarMateriasEstudiante } from '../services/api';

const ESTADOS = [
  { value: '',             label: 'Sin estado' },
  { value: 'APROBADA',     label: '✅ Aprobada' },
  { value: 'REGULARIZADA', label: '📝 Regularizada' },
  { value: 'EN_CURSO',     label: '📖 En curso' },
  { value: 'RECURSADA',    label: '🔁 Recursada' },
];

export default function Materias({ estudianteId }) {
  const nav = useNavigate();
  const [materias,  setMaterias]  = useState([]);
  const [estados,   setEstados]   = useState({});
  const [notas,     setNotas]     = useState({});
  const [loading,   setLoading]   = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [exito,     setExito]     = useState('');
  const [error,     setError]     = useState('');

  useEffect(() => {
    getMateriasEstudiante(estudianteId).then(ms => {
      setMaterias(ms);
      const e = {}, n = {};
      ms.forEach(m => {
        e[m.id] = m.estado || '';
        n[m.id] = m.nota   || '';
      });
      setEstados(e); setNotas(n);
    }).catch(() => setError('No se pudieron cargar las materias.'))
      .finally(() => setLoading(false));
  }, [estudianteId]);

  const handleGuardar = async () => {
    setGuardando(true); setError(''); setExito('');
    try {
      const materiasFiltradas = Object.entries(estados)
        .filter(([, v]) => v !== '')
        .map(([materiaId, estado]) => ({
          materiaId: Number(materiaId),
          estado,
          nota: notas[materiaId] ? Number(notas[materiaId]) : null
        }));
      await guardarMateriasEstudiante(estudianteId, materiasFiltradas);
      setExito('Historial guardado correctamente.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar.');
    } finally { setGuardando(false); }
  };

  // Bug #11 fix: construir mapa de nombre por id para mostrar correlativas
  const materiasMap = Object.fromEntries(materias.map(m => [m.id, m]));

  const getNombreCorrelativa = (id) => materiasMap[id]?.nombre || `ID ${id}`;

  // Determinar si una materia está habilitada (todas sus correlativas aprobadas o regularizadas)
  const estaHabilitada = (m) => {
    if (!m.correlativas_ids) return true;
    const ids = typeof m.correlativas_ids === 'string'
      ? m.correlativas_ids.split(',').map(Number).filter(Boolean)
      : m.correlativas_ids;
    if (ids.length === 0) return true;
    return ids.every(cId => {
      const estado = estados[cId];
      return estado === 'APROBADA' || estado === 'REGULARIZADA';
    });
  };

  const getCorrelativasIds = (m) => {
    if (!m.correlativas_ids) return [];
    if (typeof m.correlativas_ids === 'string')
      return m.correlativas_ids.split(',').map(Number).filter(Boolean);
    return m.correlativas_ids;
  };

  const porAnio = materias.reduce((acc, m) => {
    const key = `Año ${m.anio} — Cuatrimestre ${m.cuatrimestre}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  if (loading) return <div className="page"><p>Cargando materias...</p></div>;

  return (
    <div className="page">
      <h1>Historial académico</h1>
      <p>Marcá el estado de cada materia. Las correlativas necesarias se muestran debajo de cada una.</p>

      {error && <div className="alert alert-error">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      {Object.entries(porAnio).map(([titulo, mats]) => (
        <div className="card" key={titulo}>
          <h2>{titulo}</h2>
          {mats.map(m => {
            const correlativasIds = getCorrelativasIds(m);
            const habilitada      = estaHabilitada(m);
            const estadoActual    = estados[m.id] || '';

            return (
              <div key={m.id} style={{
                padding: '.6rem 0',
                borderBottom: '1px solid #f3f4f6',
                opacity: !habilitada && estadoActual === '' ? 0.6 : 1
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: '.75rem', alignItems: 'start'
                }}>
                  {/* Info de la materia */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '.9rem' }}>{m.nombre}</strong>
                      {!habilitada && estadoActual === '' && (
                        <span className="badge badge-gris" style={{ fontSize: '.7rem' }}>
                          🔒 bloqueada
                        </span>
                      )}
                      {estadoActual === 'EN_CURSO' && (
                        <span className="badge badge-azul" style={{ fontSize: '.7rem' }}>
                          cursando
                        </span>
                      )}
                    </div>
                    <div className="text-muted" style={{ fontSize: '.75rem' }}>
                      {m.codigo} · {m.horas_semanales}hs/sem · {m.dificultad}
                      {m.promocionable ? ' · promocionable' : ''}
                    </div>

                    {/* Bug #11 fix: mostrar correlativas con su estado */}
                    {correlativasIds.length > 0 && (
                      <div style={{ marginTop: '.3rem', display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '.72rem', color: '#6b7280' }}>Requiere:</span>
                        {correlativasIds.map(cId => {
                          const eCorr = estados[cId];
                          const aprobada = eCorr === 'APROBADA' || eCorr === 'REGULARIZADA';
                          return (
                            <span key={cId} className={`badge ${aprobada ? 'badge-verde' : 'badge-rojo'}`}
                              style={{ fontSize: '.7rem' }}>
                              {aprobada ? '✓' : '✗'} {getNombreCorrelativa(cId)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selector de estado */}
                  <select
                    value={estadoActual}
                    onChange={e => setEstados(prev => ({ ...prev, [m.id]: e.target.value }))}
                    style={{ fontSize: '.8rem', padding: '.3rem .5rem' }}
                  >
                    {ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>

                  {/* Nota (solo si aprobada) */}
                  {estadoActual === 'APROBADA' ? (
                    <input
                      type="number" min="1" max="10" placeholder="Nota"
                      value={notas[m.id] || ''}
                      onChange={e => setNotas(prev => ({ ...prev, [m.id]: e.target.value }))}
                      style={{ width: '70px', fontSize: '.8rem', padding: '.3rem .5rem' }}
                    />
                  ) : (
                    <div style={{ width: '70px' }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
          {guardando ? <><span className="spinner" /> Guardando...</> : 'Guardar historial'}
        </button>
        <button className="btn btn-outline" onClick={() => nav('/disponibilidad')}>
          Continuar →
        </button>
      </div>
    </div>
  );
}
