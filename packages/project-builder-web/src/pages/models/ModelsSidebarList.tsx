import { modelEntityType } from '@halfdomelabs/project-builder-lib';
import {
  Button,
  InputField,
  useConfirmDialog,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import _ from 'lodash';
import { useState } from 'react';
import { MdClear, MdDelete } from 'react-icons/md';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useToast } from '@src/hooks/useToast';
import { formatError } from '@src/services/error-formatter';
import { useProjectConfig } from 'src/hooks/useProjectConfig';

interface ModelsSidebarListProps {
  className?: string;
}

export function ModelsSidebarList({
  className,
}: ModelsSidebarListProps): JSX.Element {
  const navigate = useNavigate();
  const { requestConfirm } = useConfirmDialog();
  const toast = useToast();
  const { parsedProject, setConfig } = useProjectConfig();

  const models = parsedProject.getModels();

  const [filterQuery, setFilterQuery] = useState('');
  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  const sortedModels = _.sortBy(filteredModels, (m) => m.name);

  const handleDelete = (id: string): void => {
    try {
      setConfig((draftConfig) => {
        draftConfig.models = draftConfig.models?.filter((m) => m.uid !== id);
      });
      navigate('..');
    } catch (err) {
      toast.error(formatError(err));
    }
  };

  return (
    <div className={clsx(className, 'flex flex-col space-y-4')}>
      <Link to="/models/new" className="block w-full">
        <Button variant="secondary" className="w-full">
          New Model
        </Button>
      </Link>
      <div className="relative">
        <InputField
          value={filterQuery}
          onChange={(text) => setFilterQuery(text)}
          placeholder="Search"
        />
        {filterQuery && (
          <Button
            variant="ghost"
            className="absolute right-4 top-1/2 -translate-y-1/2 transform"
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
            <li key={model.uid} className="group">
              <NavLink
                to={`/models/edit/${modelEntityType.getUidFromId(model.id)}`}
                className={({ isActive }) =>
                  clsx(
                    'block w-full p-2 text-sm group-hover:bg-background-100 dark:group-hover:bg-background-700',
                    isActive
                      ? 'bg-background-100 font-semibold text-primary-700 dark:bg-background-700'
                      : 'font-normal text-foreground-700',
                  )
                }
                title={model.name}
              >
                <div className="flex items-center justify-between space-x-2">
                  {model.name}

                  <MdDelete
                    title="Delete Model"
                    className="z-10 hidden h-4 w-4 shrink-0 text-foreground-700 opacity-75 group-hover:inline-flex"
                    onClick={(e) => {
                      e.preventDefault();
                      requestConfirm({
                        title: 'Confirm delete',
                        content: `Are you sure you want to delete ${
                          model?.name ?? 'the model'
                        }?`,
                        buttonConfirmText: 'Delete',
                        onConfirm: () => handleDelete(model.uid),
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
