
const denyList = [
  {
    role: 'admin',
    path: '/',
  },
];

const rbac = (params: any) => {
  return (
    denyList.findIndex(
      (element: any) =>
        element.role == params?.role && params?.path?.startsWith(element.path)
    ) === -1
  );
};

export default rbac;
