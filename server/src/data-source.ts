import { DataSource } from "typeorm"
import { User } from "./entities/User"
import { Post } from "./entities/Post"
const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: process.env.DB_USERNAME_DEV,
    password: process.env.DB_PASSWORD_DEV,
    database: "FullstackSQL",
    synchronize: true,
    logging: true,
    entities: [User,Post],
    subscribers: [],
    migrations: [],
 })
export default AppDataSource