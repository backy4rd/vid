import { MigrationInterface, QueryRunner } from "typeorm";

export class category1623911895814 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE categories (
            id SERIAL PRIMARY KEY,
            category VARCHAR(32) NOT NULL
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE categories`);
    }
}
