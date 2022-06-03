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
import { RepoListing } from './RepoListing'
import { Repo } from '../../git/types/repo'

export interface ScheduleProps {
  initialSchedule: Repo[]
  onReorder: (newSchedule: Repo[]) => void
}

export const Schedule: React.FC<ScheduleProps> = ({ initialSchedule, onReorder }) => {
  const [schedule, setSchedule] = useState<(Repo & { id: string })[]>(tagWithIds(initialSchedule))
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
        {schedule.map((repo, index) => (
          <RepoListing key={repo.name + repo.mainBranchName} repo={repo} order={index + 1} />
        ))}
      </SortableContext>
    </DndContext>
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over == null) return

    if (active.id !== over.id) {
      setSchedule((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)

        const result = arrayMove(items, oldIndex, newIndex)
        onReorder(untag(result))
        return result
      })
    }
  }
}

function tagWithIds(schedule: Repo[]) {
  return schedule.map((repo) => ({
    ...repo,
    id: repo.name,
  }))
}

function untag(items: Array<Repo & { id: string }>): Repo[] {
  return items.map((i) => {
    const result: Repo & Partial<{ id: string }> = { ...i }
    delete result.id
    return result
  })
}
