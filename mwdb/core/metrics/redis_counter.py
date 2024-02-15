from typing import Dict, Tuple

from prometheus_client import CollectorRegistry
from prometheus_client import Gauge as PrometheusGauge
from prometheus_client import generate_latest
from redis import Redis

from mwdb.core.config import app_config
from mwdb.core.log import getLogger

METRIC_REGISTRY = CollectorRegistry()
METRIC_EXPIRATION_TIME = 1 * 60 * 60
COUNTERS = []

logger = getLogger()

redis = None
if app_config.mwdb.enable_prometheus_metrics:
    if not app_config.mwdb.redis_uri:
        logger.warning(
            "metrics: Prometheus metrics are disabled because redis_uri is not set"
        )
    else:
        redis = Redis.from_url(app_config.mwdb.redis_uri, decode_responses=True)


class RedisCounter:
    KEY_PREFIX = "METRICS"

    def __init__(self, name: str, documentation: str, labelnames: Tuple[str] = ()):
        self._gauge = PrometheusGauge(
            name, documentation, labelnames, registry=METRIC_REGISTRY
        )
        self._name = name
        self._labelnames = labelnames
        COUNTERS.append(self)

    def inc(self, amount: int = 1, **labelkwargs) -> None:
        if not redis:
            return
        redis_key = self._key_from_labelkwargs(**labelkwargs)
        p = redis.pipeline()
        p.incr(redis_key, amount)
        p.expire(redis_key, METRIC_EXPIRATION_TIME)
        p.execute()

    def _key_from_labelkwargs(self, **labelkwargs):
        elements = [
            str(labelkwargs[name]).replace(":", "_") for name in self._labelnames
        ]
        return ":".join([self.KEY_PREFIX, self._name] + elements)

    def _labelkwargs_from_key(self, key):
        parts = key.split(":")
        name, *elements = parts[1:]
        if name != self._name:
            return None
        if len(elements) != len(self._labelnames):
            logger.warning(
                f"metrics: Got {len(elements)} label parts "
                f"but expected {len(self._labelnames)}"
            )
            return None
        return {self._labelnames[idx]: value for idx, value in enumerate(elements)}

    def update_counters(self, counters: Dict[str, int]):
        """
        This method updates counters based on
        """
        self._gauge.clear()

        for key, value in counters.items():
            labelkwargs = self._labelkwargs_from_key(key)
            if labelkwargs is None:
                continue
            self._gauge.labels(**labelkwargs).set(value)


def collect():
    keys = redis.keys(f"{RedisCounter.KEY_PREFIX}:*")
    values = redis.mget(keys)
    counters = dict(zip(keys, values))
    for counter in COUNTERS:
        counter.update_counters(counters)
    return generate_latest(METRIC_REGISTRY)


def metrics_enabled():
    return redis is not None
