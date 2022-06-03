import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import React, { useState } from 'react'
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'
import { Scheduling } from '../../git/types/scheduling'
import { SchedulingListing } from './SchedulingListing'

export interface ScheduleProps {
  initialSchedule: Scheduling[]
  onReorder: (newSchedule: Scheduling[]) => void
}

export const Schedule: React.FC<ScheduleProps> = ({ initialSchedule, onReorder }) => {
  const [schedule, setSchedule] = useState<(Scheduling & { id: string })[]>(tagWithIds(initialSchedule))
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <SortableContext items={schedule} strategy={verticalListSortingStrategy}>
        {schedule.map((scheduling, index) => (
          <SchedulingListing
            key={scheduling.repo.name + scheduling.branch.name}
            scheduling={scheduling}
            order={index + 1}
          />
        ))}
      </SortableContext>
    </DndContext>
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active.id !== over!.id) {
      setSchedule((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over!.id)

        const result = arrayMove(items, oldIndex, newIndex)
        onReorder(untag(result))
        return result
      })
    }
  }
}

function tagWithIds(schedule: Scheduling[]) {
  return schedule.map((s) => ({
    ...s,
    id: Scheduling.toId(s),
  }))
}

function untag(items: Array<Scheduling & { id: string }>): Scheduling[] {
  return items.map((i) => {
    const result: Scheduling & Partial<{ id: string }> = { ...i }
    delete result.id
    return result
  })
}
