import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDisponibilidad, guardarDisponibilidad } from '../services/api';

const DIAS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];
const LABEL = { LUNES:'Lunes', MARTES:'Martes', MIERCOLES:'Miércoles',
                JUEVES:'Jueves', VIERNES:'Viernes', SABADO:'Sábado', DOMINGO:'Domingo' };

export default function Disponibilidad({ estudianteId }) {
  const nav = useNavigate();
  const [horas,    setHoras]    = useState(() => Object.fromEntries(DIAS.map(d => [d, 0])));
  const [loading,  setLoading]  = useState(false);
  const [guardando,setGuardando]= useState(false);
  const [exito,    setExito]    = useState('');
  const [error,    setError]    = useState('');

  useEffect(() => {
    setLoading(true);
    getDisponibilidad(estudianteId)
      .then(disp => {
        if (disp?.length) {
          const map = {};
          disp.forEach(d => { map[d.dia] = d.horas_disponibles; });
          setHoras(prev => ({ ...prev, ...map }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [estudianteId]);

  const total = Object.values(horas).reduce((s, v) => s + Number(v), 0);

  const handleGuardar = async () => {
    setGuardando(true); setError(''); setExito('');
    try {
      const disponibilidad = DIAS.map(dia => ({
        dia,
        horasDisponibles: Number(horas[dia]) || 0
      }));
      await guardarDisponibilidad(estudianteId, disponibilidad);
      setExito('Disponibilidad guardada.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar.');
    } finally { setGuardando(false); }
  };

  if (loading) return <div className="page"><p>Cargando...</p></div>;

  return (
    <div className="page">
      <h1>Disponibilidad semanal</h1>
      <p>Indicá cuántas horas libres tenés por día para estudiar (sin contar trabajo ni transporte).</p>

      {error && <div className="alert alert-error">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      <div className="card">
        {DIAS.map(dia => (
          <div key={dia} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '.6rem 0', borderBottom: '1px solid #f3f4f6'
          }}>
            <label style={{ fontWeight: 500, minWidth: '100px' }}>{LABEL[dia]}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
              <input
                type="range" min="0" max="12" step=".5"
                value={horas[dia]}
                onChange={e => setHoras(prev => ({ ...prev, [dia]: e.target.value }))}
                style={{ width: '160px', accentColor: '#2563eb' }}
              />
              <span style={{
                minWidth: '50px', textAlign: 'right',
                fontWeight: 600, color: Number(horas[dia]) === 0 ? '#9ca3af' : '#2563eb'
              }}>
                {Number(horas[dia]).toFixed(1)}hs
              </span>
            </div>
          </div>
        ))}

        <div style={{
          marginTop: '1rem', padding: '.75rem 1rem',
          background: '#eff6ff', borderRadius: '8px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <strong>Total semanal disponible</strong>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb' }}>
            {total.toFixed(1)} horas
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={handleGuardar} disabled={guardando}>
          {guardando ? <><span className="spinner" /> Guardando...</> : 'Guardar disponibilidad'}
        </button>
        <button className="btn btn-outline" onClick={() => nav('/resultado')}>
          Ver recomendación →
        </button>
      </div>
    </div>
  );
}
