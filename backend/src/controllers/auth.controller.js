const bcrypt = require('bcrypt');
const EstudianteModel = require('../models/estudiante.model');
const { getDb } = require('../database/db');
const { generarToken } = require('../middlewares/jwtMiddleware');

const SALT_ROUNDS = 10;

const AuthController = {

  /**
   * POST /api/auth/registro
   * Crea un estudiante nuevo.
   * Contraseña inicial = legajo (si no se envía una explícita).
   */
  async registro(req, res, next) {
    try {
      const {
        nombre, dni, email, legajo, carreraId,
        edad, nacimiento, trabaja,
        horasLaborales, horasTransporte, situacionLaboral,
        objetivo, preferenciaCursada, regularizadasHabilitan,
        password           // opcional: si no viene, se usa el legajo
      } = req.body;

      const rawPass = (password || legajo || '').toString().toUpperCase();
      if (!rawPass) return res.status(400).json({ error: 'No se pudo determinar la contraseña.' });

      const password_hash = await bcrypt.hash(rawPass, SALT_ROUNDS);

      const db = await getDb();
      const result = await db.run(
        `INSERT INTO estudiante
          (nombre,dni,email,edad,nacimiento,trabaja,legajo,
           horas_laborales,horas_transporte,situacion_laboral,
           objetivo,preferencia_cursada,carrera_id,
           regularizadas_habilitan,password_hash)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          nombre, dni || null, email || null, edad || null, nacimiento || null,
          trabaja ? 1 : 0,
          legajo?.toUpperCase() || null,
          horasLaborales || 0, horasTransporte || 0,
          situacionLaboral || null,
          objetivo || 'MANTENER_PROMEDIO',
          preferenciaCursada || 'EQUILIBRADA',
          carreraId,
          regularizadasHabilitan ? 1 : 0,
          password_hash
        ]
      );

      const estudiante = await EstudianteModel.findById(result.lastID);
      const token = generarToken(estudiante.id);
      return res.status(201).json({ ok: true, estudiante, token });

    } catch (err) {
      if (err.message?.includes('UNIQUE'))
        return res.status(409).json({ error: 'Ya existe un estudiante con ese legajo, DNI o email.' });
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   * Login por legajo + contraseña, o por email + contraseña.
   */
  async login(req, res, next) {
    try {
      const { legajo, email, password } = req.body;

      if (!password) return res.status(400).json({ error: 'La contraseña es requerida.' });
      if (!legajo && !email) return res.status(400).json({ error: 'Legajo o email son requeridos.' });

      const db = await getDb();
      let estudiante;

      if (legajo) {
        estudiante = await db.get(
          `SELECT e.*, c.nombre AS carrera_nombre
           FROM estudiante e LEFT JOIN carrera c ON c.id = e.carrera_id
           WHERE e.legajo = ?`,
          [legajo.trim().toUpperCase()]
        );
      } else {
        estudiante = await db.get(
          `SELECT e.*, c.nombre AS carrera_nombre
           FROM estudiante e LEFT JOIN carrera c ON c.id = e.carrera_id
           WHERE LOWER(e.email) = LOWER(?)`,
          [email.trim()]
        );
      }

      if (!estudiante) {
        return res.status(401).json({ error: 'Credenciales incorrectas.' });
      }

      // Si el estudiante no tiene hash aún (migración pendiente), lo generamos
      if (!estudiante.password_hash) {
        const defaultPass = (estudiante.legajo || '').toUpperCase();
        const hash = await bcrypt.hash(defaultPass, SALT_ROUNDS);
        await db.run(`UPDATE estudiante SET password_hash = ? WHERE id = ?`, [hash, estudiante.id]);
        estudiante.password_hash = hash;
      }

      const valid = await bcrypt.compare(password, estudiante.password_hash);
      if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas.' });

      const token = generarToken(estudiante.id);
      // No devolvemos el hash en la respuesta
      delete estudiante.password_hash;
      return res.json({ ok: true, estudiante, token });

    } catch (err) { next(err); }
  },

  /**
   * POST /api/auth/cambiar-password
   * Cambia la contraseña del estudiante autenticado.
   * Requiere token JWT (verificarToken middleware).
   */
  async cambiarPassword(req, res, next) {
    try {
      const { passwordActual, passwordNuevo } = req.body;
      const id = req.estudianteId;

      if (!passwordActual || !passwordNuevo)
        return res.status(400).json({ error: 'passwordActual y passwordNuevo son requeridos.' });
      if (passwordNuevo.length < 4)
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres.' });

      const db = await getDb();
      const est = await db.get(`SELECT password_hash FROM estudiante WHERE id = ?`, [id]);
      if (!est) return res.status(404).json({ error: 'Estudiante no encontrado.' });

      const valid = await bcrypt.compare(passwordActual, est.password_hash || '');
      if (!valid) return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });

      const hash = await bcrypt.hash(passwordNuevo, SALT_ROUNDS);
      await db.run(`UPDATE estudiante SET password_hash = ? WHERE id = ?`, [hash, id]);

      return res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
    } catch (err) { next(err); }
  }
};

module.exports = AuthController;
