import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="page text-center">
      <div style={{ padding: '3rem 0' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📚</div>
        <h1>PlanifIA</h1>
        <h2 style={{ fontWeight: 400, color: '#6b7280', marginBottom: '1.5rem' }}>
          Planificador Académico Universitario
        </h2>
        <p style={{ maxWidth: '480px', margin: '0 auto 2rem', fontSize: '1rem', lineHeight: 1.7 }}>
          Cargá tu plan de estudios, indicá tus materias aprobadas y tu disponibilidad semanal.
          El sistema genera una recomendación personalizada de cursada para el próximo cuatrimestre.
        </p>
        <Link to="/perfil" className="btn btn-primary btn-lg">
          Comenzar →
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        {[
          { icon: '📄', titulo: 'Cargá tu plan', desc: 'Subí el Excel de tu carrera' },
          { icon: '✅', titulo: 'Marcá aprobadas', desc: 'Indicá tu historial académico' },
          { icon: '⏰', titulo: 'Tu disponibilidad', desc: 'Cuántas horas tenés por día' },
          { icon: '🎯', titulo: 'Recibí tu plan', desc: 'Recomendación inteligente' },
        ].map(({ icon, titulo, desc }) => (
          <div key={titulo} className="card text-center" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '1.75rem', marginBottom: '.5rem' }}>{icon}</div>
            <strong style={{ display: 'block', marginBottom: '.25rem' }}>{titulo}</strong>
            <span className="text-muted">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
