import fs from 'fs';
import path from 'path';
const route_path = 'apis';

const entities = [];
const entityHandler = async () => {
  const loadEntity = async (path, subPath, isCtrl) => {
    const files = await fs.readdirSync(path + subPath, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) {
        await loadEntity(
          path,
          subPath + '/' + file.name,
          file.name === 'entity'
        );
      } else if (isCtrl && file.name.match(/\.(js|ts)$/) !== null) {
        const entityClass = await import(
          `../${route_path}` + subPath + '/' + file.name
        );

        const className = Object.keys(entityClass)?.[0] || null;
        if (className) {
          entities.push(entityClass[className]);
        }
      }
    }
  };

  await loadEntity(`#/${route_path}`, '', false);
  entities.sort((a, b) => (a.size > b.size ? 1 : a.size < b.size ? -1 : 0));
  return { entities };
};

export default entityHandler;
