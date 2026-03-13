import uuid
from datetime import date

from pydantic import BaseModel, Field


class GenerateRouteRequest(BaseModel):
    academy_id: uuid.UUID
    plan_date: date
    time_limit_seconds: int = Field(default=30, ge=5, le=120)


class RouteStopResponse(BaseModel):
    stop_id: str
    student_name: str | None = None
    latitude: float
    longitude: float
    order: int


class RouteResponse(BaseModel):
    vehicle_id: uuid.UUID
    plan_date: date
    version: int
    stops: list[RouteStopResponse]
    total_distance_km: float | None
    total_duration_min: float | None
    generated_by: str | None


class GenerateRouteResponse(BaseModel):
    status: str  # optimal, feasible, no_solution, timeout
    routes: list[RouteResponse]
    objective_value: float
