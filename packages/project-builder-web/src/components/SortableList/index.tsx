import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@halfdomelabs/ui-components';
import { ReactNode } from 'react';
import { RxDragHandleHorizontal } from 'react-icons/rx';

interface SortableListItem {
  id: string;
  element: JSX.Element;
}

interface SortableItemProps {
  id: string;
  children: ReactNode;
}
function SortableItem({ id, children }: SortableItemProps): JSX.Element {
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
      <div className="space-x-2" {...attributes} {...listeners}>
        <Button
          variant="tertiary"
          iconBefore={RxDragHandleHorizontal}
          size="icon"
        />
      </div>
      <div className="w-full">{children}</div>
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
}: SortableListProps): JSX.Element {
  const handleDragEnd = ({ active, over }: DragEndEvent): void => {
    if (active.id !== over!.id) {
      const dragIndex = listItems.findIndex((item) => item.id === active.id);
      const hoverIndex = listItems.findIndex((item) => item.id === over!.id);
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
