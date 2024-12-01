import 'reflect-metadata';
import { DataSource } from 'typeorm';
import entityHanler from './entity';

export let g_DataSource: DataSource = null;

const databaseHandler = async () => {
  const models = await entityHanler();
  const entities = models.entities;

  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PWD,
    synchronize: process.env.NODE_ENV === 'development' ? true : false,
    logging: false,
    entities: [...entities],
    migrations: [],
    subscribers: [],
  })
    .initialize()
    .then(async (dataSource: DataSource) => {
      g_DataSource = dataSource;
    })
    .catch((error) => console.log(error));
};

export default databaseHandler;
