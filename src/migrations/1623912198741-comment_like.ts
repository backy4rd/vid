import { MigrationInterface, QueryRunner } from "typeorm";

export class commentLike1623912198741 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE comment_likes (
            user_id INT,
            comment_id INT,
            "like" BOOLEAN NOT NULL,
            PRIMARY KEY (user_id, comment_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE comment_likes`);
    }
}
