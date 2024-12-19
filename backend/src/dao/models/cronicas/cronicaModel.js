import mongoose from "mongoose";

const cronicaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    publishedDate: {
      type: Date,
      default: Date.now,
    },
    heroImage: {
      type: String, // URL de la imagen almacenada en AWS S3
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Usuarios que dieron like
      },
    ],
    images: [
      {
        url: {
          type: String, // URL de la imagen
          required: true,
        },
        caption: {
          type: String, // Epígrafe de la imagen
          required: true,
        },
      },
    ],
    audios: [
      {
        url: {
          type: String, // URL del audio
          required: true,
        },
        caption: {
          type: String, // Epígrafe del audio
          required: true,
        },
      },
    ],
    videos: [
      {
        url: {
          type: String, // URL del video
          required: true,
        },
        caption: {
          type: String, // Epígrafe del video
          required: true,
        },
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

const Cronica = mongoose.model("Cronica", cronicaSchema);
export default Cronica;
