"""Backend routers module."""

from . import ai

__all__ = ["ai"]

# Optional imports for auth and subscription
try:
    from . import auth, subscription
    __all__.extend(["auth", "subscription"])
except ImportError:
    pass