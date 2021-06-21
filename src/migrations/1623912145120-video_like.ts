import { MigrationInterface, QueryRunner } from "typeorm";

export class videoLike1623912145120 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE video_likes (
            user_id INT,
            video_id CHAR(10),
            "like" BOOLEAN NOT NULL,
            PRIMARY KEY (user_id, video_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE video_likes`);
    }
}
