import React from 'react'
import { Scheduling } from '../../git/types/scheduling'
import { SchedulingListing } from './SchedulingListing'

export interface ScheduleProps {
  schedule: Scheduling[]
}

export const Schedule: React.FC<ScheduleProps> = ({ schedule }) => (
  <>
    {schedule.map((scheduling: Scheduling, index) => (
      <SchedulingListing
        key={scheduling.repo.name + scheduling.branch.name}
        scheduling={scheduling}
        order={index + 1}
      />
    ))}
  </>
)
