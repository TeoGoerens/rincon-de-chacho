import Cronica from "../../dao/models/cronicas/cronicaModel.js";
import baseRepository from "../baseRepository.js";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../../middlewares/multer/multerCronicaConfig.js";

import dotenv from "dotenv";
dotenv.config();

export default class CronicaRepository extends baseRepository {
  constructor() {
    super(Cronica);
  }

  updateCronicaById = async (cronicaId, cronicaBody, cronicaFiles) => {
    try {
      // Definicion de variables
      const { title, subtitle, year, body } = cronicaBody;

      // Buscar la crónica existente
      const cronicaExists = await Cronica.findById(cronicaId);
      if (!cronicaExists) {
        throw new Error(`The requested cronica was not found`);
      }

      // Actualizar campos de texto si se envían
      if (title) cronicaExists.title = title;
      if (subtitle) cronicaExists.subtitle = subtitle;
      if (year) cronicaExists.year = year;
      if (body) cronicaExists.body = body;

      // Actualizar archivos
      if (cronicaFiles?.heroImage?.[0]) {
        // Eliminar la imagen anterior de S3 si existe
        if (cronicaExists.heroImage) {
          try {
            // Extraer el Key desde la URL completa
            const fullUrl = cronicaExists.heroImage;
            const urlParts = fullUrl.split(".com/"); // Divide la URL para obtener el Key relativo
            const keyToDelete = urlParts[1]; // El Key es la segunda parte

            await s3.send(
              new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: keyToDelete, // Usar directamente el nombre del archivo
              })
            );
          } catch (error) {
            console.error(
              "Error al eliminar el archivo anterior de S3:",
              error.message
            );
          }
        }
        // Actualizar con la nueva imagen
        cronicaExists.heroImage = cronicaFiles.heroImage[0].location;
      }

      // Guardar la crónica actualizada
      const updatedCronica = await cronicaExists.save();

      return updatedCronica;
    } catch (error) {
      throw error;
    }
  };

  updateCronicaLikesById = async (cronicaId, userId) => {
    try {
      const updatedCronica = await Cronica.findById(cronicaId);
      if (!updatedCronica) {
        throw new Error(`The requested cronica was not found`);
      }

      if (updatedCronica.likes.includes(userId)) {
        updatedCronica.likes = updatedCronica.likes.filter(
          (id) => id.toString() !== userId
        );
      } else {
        updatedCronica.likes.push(userId);
      }

      await updatedCronica.save();

      return updatedCronica;
    } catch (error) {
      throw error;
    }
  };

  updateCronicaViewsById = async (id) => {
    try {
      const updatedCronica = await Cronica.findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },
        { new: true }
      );

      if (!updatedCronica) {
        throw new Error(`The requested cronica was not found`);
      }

      return updatedCronica;
    } catch (error) {
      throw error;
    }
  };
}
