import { AdminAppConfig } from '@src/schema';
import { AppEntryBuilder } from '../appEntryBuilder';

export function compileAdminSections(
  builder: AppEntryBuilder<AdminAppConfig>
): unknown[] {
  builder.addDescriptor('admin/root.json', {
    name: 'admin',
    generator: '@baseplate/react/admin/admin-home',
  });

  return ['admin/root'];
}
