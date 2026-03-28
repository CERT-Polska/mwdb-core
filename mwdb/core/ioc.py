from dataclasses import dataclass, field
from enum import Enum
from typing import ClassVar, Dict, FrozenSet, List, Optional, Type


class IOCType(str, Enum):
    """Valid IOC types."""

    IP = "ip"
    DOMAIN = "domain"
    URL = "url"
    PORT = "port"
    EMAIL = "email"
    HASH = "hash"
    MUTEX = "mutex"
    REGISTRY_KEY = "registry_key"
    USER_AGENT = "user_agent"

    @classmethod
    def from_string(cls, value: str) -> "IOCType":
        """Parse a raw string into an IOCType, with normalization.

        Handles case-insensitive input and surrounding whitespace.
        Raises ValueError if the value is not a recognized IOC type.
        """
        normalized = value.lower().strip()
        try:
            return cls(normalized)
        except ValueError:
            valid = ", ".join(t.value for t in cls)
            raise ValueError(
                f"Invalid IOC type '{value}'. Must be one of: {valid}"
            )


class IOCSeverity(str, Enum):
    """Valid IOC severity levels, ordered from lowest to highest."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

    @classmethod
    def from_string(cls, value: str) -> "IOCSeverity":
        """Parse a raw string into an IOCSeverity, with normalization.

        Handles case-insensitive input and surrounding whitespace.
        Raises ValueError if the value is not a recognized severity.
        """
        normalized = value.lower().strip()
        try:
            return cls(normalized)
        except ValueError:
            valid = ", ".join(s.value for s in cls)
            raise ValueError(
                f"Invalid severity '{value}'. Must be one of: {valid}"
            )


# ---------------------------------------------------------------------------
# Base IOC dataclass
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class BaseIOC:
    """Immutable base for all IOC types.

    Each concrete subclass must set the ``IOC_TYPE`` class variable and may
    override ``sanitize_value`` for type-specific normalization.

    Construction should go through one of the factory classmethods:

    * ``BaseIOC.from_dict(data)`` -- dispatches to the correct subclass
      based on the ``type`` key in *data*.
    * ``SomeIOC.from_raw_value(raw, ...)`` -- constructs a specific subclass
      directly, applying its sanitization.
    """

    IOC_TYPE: ClassVar[IOCType]

    value: str
    category: Optional[str] = None
    severity: Optional[IOCSeverity] = None
    tags: List[str] = field(default_factory=list)

    def __post_init__(self):
        if not self.value or not self.value.strip():
            raise ValueError("IOC value must not be empty")

    # -- sanitization (override in subclasses) -----------------------------

    @classmethod
    def sanitize_value(cls, raw_value: str) -> str:
        """Normalize a raw IOC value. Subclasses override for type-specific
        rules; the default simply strips surrounding whitespace."""
        return raw_value.strip()

    # -- factory classmethods ----------------------------------------------

    @classmethod
    def from_dict(cls, data: dict) -> "BaseIOC":
        """Create the appropriate IOC subclass from a raw dictionary.

        Looks up the ``type`` key, resolves it to a concrete subclass via
        ``IOC_IMPLEMENTATIONS``, and delegates construction to
        ``from_raw_value``.  Raises ``ValueError`` on invalid input.
        """
        raw_type = data.get("type", "")
        if not raw_type:
            raise ValueError("IOC type is required")

        ioc_type = IOCType.from_string(raw_type)
        impl_class = IOC_IMPLEMENTATIONS[ioc_type]
        return impl_class.from_raw_value(
            raw_value=data.get("value", ""),
            category=data.get("category"),
            severity=data.get("severity"),
            tags=data.get("tags"),
        )

    @classmethod
    def from_raw_value(
        cls,
        raw_value: str,
        *,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> "BaseIOC":
        """Construct this IOC type from raw (unsanitized) field values.

        Applies ``sanitize_value`` to the value and normalizes category /
        severity.  Raises ``ValueError`` when the value is empty or the
        severity is unrecognized.
        """
        sanitized_value = cls.sanitize_value(raw_value)
        if not sanitized_value:
            raise ValueError("IOC value is required")

        return cls(
            value=sanitized_value,
            category=category.lower().strip() if category else None,
            severity=(
                IOCSeverity.from_string(severity) if severity else None
            ),
            tags=tags if tags is not None else [],
        )


# ---------------------------------------------------------------------------
# Concrete IOC types
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class IpIOC(BaseIOC):
    """IP address indicator (IPv4 or IPv6)."""

    IOC_TYPE: ClassVar[IOCType] = IOCType.IP

    @classmethod
    def sanitize_value(cls, raw_value: str) -> str:
        # IPv6 hex digits are case-insensitive; normalise to lowercase.
        return raw_value.lower().strip()


@dataclass(frozen=True)
class DomainIOC(BaseIOC):
    """Domain name indicator."""

    IOC_TYPE: ClassVar[IOCType] = IOCType.DOMAIN

    @classmethod
    def sanitize_value(cls, raw_value: str) -> str:
        # Lowercase, strip, and remove a trailing FQDN dot if present.
        return raw_value.lower().strip().rstrip(".")


@dataclass(frozen=True)
class UrlIOC(BaseIOC):
    """URL indicator."""

    IOC_TYPE: ClassVar[IOCType] = IOCType.URL

    @classmethod
    def sanitize_value(cls, raw_value: str) -> str:
        # URL paths are case-sensitive, so only strip whitespace.
        return raw_value.strip()


@dataclass(frozen=True)
class PortIOC(BaseIOC):
    """Network port indicator."""

    IOC_TYPE: ClassVar[IOCType] = IOCType.PORT

    @classmethod
    def sanitize_value(cls, raw_value: str) -> str:
        return raw_value.strip()


@dataclass(frozen=True)
class EmailIOC(BaseIOC):
    """Email address indicator."""

    IOC_TYPE: ClassVar[IOCType] = IOCType.EMAIL

    @classmethod
    def sanitize_value(cls, raw_value: str) -> str:
        return raw_value.lower().strip()


@dataclass(frozen=True)
class HashIOC(BaseIOC):
    """Cryptographic hash indicator (MD5, SHA-1, SHA-256, etc.)."""

    IOC_TYPE: ClassVar[IOCType] = IOCType.HASH

    @classmethod
    def sanitize_value(cls, raw_value: str) -> str:
        # Hex hashes are case-insensitive; normalise to lowercase.
        return raw_value.lower().strip()


@dataclass(frozen=True)
class MutexIOC(BaseIOC):
    """Mutex (mutual exclusion object) indicator."""

    IOC_TYPE: ClassVar[IOCType] = IOCType.MUTEX

    @classmethod
    def sanitize_value(cls, raw_value: str) -> str:
        # Mutex names are case-sensitive on Windows; preserve case.
        return raw_value.strip()


@dataclass(frozen=True)
class RegistryKeyIOC(BaseIOC):
    """Windows registry key/value indicator."""

    IOC_TYPE: ClassVar[IOCType] = IOCType.REGISTRY_KEY

    @classmethod
    def sanitize_value(cls, raw_value: str) -> str:
        # Registry key paths are case-insensitive on Windows, but values
        # may be meaningful in original case.  Preserve case, strip only.
        return raw_value.strip()


@dataclass(frozen=True)
class UserAgentIOC(BaseIOC):
    """HTTP User-Agent string indicator."""

    IOC_TYPE: ClassVar[IOCType] = IOCType.USER_AGENT

    @classmethod
    def sanitize_value(cls, raw_value: str) -> str:
        # User-Agent strings are case-sensitive; preserve case.
        return raw_value.strip()


# ---------------------------------------------------------------------------
# IOCType -> implementation mapping
# ---------------------------------------------------------------------------

IOC_IMPLEMENTATIONS: Dict[IOCType, Type[BaseIOC]] = {
    IOCType.IP: IpIOC,
    IOCType.DOMAIN: DomainIOC,
    IOCType.URL: UrlIOC,
    IOCType.PORT: PortIOC,
    IOCType.EMAIL: EmailIOC,
    IOCType.HASH: HashIOC,
    IOCType.MUTEX: MutexIOC,
    IOCType.REGISTRY_KEY: RegistryKeyIOC,
    IOCType.USER_AGENT: UserAgentIOC,
}


# ---------------------------------------------------------------------------
# IOC update (partial)
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class IOCUpdate:
    """Immutable representation of a partial IOC update.

    Fields set to ``None`` will not be applied.  Use ``is_provided`` to check
    whether a given field was explicitly included in the source data.
    ``provided_fields`` tracks which fields the caller intended to change so
    that 'not provided' (omitted from the request) can be distinguished from
    'set to None' (clear the field).
    """

    category: Optional[str] = None
    severity: Optional[IOCSeverity] = None
    tags: Optional[List[str]] = None
    provided_fields: FrozenSet[str] = field(
        default_factory=frozenset, repr=False, compare=False
    )

    def is_provided(self, field_name: str) -> bool:
        """Return True if the field was explicitly included in the source."""
        return field_name in self.provided_fields

    @classmethod
    def from_dict(cls, data: dict) -> "IOCUpdate":
        """Create an IOCUpdate from a raw dictionary.

        Handles sanitization and validation.  Fields not present in *data*
        (or present as ``None``) are treated as 'not provided'.
        """
        provided: set = set()

        raw_category = data.get("category")
        category = None
        if raw_category is not None:
            provided.add("category")
            category = raw_category.lower().strip() if raw_category else None

        raw_severity = data.get("severity")
        severity = None
        if raw_severity is not None:
            provided.add("severity")
            if raw_severity:
                severity = IOCSeverity.from_string(raw_severity)

        raw_tags = data.get("tags")
        tags = None
        if raw_tags is not None:
            provided.add("tags")
            tags = raw_tags

        return cls(
            category=category,
            severity=severity,
            tags=tags,
            provided_fields=frozenset(provided),
        )
