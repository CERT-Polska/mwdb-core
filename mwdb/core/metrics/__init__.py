from .redis_counter import RedisCounter, collect, metrics_enabled

metric_api_requests = RedisCounter(
    "mwdb_api_requests",
    "API request metrics",
    ("method", "endpoint", "user", "status_code"),
)
metric_deprecated_usage = RedisCounter(
    "mwdb_deprecated_usage",
    "Deprecated API usage metrics",
    ("feature", "method", "endpoint", "user"),
)

__all__ = [
    "collect",
    "metrics_enabled",
    "metric_api_requests",
    "metric_deprecated_usage",
]
