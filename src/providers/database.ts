import * as path from "path";
import { Connection, createConnection, ConnectionOptionsReader } from "typeorm";

class Database {
    public static CONNECTION_OPTION_NAME = "default";

    public connection: Connection;

    public async createConnection(): Promise<void> {
        const reader = new ConnectionOptionsReader({ root: path.join(__dirname, "..") });
        const option = await reader.get(Database.CONNECTION_OPTION_NAME);

        this.connection = await createConnection(option);
    }
}

export default new Database();
