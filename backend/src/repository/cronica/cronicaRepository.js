import mongoose from "mongoose";
import Cronica from "../../dao/models/cronicas/cronicaModel.js";
import CronicaComment from "../../dao/models/cronicas/cronicaCommentModel.js";
import baseRepository from "../baseRepository.js";

// Helper para eliminar archivos de S3
import deleteFilesFromS3 from "../../helpers/deleteFilesFromS3.js";

export default class CronicaRepository extends baseRepository {
  constructor() {
    super(Cronica);
  }

  getAllCronicas = async () => {
    try {
      const cronicas = await Cronica.aggregate([
        // 1. Buscar todas las crónicas
        {
          $lookup: {
            from: "cronica comments", // Nombre de la colección de comentarios
            localField: "_id", // Campo en la colección de crónicas
            foreignField: "cronicaId", // Campo en la colección de comentarios
            as: "comments", // Alias para los comentarios relacionados
          },
        },
        // 2. Contar los comentarios relacionados
        {
          $addFields: {
            commentCount: { $size: "$comments" },
          },
        },
        // 3. Eliminar el campo `comments` si no lo necesitas en el resultado
        {
          $project: {
            comments: 0, // No incluir los comentarios completos en el resultado
          },
        },
        // 4. Ordenar por fecha de publicación (opcional)
        {
          $sort: { publishedDate: -1 },
        },
      ]);

      return cronicas;
    } catch (error) {
      throw error;
    }
  };

  getCronicaById = async (cronicaId) => {
    try {
      // Validar que el id sea válido
      if (!mongoose.Types.ObjectId.isValid(cronicaId)) {
        throw new Error("El ID de la crónica no es válido");
      }

      const result = await Cronica.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(cronicaId) }, // Filtrar solo la crónica deseada
        },
        {
          $lookup: {
            from: "cronica comments", // Nombre de la colección de comentarios
            localField: "_id",
            foreignField: "cronicaId",
            as: "comments", // Une los comentarios a la crónica
          },
        },
        {
          $addFields: {
            commentCount: { $size: "$comments" }, // Calcula el número de comentarios
          },
        },
        {
          $project: {
            comments: 0, // Excluye el array de comentarios si no lo necesitas
          },
        },
      ]);

      if (!result || result.length === 0) {
        throw new Error("La crónica no fue encontrada");
      }

      return result[0]; // Retorna la crónica con el campo commentCount
    } catch (error) {
      throw error;
    }
  };

  createCronica = async (cronicaBody, cronicaFiles) => {
    // Recolectar archivos subidos para limpieza en caso de error
    const filesToDelete = [
      ...(cronicaFiles.heroImage || []),
      ...(cronicaFiles.images || []),
      ...(cronicaFiles.audios || []),
      ...(cronicaFiles.videos || []),
    ];

    try {
      // Validar campos obligatorios
      const { title, subtitle, year, body } = cronicaBody;

      if (!title || !subtitle || !year || !body) {
        throw new Error(
          `Asegurate que hayas completado el titulo, subtìtulo, año y contenido de la crónica`
        );
      }

      // Procesar Hero Image
      const heroImage = cronicaFiles.heroImage?.[0]?.location || "";

      if (!heroImage) {
        throw new Error(
          `Asegurate de haber subido correctamente una imagen de cabecera para la crónica`
        );
      }

      // Procesar imágenes adicionales
      const images = (cronicaFiles.images || []).map((file) => {
        const captionKey = `imageCaption_${file.originalname}`;
        const caption = cronicaBody[captionKey];

        if (!caption) {
          throw new Error(
            `Asegurate de incluir un epígrafe para la imagen: ${file.originalname}`
          );
        }

        return {
          url: file.location,
          caption: caption,
        };
      });

      // Procesar audios adicionales
      const audios = (cronicaFiles.audios || []).map((file) => {
        const captionKey = `audioCaption_${file.originalname}`;
        const caption = cronicaBody[captionKey];

        if (!caption) {
          throw new Error(
            `Asegurate de incluir un epígrafe para el audio: ${file.originalname}`
          );
        }

        return {
          url: file.location,
          caption,
        };
      });

      // Procesar videos adicionales
      const videos = (cronicaFiles.videos || []).map((file) => {
        const captionKey = `videoCaption_${file.originalname}`;
        const caption = cronicaBody[captionKey];

        if (!caption) {
          throw new Error(
            `Asegurate de incluir un epígrafe para el video: ${file.originalname}`
          );
        }

        return {
          url: file.location,
          caption,
        };
      });

      // Construir objeto Cronica
      const newCronica = {
        title,
        subtitle,
        year,
        body,
        heroImage,
        images,
        audios,
        videos,
      };

      // Guardar el objeto creado en la base de datos
      const cronicaLoaded = await Cronica.create(newCronica);

      return cronicaLoaded;
    } catch (error) {
      // Limpiar archivos subidos en caso de error
      console.error("Error creating cronica:", error.message);

      await deleteFilesFromS3(filesToDelete);

      throw error;
    }
  };

  updateCronicaById = async (cronicaId, cronicaBody, cronicaFiles) => {
    const filesToDelete = [];

    try {
      // Buscar la crónica existente
      const cronicaExists = await Cronica.findById(cronicaId);
      if (!cronicaExists) {
        throw new Error(`The requested cronica was not found`);
      }

      // Actualizar campos de texto si se envían
      const { title, subtitle, year, body } = cronicaBody;
      if (title) cronicaExists.title = title;
      if (subtitle) cronicaExists.subtitle = subtitle;
      if (year) cronicaExists.year = year;
      if (body) cronicaExists.body = body;

      // Actualizar Hero Image si se envía
      if (cronicaFiles?.heroImage?.[0]) {
        const newHeroImage = cronicaFiles.heroImage[0].location;
        filesToDelete.push({ Key: cronicaExists.heroImage.split(".com/")[1] });

        cronicaExists.heroImage = newHeroImage;
      }

      // Actualizar imágenes adicionales si se envían
      if (cronicaFiles.images) {
        const updatedImages = cronicaFiles.images.map((file) => {
          const captionKey = `imageCaption_${file.originalname}`;
          const caption = cronicaBody[captionKey];

          if (!caption) {
            throw new Error(
              `Asegurate de incluir un epígrafe para la imagen: ${file.originalname}`
            );
          }

          return {
            url: file.location,
            caption,
          };
        });

        filesToDelete.push(
          ...cronicaExists.images.map((image) => ({
            Key: image.url.split(".com/")[1],
          }))
        );

        cronicaExists.images = updatedImages;
      }

      // Actualizar audios adicionales si se envían
      if (cronicaFiles.audios) {
        const updatedAudios = cronicaFiles.audios.map((file) => {
          const captionKey = `audioCaption_${file.originalname}`;
          const caption = cronicaBody[captionKey];

          if (!caption) {
            throw new Error(
              `Asegurate de incluir un epígrafe para el audio: ${file.originalname}`
            );
          }

          return {
            url: file.location,
            caption,
          };
        });

        filesToDelete.push(
          ...cronicaExists.audios.map((audio) => ({
            Key: audio.url.split(".com/")[1],
          }))
        );

        cronicaExists.audios = updatedAudios;
      }

      // Actualizar videos adicionales si se envían
      if (cronicaFiles.videos) {
        const updatedVideos = cronicaFiles.videos.map((file) => {
          const captionKey = `videoCaption_${file.originalname}`;
          const caption = cronicaBody[captionKey];

          if (!caption) {
            throw new Error(
              `Asegurate de incluir un epígrafe para el video: ${file.originalname}`
            );
          }

          return {
            url: file.location,
            caption,
          };
        });

        filesToDelete.push(
          ...cronicaExists.videos.map((video) => ({
            Key: video.url.split(".com/")[1],
          }))
        );

        cronicaExists.videos = updatedVideos;
      }

      // Guardar la crónica actualizada
      const updatedCronica = await cronicaExists.save();

      // Eliminar archivos anteriores de S3
      if (filesToDelete.length > 0) {
        await deleteFilesFromS3(filesToDelete);
      }

      return updatedCronica;
    } catch (error) {
      console.error("Error updating cronica:", error.message);

      // Limpiar archivos subidos en caso de error
      const newFilesToDelete = [
        ...(cronicaFiles.heroImage || []),
        ...(cronicaFiles.images || []),
        ...(cronicaFiles.audios || []),
        ...(cronicaFiles.videos || []),
      ];
      await deleteFilesFromS3(newFilesToDelete);

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

  deleteCronicaById = async (cronicaId) => {
    try {
      // 1. Obtener la crónica antes de borrarla para tener acceso a sus archivos
      const cronicaExists = await Cronica.findById(cronicaId);
      if (!cronicaExists) {
        throw new Error(`The requested cronica was not found`);
      }

      // 2. Borrar todos los comentarios asociados a esta crónica
      const commentsDeleted = await CronicaComment.deleteMany({
        cronicaId: cronicaId,
      });

      // 3. Recolectar todos los archivos a eliminar de S3
      const filesToDelete = [];

      // Hero Image
      if (cronicaExists.heroImage) {
        const heroImageKey = cronicaExists.heroImage.split(".com/")[1];
        filesToDelete.push({ Key: heroImageKey });
      }

      // Images
      if (cronicaExists.images && cronicaExists.images.length > 0) {
        cronicaExists.images.forEach((image) => {
          const imageKey = image.url.split(".com/")[1];
          filesToDelete.push({ Key: imageKey });
        });
      }

      // Audios
      if (cronicaExists.audios && cronicaExists.audios.length > 0) {
        cronicaExists.audios.forEach((audio) => {
          const audioKey = audio.url.split(".com/")[1];
          filesToDelete.push({ Key: audioKey });
        });
      }

      // Videos
      if (cronicaExists.videos && cronicaExists.videos.length > 0) {
        cronicaExists.videos.forEach((video) => {
          const videoKey = video.url.split(".com/")[1];
          filesToDelete.push({ Key: videoKey });
        });
      }

      // 4. Ahora que ya tenemos los archivos a eliminar y hemos borrado los comentarios, procedemos a borrar el documento de la crónica
      const cronicaDeleted = await Cronica.findOneAndDelete({ _id: cronicaId });

      // 5. Borrar archivos de S3 asociados a la crónica
      await deleteFilesFromS3(filesToDelete);

      return cronicaDeleted;
    } catch (error) {
      throw error;
    }
  };
}
