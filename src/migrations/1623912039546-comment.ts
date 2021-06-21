import { MigrationInterface, QueryRunner } from "typeorm";

export class comment1623912039546 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE comments (
            id SERIAL PRIMARY KEY,
            content VARCHAR(2000) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            video_id CHAR(10) NOT NULL,
            user_id INT NOT NULL,
            parent_id INT,
            FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
        )`);

        const _1000000To9999999 = ~~(Math.random() * 9000000) + 1000000;

        await queryRunner.query(`ALTER SEQUENCE comments_id_seq RESTART WITH ${_1000000To9999999}`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE comments`);
    }
}
