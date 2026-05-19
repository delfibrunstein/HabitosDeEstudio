# PlanifIA — Planificador Académico Universitario

TPO — Materia: Proceso de Desarrollo

---

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior
- (Opcional) Ollama instalado localmente

---

## Instalación

### 1. Clonar y preparar

```bash
git clone <repo>
cd planificador-academico
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:init      # Crea la base de datos SQLite
npm run db:seed      # Carga datos de prueba (carrera UTN + 15 materias + estudiante demo)
npm run dev          # Inicia el servidor en http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev          # Inicia en http://localhost:5173
```

---

## Variables de entorno (backend/.env)

```env
PORT=3001
DATABASE_PATH=./src/database/planificador.db
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
NODE_ENV=development
```

---

## Estructura del proyecto

```
planificador-academico/
  backend/
    src/
      controllers/        # Lógica HTTP de cada recurso
      routes/             # Definición de endpoints Express
      services/           # Lógica de negocio (Excel, Recomendador, IA)
      models/             # Acceso a la base de datos (SQLite)
      strategies/         # Patrón Strategy: motor de recomendación
        StrategyRecomendacion.js   (interfaz base)
        EstrAvanceRapido.js
        EstrAvanceModerado.js
        EstrAvanceLento.js
        EstrAvanceConTrabajo.js
      database/
        db.js             # Conexión SQLite (singleton)
        init.js           # Schema inicial (CREATE TABLE)
        seed.js           # Datos de prueba
      app.js              # Configuración Express
      server.js           # Entry point
  frontend/
    src/
      pages/              # Pantallas principales (React)
      components/         # Componentes reutilizables (Navbar)
      services/           # api.js — wrapper Axios
      styles/             # global.css
```

---

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | /api/health | Estado del servidor |
| GET  | /api/estudiantes/carreras | Lista de carreras disponibles |
| POST | /api/estudiantes | Crear estudiante |
| GET  | /api/estudiantes/:id | Obtener estudiante |
| PUT  | /api/estudiantes/:id | Actualizar perfil |
| GET  | /api/estudiantes/:id/disponibilidad | Ver disponibilidad semanal |
| POST | /api/estudiantes/:id/disponibilidad | Guardar disponibilidad |
| GET  | /api/estudiantes/:id/materias | Materias con estado |
| POST | /api/estudiantes/:id/materias | Guardar historial académico |
| POST | /api/planes/upload | Subir Excel de plan de estudios |
| GET  | /api/materias?carreraId=1 | Listar materias de una carrera |
| POST | /api/recomendaciones/generar | Generar recomendación |
| GET  | /api/recomendaciones/:id | Consultar recomendación |
| POST | /api/ia/explicar | Explicar con Ollama o fallback |

---

## Formato del Excel

El archivo debe tener estas columnas exactas en la primera fila:

| Codigo | Materia | Anio | Cuatrimestre | HorasSemanales | Correlativas | Dificultad | Promocionable |
|--------|---------|------|--------------|----------------|-------------|------------|---------------|
| ANA1 | Análisis Matemático 1 | 1 | 1 | 6 | | ALTA | No |
| PROG1 | Programación 1 | 2 | 1 | 6 | TEC1 | MEDIA | Si |
| BD1 | Bases de Datos 1 | 2 | 2 | 6 | PROG1 | MEDIA | Si |

- **Correlativas**: códigos separados por coma. Dejar vacío si no tiene.
- **Dificultad**: BAJA / MEDIA / ALTA / CRITICA (mayúsculas).
- **Promocionable**: Si / No.

---

## Configurar Ollama (opcional)

```bash
# Instalar Ollama desde https://ollama.ai
ollama pull llama3.1
ollama serve
```

La app funciona **sin Ollama**. Si no está disponible, la explicación se genera automáticamente por reglas del sistema.

---

## Flujo para la demo del TPO

1. **Abrir** http://localhost:5173
2. **Perfil** → Completar datos del estudiante (usar datos del seed: legajo `SIS001`)
3. **Plan** → Subir el Excel de prueba o verificar materias del seed
4. **Materias** → Marcar materias aprobadas (el seed ya tiene el primer año aprobado)
5. **Disponibilidad** → Configurar horas disponibles por día con los sliders
6. **Resultado** → Clic en "Generar recomendación"
   - Ver materias recomendadas con horas de cursada + estudio
   - Ver materias rechazadas y motivo
   - Ver plan semanal distribuido
7. **Explicame esta recomendación** → Respuesta del asistente (Ollama o reglas)

---

## Patrón Strategy — cómo funciona

El motor de recomendación usa el **patrón Strategy**:

```
StrategyRecomendacion (interfaz base)
  └── EstrAvanceRapido      → objetivo AVANZAR_RAPIDO
  └── EstrAvanceModerado    → objetivo MANTENER_PROMEDIO
  └── EstrAvanceLento       → objetivo EVITAR_SOBRECARGA / ORDENAR_HABITOS
  └── EstrAvanceConTrabajo  → cuando el estudiante trabaja
```

`RecomendadorService` selecciona la estrategia según el objetivo del estudiante y delega en `estrategia.recomendar()`. Para cambiar el comportamiento del recomendador basta con agregar una nueva clase que extienda `StrategyRecomendacion`, sin tocar el resto del sistema.

---

## Reglas de negocio implementadas

1. Una materia solo se recomienda si todas sus correlativas están **aprobadas**.
2. La carga total (cursada + estudio) no supera la disponibilidad semanal declarada.
3. Si el estudiante trabaja más de 30hs semanales, se usa `EstrAvanceConTrabajo` automáticamente.
4. Máximo 2 materias de dificultad ALTA o CRITICA por cuatrimestre.
5. Las materias desbloqueantes (con más materias futuras dependientes) se priorizan.
6. El sistema informa el motivo de rechazo para cada materia no recomendada.

---

## Tecnologías utilizadas

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Backend | Node.js + Express | Simple, ampliamente conocido, fácil de ejecutar localmente |
| Base de datos | SQLite (better-sqlite3) | Sin instalación, archivo único, ideal para TPO |
| Excel | xlsx (SheetJS) | Estándar para lectura/escritura de Excel en Node |
| Frontend | React + Vite | Moderno, rápido, componentes claros |
| HTTP client | Axios | Manejo de errores más limpio que fetch nativo |
| IA | Ollama (API local) | Privacidad, sin costo, fallback automático |
