import type React from 'react';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  InputField,
  NavigationMenu,
  NavigationMenuItemWithLink,
  NavigationMenuList,
  ScrollArea,
} from '@baseplate-dev/ui-components';
import clsx from 'clsx';
import { sortBy } from 'es-toolkit';
import { useState } from 'react';
import { MdAdd, MdClear } from 'react-icons/md';
import { NavLink } from 'react-router-dom';

import { createModelEditLink } from '../_utils/url.js';
import { NewModelDialog } from './NewModelDialog.js';

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
          <Button variant="secondary" className="w-full">
            <MdAdd />
            New Model
          </Button>
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
                className="absolute top-1/2 right-4 -translate-y-1/2"
                onClick={() => {
                  setFilterQuery('');
                }}
                size="icon"
              >
                <MdClear />
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
          <NavigationMenuList>
            {sortedModels.map((model) => (
              <NavigationMenuItemWithLink key={model.id} asChild>
                <NavLink to={createModelEditLink(model.id)}>
                  {model.name}
                </NavLink>
              </NavigationMenuItemWithLink>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </ScrollArea>
    </div>
  );
}
