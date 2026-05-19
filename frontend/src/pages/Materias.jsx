import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMateriasEstudiante, guardarMateriasEstudiante } from '../services/api';

const ESTADOS = [
  { value: '',             label: 'Sin estado' },
  { value: 'APROBADA',     label: '✅ Aprobada' },
  { value: 'REGULARIZADA', label: '📝 Regularizada' },
  { value: 'RECURSADA',    label: '🔁 Recursada' },
  { value: 'EN_CURSO',     label: '📖 En curso' },
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

  const porAnio = materias.reduce((acc, m) => {
    const key = `Año ${m.anio} - Cuatrimestre ${m.cuatrimestre}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  if (loading) return <div className="page"><p>Cargando materias...</p></div>;

  return (
    <div className="page">
      <h1>Historial académico</h1>
      <p>Marcá el estado de cada materia. Solo podés cursar materias con correlativas aprobadas.</p>

      {error && <div className="alert alert-error">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      {Object.entries(porAnio).map(([titulo, mats]) => (
        <div className="card" key={titulo}>
          <h2>{titulo}</h2>
          {mats.map(m => (
            <div key={m.id} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              gap: '.75rem', alignItems: 'center',
              padding: '.5rem 0', borderBottom: '1px solid #f3f4f6'
            }}>
              <div>
                <strong style={{ fontSize: '.9rem' }}>{m.nombre}</strong>
                <div className="text-muted" style={{ fontSize: '.75rem' }}>
                  {m.codigo} · {m.horas_semanales}hs/sem · {m.dificultad}
                </div>
              </div>
              <select
                value={estados[m.id] || ''}
                onChange={e => setEstados(prev => ({ ...prev, [m.id]: e.target.value }))}
                style={{ fontSize: '.8rem', padding: '.3rem .5rem' }}
              >
                {ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {estados[m.id] === 'APROBADA' && (
                <input
                  type="number" min="1" max="10" placeholder="Nota"
                  value={notas[m.id] || ''}
                  onChange={e => setNotas(prev => ({ ...prev, [m.id]: e.target.value }))}
                  style={{ width: '70px', fontSize: '.8rem', padding: '.3rem .5rem' }}
                />
              )}
            </div>
          ))}
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
