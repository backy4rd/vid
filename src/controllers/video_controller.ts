import * as path from "path";
import * as sharp from "sharp";
import { NextFunction, Request, Response } from "express";
import { expect } from "chai";
import { getRepository, In } from "typeorm";

import staticService from "../services/static_service";
import { listRegex } from "../commons/regexs";
import asyncHandler from "../decorators/async_handler";
import { isNumberIfExist, mustExist, mustExistOne } from "../decorators/validate_decorators";
import { mustInRangeIfExist, mustMatchIfExist } from "../decorators/assert_decorators";
import { Category } from "../entities/Category";
import { Video, THUMBNAIL_HEIGHT } from "../entities/Video";
import { VideoLike } from "../entities/VideoLike";
import { WatchedVideo } from "../entities/WatchedVideo";
import extractFrame from "../utils/extract_frame";
import getVideoDuration from "../utils/get_video_duration";
import { randomString } from "../utils/string_function";
import extractFilenameFromPath from "../utils/extract_filename_from_path";

const tempPath = path.join(__dirname, "../../tmp");

class VideoController {
    @asyncHandler
    @mustExist("body.title", "files.video")
    @mustMatchIfExist("body.categories", listRegex)
    public async uploadVideo(req: Request, res: Response, next: NextFunction) {
        const { title, description, categories } = req.body;
        const { video } = req.files;

        expect(video.mimetype, "400:invalid video").to.match(/^video/);

        const uploadedAt = new Date(); // manualy insert uploadedAt to avoid incorrect cause by post request
        const duration = await getVideoDuration(video.path);
        const thumbnailName = randomString(32) + ".png";
        const thumbnailPath = path.join(tempPath, thumbnailName);

        await extractFrame(video.path, {
            dest: thumbnailPath,
            seek: duration / 2,
            height: THUMBNAIL_HEIGHT,
        });

        req.local.tempFilePaths.push(thumbnailPath);

        await staticService.postVideo(video);

        await staticService.postThumbnail({
            mimetype: "image/png",
            path: thumbnailPath,
            name: thumbnailName,
            type: "png",
        });

        const videoRepository = getRepository(Video);

        const _video = videoRepository.create({
            id: await Video.generateId(),
            title: title,
            duration: duration,
            videoPath: "/videos/" + video.name,
            thumbnailPath: "/thumbnails/" + thumbnailName,
            description: description,
            views: 0,
            uploadedAt: uploadedAt,
            uploadedBy: { id: req.local.auth.id },
        });

        if (categories) {
            _video.categories = await getRepository(Category).find({
                where: { category: In(categories.split(",")) },
            });
        }

        // use .save to also insert category entities
        await videoRepository.save(_video);

        res.status(201).json({
            data: _video,
        });

        next();
    }

    @asyncHandler
    public async getVideo(req: Request, res: Response) {
        const { video_id } = req.params;

        const videoRepository = getRepository(Video);

        const video = await videoRepository
            .createQueryBuilder("videos")
            .leftJoinAndSelect("videos.categories", "categories")
            .innerJoin("videos.uploadedBy", "users")
            .addSelect(["users.username", "users.iconPath"])
            .loadRelationCountAndMap("videos.like", "videos.videoLikes", "a", (qb) =>
                qb.andWhere("a.like = true"),
            )
            .loadRelationCountAndMap("videos.dislike", "videos.videoLikes", "a", (qb) =>
                qb.andWhere("a.like = false"),
            )
            .loadRelationCountAndMap("videos.totalComments", "videos.comments")
            .addSelect(
                (qb) =>
                    qb
                        .select("vl.like", "react")
                        .from(VideoLike, "vl")
                        .where("vl.video_id = :videoId AND vl.user_id = :userId", {
                            videoId: video_id,
                            userId: req.local.auth?.id,
                        }),
                "videos_react",
            )
            .where({ id: video_id })
            .getOne();

        console.log({
            videoId: video_id,
            userId: req.local.auth?.id,
        });

        res.status(200).json({
            data: video,
        });

        await videoRepository.update(video.id, { views: video.views + 1 });

        // store history if user logged in
        if (req.local.auth) {
            const { id } = req.local.auth;
            const watchedVideoRepository = getRepository(WatchedVideo);

            const watchedVideo = await watchedVideoRepository.findOne({
                userId: id,
                videoId: video_id,
            });

            // update watchedVideo timestamps if it was watched before
            if (watchedVideo) {
                watchedVideo.watchedAt = new Date();
                await watchedVideoRepository.update(
                    { userId: id, videoId: video_id },
                    { watchedAt: new Date() },
                );

                // if not, insert new watchedVideo to db
            } else {
                await watchedVideoRepository.insert(
                    watchedVideoRepository.create({
                        userId: id,
                        videoId: video_id,
                        watchedAt: new Date(),
                    }),
                );
            }
        }
    }

    @asyncHandler
    @isNumberIfExist("query.offset", "query.limit")
    @mustInRangeIfExist("query.offset", 0, Infinity)
    @mustInRangeIfExist("query.limit", 0, 100)
    public async getVideos(req: Request, res: Response) {
        const offset = +req.query.offset || 0;
        const limit = +req.query.limit || 30;
        const category = req.query.category as string;

        let videoQueryBuilder = getRepository(Video)
            .createQueryBuilder("videos")
            .innerJoin("videos.uploadedBy", "users")
            .addSelect(["users.username", "users.iconPath"])
            .leftJoinAndSelect("videos.categories", "categories")
            .orderBy("videos.uploadedAt", "DESC")
            .skip(offset)
            .take(limit);

        if (category) {
            videoQueryBuilder = videoQueryBuilder.where("categories.category = :category", {
                category: category,
            });
        }

        const videos = await videoQueryBuilder.getMany();

        res.status(200).json({
            data: videos,
        });
    }

    @asyncHandler
    @mustExist("body.reaction")
    public async reactVideo(req: Request, res: Response) {
        const { video_id } = req.params;
        const { reaction } = req.body;

        expect(reaction, "400:invalid parameters").to.be.oneOf(["like", "dislike"]);

        const videoLikeRepository = getRepository(VideoLike);
        const isLike = reaction === "like";

        const videoLike = videoLikeRepository.create({
            videoId: video_id,
            userId: req.local.auth.id,
            like: isLike,
        });

        await videoLikeRepository.save(videoLike);

        res.status(200).json({
            data: { message: isLike ? "liked" : "disliked" },
        });
    }

    @asyncHandler
    public async deleteVideoReaction(req: Request, res: Response) {
        const { video_id } = req.params;

        await getRepository(VideoLike).delete({
            videoId: video_id,
            userId: req.local.auth.id,
        });

        res.status(200).json({
            data: { message: "deleted reaction" },
        });
    }

    @asyncHandler
    @isNumberIfExist("query.offset", "query.limit")
    @mustInRangeIfExist("query.offset", 0, Infinity)
    @mustInRangeIfExist("query.limit", 0, 100)
    public async getSubscriptionVideos(req: Request, res: Response) {
        const { id } = req.local.auth;
        const offset = +req.query.offset || 0;
        const limit = +req.query.limit || 30;

        const videos = await getRepository(Video)
            .createQueryBuilder("videos")
            .leftJoinAndSelect("videos.categories", "categories")
            .innerJoin("videos.uploadedBy", "users")
            .addSelect(["users.username", "users.iconPath"])
            .innerJoin(
                (subquery) => {
                    return subquery
                        .select("user_id")
                        .from("subscriptions", "sub")
                        .where("sub.subscriber_id = :subscriberId", { subscriberId: id });
                },
                "subscriptions",
                "subscriptions.user_id = videos.uploadedBy",
            )
            .orderBy("videos.uploadedAt", "DESC")
            .skip(offset)
            .take(limit)
            .getMany();

        res.status(200).json({
            data: videos,
        });
    }

    @asyncHandler
    @mustExistOne("body.title", "body.description", "body.categories", "files.thumbnail")
    @mustMatchIfExist("body.categories", listRegex)
    public async updateVideo(req: Request, res: Response, next: NextFunction) {
        const { title, description, categories } = req.body;
        const { thumbnail } = req.files;
        const { video } = req.local;

        video.title = title || video.title;
        video.description = description || video.description;

        if (categories) {
            video.categories = await getRepository(Category).find({
                where: { category: In(categories.split(",")) },
            });
        }

        if (thumbnail) {
            expect(thumbnail.mimetype, "400:invalid thumbnail").to.match(/^image/);

            video.validate();

            const resizedThumbnailName = randomString(32) + ".jpg";
            const resizedThumbnailPath = path.join(tempPath, resizedThumbnailName);

            await sharp(thumbnail.path)
                .resize({ height: THUMBNAIL_HEIGHT })
                .jpeg()
                .toFile(resizedThumbnailPath);

            req.local.tempFilePaths.push(resizedThumbnailPath);

            await staticService.postThumbnail({
                mimetype: "image/jpeg",
                name: resizedThumbnailName,
                path: resizedThumbnailPath,
                type: "jpg",
            });

            await staticService.deleteThumbnail(extractFilenameFromPath(video.thumbnailPath));

            video.thumbnailPath = "/thumbnails/" + resizedThumbnailName;
        }

        await getRepository(Video).save(video);

        res.status(200).json({
            data: video,
        });

        next();
    }

    @asyncHandler
    public async deleteVideo(req: Request, res: Response) {
        const { video } = req.local;

        await staticService.deleteVideo(extractFilenameFromPath(video.videoPath));
        await staticService.deleteThumbnail(extractFilenameFromPath(video.thumbnailPath));

        await getRepository(Video).delete({ id: video.id });

        res.status(200).json({
            data: { message: "deleted video" },
        });
    }

    @asyncHandler
    @isNumberIfExist("query.offset", "query.limit")
    @mustInRangeIfExist("query.offset", 0, Infinity)
    @mustInRangeIfExist("query.limit", 0, 100)
    public async getLikedVideos(req: Request, res: Response) {
        const offset = +req.query.offset || 0;
        const limit = +req.query.limit || 30;

        const videos = await getRepository(Video)
            .createQueryBuilder("videos")
            .leftJoinAndSelect("videos.categories", "categories")
            .innerJoin("videos.videoLikes", "video_likes")
            .innerJoin("videos.uploadedBy", "users")
            .addSelect(["users.username", "users.iconPath"])
            .where("video_likes.like = :isLiked", { isLiked: true })
            .andWhere("video_likes.user_id = :userId", { userId: req.local.auth.id })
            .skip(offset)
            .take(limit)
            .getMany();

        res.status(200).json({
            data: videos,
        });
    }

    @asyncHandler
    @isNumberIfExist("query.offset", "query.limit")
    @mustInRangeIfExist("query.offset", 0, Infinity)
    @mustInRangeIfExist("query.limit", 0, 100)
    public async getRelateVideos(req: Request, res: Response) {
        const { video_id } = req.params;
        const offset = +req.query.offset || 0;
        const limit = +req.query.limit || 30;

        const videoRepository = getRepository(Video);

        const video = await videoRepository.findOne(video_id, {
            select: ["id"],
            relations: ["categories"],
        });

        let relateVideosQueryBuilder = videoRepository
            .createQueryBuilder("videos")
            .leftJoinAndSelect("videos.categories", "categories")
            .innerJoin("videos.uploadedBy", "users")
            .addSelect(["users.username", "users.iconPath"])
            .where("videos.id <> :videoId", { videoId: video_id })
            .skip(offset)
            .take(limit)
            .orderBy("videos.uploadedAt", "DESC");

        if (video.categories.length === 0) {
            relateVideosQueryBuilder = relateVideosQueryBuilder.andWhere("categories.id IS NULL");
        } else {
            relateVideosQueryBuilder = relateVideosQueryBuilder.andWhere(
                "categories.id IN (:...categoryIds)",
                {
                    categoryIds: video.categories.map((category) => category.id),
                },
            );
        }

        const relateVideos = await relateVideosQueryBuilder.getMany();

        res.status(200).json({
            data: relateVideos,
        });
    }
}

export default new VideoController();
