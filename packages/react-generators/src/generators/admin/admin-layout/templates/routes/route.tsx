// @ts-nocheck

import type React from 'react';

import { RequireAuth } from '%authComponentsImports';
import { createFileRoute } from '@tanstack/react-router';

import { AdminLayout } from '../../components/admin-layout/admin-layout.js';

export const Route = createFileRoute('/admin')({
  component: AuthenticatedAdminLayout,
});

function AuthenticatedAdminLayout(): React.ReactElement {
  return (
    <RequireAuth>
      <AdminLayout />
    </RequireAuth>
  );
}
