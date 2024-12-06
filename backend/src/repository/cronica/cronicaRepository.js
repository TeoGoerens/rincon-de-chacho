import Cronica from "../../dao/models/cronicas/cronicaModel.js";
import baseRepository from "../baseRepository.js";

// Helper para eliminar archivos de S3
import deleteFilesFromS3 from "../../helpers/deleteFilesFromS3.js";

export default class CronicaRepository extends baseRepository {
  constructor() {
    super(Cronica);
  }

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
}
