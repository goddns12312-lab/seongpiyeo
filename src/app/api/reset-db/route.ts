import { disabledRouteResponse } from '@/lib/disabled-route';

export async function POST() {
  return disabledRouteResponse();
}
