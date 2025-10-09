import os
from typing import Optional
from .transport.secure_http_client import SecureHttpClient
from .core.orchestrator import Orchestrator
from .dx.builder import PayoutBuilder
from .storage.idempotency_store import RedisIdempotencyStore
from .storage.receipt_store import RedisReceiptStore

try:
    import redis
except ImportError:
    redis = None


class VisaDirectClientConfig:
    def __init__(
        self,
        base_url: Optional[str] = None,
        cert_path: Optional[str] = None,
        key_path: Optional[str] = None,
        ca_path: Optional[str] = None,
        env_mode: str = "production",
        redis_url: Optional[str] = None,
        user_id: Optional[str] = None,
        password: Optional[str] = None,
        api_key: Optional[str] = None,
        shared_secret: Optional[str] = None,
    ):
        self.base_url = base_url or os.getenv("VISA_BASE_URL")
        self.cert_path = cert_path or os.getenv("VISA_CERT_PATH")
        self.key_path = key_path or os.getenv("VISA_KEY_PATH")
        self.ca_path = ca_path or os.getenv("VISA_CA_PATH")
        self.env_mode = env_mode or os.getenv("SDK_ENV", "production")
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        self.user_id = user_id or os.getenv("VISA_USER_ID")
        self.password = password or os.getenv("VISA_PASSWORD")
        self.api_key = api_key or os.getenv("VISA_API_KEY")
        self.shared_secret = shared_secret or os.getenv("VISA_SHARED_SECRET")


class VisaDirectClient:
    def __init__(self, config: Optional[VisaDirectClientConfig] = None):
        if config is None:
            config = VisaDirectClientConfig()

        # Create HTTP client with mTLS
        self.http_client = SecureHttpClient(
            base_url=config.base_url,
            cert_path=config.cert_path,
            key_path=config.key_path,
            ca_path=config.ca_path,
        )

        # Initialize Redis if URL provided
        self.redis_client = None
        if config.redis_url and redis:
            self.redis_client = redis.from_url(config.redis_url)

        # Create orchestrator with Redis stores
        orchestrator_options = {}
        if self.redis_client:
            orchestrator_options.update({
                "idempotency_store": RedisIdempotencyStore(self.redis_client),
                "receipt_store": RedisReceiptStore(self.redis_client),
            })

        self.orchestrator = Orchestrator(self.http_client, **orchestrator_options)

    @property
    def payouts(self):
        return PayoutBuilder(self.orchestrator)

    def close(self):
        if self.redis_client:
            self.redis_client.close()
