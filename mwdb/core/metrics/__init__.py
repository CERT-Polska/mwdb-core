from .redis_counter import RedisCounter, collect, metrics_enabled

metric_api_requests = RedisCounter(
    "api_requests", "API request metrics", ("method", "endpoint", "user", "status_code")
)

__all__ = [
    "collect",
    "metrics_enabled",
    "metric_api_requests",
]
