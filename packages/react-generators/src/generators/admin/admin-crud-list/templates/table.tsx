// @ts-nocheck

import type { ReactElement } from 'react';

import { readFragment } from '%graphqlImports';
import {
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from '%reactComponentsImports';

TPL_ITEMS_FRAGMENT;

interface Props {
  TPL_PROPS;
}

export function TPL_COMPONENT_NAME(
  TPL_DESTRUCTURED_PROPS: Props,
): ReactElement {
  TPL_ACTION_HOOKS;

  // Unmask the fragment data for rendering
  const itemsData = readFragment(TPL_ITEMS_FRAGMENT_NAME, items);

  if (itemsData.length === 0) {
    return (
      <Alert variant="default">
        <AlertTitle>
          No <TPL_PLURAL_MODEL /> found.
        </AlertTitle>
      </Alert>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TPL_HEADERS />
          </TableRow>
        </TableHeader>
        <TableBody>
          {itemsData.map((item) => (
            <TableRow key={item.id}>
              <TPL_CELLS />
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TPL_ACTION_SIBLING_COMPONENTS />
    </>
  );
}
