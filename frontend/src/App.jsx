import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar         from './components/Navbar';
import Home           from './pages/Home';
import Login          from './pages/Login';
import Perfil         from './pages/Perfil';
import PlanExcel      from './pages/PlanExcel';
import Materias       from './pages/Materias';
import Disponibilidad from './pages/Disponibilidad';
import Resultado      from './pages/Resultado';
import { getEstudiante } from './services/api';

export default function App() {
  const [estudianteId, setEstudianteId] = useState(
    () => Number(localStorage.getItem('estudianteId')) || null
  );

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Valida que el estudiante del storage siga existiendo
  useEffect(() => {
    if (estudianteId) {
      getEstudiante(estudianteId).catch(() => {
        localStorage.removeItem('estudianteId');
        localStorage.removeItem('authToken');
        setEstudianteId(null);
      });
    }
  }, []);

  const handleLogin = (id) => {
    setEstudianteId(id);
    localStorage.setItem('estudianteId', id);
    // authToken ya lo guarda Login/Perfil antes de llamar a onLogin
  };

  const handleLogout = () => {
    localStorage.removeItem('estudianteId');
    localStorage.removeItem('authToken');
    setEstudianteId(null);
  };

  return (
    <>
      <Navbar estudianteId={estudianteId} theme={theme} setTheme={setTheme} onLogout={handleLogout} />
      <Routes>
        <Route path="/"      element={<Home estudianteId={estudianteId} />} />
        <Route path="/login" element={
          estudianteId ? <Navigate to="/plan" /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/perfil" element={
          <Perfil onLogin={handleLogin} estudianteId={estudianteId} />
        } />
        <Route path="/plan"           element={estudianteId ? <PlanExcel      estudianteId={estudianteId} /> : <Navigate to="/login" />} />
        <Route path="/materias"       element={estudianteId ? <Materias       estudianteId={estudianteId} /> : <Navigate to="/login" />} />
        <Route path="/disponibilidad" element={estudianteId ? <Disponibilidad estudianteId={estudianteId} /> : <Navigate to="/login" />} />
        <Route path="/resultado"      element={estudianteId ? <Resultado      estudianteId={estudianteId} /> : <Navigate to="/login" />} />
        <Route path="*"               element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
