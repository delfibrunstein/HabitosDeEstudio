import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ estudianteId }) {
  const loc = useLocation();
  const getLinkClass = (path) => `navbar-link ${loc.pathname === path ? 'active' : ''}`;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">📚 PlanifIA</Link>
      <div className="navbar-links-container">
        {estudianteId && (
          <>
            <Link to="/plan"           className={getLinkClass('/plan')}>Plan</Link>
            <Link to="/materias"       className={getLinkClass('/materias')}>Materias</Link>
            <Link to="/disponibilidad" className={getLinkClass('/disponibilidad')}>Disponibilidad</Link>
            <Link to="/resultado"      className={getLinkClass('/resultado')}>Resultado</Link>
          </>
        )}
        <Link to="/perfil" className="navbar-user">
          {estudianteId ? `#${estudianteId}` : 'Ingresar'}
        </Link>
      </div>
    </nav>
  );
}
