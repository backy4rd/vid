import { MigrationInterface, QueryRunner } from "typeorm";

export class video1623911978508 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE videos (
            id CHAR(10) PRIMARY KEY,
            title VARCHAR(128) NOT NULL,
            video_path VARCHAR(128) NOT NULL,
            thumbnail_path VARCHAR(128) NOT NULL,
            duration int NOT NULL,
            description VARCHAR(5000),
            views INT NOT NULL DEFAULT 0,
            uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            uploaded_by int NOT NULL,
            FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE videos`);
    }
}
