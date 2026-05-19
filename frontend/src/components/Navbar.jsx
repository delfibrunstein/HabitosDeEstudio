import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ estudianteId }) {
  const loc = useLocation();
  const active = (path) => loc.pathname === path ? { fontWeight: 700, color: '#fff' } : {};

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">📚 PlanifIA</Link>
      {estudianteId && (
        <div className="navbar-links">
          <Link to="/plan"          style={active('/plan')}>Plan</Link>
          <Link to="/materias"      style={active('/materias')}>Materias</Link>
          <Link to="/disponibilidad" style={active('/disponibilidad')}>Disponibilidad</Link>
          <Link to="/resultado"     style={active('/resultado')}>Resultado</Link>
        </div>
      )}
      <Link to="/perfil" className="navbar-links" style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.75)' }}>
        {estudianteId ? `#${estudianteId}` : 'Ingresar'}
      </Link>
    </nav>
  );
}
