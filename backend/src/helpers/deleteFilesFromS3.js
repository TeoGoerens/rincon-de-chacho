// Importar el modulo de S3 y la configuracion propia de s3 desde el middleware de Multer
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../middlewares/multer/multerCronicaConfig.js";

// Importar el modulo dotenv para acceder a la informacion del archivo .env
import dotenv from "dotenv";
dotenv.config();

// Funcion helper para eliminar files de S3
const deleteFilesFromS3 = async (files) => {
  try {
    for (const file of files) {
      let key = file?.location
        ? file.location.split(".com/")[1] // Si tiene location, extraer el Key
        : file?.Key; // Si tiene Key, usarlo directamente

      if (key) {
        // Decodificar la Key para reemplazar %20 por espacios
        key = decodeURIComponent(key);

        await s3.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
          })
        );
        console.log(`File deleted from S3: ${key}`);
      } else {
        console.warn(
          `File object does not have a valid location or Key property: ${JSON.stringify(
            file
          )}`
        );
      }
    }
  } catch (error) {
    console.error("Error deleting files from S3:", error.message);
  }
};

export default deleteFilesFromS3;
