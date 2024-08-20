import { modelEntityType } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  InputField,
  useConfirmDialog,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import _ from 'lodash';
import { useState } from 'react';
import { MdAdd, MdClear, MdDelete } from 'react-icons/md';
import { NavLink, useNavigate } from 'react-router-dom';

import { NewModelDialog } from './NewModelDialog';
import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { useToast } from '@src/hooks/useToast';
import { logAndFormatError } from '@src/services/error-formatter';
import { RefDeleteError } from '@src/utils/error';

interface ModelsSidebarListProps {
  className?: string;
}

export function ModelsSidebarList({
  className,
}: ModelsSidebarListProps): JSX.Element {
  const navigate = useNavigate();
  const { requestConfirm } = useConfirmDialog();
  const toast = useToast();
  const { parsedProject, setConfigAndFixReferences } = useProjectDefinition();
  const { showRefIssues } = useDeleteReferenceDialog();

  const models = parsedProject.getModels();

  const [filterQuery, setFilterQuery] = useState('');
  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  const sortedModels = _.sortBy(filteredModels, (m) => m.name);

  const handleDelete = (id: string): void => {
    try {
      setConfigAndFixReferences((draftConfig) => {
        draftConfig.models = draftConfig.models?.filter((m) => m.id !== id);
      });
      navigate('/data/models');
    } catch (err) {
      if (err instanceof RefDeleteError) {
        showRefIssues({ issues: err.issues });
        return;
      }
      toast.error(logAndFormatError(err));
    }
  };

  return (
    <div className={clsx(className, 'flex flex-col space-y-4')}>
      <NewModelDialog>
        <Button.WithIcon icon={MdAdd} variant="secondary" className="w-full">
          New Model
        </Button.WithIcon>
      </NewModelDialog>
      <div className="relative">
        <InputField
          value={filterQuery}
          onChange={(text) => setFilterQuery(text)}
          placeholder="Search"
        />
        {filterQuery && (
          <Button
            variant="ghost"
            className="absolute right-4 top-1/2 -translate-y-1/2"
            onClick={() => setFilterQuery('')}
            size="icon"
          >
            <Button.Icon icon={MdClear} />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <ul>
          {sortedModels.map((model) => (
            <li key={model.id} className="group">
              <NavLink
                to={`./models/edit/${modelEntityType.toUid(model.id)}`}
                className={({ isActive }) =>
                  clsx(
                    'block w-full p-2 text-sm',
                    isActive
                      ? 'bg-accent font-semibold text-accent-foreground'
                      : 'font-normal group-hover:bg-accent/50',
                  )
                }
                title={model.name}
              >
                <div className="flex items-center justify-between space-x-2">
                  {model.name}

                  <MdDelete
                    title="Delete Model"
                    className="z-10 hidden size-4 shrink-0 opacity-50 group-hover:inline-flex"
                    onClick={(e) => {
                      e.preventDefault();
                      requestConfirm({
                        title: 'Confirm delete',
                        content: `Are you sure you want to delete ${
                          model?.name ?? 'the model'
                        }?`,
                        buttonConfirmText: 'Delete',
                        onConfirm: () => handleDelete(model.id),
                      });
                    }}
                  />
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
