import os
from dotenv import load_dotenv
from dataclasses import dataclass

load_dotenv()

@dataclass
class Config:
    db_path: str
    debug: bool
    log_level: str
    cors_origins: list[str]

def load_config() -> Config:
    db_path = os.getenv("EXAM_DB_PATH", "scheduler.db")
    debug = parse_bool(os.getenv("EXAM_DEBUG","false"))
    log_level = os.getenv("EXAM_LOG_LEVEL","INFO")
    exam_cors_origins = parse_csv(os.getenv("EXAM_CORS_ORIGINS"))
    conf = Config(db_path=db_path,debug=debug,log_level=log_level,cors_origins=exam_cors_origins)
    return conf


def parse_bool(value: str | bool | None, default: bool = False) -> bool:
    """Parse a boolean environment-variable value.

    Accepted truthy values are ``true``, ``1``, ``yes``, and ``on``; accepted
    falsy values are ``false``, ``0``, ``no``, and ``off``. Matching ignores
    case and surrounding whitespace. ``None`` and an empty string use
    ``default``.
    """
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value

    normalized_value = value.strip().lower()
    if normalized_value in {"true", "1", "yes", "on"}:
        return True
    if normalized_value in {"false", "0", "no", "off"}:
        return False

    raise ValueError(
        f"Invalid boolean value {value!r}; expected true/false, 1/0, yes/no, or on/off."
    )


def parse_csv(value: str | None, default: list[str] | None = None) -> list[str]:
    """Parse a comma-separated environment-variable value into clean strings."""
    if value is None or not value.strip():
        return list(default) if default is not None else []

    return [item.strip() for item in value.split(",") if item.strip()]
