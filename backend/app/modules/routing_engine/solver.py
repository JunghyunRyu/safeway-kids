"""VRP-TW solver using Google OR-Tools.

Solves the Vehicle Routing Problem with Time Windows:
- Multiple vehicles with capacity constraints
- Stops with lat/lon coordinates and time windows
- Minimizes total travel distance
- Uses Euclidean distance matrix (M4 prototype)
"""

import math
from dataclasses import dataclass

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

# Scale factor: OR-Tools works with integers, so we multiply distances by this
DISTANCE_SCALE = 1000
# Approximate km per degree at Korea's latitude (~37°N)
KM_PER_DEG_LAT = 111.0
KM_PER_DEG_LNG = 88.0  # cos(37°) * 111


@dataclass
class Stop:
    id: str
    latitude: float
    longitude: float
    time_window_start: int  # minutes from midnight
    time_window_end: int  # minutes from midnight
    demand: int = 1  # number of students at this stop


@dataclass
class Depot:
    """Academy location — start/end point for all vehicles."""
    latitude: float
    longitude: float


@dataclass
class VehicleSpec:
    id: str
    capacity: int


@dataclass
class RouteSolution:
    vehicle_id: str
    ordered_stop_ids: list[str]
    total_distance_km: float
    total_duration_min: float


@dataclass
class SolverResult:
    routes: list[RouteSolution]
    status: str  # "optimal", "feasible", "no_solution", "timeout"
    objective_value: float = 0.0


def _euclidean_distance_km(
    lat1: float, lng1: float, lat2: float, lng2: float
) -> float:
    """Approximate Euclidean distance in km between two coordinates."""
    dlat = (lat2 - lat1) * KM_PER_DEG_LAT
    dlng = (lng2 - lng1) * KM_PER_DEG_LNG
    return math.sqrt(dlat * dlat + dlng * dlng)


def _build_distance_matrix(
    depot: Depot, stops: list[Stop]
) -> list[list[int]]:
    """Build distance matrix (scaled integers) with depot at index 0."""
    nodes: list[tuple[float, float]] = [(depot.latitude, depot.longitude)]
    for s in stops:
        nodes.append((s.latitude, s.longitude))

    n = len(nodes)
    matrix: list[list[int]] = []
    for i in range(n):
        row: list[int] = []
        for j in range(n):
            if i == j:
                row.append(0)
            else:
                dist = _euclidean_distance_km(
                    nodes[i][0], nodes[i][1], nodes[j][0], nodes[j][1]
                )
                row.append(int(dist * DISTANCE_SCALE))
        matrix.append(row)
    return matrix


# Average speed assumption for time estimation (km/h)
AVERAGE_SPEED_KMH = 30


def _build_time_matrix(
    depot: Depot, stops: list[Stop]
) -> list[list[int]]:
    """Build travel time matrix in minutes with depot at index 0."""
    nodes: list[tuple[float, float]] = [(depot.latitude, depot.longitude)]
    for s in stops:
        nodes.append((s.latitude, s.longitude))

    n = len(nodes)
    matrix: list[list[int]] = []
    for i in range(n):
        row: list[int] = []
        for j in range(n):
            if i == j:
                row.append(0)
            else:
                dist_km = _euclidean_distance_km(
                    nodes[i][0], nodes[i][1], nodes[j][0], nodes[j][1]
                )
                time_min = int((dist_km / AVERAGE_SPEED_KMH) * 60)
                row.append(max(time_min, 1))  # at least 1 minute
        matrix.append(row)
    return matrix


def solve_vrp_tw(
    depot: Depot,
    stops: list[Stop],
    vehicles: list[VehicleSpec],
    time_limit_seconds: int = 30,
    precomputed_distance_matrix: list[list[int]] | None = None,
    precomputed_time_matrix: list[list[int]] | None = None,
) -> SolverResult:
    """Solve VRP-TW using OR-Tools constraint solver.

    Args:
        depot: Academy location (start/end point for all vehicles)
        stops: List of pickup stops with coordinates and time windows
        vehicles: List of available vehicles with capacities
        time_limit_seconds: Maximum solver time (SRS requirement: ≤30s)

    Returns:
        SolverResult with ordered routes per vehicle
    """
    if not stops:
        return SolverResult(routes=[], status="no_solution")

    if not vehicles:
        return SolverResult(routes=[], status="no_solution")

    num_vehicles = len(vehicles)
    num_nodes = len(stops) + 1  # +1 for depot at index 0

    # Use pre-computed matrices if provided, otherwise build Euclidean
    if precomputed_distance_matrix is not None:
        distance_matrix = precomputed_distance_matrix
    else:
        distance_matrix = _build_distance_matrix(depot, stops)

    if precomputed_time_matrix is not None:
        time_matrix = precomputed_time_matrix
    else:
        time_matrix = _build_time_matrix(depot, stops)

    # Create routing index manager: nodes, vehicles, depot index
    manager = pywrapcp.RoutingIndexManager(num_nodes, num_vehicles, 0)
    routing = pywrapcp.RoutingModel(manager)

    # Distance callback
    def distance_callback(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Capacity constraint
    def demand_callback(from_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        if from_node == 0:  # depot
            return 0
        return stops[from_node - 1].demand

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # no slack
        [v.capacity for v in vehicles],
        True,  # start cumul to zero
        "Capacity",
    )

    # Time window constraint
    def time_callback(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return time_matrix[from_node][to_node]

    time_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.AddDimension(
        time_callback_index,
        60,  # max waiting time (minutes)
        1440,  # max total time per vehicle (24h)
        False,  # don't force start cumul to zero
        "Time",
    )

    time_dimension = routing.GetDimensionOrDie("Time")

    # Set time windows for depot (wide open)
    time_dimension.CumulVar(routing.Start(0)).SetRange(0, 1440)
    time_dimension.CumulVar(routing.End(0)).SetRange(0, 1440)

    # Set time windows for all vehicle starts/ends
    for v in range(num_vehicles):
        time_dimension.CumulVar(routing.Start(v)).SetRange(0, 1440)
        time_dimension.CumulVar(routing.End(v)).SetRange(0, 1440)

    # Set time windows for each stop
    for i, stop in enumerate(stops):
        node_index = manager.NodeToIndex(i + 1)  # +1 because depot is 0
        time_dimension.CumulVar(node_index).SetRange(
            stop.time_window_start, stop.time_window_end
        )

    # Search parameters
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_params.time_limit.seconds = time_limit_seconds

    # Solve
    solution = routing.SolveWithParameters(search_params)

    if not solution:
        status_code = routing.status()
        if status_code == 3:  # ROUTING_FAIL_TIMEOUT
            return SolverResult(routes=[], status="timeout")
        return SolverResult(routes=[], status="no_solution")

    # Extract routes
    routes: list[RouteSolution] = []
    for v in range(num_vehicles):
        route_stops: list[str] = []
        route_distance = 0.0

        index = routing.Start(v)
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            if node != 0:  # skip depot
                route_stops.append(stops[node - 1].id)

            next_index = solution.Value(routing.NextVar(index))
            route_distance += distance_matrix[node][manager.IndexToNode(next_index)]
            index = next_index

        if route_stops:  # only include vehicles that have stops
            # Get time from time dimension
            start_time = solution.Value(time_dimension.CumulVar(routing.Start(v)))
            end_time = solution.Value(time_dimension.CumulVar(routing.End(v)))

            routes.append(RouteSolution(
                vehicle_id=vehicles[v].id,
                ordered_stop_ids=route_stops,
                total_distance_km=route_distance / DISTANCE_SCALE,
                total_duration_min=float(end_time - start_time),
            ))

    status = "optimal" if routing.status() == 1 else "feasible"
    return SolverResult(
        routes=routes,
        status=status,
        objective_value=solution.ObjectiveValue() / DISTANCE_SCALE,
    )
