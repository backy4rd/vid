import { MigrationInterface, QueryRunner } from "typeorm";

export class watchedVideo1623912258075 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE watched_videos (
            user_id INT,
            video_id CHAR(10),
            watched_at TIMESTAMP NOT NULL,
            PRIMARY KEY (user_id, video_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE watched_videos`);
    }
}
