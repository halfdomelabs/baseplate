import { createFileRoute, notFound, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/apps/packages/$key/')({
  loader: ({ params: { key }, context: { pkg } }) => {
    if (!pkg) throw notFound();
    const pkgType = pkg.type as string;
    if (pkgType === 'node-library') {
      throw redirect({
        to: '/apps/packages/$key/node-library',
        params: { key },
      });
    }
    throw new Error(`Unknown package type: ${pkg.type}`);
  },
});
