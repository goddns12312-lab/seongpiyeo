import { disabledRouteResponse } from '@/lib/disabled-route';

export async function GET() {
  return disabledRouteResponse();
}
