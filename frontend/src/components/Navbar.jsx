import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ estudianteId, theme, setTheme }) {
  const loc = useLocation();
  const getLinkClass = (path) => `navbar-link ${loc.pathname === path ? 'active' : ''}`;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span style={{ fontSize: '18px' }}>📚</span> PlanifIA
      </Link>
      <div className="navbar-links-container">
        {estudianteId && (
          <>
            <Link to="/plan"           className={getLinkClass('/plan')}>Plan</Link>
            <Link to="/materias"       className={getLinkClass('/materias')}>Materias</Link>
            <Link to="/disponibilidad" className={getLinkClass('/disponibilidad')}>Disponibilidad</Link>
            <Link to="/resultado"      className={getLinkClass('/resultado')}>Resultado</Link>
          </>
        )}
        <div className="theme-switch-wrapper">
          <span className="theme-icon">☀</span>
          <button className={`theme-switch ${theme === 'dark' ? 'dark' : ''}`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Cambiar tema">
            <span className="theme-switch-thumb"></span>
          </button>
          <span className="theme-icon">☾</span>
        </div>
        <Link to="/perfil" className="navbar-user">
          {estudianteId ? `#${estudianteId}` : 'Ingresar'}
        </Link>
      </div>
    </nav>
  );
}
