import { MigrationInterface, QueryRunner } from "typeorm";

export class subscription1623912344271 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE subscriptions (
            user_id INT,
            subscriber_id INT,
            PRIMARY KEY (user_id, subscriber_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (subscriber_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE subscriptions`);
    }
}
