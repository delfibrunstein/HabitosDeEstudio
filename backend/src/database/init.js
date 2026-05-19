const { getDb } = require('./db');

async function initDatabase() {
  const db = await getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS universidad (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre  TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS carrera (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre         TEXT NOT NULL,
      universidad_id INTEGER REFERENCES universidad(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS materia (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo          TEXT NOT NULL,
      nombre          TEXT NOT NULL,
      anio            INTEGER NOT NULL,
      cuatrimestre    INTEGER NOT NULL,
      horas_semanales REAL NOT NULL,
      dificultad      TEXT NOT NULL,
      promocionable   INTEGER NOT NULL DEFAULT 0,
      carrera_id      INTEGER REFERENCES carrera(id) ON DELETE CASCADE,
      UNIQUE(codigo, carrera_id)
    );
    CREATE TABLE IF NOT EXISTS correlatividad (
      materia_id     INTEGER NOT NULL REFERENCES materia(id) ON DELETE CASCADE,
      correlativa_id INTEGER NOT NULL REFERENCES materia(id) ON DELETE CASCADE,
      PRIMARY KEY (materia_id, correlativa_id)
    );
    CREATE TABLE IF NOT EXISTS estudiante (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre              TEXT NOT NULL,
      dni                 TEXT UNIQUE,
      email               TEXT,
      edad                INTEGER,
      nacimiento          TEXT,
      trabaja             INTEGER NOT NULL DEFAULT 0,
      legajo              TEXT UNIQUE,
      carga               REAL DEFAULT 0,
      horas_transporte    REAL DEFAULT 0,
      horas_laborales     REAL DEFAULT 0,
      objetivo            TEXT DEFAULT 'MANTENER_PROMEDIO',
      preferencia_cursada TEXT DEFAULT 'EQUILIBRADA',
      carrera_id          INTEGER REFERENCES carrera(id)
    );
    CREATE TABLE IF NOT EXISTS disponibilidad_usuario (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id     INTEGER NOT NULL REFERENCES estudiante(id) ON DELETE CASCADE,
      dia               TEXT NOT NULL,
      horas_disponibles REAL NOT NULL DEFAULT 0,
      UNIQUE(estudiante_id, dia)
    );
    CREATE TABLE IF NOT EXISTS materia_aprobada (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id         INTEGER NOT NULL REFERENCES estudiante(id) ON DELETE CASCADE,
      materia_id            INTEGER NOT NULL REFERENCES materia(id) ON DELETE CASCADE,
      nota                  REAL,
      estado                TEXT NOT NULL,
      cuatrimestre_aprobado INTEGER,
      UNIQUE(estudiante_id, materia_id)
    );
    CREATE TABLE IF NOT EXISTS plan_estudio (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_archivo TEXT NOT NULL,
      fecha_carga    TEXT NOT NULL DEFAULT (datetime('now')),
      carrera_id     INTEGER REFERENCES carrera(id)
    );
    CREATE TABLE IF NOT EXISTS plan (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      estudiante_id           INTEGER NOT NULL REFERENCES estudiante(id) ON DELETE CASCADE,
      fecha_generacion        TEXT NOT NULL DEFAULT (datetime('now')),
      cuatrimestre_objetivo   INTEGER,
      horas_estudio_semanales REAL,
      explicacion_ia          TEXT,
      estrategia              TEXT
    );
    CREATE TABLE IF NOT EXISTS plan_materia (
      plan_id        INTEGER NOT NULL REFERENCES plan(id) ON DELETE CASCADE,
      materia_id     INTEGER NOT NULL REFERENCES materia(id),
      recomendada    INTEGER NOT NULL DEFAULT 1,
      motivo_rechazo TEXT,
      horas_cursada  REAL,
      horas_estudio  REAL,
      PRIMARY KEY (plan_id, materia_id)
    );
    CREATE TABLE IF NOT EXISTS plan_semanal (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id   INTEGER NOT NULL REFERENCES plan(id) ON DELETE CASCADE,
      dia       TEXT NOT NULL,
      actividad TEXT NOT NULL,
      horas     REAL NOT NULL
    );
  `);
  console.log('[DB] Schema creado correctamente');
}

if (require.main === module) {
  require('dotenv').config();
  initDatabase()
    .then(() => { console.log('[DB] Listo'); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); });
}

module.exports = { initDatabase };
