import React, { useEffect } from 'react'
import { MyApi } from '../service/ipc/my-api'
import { Scheduling } from '../service/ipc/scheduling'
import { SchedulingListing } from './components/SchedulingListing'

export interface IndexProps {
  api: Promise<MyApi>
}

export const Index: React.FC<IndexProps> = ({ api }) => {
  const [schedule, setSchedule] = React.useState<Scheduling[] | undefined>(undefined)

  useEffect(() => {
    api.then((a) => {
      setSchedule(a.schedule)
      a.on('ScheduleUpdated', ({ newSchedule }) => setSchedule(newSchedule))
    })
  })

  return schedule == null ? (
    <span>Loading...</span>
  ) : (
    <>
      {schedule.map((scheduling: Scheduling) => (
        <SchedulingListing key={scheduling.repo.name + scheduling.branch.name} scheduling={scheduling} />
      ))}
    </>
  )
}
