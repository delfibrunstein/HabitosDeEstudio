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
    <div className="page login-wrap">
      <div className="login-header">
        <span style={{ fontSize: '40px', display: 'block', marginBottom: '14px' }}>👋</span>
        <h1>Bienvenido de nuevo</h1>
        <p style={{ marginBottom: 0 }}>Ingresá tu legajo para continuar</p>
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
          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px' }} disabled={loading}>
            {loading ? <><span className="spinner" /> Buscando...</> : 'Iniciar sesión →'}
          </button>
        </form>
      </div>

      <p className="login-footer">
        ¿No tenés cuenta?{' '}
        <Link to="/perfil">Registrate acá</Link>
      </p>
    </div>
  );
}
