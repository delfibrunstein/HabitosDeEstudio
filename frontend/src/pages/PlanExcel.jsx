import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subirExcel, getMateriasPorCarrera, getEstudiante } from '../services/api';

export default function PlanExcel({ estudianteId }) {
  const nav = useNavigate();
  const [archivo,    setArchivo]    = useState(null);
  const [carreraId,  setCarreraId]  = useState(null);
  const [materias,   setMaterias]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [exito,      setExito]      = useState('');

  useEffect(() => {
    getEstudiante(estudianteId).then(e => {
      setCarreraId(e.carrera_id);
      if (e.carrera_id) {
        getMateriasPorCarrera(e.carrera_id).then(setMaterias).catch(() => {});
      }
    }).catch(() => {});
  }, [estudianteId]);

  const handleUpload = async () => {
    if (!archivo) return setError('Seleccioná un archivo Excel.');
    if (!carreraId) return setError('No se encontró la carrera del estudiante.');
    setError(''); setExito(''); setLoading(true);
    try {
      const res = await subirExcel(archivo, carreraId);
      setExito(res.mensaje);
      getMateriasPorCarrera(carreraId).then(setMaterias);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar el archivo.');
    } finally { setLoading(false); }
  };

  const DIFICULTAD_BADGE = { BAJA:'badge-verde', MEDIA:'badge-azul', ALTA:'badge-naranja', CRITICA:'badge-rojo' };

  return (
    <div className="page">
      <h1>Plan de estudios</h1>
      <p>Subí el Excel de tu carrera o continuá si ya tenés materias cargadas.</p>

      {error && <div className="alert alert-error">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      <div className="card">
        <h2>Cargar archivo Excel</h2>
        <p className="text-muted" style={{ marginBottom: '1rem' }}>
          El archivo debe tener las columnas: Codigo, Materia, Anio, Cuatrimestre,
          HorasSemanales, Correlativas, Dificultad, Promocionable.
        </p>
        <div className="form-group">
          <input type="file" accept=".xlsx,.xls"
            onChange={e => setArchivo(e.target.files[0])} />
        </div>
        <button className="btn btn-primary" onClick={handleUpload} disabled={loading || !archivo}>
          {loading ? <><span className="spinner" /> Procesando...</> : 'Subir Excel'}
        </button>
      </div>

      {materias.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-1">
            <h2 style={{ margin: 0 }}>Materias detectadas ({materias.length})</h2>
            <button className="btn btn-outline" onClick={() => nav('/materias')}>
              Continuar →
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th><th>Materia</th><th>Año</th>
                  <th>Cuatri</th><th>Hs/sem</th><th>Dificultad</th>
                </tr>
              </thead>
              <tbody>
                {materias.map(m => (
                  <tr key={m.id}>
                    <td><code>{m.codigo}</code></td>
                    <td>{m.nombre}</td>
                    <td>{m.anio}</td>
                    <td>{m.cuatrimestre}</td>
                    <td>{m.horas_semanales}hs</td>
                    <td><span className={`badge ${DIFICULTAD_BADGE[m.dificultad] || 'badge-gris'}`}>{m.dificultad}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {materias.length === 0 && (
        <div className="alert alert-info">
          No hay materias cargadas aún. Subí un Excel o pedile al docente el archivo del plan de estudios.
        </div>
      )}
    </div>
  );
}
