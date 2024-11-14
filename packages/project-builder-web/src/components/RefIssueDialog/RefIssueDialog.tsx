import type { DefinitionEntity } from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { Button, Dialog, Table } from '@halfdomelabs/ui-components';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import type { UseDeleteReferenceDialogRequestOptions } from '@src/hooks/useDeleteReferenceDialog';

import { useDeleteReferenceDialogState } from '@src/hooks/useDeleteReferenceDialog';
import { getEntityTypeUrl } from '@src/services/entity-type';

export function RefIssueDialog(): React.JSX.Element {
  const { dialogOptions, setDialogOptions } = useDeleteReferenceDialogState();
  const { definitionContainer } = useProjectDefinition();
  const { entities } = definitionContainer;

  // We need to store the text content in a ref because the Dialog component
  // will transition to fade so we need to cache the text while we close.
  const dialogOptionsCached =
    useRef<null | UseDeleteReferenceDialogRequestOptions>();

  useEffect(() => {
    if (dialogOptions) {
      dialogOptionsCached.current = dialogOptions;
    }
  }, [dialogOptions]);

  const { issues } = dialogOptions ?? dialogOptionsCached.current ?? {};

  return (
    <Dialog
      open={!!dialogOptions}
      onOpenChange={() => {
        setDialogOptions(undefined);
      }}
    >
      <Dialog.Content width="lg">
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
              <Table.Head>Entity</Table.Head>
              <Table.Head>Path</Table.Head>
              <Table.Head>Referenced Entity</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {issues?.map((issue) => {
              const entity = entities.find((e) => e.id === issue.entityId);
              const issuePath = issue.ref.path.join('.');
              let referenceParent: DefinitionEntity | undefined;
              for (const e of entities) {
                const entityPath = e.path.join('.');
                if (
                  issuePath.startsWith(entityPath) &&
                  (!referenceParent ||
                    referenceParent.path.length < entityPath.length)
                ) {
                  referenceParent = e;
                }
              }
              const pathInParent = referenceParent
                ? issuePath.slice(
                    Math.max(0, referenceParent.path.join('.').length + 1),
                  )
                : issuePath;
              const referenceParentUrl = referenceParent
                ? getEntityTypeUrl(definitionContainer, referenceParent)
                : undefined;
              return (
                <Table.Row key={issuePath}>
                  <Table.Cell>
                    {referenceParent ? (
                      <div className="text-style-prose">
                        <div>
                          {referenceParentUrl ? (
                            <Link
                              to={referenceParentUrl}
                              onClick={() => {
                                setDialogOptions(undefined);
                              }}
                            >
                              <strong>{referenceParent.name}</strong>
                            </Link>
                          ) : (
                            <strong>{referenceParent.name}</strong>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          {referenceParent.type.name}
                        </div>
                      </div>
                    ) : (
                      <strong>Root</strong>
                    )}
                  </Table.Cell>
                  <Table.Cell>{pathInParent}</Table.Cell>
                  <Table.Cell>
                    {entity ? (
                      <div>
                        <div>{entity.name}</div>
                        <div className="text-muted-foreground">
                          {entity.type.name}
                        </div>
                      </div>
                    ) : (
                      ''
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
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
