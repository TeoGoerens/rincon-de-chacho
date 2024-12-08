import CronicaComment from "../../dao/models/cronicas/cronicaCommentModel.js";
import Cronica from "../../dao/models/cronicas/cronicaModel.js";

import baseRepository from "../baseRepository.js";

export default class CronicaCommentRepository extends baseRepository {
  constructor() {
    super(CronicaComment);
  }

  getAllCommentsByCronicaId = async (cronicaId) => {
    try {
      const commentsByCronica = await CronicaComment.find({
        cronicaId: cronicaId,
      })
        .populate("userId", "first_name last_name profile_picture email")
        .populate(
          "replies.userId",
          "first_name last_name profile_picture email"
        )
        .sort({ date: -1 });
      if (!commentsByCronica) {
        throw new Error(`The requested cronica has no associated comments`);
      }

      // Ordenar las replies de cada comentario por fecha descendente
      commentsByCronica.forEach((comment) => {
        comment.replies.sort((a, b) => b.date - a.date);
      });

      return commentsByCronica;
    } catch (error) {
      throw error;
    }
  };

  createCommentOnACronica = async (userId, cronicaId, comment) => {
    try {
      const cronica = await Cronica.find({ _id: cronicaId });

      if (cronica.length === 0) {
        throw new Error(`The requested cronica was not found`);
      }

      const newComment = new CronicaComment({ userId, cronicaId, comment });

      const savedComment = await newComment.save();

      return savedComment;
    } catch (error) {
      throw error;
    }
  };

  updateCommentLike = async (userId, commentId) => {
    try {
      const comment = await CronicaComment.findById(commentId);

      if (!comment) {
        throw new Error(`The requested comment was not found`);
      }

      if (!comment.likes.includes(userId)) {
        comment.likes.push(userId);
      } else {
        comment.likes = comment.likes.filter((id) => id.toString() !== userId);
      }

      if (comment.dislikes.includes(userId)) {
        comment.dislikes = comment.dislikes.filter(
          (id) => id.toString() !== userId
        );
      }

      const updatedComment = await comment.save();

      return updatedComment;
    } catch (error) {
      throw error;
    }
  };

  updateCommentDislike = async (userId, commentId) => {
    try {
      const comment = await CronicaComment.findById(commentId);

      if (!comment) {
        throw new Error(`The requested comment was not found`);
      }

      if (!comment.dislikes.includes(userId)) {
        comment.dislikes.push(userId);
      } else {
        comment.dislikes = comment.dislikes.filter(
          (id) => id.toString() !== userId
        );
      }

      if (comment.likes.includes(userId)) {
        comment.likes = comment.likes.filter((id) => id.toString() !== userId);
      }

      const updatedComment = await comment.save();

      return updatedComment;
    } catch (error) {
      throw error;
    }
  };

  updateCommentOnCronica = async (userId, commentId, comment) => {
    try {
      const commentExists = await CronicaComment.findById(commentId);

      if (!commentExists) {
        throw new Error(`The requested comment was not found`);
      }

      // Verificar si el usuario que intenta editar es el creador del comentario
      if (commentExists.userId.toString() !== userId) {
        throw new Error(`You are not authorized to edit this comment`);
      }

      // Actualizar el contenido del comentario
      commentExists.comment = comment;
      const updatedComment = await commentExists.save();

      return updatedComment;
    } catch (error) {
      throw error;
    }
  };

  deleteCommentFromCronica = async (userId, isAdmin, commentId) => {
    try {
      const commentExists = await CronicaComment.findById(commentId);

      if (!commentExists) {
        throw new Error(`The requested comment was not found`);
      }

      // Verificar si el usuario es el autor del comentario o un administrador
      if (commentExists.userId.toString() !== userId && !isAdmin) {
        throw new Error(`You are not authorized to delete this comment`);
      }

      // Eliminar el comentario utilizando deleteOne
      await CronicaComment.deleteOne({ _id: commentId });

      return commentExists;
    } catch (error) {
      throw error;
    }
  };

  createReplyOnAComment = async (userId, commentId, reply) => {
    try {
      const commentExists = await CronicaComment.findById(commentId);

      if (!commentExists) {
        throw new Error(`The requested comment was not found`);
      }

      commentExists.replies.push({ userId: userId, reply: reply });

      const updatedComment = await commentExists.save();

      return updatedComment;
    } catch (error) {
      throw error;
    }
  };

  updateReplyOnAComment = async (userId, commentId, replyId, reply) => {
    try {
      // Verificar si el comment existe
      const commentExists = await CronicaComment.findById(commentId);

      if (!commentExists) {
        throw new Error(`The requested comment was not found`);
      }

      // Verificar si la reply existe
      const replyExists = commentExists.replies.find((reply) =>
        reply._id.equals(replyId)
      );

      if (!replyExists) {
        throw new Error(`The requested reply was not found`);
      }

      // Verificar si el usuario es el autor de la respuesta
      if (replyExists.userId.toString() !== userId) {
        throw new Error(`You are not authorized to edit this reply`);
      }

      replyExists.reply = reply;

      const updatedComment = await commentExists.save();

      return updatedComment;
    } catch (error) {
      throw error;
    }
  };

  updateReplyLike = async (userId, commentId, replyId) => {
    try {
      // Verificar si el comment existe
      const commentExists = await CronicaComment.findById(commentId);

      if (!commentExists) {
        throw new Error(`The requested comment was not found`);
      }

      // Verificar si la reply existe
      const replyExists = commentExists.replies.find((reply) =>
        reply._id.equals(replyId)
      );

      if (!replyExists) {
        throw new Error(`The requested reply was not found`);
      }

      // Verificar si el userId ya esta incluido en el array de dislikes y quitarlo
      if (replyExists.dislikes.includes(userId)) {
        replyExists.dislikes = replyExists.dislikes.filter(
          (id) => id.toString() !== userId
        );
      }

      // Verificar si el userId ya pertenece al array likes y hacer toggle segun corresponda
      if (!replyExists.likes.includes(userId)) {
        replyExists.likes.push(userId);
      } else {
        replyExists.likes = replyExists.likes.filter(
          (id) => id.toString() !== userId
        );
      }

      const updatedComment = await commentExists.save();

      return updatedComment;
    } catch (error) {
      throw error;
    }
  };

  updateReplyDislike = async (userId, commentId, replyId) => {
    try {
      // Verificar si el comment existe
      const commentExists = await CronicaComment.findById(commentId);

      if (!commentExists) {
        throw new Error(`The requested comment was not found`);
      }

      // Verificar si la reply existe
      const replyExists = commentExists.replies.find((reply) =>
        reply._id.equals(replyId)
      );

      if (!replyExists) {
        throw new Error(`The requested reply was not found`);
      }

      // Verificar si el userId ya esta incluido en el array de likes y quitarlo
      if (replyExists.likes.includes(userId)) {
        replyExists.likes = replyExists.likes.filter(
          (id) => id.toString() !== userId
        );
      }

      // Verificar si el userId ya pertenece al array dislikes y hacer toggle segun corresponda
      if (!replyExists.dislikes.includes(userId)) {
        replyExists.dislikes.push(userId);
      } else {
        replyExists.dislikes = replyExists.dislikes.filter(
          (id) => id.toString() !== userId
        );
      }

      const updatedComment = await commentExists.save();

      return updatedComment;
    } catch (error) {
      throw error;
    }
  };

  deleteReplyOnAComment = async (userId, isAdmin, commentId, replyId) => {
    try {
      // Verificar si el comment existe
      const commentExists = await CronicaComment.findById(commentId);

      if (!commentExists) {
        throw new Error(`The requested comment was not found`);
      }

      // Verificar si la reply existe
      const replyExists = commentExists.replies.find((reply) =>
        reply._id.equals(replyId)
      );

      if (!replyExists) {
        throw new Error(`The requested reply was not found`);
      }

      // Verificar si el usuario es el autor de la respuesta o un administrador
      if (replyExists.userId.toString() !== userId && !isAdmin) {
        throw new Error(`You are not authorized to delete this reply`);
      }

      commentExists.replies = commentExists.replies.filter(
        (r) => r._id.toString() !== replyId
      );

      const updatedComment = await commentExists.save();

      return updatedComment;
    } catch (error) {
      throw error;
    }
  };
}
