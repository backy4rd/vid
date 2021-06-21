import { MigrationInterface, QueryRunner } from "typeorm";

export class user1623911786713 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(` CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(32) NOT NULL UNIQUE,
            password VARCHAR(100) NOT NULL,
            first_name VARCHAR(32) NOT NULL,
            last_name VARCHAR(32) NOT NULL,
            female BOOLEAN NOT NULL,
            banner_path VARCHAR(128) NOT NULL DEFAULT '/photos/default-banner.png',
            avatar_path VARCHAR(128) NOT NULL DEFAULT '/photos/default-avatar.png',
            icon_path VARCHAR(128) NOT NULL DEFAULT '/photos/default-icon.png',
            joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`);

        const _1000000To9999999 = ~~(Math.random() * 9000000) + 1000000;

        await queryRunner.query(`ALTER SEQUENCE users_id_seq RESTART WITH ${_1000000To9999999}`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE users`);
    }
}
