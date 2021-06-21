import * as path from "path";
import { ConnectionOptions } from "typeorm";
import env from "./providers/env";

export default [
    {
        type: "postgres",
        host: env.DB_HOST,
        port: env.DB_PORT,
        username: env.DB_USERNAME,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        synchronize: false,
        logging: env.NODE_ENV === "development" ? ["query"] : false,
        entities: [path.join(__dirname, "./entities/*{.ts,.js}")],
        migrations: [path.join(__dirname, "./migrations/*{.ts,.js}")],
        cli: {
            migrationsDir: path.join(__dirname, "./migrations"),
            entitiesDir: path.join(__dirname, "./entities"),
        },
    },
    {
        name: "seed",
        type: "postgres",
        host: env.DB_HOST,
        port: env.DB_PORT,
        username: env.DB_USERNAME,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        synchronize: false,
        logging: env.NODE_ENV === "development" ? ["query"] : false,
        migrations: [path.join(__dirname, "./seeds/*{.ts,.js}")],
        migrationsTableName: "seeds",
        cli: {
            migrationsDir: path.join(__dirname, "./seeds"),
        },
    },
] as Array<ConnectionOptions>;
