import { Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Navbar    from './components/Navbar';
import Home      from './pages/Home';
import Perfil    from './pages/Perfil';
import PlanExcel from './pages/PlanExcel';
import Materias  from './pages/Materias';
import Disponibilidad from './pages/Disponibilidad';
import Resultado from './pages/Resultado';

export default function App() {
  // Estado global mínimo: id del estudiante activo
  const [estudianteId, setEstudianteId] = useState(
    () => Number(localStorage.getItem('estudianteId')) || null
  );

  const handleLogin = (id) => {
    setEstudianteId(id);
    localStorage.setItem('estudianteId', id);
  };

  return (
    <>
      <Navbar estudianteId={estudianteId} />
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/perfil"       element={<Perfil onLogin={handleLogin} estudianteId={estudianteId} />} />
        <Route path="/plan"         element={estudianteId ? <PlanExcel estudianteId={estudianteId} /> : <Navigate to="/perfil" />} />
        <Route path="/materias"     element={estudianteId ? <Materias  estudianteId={estudianteId} /> : <Navigate to="/perfil" />} />
        <Route path="/disponibilidad" element={estudianteId ? <Disponibilidad estudianteId={estudianteId} /> : <Navigate to="/perfil" />} />
        <Route path="/resultado"    element={estudianteId ? <Resultado estudianteId={estudianteId} /> : <Navigate to="/perfil" />} />
        <Route path="*"             element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
