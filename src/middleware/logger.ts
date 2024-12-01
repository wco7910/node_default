import { g_DataSource } from '../serverInit/database';

const pathList = [
  {
    method: 'POST',
    path: '/',
    description: '',
  },
];

export const logger = async (params: any) => {
  const index = pathList.findIndex(
    (element: any) =>
      element.path == params.path && element.method == params.method
  );

  if (index != -1) {
    await g_DataSource.getRepository('ActivityLog').save({
      content: pathList[index].description,
      ip: params.user.ip,
      who: params.user.id,
    });
  }
};
