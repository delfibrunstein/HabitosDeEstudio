/**
 * Migración de autenticación
 * ──────────────────────────
 * 1. Agrega la columna password_hash a la tabla estudiante (si no existe).
 * 2. Para cada estudiante sin hash, genera uno usando su legajo como contraseña.
 *
 * Ejecutar UNA SOLA VEZ desde la raíz del backend:
 *   node src/database/migrate_auth.js
 */

// IMPORTANTE: cargar .env ANTES de cualquier require que use process.env
require('dotenv').config();

const bcrypt    = require('bcrypt');
const { getDb } = require('../patterns/singleton');

async function migrate() {
  const db = await getDb();

  // 1. Verifica si la columna ya existe
  const cols = await db.all(`PRAGMA table_info(estudiante)`);
  if (!cols || cols.length === 0) {
    console.error('❌  La tabla "estudiante" no existe en esta base de datos.');
    console.error('   Primero inicializá la DB con: node src/database/init.js');
    process.exit(1);
  }

  if (!cols.find(c => c.name === 'password_hash')) {
    await db.exec(`ALTER TABLE estudiante ADD COLUMN password_hash TEXT`);
    console.log('✓  Columna password_hash agregada.');
  } else {
    console.log('·  Columna password_hash ya existe, se salteó el ALTER TABLE.');
  }

  // 2. Genera hash para cada estudiante que aún no tenga contraseña
  const rows = await db.all(
    `SELECT id, legajo FROM estudiante WHERE password_hash IS NULL AND legajo IS NOT NULL`
  );

  if (rows.length === 0) {
    console.log('·  Todos los estudiantes ya tienen contraseña seteada.');
  } else {
    console.log(`→  Seteando contraseña para ${rows.length} estudiante(s)...`);
    for (const row of rows) {
      const hash = await bcrypt.hash(row.legajo.toUpperCase(), 10);
      await db.run(
        `UPDATE estudiante SET password_hash = ? WHERE id = ?`,
        [hash, row.id]
      );
      console.log(`   ✓  id=${row.id}  legajo=${row.legajo}`);
    }
  }

  console.log('\n✅  Migración completada. Podés iniciar el servidor normalmente.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌  Error en la migración:', err.message);
  process.exit(1);
});
