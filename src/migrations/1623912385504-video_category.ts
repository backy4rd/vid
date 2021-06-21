import { MigrationInterface, QueryRunner } from "typeorm";

export class videoCategory1623912385504 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE video_categories (
            video_id CHAR(10),
            category_id INT,
            PRIMARY KEY (video_id, category_id),
            FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )`);

        const _1000000To9999999 = ~~(Math.random() * 9000000) + 1000000;

        await queryRunner.query(
            `ALTER SEQUENCE categories_id_seq RESTART WITH ${_1000000To9999999}`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE video_categories`);
    }
}
