import {
  departurePlans,
  estimatedLeaves,
  type DeparturePlan,
  type LeaveInfo,
} from '../../data/departures';
import { departureMapsUrl } from './plans';

/** "הליכה ל־X → קו Y → הליכה לכניסה." → numbered steps. */
const routeSteps = (route: string) =>
  route
    .split('→')
    .map((step) => step.trim().replace(/\.$/, ''))
    .filter(Boolean);

function fromPlan(plan: DeparturePlan): LeaveInfo {
  return {
    eventId: plan.eventId,
    leave: plan.leave,
    arriveBy: plan.arriveBy,
    from: plan.startsFrom,
    steps: routeSteps(plan.route),
    booking: plan.booking,
    why: plan.reason,
    tip: plan.note,
    estimate: false,
    mapsUrl: departureMapsUrl(plan),
  };
}

/** The leave advice for an event: the checked plan if there is one, otherwise an estimate. */
export function leaveFor(eventId: string): LeaveInfo | undefined {
  const plan = departurePlans.find((candidate) => candidate.eventId === eventId);
  if (plan) return fromPlan(plan);
  return estimatedLeaves.find((estimate) => estimate.eventId === eventId);
}
