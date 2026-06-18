/**
 * PATRÓN SINGLETON
 * ───────────────────────────────────────────────────────────────────────────
 * Garantiza que exista una única instancia de la conexión a la base de datos
 * durante toda la vida del proceso Node.js.
 *
 * Contexto en el TPO:
 * SQLite no soporta bien múltiples conexiones simultáneas al mismo archivo.
 * Abrir una nueva conexión por cada request generaría errores de concurrencia
 * ("database is locked") y desperdiciaría recursos. El Singleton asegura que
 * todos los modelos compartan exactamente la misma conexión.
 *
 * El archivo original db.js ya implementaba esto con una variable `_db`.
 * Aquí lo formalizamos como una clase Singleton explícita y documentada

 * Participantes:
 *   - DatabaseConnection → clase Singleton con constructor privado simulado
 *   - _instance          → referencia estática a la única instancia
 *   - getInstance()      → punto de acceso global
 */

const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

class DatabaseConnection {
  // La instancia estática única
  static _instance = null;

  // La conexión SQLite ya abierta
  _db = null;

  // Constructor privado: lanzamos error si se intenta usar `new` directamente
  constructor() {
    if (DatabaseConnection._instance) {
      throw new Error(
        'DatabaseConnection es un Singleton. ' +
        'Usá DatabaseConnection.getInstance() en lugar de new DatabaseConnection().'
      );
    }
  }

  /**
   * Punto de acceso global al Singleton.
   * Primera llamada: crea la instancia y devuelve la promesa de conexión.
   * Llamadas siguientes: devuelve la misma instancia ya conectada.
   * @returns {Promise<DatabaseConnection>}
   */
  static async getInstance() {
    if (!DatabaseConnection._instance) {
      const conn = Object.create(DatabaseConnection.prototype);
      conn._db = null;
      DatabaseConnection._instance = conn;
    }

    if (!DatabaseConnection._instance._db) {
      await DatabaseConnection._instance._connect();
    }

    return DatabaseConnection._instance;
  }

  /**
   * Abre la conexión SQLite y configura los pragmas necesarios.
   * Se ejecuta una única vez en el ciclo de vida del proceso.
   */
  async _connect() {
    const DB_PATH = process.env.DATABASE_PATH
      ? path.resolve(process.env.DATABASE_PATH)
      : path.join(__dirname, 'planificador.db');

    this._db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    await this._db.exec('PRAGMA journal_mode = WAL');
    await this._db.exec('PRAGMA foreign_keys = ON');

    console.log('[DB Singleton] Conexión establecida:', DB_PATH);
  }

  /**
   * Devuelve la conexión SQLite subyacente.
   * Los modelos usan esto para ejecutar queries.
   * @returns {import('sqlite').Database}
   */
  getConnection() {
    if (!this._db) {
      throw new Error('La base de datos no está conectada. Llamá primero a getInstance().');
    }
    return this._db;
  }

  /**
   * Cierra la conexión (útil para tests o shutdown graceful).
   */
  async cerrar() {
    if (this._db) {
      await this._db.close();
      this._db = null;
      DatabaseConnection._instance = null;
      console.log('[DB Singleton] Conexión cerrada.');
    }
  }
}

/**
 * Función helper compatible con el resto del código existente.
 * Mantiene la misma firma que el db.js original para no romper los modelos.
 *
 * Uso en modelos:
 *   const { getDb } = require('../patterns/singleton');
 *   const db = await getDb();
 *   await db.all('SELECT * FROM materia WHERE carrera_id = ?', [id]);
 */
async function getDb() {
  const conn = await DatabaseConnection.getInstance();
  return conn.getConnection();
}

module.exports = { DatabaseConnection, getDb };
