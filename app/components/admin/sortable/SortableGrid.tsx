// app/components/admin/sortable/SortableGrid.tsx

import { useState } from "react";
import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import type {
  DragEndEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./SortableGrid.module.css";

/**
 * Reusable sortable grid used by every reorderable surface in the admin:
 * artist main photos, artist flash, and (later) admin gallery curation. The
 * grid owns dnd-kit's sensor/context wiring; consumers own the tiles that
 * live inside.
 *
 * Consumers render `<SortableGrid>` around a list of `<SortableGridItem>`s
 * (one per photo). The items become drag sources; the grid emits the new
 * ordered id list when a drag completes. Consumers hold the "authoritative
 * order" in state and use `onOrderChange` to commit that new order to the
 * server — the grid itself is stateless with respect to order (it renders
 * whatever the consumer's `orderedItemIds` says right now).
 *
 * Why the wrapper-and-child shape, rather than a `renderItem` render prop:
 * `renderItem` is a nested render function, which is exactly the pattern the
 * project's coding rules avoid. Wrapping consumer-authored children in a
 * SortableContext + per-item useSortable hook gives the same composability
 * without the render-function shape.
 */

/**
 * The tile ids we track. dnd-kit's UniqueIdentifier is `string | number`;
 * photos are numeric ids from D1, so we keep the number shape and let
 * dnd-kit accept it directly.
 */
export type SortableGridItemId = number;

type SortableGridProps = {
  orderedItemIds: readonly SortableGridItemId[];
  onOrderChange: (nextOrderedIds: SortableGridItemId[]) => void;
  children: ReactNode;
  ariaLabel: string;
};

export function SortableGrid(props: SortableGridProps) {
  const { orderedItemIds, onOrderChange, children, ariaLabel } = props;

  /**
   * Sensor configuration. Distance/hold thresholds prevent every click on a
   * tile (delete button, drag handle) from initiating a drag. Keyboard sensor
   * gives screen-reader and no-pointer users equivalent access — space to
   * pick up, arrows to move, enter/space to drop, escape to cancel.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over === null || active.id === over.id) {
      return;
    }

    const fromIndex = orderedItemIds.indexOf(active.id as SortableGridItemId);
    const toIndex = orderedItemIds.indexOf(over.id as SortableGridItemId);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    const nextOrderedIds = arrayMove(
      [...orderedItemIds],
      fromIndex,
      toIndex,
    );

    onOrderChange(nextOrderedIds);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedItemIds as UniqueIdentifier[]}
        strategy={rectSortingStrategy}
      >
        <ul className={styles.grid} role="list" aria-label={ariaLabel}>
          {children}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

// ---------------------------------------------------------------------------
// SortableGridItem
// ---------------------------------------------------------------------------

type SortableGridItemProps = {
  itemId: SortableGridItemId;
  children: ReactNode;
};

/**
 * One draggable/droppable cell inside a SortableGrid. Wraps the consumer's
 * tile markup with the dnd-kit wiring, including the transform + transition
 * styles and the ARIA attributes that make the cell announce as reorderable.
 *
 * The whole cell is the drag surface — consumers do not need a dedicated
 * drag handle. The PointerSensor's distance threshold means clicks on
 * interactive elements inside the tile (delete buttons, links) don't get
 * hijacked as drag starts.
 */
export function SortableGridItem(props: SortableGridItemProps) {
  const { itemId, children } = props;

  const sortable = useSortable({ id: itemId });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;

  const inlineStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={inlineStyle}
      data-dragging={isDragging}
      className={styles.gridItem}
      {...attributes}
      {...listeners}
    >
      {children}
    </li>
  );
}