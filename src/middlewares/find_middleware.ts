import { expect } from "chai";
import { Request, Response, NextFunction } from "express";
import { getRepository } from "typeorm";

import asyncHander from "../decorators/async_handler";
import { Comment } from "../entities/Comment";
import { User } from "../entities/User";
import { Video } from "../entities/Video";

class FindMiddleware {
    @asyncHander
    public async isVideoExist(req: Request, res: Response, next: NextFunction) {
        const { video_id } = req.params;

        const countVideo = await getRepository(Video).count({ id: video_id });
        expect(countVideo, "404:video not found").to.equal(1);

        next();
    }

    @asyncHander
    public async isCommentExistInVideo(req: Request, res: Response, next: NextFunction) {
        const { video_id } = req.params;
        const comment_id = +req.params.comment_id;

        const countVideo = await getRepository(Comment).count({
            id: comment_id,
            video: { id: video_id },
        });

        expect(countVideo, "404:comment not found").to.equal(1);

        next();
    }

    @asyncHander
    public async isUserExist(req: Request, res: Response, next: NextFunction) {
        const { username } = req.params;

        const countUser = await getRepository(User).count({ username: username });
        expect(countUser, "404:user not found").to.equal(1);

        next();
    }
}

export default new FindMiddleware();
