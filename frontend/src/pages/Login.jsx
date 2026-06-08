import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginPorLegajo } from '../services/api';

export default function Login({ onLogin }) {
  const nav = useNavigate();
  const [legajo,  setLegajo]  = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!legajo.trim()) return setError('Ingresá tu legajo.');
    setLoading(true); setError('');
    try {
      const estudiante = await loginPorLegajo(legajo.trim().toUpperCase());
      onLogin(estudiante.id);
      nav('/plan');
    } catch {
      setError('No se encontró ningún estudiante con ese legajo. ¿Ya te registraste?');
    } finally { setLoading(false); }
  };

  return (
    <div className="page" style={{ maxWidth: '420px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: '2rem 0 1.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>👋</div>
        <h1 style={{ marginBottom: '.25rem' }}>Bienvenido de nuevo</h1>
        <p className="text-muted">Ingresá tu legajo para continuar</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Legajo</label>
            <input
              value={legajo}
              onChange={e => setLegajo(e.target.value)}
              placeholder="Ej: SIS001"
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><span className="spinner" /> Buscando...</> : 'Iniciar sesión →'}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '.9rem', color: '#6b7280' }}>
        ¿No tenés cuenta?{' '}
        <Link to="/perfil" style={{ color: '#2563eb', fontWeight: 600 }}>
          Registrate acá
        </Link>
      </p>
    </div>
  );
}
