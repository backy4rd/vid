import { Request, Response } from "express";
import { getRepository } from "typeorm";

import { Video } from "../entities/Video";
import { User } from "../entities/User";
import asyncHandler from "../decorators/async_handler";
import { isDateFormatIfExist, isNumberIfExist, mustExist } from "../decorators/validate_decorators";
import { mustInRangeIfExist } from "../decorators/assert_decorators";

class SearchController {
    @asyncHandler
    @mustExist("query.q")
    @isDateFormatIfExist("query.max_upload_date")
    @isNumberIfExist("query.offset", "query.limit", "query.min_duration")
    @mustInRangeIfExist("query.offset", 0, Infinity)
    @mustInRangeIfExist("query.limit", 0, 100)
    public async searchVideos(req: Request, res: Response) {
        const q = req.query.q as string;
        const max_upload_date = req.query.max_upload_date as string;
        const min_duration = req.query.min_duration as string;
        const category = req.query.category as string;
        const sort = req.query.sort as string;
        const offset = +req.query.offset || 0;
        const limit = +req.query.limit || 30;

        let videoQueryBuilder = getRepository(Video)
            .createQueryBuilder("videos")
            .leftJoinAndSelect("videos.categories", "categories")
            .innerJoin("videos.uploadedBy", "users")
            .addSelect(["users.username", "users.iconPath"])
            .where("LOWER(title) LIKE :q", { q: `%${q.toLowerCase()}%` })
            .skip(offset)
            .take(limit);

        if (min_duration) {
            videoQueryBuilder = videoQueryBuilder.andWhere("videos.duration <= :minDuration", {
                minDuration: +min_duration,
            });
        }

        if (max_upload_date) {
            videoQueryBuilder = videoQueryBuilder.andWhere("videos.uploadedAt >= :maxUploadDate", {
                maxUploadDate: new Date(max_upload_date),
            });
        }

        if (category) {
            videoQueryBuilder = videoQueryBuilder.andWhere("categories.category = :category", {
                category: category,
            });
        }

        switch (sort) {
            case "views":
                videoQueryBuilder = videoQueryBuilder.orderBy("videos.views", "DESC");
                break;
            default:
                videoQueryBuilder = videoQueryBuilder.orderBy("videos.uploadedAt", "DESC");
                break;
        }

        const videos = await videoQueryBuilder.getMany();

        res.status(200).json({
            data: videos,
        });
    }

    @asyncHandler
    @mustExist("query.q")
    @isNumberIfExist("query.offset", "query.limit")
    @mustInRangeIfExist("query.offset", 0, Infinity)
    @mustInRangeIfExist("query.limit", 0, 100)
    public async searchUsers(req: Request, res: Response) {
        const q = req.query.q as string;
        const offset = +req.query.offset || 0;
        const limit = +req.query.limit || 30;

        const wildcardQuery = `%${q.toLowerCase()}%`;

        let users = await getRepository(User)
            .createQueryBuilder("users")
            .loadRelationCountAndMap("users.subscribers", "users.subscribers")
            .select(["users.firstName", "users.lastName", "users.username", "users.iconPath"])
            .where("LOWER(username) LIKE :q", { q: wildcardQuery })
            .orWhere("LOWER(CONCAT(first_name, ' ', last_name)) LIKE :q", { q: wildcardQuery })
            .skip(offset)
            .take(limit)
            .getMany();

        res.status(200).json({
            data: users,
        });
    }
}

export default new SearchController();
