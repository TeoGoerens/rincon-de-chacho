import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3"; // Cliente S3 del SDK v3
import dotenv from "dotenv";

dotenv.config();

// Configurar el cliente S3
export const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

// Obtener entorno
const environment =
  process.env.npm_lifecycle_event === "start" ? "production" : "development";

// Middleware Multer para solicitudes con archivos
const uploadWithFiles = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const folder =
        environment === "production"
          ? "cronicas/production"
          : "cronicas/development";
      const uniqueKey = `${folder}/${Date.now()}_${file.originalname}`;
      cb(null, uniqueKey);
    },
  }),

  // ----------- LÍMITES AJUSTADOS -----------
  /*   limits: {
    fileSize: 5000 * 1024 * 1024, // 50 MB por archivo
    fieldSize: 10 * 1024 * 1024, // 10 MB para campos no archivo
    files: 50, // Aumentado a 50 archivos en total
  }, */
}).fields([
  { name: "heroImage", maxCount: 1 },
  { name: "images", maxCount: 50 },
  { name: "audios", maxCount: 50 },
  { name: "videos", maxCount: 50 },
]);

// Middleware Multer para solicitudes sin archivos
const uploadWithoutFiles = multer().none();

export const uploadMultipleFilesCronica = (req, res, next) => {
  // Detectar si hay archivos en la solicitud
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    uploadWithFiles(req, res, next);
  } else {
    uploadWithoutFiles(req, res, next);
  }
};
