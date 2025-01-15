import type React from 'react';

import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  InputField,
  NavigationMenu,
  ScrollArea,
} from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { sortBy } from 'es-toolkit';
import { useState } from 'react';
import { MdAdd, MdClear } from 'react-icons/md';
import { NavLink } from 'react-router-dom';

import { createModelEditLink } from '../_utils/url';
import { NewModelDialog } from './NewModelDialog';

interface ModelsSidebarListProps {
  className?: string;
}

export function ModelsSidebarList({
  className,
}: ModelsSidebarListProps): React.JSX.Element {
  const {
    definition: { models },
  } = useProjectDefinition();

  const [filterQuery, setFilterQuery] = useState('');
  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  const sortedModels = sortBy(filteredModels, [(m) => m.name]);

  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <div
      className={clsx(
        className,
        'flex flex-1 flex-col space-y-4 overflow-y-auto',
      )}
    >
      <div className="space-y-4 px-4">
        <NewModelDialog>
          <Button.WithIcon icon={MdAdd} variant="secondary" className="w-full">
            New Model
          </Button.WithIcon>
        </NewModelDialog>
        {models.length > 0 && (
          <div className="relative">
            <InputField
              value={filterQuery}
              onChange={(text) => {
                setFilterQuery(text);
              }}
              placeholder="Search"
            />
            {filterQuery && (
              <Button
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2"
                onClick={() => {
                  setFilterQuery('');
                }}
                size="icon"
              >
                <Button.Icon icon={MdClear} />
              </Button>
            )}
          </div>
        )}
      </div>

      <ScrollArea
        className={clsx('flex-1 px-2', isScrolled && 'border-t')}
        onScrollCapture={(e) => {
          const hasScrolled = e.currentTarget.scrollTop > 0;
          if (hasScrolled !== isScrolled) {
            setIsScrolled(hasScrolled);
          }
        }}
      >
        {sortedModels.length === 0 && filterQuery && (
          <div className="py-4 text-center text-style-muted">
            No models found
          </div>
        )}
        <NavigationMenu orientation="vertical">
          <NavigationMenu.List>
            {sortedModels.map((model) => (
              <li key={model.id}>
                <NavigationMenu.ItemWithLink asChild size="skinny">
                  <NavLink to={createModelEditLink(model.id)}>
                    {model.name}
                  </NavLink>
                </NavigationMenu.ItemWithLink>
              </li>
            ))}
          </NavigationMenu.List>
        </NavigationMenu>
      </ScrollArea>
    </div>
  );
}
