import { SidebarLayout } from '@halfdomelabs/ui-components';
import { useContext } from 'react';

import SidebarFooterContentContext from './context/ModelsFooterContentContext';

export function ModelsLayoutFooter(): JSX.Element {
  const { content } = useContext(SidebarFooterContentContext);

  return <SidebarLayout.ContentFooter>{content}</SidebarLayout.ContentFooter>;
}
