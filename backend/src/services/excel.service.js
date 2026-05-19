const XLSX = require('xlsx');
const MateriaModel = require('../models/materia.model');
const { getDb } = require('../database/db');

const COLS = ['Codigo','Materia','Anio','Cuatrimestre','HorasSemanales','Correlativas','Dificultad','Promocionable'];
const DIFS = ['BAJA','MEDIA','ALTA','CRITICA'];

const ExcelService = {
  async parsearYGuardar(filePath, carreraId, nombreArchivo) {
    const wb   = XLSX.readFile(filePath);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval:'' });
    if (!rows.length) throw new Error('El archivo Excel esta vacio.');

    const faltantes = COLS.filter(c => !Object.keys(rows[0]).includes(c));
    if (faltantes.length) throw new Error(`Columnas faltantes: ${faltantes.join(', ')}`);

    const errores = [], codigos = new Set();
    for (let i=0; i<rows.length; i++) {
      const f=i+2, r=rows[i];
      if (!r.Codigo)         errores.push(`Fila ${f}: Codigo vacio.`);
      if (!r.Materia)        errores.push(`Fila ${f}: Nombre vacio.`);
      if (!r.Anio||isNaN(+r.Anio)) errores.push(`Fila ${f}: Anio invalido.`);
      if (![1,2,'1','2'].includes(r.Cuatrimestre)) errores.push(`Fila ${f}: Cuatrimestre debe ser 1 o 2.`);
      if (!r.HorasSemanales||isNaN(+r.HorasSemanales)||+r.HorasSemanales<=0) errores.push(`Fila ${f}: HorasSemanales invalido.`);
      if (!DIFS.includes(String(r.Dificultad).toUpperCase().trim())) errores.push(`Fila ${f}: Dificultad invalida '${r.Dificultad}'.`);
      if (codigos.has(String(r.Codigo).trim())) errores.push(`Fila ${f}: Codigo duplicado '${r.Codigo}'.`);
      codigos.add(String(r.Codigo).trim());
    }
    for (let i=0; i<rows.length; i++) {
      const r=rows[i];
      if (!r.Correlativas) continue;
      String(r.Correlativas).split(',').map(s=>s.trim()).filter(Boolean).forEach(c=>{
        if (!codigos.has(c)) errores.push(`Fila ${i+2}: Correlativa '${c}' no existe en el plan.`);
      });
    }
    if (errores.length) throw new Error(errores.join('\n'));

    await MateriaModel.deleteByCarrera(carreraId);
    const mapaIds = {};
    for (const r of rows) {
      const res = await MateriaModel.create({
        codigo: String(r.Codigo).trim(),
        nombre: String(r.Materia).trim(),
        anio: +r.Anio, cuatrimestre: +r.Cuatrimestre,
        horasSemanales: +r.HorasSemanales,
        dificultad: String(r.Dificultad).toUpperCase().trim(),
        promocionable: ['si','true','1'].includes(String(r.Promocionable).toLowerCase()),
        carreraId
      });
      mapaIds[String(r.Codigo).trim()] = res.lastID;
    }
    for (const r of rows) {
      if (!r.Correlativas) continue;
      const mid = mapaIds[String(r.Codigo).trim()];
      for (const c of String(r.Correlativas).split(',').map(s=>s.trim()).filter(Boolean)) {
        if (mapaIds[c]) await MateriaModel.insertCorrelatividad(mid, mapaIds[c]);
      }
    }
    const db = await getDb();
    await db.run(`INSERT INTO plan_estudio (nombre_archivo,carrera_id) VALUES (?,?)`, [nombreArchivo, carreraId]);
    return { mensaje:`Se importaron ${Object.keys(mapaIds).length} materias correctamente.`, totalMaterias:Object.keys(mapaIds).length };
  }
};

module.exports = ExcelService;
