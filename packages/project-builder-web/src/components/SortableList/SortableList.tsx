import type { DragEndEvent } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import type React from 'react';

import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@halfdomelabs/ui-components';
import { RxDragHandleHorizontal } from 'react-icons/rx';

interface SortableListItem {
  id: string;
  element: React.JSX.Element;
}

interface SortableItemProps {
  id: string;
  children: ReactNode;
}
function SortableItem({ id, children }: SortableItemProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className="flex w-full items-center gap-2"
      ref={setNodeRef}
      style={style}
    >
      <div
        className="flex w-10 items-center justify-center"
        {...attributes}
        {...listeners}
      >
        <Button className="cursor-grab" variant="ghost" size="icon">
          <RxDragHandleHorizontal />
        </Button>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

interface SortableListProps {
  listItems: SortableListItem[];
  sortItems: (dragIndex: number, hoverIndex: number) => void;
}

export function SortableList({
  listItems,
  sortItems,
}: SortableListProps): React.JSX.Element {
  const handleDragEnd = ({ active, over }: DragEndEvent): void => {
    if (over && active.id !== over.id) {
      const dragIndex = listItems.findIndex((item) => item.id === active.id);
      const hoverIndex = listItems.findIndex((item) => item.id === over.id);
      sortItems(dragIndex, hoverIndex);
    }
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis]}
    >
      <div className="flex w-full flex-col gap-4">
        <SortableContext
          items={listItems.map(({ id }) => id)}
          strategy={verticalListSortingStrategy}
        >
          {listItems.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {item.element}
            </SortableItem>
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}
