import { MigrationInterface, QueryRunner } from "typeorm";

const data = [
    "Trò Chơi",
    "Âm Nhạc",
    "Nghệ Thuật",
    "Hướng Dẫn",
    "Phim Ảnh",
    "Điện Tử",
    "Kĩ Thuật",
    "Phim Ngắn",
];

export class categories1623917020011 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const values = data.map((d) => `('${d}')`).join(",");
        await queryRunner.query(`INSERT INTO categories(category) VALUES ${values}`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const values = data.map((d) => `'${d}'`).join(",");
        await queryRunner.query(`DELETE FROM categories WHERE category IN (${values})`);
    }
}
