// @ts-nocheck

import type { ReactElement } from 'react';

import {
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from '%reactComponentsImports';

interface Props {
  items: TPL_ROW_FRAGMENT[];
  TPL_EXTRA_PROPS;
}

export function TPL_COMPONENT_NAME(
  TPL_DESTRUCTURED_PROPS: Props,
): ReactElement {
  TPL_ACTION_HOOKS;

  if (items.length === 0) {
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
          {items.map((item) => (
            <TableRow key={item.id}>
              <TPL_CELLS />
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {TPL_ACTION_SIBLING_COMPONENTS}
    </>
  );
}
