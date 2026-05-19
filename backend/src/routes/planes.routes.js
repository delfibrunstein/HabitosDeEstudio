const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Directorio de uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `plan_${Date.now()}_${file.originalname}`)
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) return cb(null, true);
    cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
  }
});

const planesController = require('../controllers/planes.controller');

const router = Router();

router.post('/upload', upload.single('archivo'), planesController.uploadExcel);
router.get('/',                                  planesController.listar);

module.exports = router;
