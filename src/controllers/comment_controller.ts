import { expect } from "chai";
import { Request, Response } from "express";
import { getRepository } from "typeorm";

import asyncHandler from "../decorators/async_handler";
import { isNumberIfExist, mustExist, mustExistOne } from "../decorators/validate_decorators";
import { mustInRangeIfExist } from "../decorators/assert_decorators";
import { Comment } from "../entities/Comment";
import { CommentLike } from "../entities/CommentLike";

class CommentController {
    @asyncHandler
    @mustExist("body.content")
    public async postComment(req: Request, res: Response) {
        const { video_id } = req.params;
        const { content } = req.body;
        const { id } = req.local.auth;

        const commentRepository = getRepository(Comment);

        const newComment = commentRepository.create({
            content: content,
            user: { id: id },
            video: { id: video_id },
        });

        await commentRepository.insert(newComment);

        res.status(201).json({
            data: newComment,
        });
    }

    @asyncHandler
    @mustExist("body.content")
    public async replyComment(req: Request, res: Response) {
        const { video_id } = req.params;
        const { content } = req.body;
        const { id } = req.local.auth;
        const comment_id = +req.params.comment_id;

        const commentRepository = getRepository(Comment);

        const comment = await commentRepository.findOne(
            { id: comment_id },
            { relations: ["parent"] },
        );
        expect(comment.parent, "400:nested comment is not allowed").to.be.null;

        const newComment = commentRepository.create({
            content: content,
            user: { id: id },
            video: { id: video_id },
            parent: { id: comment_id },
        });

        await commentRepository.insert(newComment);

        res.status(201).json({
            data: newComment,
        });
    }

    @asyncHandler
    @isNumberIfExist("query.offset", "query.limit")
    @mustInRangeIfExist("query.offset", 0, Infinity)
    @mustInRangeIfExist("query.limit", 0, 100)
    public async getVideoComments(req: Request, res: Response) {
        const { video_id } = req.params;
        const offset = +req.query.offset || 0;
        const limit = +req.query.limit || 30;

        const comments = await getRepository(Comment)
            .createQueryBuilder("comments")
            .leftJoin("comments.user", "users")
            .addSelect(["users.username", "users.iconPath"])
            .loadRelationCountAndMap("comments.totalReplies", "comments.comments")
            .loadRelationCountAndMap("comments.like", "comments.commentLikes", "a", (qb) =>
                qb.andWhere("a.like = true"),
            )
            .loadRelationCountAndMap("comments.dislike", "comments.commentLikes", "b", (qb) =>
                qb.andWhere("b.like = false"),
            )
            .addSelect(
                (qb) =>
                    qb
                        .select("cl.like", "react")
                        .from(CommentLike, "cl")
                        .where("cl.comment_id = comments.id AND cl.user_id = :userId", {
                            userId: req.local.auth?.id,
                        }),
                "comments_react",
            )
            .where("comments.video_id = :videoId", { videoId: video_id })
            .andWhere("comments.parent_id IS NULL")
            .orderBy("comments.createdAt", "DESC")
            .skip(offset)
            .take(limit)
            .getMany();

        res.status(200).json({
            data: comments,
        });
    }

    @asyncHandler
    @isNumberIfExist("query.offset", "query.limit")
    @mustInRangeIfExist("query.offset", 0, Infinity)
    @mustInRangeIfExist("query.limit", 0, 100)
    public async getCommentReplies(req: Request, res: Response) {
        const offset = +req.query.offset || 0;
        const limit = +req.query.limit || 30;
        const comment_id = +req.params.comment_id;

        const comments = await getRepository(Comment)
            .createQueryBuilder("comments")
            .leftJoin("comments.user", "users")
            .addSelect(["users.username", "users.iconPath"])
            .loadRelationCountAndMap("comments.like", "comments.commentLikes", "a", (qb) =>
                qb.andWhere("a.like = true"),
            )
            .loadRelationCountAndMap("comments.dislike", "comments.commentLikes", "b", (qb) =>
                qb.andWhere("b.like = false"),
            )
            .addSelect(
                (qb) =>
                    qb
                        .select("cl.like", "react")
                        .from(CommentLike, "cl")
                        .where("cl.comment_id = comments.id AND cl.user_id = :userId", {
                            userId: req.local.auth?.id,
                        }),
                "comments_react",
            )
            .where("comments.parent_id = :parentId", { parentId: comment_id })
            .orderBy("comments.createdAt", "DESC")
            .skip(offset)
            .take(limit)
            .getMany();

        res.status(200).json({
            data: comments,
        });
    }

    @asyncHandler
    @mustExist("body.reaction")
    public async reactComment(req: Request, res: Response) {
        const { reaction } = req.body;
        const comment_id = +req.params.comment_id;

        expect(reaction, "400:invalid parameters").to.be.oneOf(["like", "dislike"]);

        const commentLikeRepository = getRepository(CommentLike);
        const isLike = reaction === "like";

        const videoLike = commentLikeRepository.create({
            commentId: comment_id,
            userId: req.local.auth.id,
            like: isLike,
        });

        await commentLikeRepository.save(videoLike);

        res.status(200).json({
            data: { message: isLike ? "liked" : "disliked" },
        });
    }

    @asyncHandler
    public async deleteCommentReaction(req: Request, res: Response) {
        const comment_id = +req.params.comment_id;

        await getRepository(CommentLike).delete({
            commentId: comment_id,
            userId: req.local.auth.id,
        });

        res.status(200).json({
            data: { message: "deleted reaction" },
        });
    }

    @asyncHandler
    @mustExistOne("body.content")
    public async updateComment(req: Request, res: Response) {
        const { content } = req.body;
        const { comment } = req.local;

        comment.content = content;

        await getRepository(Comment).update({ id: comment.id }, comment);

        res.status(200).json({
            data: comment,
        });
    }

    @asyncHandler
    public async deleteComment(req: Request, res: Response) {
        const { comment } = req.local;

        await getRepository(Comment).delete({ id: comment.id });

        res.status(200).json({
            data: { message: "deleted comment" },
        });
    }
}

export default new CommentController();
