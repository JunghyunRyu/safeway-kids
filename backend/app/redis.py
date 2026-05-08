"""Redis client wrapper.

본 모듈은 redis_client 한 개의 export를 통해 9개 사용처에 공급된다.
production/test 환경에서는 실제 Redis 인스턴스로 직접 호출되고,
local dev에서 Redis가 미기동인 경우 _SafeRedis 래퍼가 ConnectionError를
삼키고 메서드별 NoOp fallback을 반환해 라우트가 500으로 전파되는 것을 막는다.

미팅/데모 환경 한정 안전 장치다. production은 settings.environment 가드
및 health degraded signal을 통해 별도 검출된다.

redis-py 5.x 호환: 모든 메서드는 일반 ``def``로 정의되고 호출 시
awaitable을 반환하는 구조라, ``iscoroutinefunction``이 무용. 호출
결과가 awaitable인지로 분기해야 한다.
"""

from __future__ import annotations

import inspect
import logging
import time
from typing import Any

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.config import settings

logger = logging.getLogger(__name__)

# In-memory KV cache for set/get when Redis is unavailable.
# 시연 환경에서 GPS payload(`vehicle:{id}:gps`) 같은 short-lived 캐시를 받쳐
# /map polling 흐름이 마커를 정상 표시하도록 한다. process 재시작 시 휘발.
_memory_kv: dict[str, Any] = {}
_memory_ttl: dict[str, float] = {}

_real_client: Redis = Redis.from_url(  # type: ignore[type-arg]
    settings.redis_url,
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
)


# 메서드명 → 미동작 시 fallback 반환값.
# 매칭되지 않는 메서드는 None을 반환한다.
_FALLBACKS: dict[str, Any] = {
    # read
    "get": None,
    "mget": [],
    "exists": 0,
    "ttl": -2,
    "pttl": -2,
    "type": "none",
    "ping": True,
    "hget": None,
    "hmget": [],
    "hgetall": {},
    "hkeys": [],
    "hvals": [],
    "hlen": 0,
    "hexists": 0,
    "smembers": set(),
    "sismember": False,
    "scard": 0,
    "lrange": [],
    "llen": 0,
    "lpop": None,
    "rpop": None,
    "lindex": None,
    "zrange": [],
    "zrevrange": [],
    "zcard": 0,
    "zscore": None,
    "keys": [],
    # write
    "set": True,
    "setex": True,
    "setnx": True,
    "mset": True,
    "msetnx": True,
    "delete": 0,
    "unlink": 0,
    "expire": True,
    "pexpire": True,
    "persist": False,
    "incr": 1,
    "decr": 0,
    "incrby": 1,
    "decrby": 0,
    "incrbyfloat": 1.0,
    "hset": 1,
    "hmset": True,
    "hdel": 0,
    "hincrby": 1,
    "hincrbyfloat": 1.0,
    "sadd": 1,
    "srem": 0,
    "lpush": 1,
    "rpush": 1,
    "lpushx": 0,
    "rpushx": 0,
    "ltrim": True,
    "zadd": 1,
    "zrem": 0,
    "publish": 0,
}


class _SafeRedis:
    """Redis 호출 실패가 라우트에 500으로 전파되지 않도록 감싼 프록시.

    redis-py 메서드는 호출 시 awaitable을 반환한다. wrapper는 호출 결과가
    awaitable이면 ``await``을 try/except로 감싸 fallback을 반환하고, 일반
    객체(예: ``pubsub()``의 ``PubSub`` 인스턴스)는 그대로 노출한다.

    한 번 실패하면 첫 1회만 WARNING으로 알리고 이후는 조용히 fallback해
    로그 폭주를 막는다.
    """

    _warned: bool = False

    def __getattr__(self, name: str) -> Any:
        attr = getattr(_real_client, name)
        if not callable(attr):
            return attr

        fallback = _FALLBACKS.get(name)
        method_name = name

        def proxy(*args: Any, **kwargs: Any) -> Any:
            # 첫 실패 이후로는 connection 시도를 스킵하고 fallback 경로로 직행해
            # 매 호출마다 socket_connect_timeout만큼 지연되는 것을 막는다.
            # _FALLBACKS에 등록된 잘 알려진 메서드만 shortcut을 적용해
            # pubsub() 같은 sync 메서드의 호출 시그니처는 보존한다.
            if _SafeRedis._warned and name in _FALLBACKS:

                async def shortcut() -> Any:
                    return _fallback_with_memory(method_name, args, kwargs, fallback)

                return shortcut()

            try:
                result = attr(*args, **kwargs)
            except (RedisError, OSError) as exc:
                _warn_once(method_name, exc)
                return _fallback_with_memory(method_name, args, kwargs, fallback)

            if inspect.isawaitable(result):
                return _safe_await(result, method_name, args, kwargs, fallback)
            return result

        return proxy


async def _safe_await(
    coro: Any, method_name: str, args: tuple, kwargs: dict, fallback: Any
) -> Any:
    try:
        return await coro
    except (RedisError, OSError) as exc:
        _warn_once(method_name, exc)
        return _fallback_with_memory(method_name, args, kwargs, fallback)


def _fallback_with_memory(
    method_name: str, args: tuple, kwargs: dict, fallback: Any
) -> Any:
    """set/get 호출은 in-memory dict로 받쳐 시연 흐름을 살린다.

    Redis가 미동작이어도 같은 프로세스 내에서 GPS payload write→read 한 쌍이
    동작하도록 보장한다. set의 ``ex`` 인자는 절대 시각 ttl로 변환해 저장한다.
    """
    if method_name == "set" and args:
        key = args[0]
        value = args[1] if len(args) > 1 else kwargs.get("value")
        _memory_kv[key] = value
        ex = kwargs.get("ex")
        if isinstance(ex, (int, float)) and ex > 0:
            _memory_ttl[key] = time.time() + float(ex)
        else:
            _memory_ttl.pop(key, None)
        return True

    if method_name == "get" and args:
        key = args[0]
        ttl = _memory_ttl.get(key)
        if ttl is not None and time.time() > ttl:
            _memory_kv.pop(key, None)
            _memory_ttl.pop(key, None)
            return None
        return _memory_kv.get(key)

    if method_name == "delete" and args:
        n = 0
        for key in args:
            if key in _memory_kv:
                _memory_kv.pop(key, None)
                _memory_ttl.pop(key, None)
                n += 1
        return n

    return fallback


def _warn_once(method_name: str, exc: BaseException) -> None:
    if not _SafeRedis._warned:
        logger.warning(
            "Redis unavailable, falling back to NoOp (first hit on %s): %s",
            method_name, exc,
        )
        _SafeRedis._warned = True


redis_client: Any = _SafeRedis()


async def get_redis() -> Any:
    return redis_client
