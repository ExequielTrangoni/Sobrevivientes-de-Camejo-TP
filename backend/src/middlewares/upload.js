const fs = require('fs');
const path = require('path');
const multer = require('multer');
const uploadsPath = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsPath)) {
    try {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log('Carpeta uploads creada exitosamente en:', uploadsPath);
    } catch (err) {
        console.error('Error creando la carpeta uploads:', err);
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

module.exports = multer({ storage: storage });