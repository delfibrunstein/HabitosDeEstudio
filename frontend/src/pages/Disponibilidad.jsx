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

  if (loading) return (
    <div className="page">
      <div className="skeleton" style={{ height: '32px', width: '240px', marginBottom: '8px' }} />
      <div className="skeleton" style={{ height: '18px', width: '400px', marginBottom: '28px' }} />
      <div className="card skeleton" style={{ height: '320px', border: 'none' }} />
    </div>
  );

  return (
    <div className="page">
      <h1>Disponibilidad semanal</h1>
      <p>Indicá cuántas horas libres tenés por día para estudiar (sin contar trabajo ni transporte).</p>

      {error && <div className="alert alert-error">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      <div className="card">
        {DIAS.map(dia => (
          <div key={dia} className="avail-row">
            <span className="avail-label">{LABEL[dia]}</span>
            <input
              type="range" min="0" max="12" step=".5"
              value={horas[dia]}
              onChange={e => setHoras(prev => ({ ...prev, [dia]: e.target.value }))}
              style={{ 
                flex: 1,
                background: `linear-gradient(to right, 
                  var(--primary) ${(horas[dia] / 12) * 100}%, 
                  var(--border-soft) ${(horas[dia] / 12) * 100}%
                )`
              }}
            />
            <span className={`avail-value ${Number(horas[dia]) === 0 ? 'zero' : ''}`}>
              {Number(horas[dia]).toFixed(1)}hs
            </span>
          </div>
        ))}

        <div className="total-box">
          <strong>Total semanal disponible</strong>
          <span className="total-num">{total.toFixed(1)} hs</span>
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
