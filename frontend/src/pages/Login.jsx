import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginEstudiante } from '../services/api';

export default function Login({ onLogin }) {
  const nav = useNavigate();
  const [modo, setModo]       = useState('legajo');   // 'legajo' | 'email'
  const [legajo,   setLegajo]  = useState('');
  const [email,    setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]   = useState('');
  const [loading,  setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) return setError('Ingresá tu contraseña.');
    if (modo === 'legajo' && !legajo.trim()) return setError('Ingresá tu legajo.');
    if (modo === 'email'  && !email.trim())  return setError('Ingresá tu email.');

    setLoading(true);
    try {
      const payload = modo === 'legajo'
        ? { legajo: legajo.trim().toUpperCase(), password: password.trim() }
        : { email: email.trim().toLowerCase(), password: password.trim() };

      const { estudiante, token } = await loginEstudiante(payload);
      localStorage.setItem('authToken', token);
      onLogin(estudiante.id);
      nav('/plan');
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesión.';
      setError(msg === 'Credenciales incorrectas.'
        ? 'Legajo/email o contraseña incorrectos. ¿Ya te registraste?'
        : msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="page login-wrap">
      <div className="login-header">
        <span style={{ fontSize: '40px', display: 'block', marginBottom: '14px' }}>👋</span>
        <h1>Bienvenido de nuevo</h1>
        <p style={{ marginBottom: 0 }}>Ingresá tus credenciales para continuar</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Toggle legajo / email */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          className={`btn ${modo === 'legajo' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
          onClick={() => setModo('legajo')}
        >
          Ingresar con legajo
        </button>
        <button
          type="button"
          className={`btn ${modo === 'email' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ flex: 1 }}
          onClick={() => setModo('email')}
        >
          Ingresar con email
        </button>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {modo === 'legajo' ? (
            <div className="form-group">
              <label>Legajo</label>
              <input
                value={legajo}
                onChange={e => setLegajo(e.target.value)}
                placeholder="Ej: SIS001"
                autoFocus
                autoComplete="username"
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="juan@email.com"
                autoFocus
                autoComplete="email"
              />
            </div>
          )}

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Tu contraseña (por defecto: tu legajo)"
              autoComplete="current-password"
            />
            <small style={{ color: 'var(--text-muted, #888)', marginTop: '4px', display: 'block' }}>
              Si es tu primer ingreso, la contraseña es tu legajo en mayúsculas.
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', height: '44px' }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Verificando...</> : 'Iniciar sesión →'}
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
