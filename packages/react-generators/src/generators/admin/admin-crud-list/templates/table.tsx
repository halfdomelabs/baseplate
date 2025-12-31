// @ts-nocheck

import type { FragmentOf, ResultOf } from '%graphqlImports';
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

TPL_ROW_FRAGMENT;

/** UserRow fragment type for component props */
type UserRowFragment = ResultOf<typeof userRowFragment>;

TPL_DELETE_MUTATION;

interface Props {
  items: FragmentOf<typeof userRowFragment>[];
  TPL_EXTRA_PROPS;
}

export function TPL_COMPONENT_NAME(
  TPL_DESTRUCTURED_PROPS: Props,
): ReactElement {
  TPL_ACTION_HOOKS;

  // Unmask the fragment data for rendering
  const users = readFragment(userRowFragment, items);

  if (users.length === 0) {
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
          {users.map((item) => (
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
