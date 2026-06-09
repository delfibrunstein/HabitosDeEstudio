import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '📄', titulo: 'Cargá tu plan',    desc: 'Subí el Excel de tu carrera' },
  { icon: '✅', titulo: 'Marcá aprobadas',  desc: 'Indicá tu historial académico' },
  { icon: '⏰', titulo: 'Tu disponibilidad',desc: 'Cuántas horas tenés por día' },
  { icon: '🎯', titulo: 'Recibí tu plan',   desc: 'Recomendación inteligente' },
];

export default function Home({ estudianteId }) {
  return (
    <div className="page">
      <div className="hero">
        <span className="hero-icon">📚</span>
        <h1>PlanifIA</h1>
        <p style={{ fontSize: '16px', maxWidth: '460px', margin: '10px auto 0', lineHeight: 1.7 }}>
          Cargá tu plan de estudios, indicá tus materias aprobadas y tu disponibilidad semanal.
          El sistema genera una recomendación personalizada de cursada para el próximo cuatrimestre.
        </p>

        <div className="hero-ctas">
          {estudianteId ? (
            <Link to="/resultado" className="btn btn-primary btn-lg">
              Ir a mi planificación →
            </Link>
          ) : (
            <>
              <Link to="/login"  className="btn btn-primary btn-lg">Iniciar sesión</Link>
              <Link to="/perfil" className="btn btn-outline btn-lg">Registrarse</Link>
            </>
          )}
        </div>
      </div>

      <div className="feature-grid">
        {FEATURES.map(({ icon, titulo, desc }) => (
          <div key={titulo} className="feature-card">
            <span className="feature-icon">{icon}</span>
            <div className="feature-title">{titulo}</div>
            <div className="feature-desc">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
