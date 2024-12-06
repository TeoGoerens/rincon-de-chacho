import CronicaCommentRepository from "../../repository/cronica/cronicaCommentRepository.js";
const repository = new CronicaCommentRepository();

export default class CronicaCommentController {
  // ---------- GET COMMENTS BY CRONICA ID ----------
  getAllCommentsByCronicaId = async (req, res, next) => {
    try {
      const cronicaId = req.params.cid;

      const commentsByCronica = await repository.getAllCommentsByCronicaId(
        cronicaId
      );

      res.status(200).json({
        message: `All comments from cronica ${cronicaId} have been properly retrieved`,
        commentsByCronica,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- CREATE COMMENT ON A CRONICA ----------
  createCommentOnACronica = async (req, res, next) => {
    try {
      const cronicaId = req.params.cid;
      const userId = req.user.id;
      const comment = req.body.comment;

      const newComment = await repository.createCommentOnACronica(
        userId,
        cronicaId,
        comment
      );

      res.status(200).json({
        message: `A new comment has been submitted in cronica ${cronicaId}`,
        newComment,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE LIKE ON A COMMENT ----------
  updateCommentLike = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const commentId = req.params.mid;

      const updatedComment = await repository.updateCommentLike(
        userId,
        commentId
      );

      res.status(200).json({
        message: `Like's array has been updated for comment ${commentId}`,
        updatedComment,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE DISLIKE ON A COMMENT ----------
  updateCommentDislike = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const commentId = req.params.mid;

      const updatedComment = await repository.updateCommentDislike(
        userId,
        commentId
      );

      res.status(200).json({
        message: `Dislike's array has been updated for comment ${commentId}`,
        updatedComment,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE COMMENT ON A CRONICA ----------
  updateCommentOnCronica = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const commentId = req.params.mid;
      const comment = req.body.comment;

      const updatedComment = await repository.updateCommentOnCronica(
        userId,
        commentId,
        comment
      );

      res.status(200).json({
        message: `Comment ${commentId} has been properly updated`,
        updatedComment,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- DELETE COMMENT FROM CRONICA ----------
  deleteCommentFromCronica = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.is_admin;
      const commentId = req.params.mid;

      const deletedComment = await repository.deleteCommentFromCronica(
        userId,
        isAdmin,
        commentId
      );

      res.status(200).json({
        message: `Comment ${commentId} has been properly deleted`,
        deletedComment,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- CREATE REPLY ON A COMMENT ----------
  createReplyOnAComment = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const commentId = req.params.mid;
      const reply = req.body.reply;

      const newReply = await repository.createReplyOnAComment(
        userId,
        commentId,
        reply
      );

      res.status(200).json({
        message: `Reply for comment ${commentId} has been properly created`,
        newReply,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE REPLY ON A COMMENT ----------
  updateReplyOnAComment = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const commentId = req.params.mid;
      const replyId = req.params.rid;
      const reply = req.body.reply;

      const updatedReply = await repository.updateReplyOnAComment(
        userId,
        commentId,
        replyId,
        reply
      );

      res.status(200).json({
        message: `Reply ${replyId} has been properly updated`,
        updatedReply,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE LIKE ON A REPLY ----------
  updateReplyLike = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const commentId = req.params.mid;
      const replyId = req.params.rid;

      const updatedReply = await repository.updateReplyLike(
        userId,
        commentId,
        replyId
      );

      res.status(200).json({
        message: `Reply ${replyId} has had its likes properly updated`,
        updatedReply,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- UPDATE DISLIKE ON A REPLY ----------
  updateReplyDislike = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const commentId = req.params.mid;
      const replyId = req.params.rid;

      const updatedReply = await repository.updateReplyDislike(
        userId,
        commentId,
        replyId
      );

      res.status(200).json({
        message: `Reply ${replyId} has had its dislikes properly updated`,
        updatedReply,
      });
    } catch (error) {
      next(error);
    }
  };

  // ---------- DELETE REPLY ON A COMMENT ----------
  deleteReplyOnAComment = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.is_admin;
      const commentId = req.params.mid;
      const replyId = req.params.rid;

      const updatedComment = await repository.deleteReplyOnAComment(
        userId,
        isAdmin,
        commentId,
        replyId
      );

      res.status(200).json({
        message: `Reply ${replyId} has been properly deleted`,
        updatedComment,
      });
    } catch (error) {
      next(error);
    }
  };
}
