"""Unit tests for VRP-TW solver."""

import pytest

from app.modules.routing_engine.solver import (
    Depot,
    Stop,
    VehicleSpec,
    _euclidean_distance_km,
    solve_vrp_tw,
)


class TestEuclideanDistance:
    def test_same_point_is_zero(self):
        assert _euclidean_distance_km(37.5, 127.0, 37.5, 127.0) == 0.0

    def test_known_distance(self):
        # ~1 degree latitude ≈ 111 km
        dist = _euclidean_distance_km(37.0, 127.0, 38.0, 127.0)
        assert 100 < dist < 120  # approximately 111 km


class TestSolverBasic:
    def test_empty_stops_returns_no_solution(self):
        depot = Depot(latitude=37.5, longitude=127.0)
        result = solve_vrp_tw(depot, stops=[], vehicles=[VehicleSpec("v1", 10)])
        assert result.status == "no_solution"
        assert result.routes == []

    def test_empty_vehicles_returns_no_solution(self):
        depot = Depot(latitude=37.5, longitude=127.0)
        stops = [Stop("s1", 37.51, 127.01, 780, 810)]
        result = solve_vrp_tw(depot, stops, vehicles=[])
        assert result.status == "no_solution"

    def test_single_stop_single_vehicle(self):
        depot = Depot(latitude=37.5, longitude=127.0)
        stops = [Stop("s1", 37.51, 127.01, 780, 840)]
        vehicles = [VehicleSpec("v1", 10)]

        result = solve_vrp_tw(depot, stops, vehicles, time_limit_seconds=10)
        assert result.status in ("optimal", "feasible")
        assert len(result.routes) == 1
        assert result.routes[0].ordered_stop_ids == ["s1"]
        assert result.routes[0].vehicle_id == "v1"
        assert result.routes[0].total_distance_km > 0


class TestSolverMultiVehicle:
    """Test with multiple stops and vehicles — Gangnam area coordinates."""

    @pytest.fixture
    def gangnam_scenario(self):
        # Academy (depot) in Gangnam
        depot = Depot(latitude=37.4979, longitude=127.0276)

        # 10 student pickup stops scattered around Gangnam
        stops = [
            Stop("s1", 37.500, 127.030, 780, 810, demand=1),
            Stop("s2", 37.505, 127.025, 780, 810, demand=1),
            Stop("s3", 37.495, 127.035, 790, 820, demand=1),
            Stop("s4", 37.510, 127.020, 790, 820, demand=1),
            Stop("s5", 37.492, 127.040, 800, 830, demand=1),
            Stop("s6", 37.503, 127.015, 800, 830, demand=1),
            Stop("s7", 37.508, 127.032, 810, 840, demand=1),
            Stop("s8", 37.490, 127.028, 810, 840, demand=1),
            Stop("s9", 37.498, 127.045, 820, 850, demand=1),
            Stop("s10", 37.512, 127.022, 820, 850, demand=1),
        ]

        return depot, stops

    def test_two_vehicles_cover_all_stops(self, gangnam_scenario):
        depot, stops = gangnam_scenario
        vehicles = [
            VehicleSpec("v1", 6),
            VehicleSpec("v2", 6),
        ]

        result = solve_vrp_tw(depot, stops, vehicles, time_limit_seconds=10)
        assert result.status in ("optimal", "feasible")

        # All stops should be covered
        all_assigned = []
        for route in result.routes:
            all_assigned.extend(route.ordered_stop_ids)

        assert sorted(all_assigned) == sorted([s.id for s in stops])

        # Each vehicle should have reasonable number of stops
        for route in result.routes:
            assert len(route.ordered_stop_ids) <= 6  # capacity constraint

    def test_capacity_constraint_enforced(self, gangnam_scenario):
        depot, stops = gangnam_scenario
        # Only 1 vehicle with capacity 5 — can't serve all 10 stops
        vehicles = [VehicleSpec("v1", 5)]

        result = solve_vrp_tw(depot, stops, vehicles, time_limit_seconds=10)
        # Should either find partial solution or no solution
        if result.routes:
            assert len(result.routes[0].ordered_stop_ids) <= 5

    def test_three_vehicles(self, gangnam_scenario):
        depot, stops = gangnam_scenario
        vehicles = [
            VehicleSpec("v1", 5),
            VehicleSpec("v2", 5),
            VehicleSpec("v3", 5),
        ]

        result = solve_vrp_tw(depot, stops, vehicles, time_limit_seconds=10)
        assert result.status in ("optimal", "feasible")

        all_assigned = []
        for route in result.routes:
            all_assigned.extend(route.ordered_stop_ids)
            assert len(route.ordered_stop_ids) <= 5

        assert sorted(all_assigned) == sorted([s.id for s in stops])

    def test_solver_returns_distance_and_duration(self, gangnam_scenario):
        depot, stops = gangnam_scenario
        vehicles = [VehicleSpec("v1", 15)]

        result = solve_vrp_tw(depot, stops, vehicles, time_limit_seconds=10)
        assert result.status in ("optimal", "feasible")
        assert len(result.routes) == 1

        route = result.routes[0]
        assert route.total_distance_km > 0
        assert route.total_duration_min >= 0
