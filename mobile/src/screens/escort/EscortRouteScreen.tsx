import React from "react";
import DriverRouteScreen from "../driver/RouteScreen";

/**
 * Safety escort route screen — reuses DriverRouteScreen.
 * The backend already supports SAFETY_ESCORT role for the driver daily schedules endpoint.
 */
export default function EscortRouteScreen() {
  return <DriverRouteScreen />;
}
