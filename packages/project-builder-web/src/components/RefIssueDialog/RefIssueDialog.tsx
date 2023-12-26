import { Button, Dialog, Table } from '@halfdomelabs/ui-components';
import { useEffect, useRef } from 'react';

import {
  UseDeleteReferenceDialogRequestOptions,
  useDeleteReferenceDialogState,
} from '@src/hooks/useDeleteReferenceDialog';
import { useProjectConfig } from '@src/hooks/useProjectConfig';

export function RefIssueDialog(): JSX.Element {
  const { dialogOptions, setDialogOptions } = useDeleteReferenceDialogState();
  const { definitionContainer } = useProjectConfig();

  // We need to store the text content in a ref because the Dialog component
  // will transition to fade so we need to cache the text while we close.
  const textOptionsCached =
    useRef<null | UseDeleteReferenceDialogRequestOptions>();

  useEffect(() => {
    if (dialogOptions) {
      textOptionsCached.current = dialogOptions;
    }
  }, [dialogOptions]);

  const { issues } = dialogOptions ?? {};

  return (
    <Dialog
      open={!!dialogOptions}
      onOpenChange={() => setDialogOptions(undefined)}
    >
      <Dialog.Content width="md">
        <Dialog.Header>
          <Dialog.Title>Unable to delete</Dialog.Title>
        </Dialog.Header>
        <p>
          There were other references that needed to be fixed before you could
          delete this item.
        </p>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Reference</Table.Head>
              <Table.Head>Type</Table.Head>
              <Table.Head>Entity</Table.Head>
            </Table.Row>
          </Table.Header>
          {issues?.map((issue) => {
            const entity = definitionContainer.entities.find(
              (e) => e.id === issue.entityId,
            );
            return (
              <Table.Row key={issue.ref.path.join('.')}>
                <Table.Cell>{issue.ref.path.join('.')}</Table.Cell>
                <Table.Cell>{entity?.type.name ?? 'Unknown Entity'}</Table.Cell>
                <Table.Cell>{entity?.name ?? ''}</Table.Cell>
              </Table.Row>
            );
          })}
        </Table>
        <Dialog.Footer>
          <Button
            onClick={() => {
              setDialogOptions(undefined);
            }}
          >
            OK
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
