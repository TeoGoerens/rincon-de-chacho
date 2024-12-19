import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Referencia a la colección de usuarios
    required: true,
  },
  reply: {
    type: String, // Contenido de la respuesta
    required: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Usuarios que dieron like
    },
  ],
  dislikes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Usuarios que dieron dislike
    },
  ],
  date: {
    type: Date,
    default: Date.now, // Fecha de la respuesta
  },
});

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Referencia a la colección de usuarios
    required: true,
  },
  cronicaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cronica", // Referencia a la crónica asociada
    required: true,
  },
  comment: {
    type: String, // Contenido del comentario
    required: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Usuarios que dieron like
    },
  ],
  dislikes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Usuarios que dieron dislike
    },
  ],
  replies: [replySchema], // Respuestas al comentario
  date: {
    type: Date,
    default: Date.now, // Fecha del comentario
  },
});

const CronicaComment = mongoose.model("Cronica Comment", commentSchema);

export default CronicaComment;
