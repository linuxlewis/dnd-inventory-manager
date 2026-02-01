"""Logging configuration for the backend."""

import logging
from pathlib import Path


def setup_logging(log_file: str, log_level: str) -> None:
    """Configure logging with file output that resets on startup."""
    # Ensure log directory exists
    log_path = Path(log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    # Create formatter
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # File handler - mode='w' truncates on start
    file_handler = logging.FileHandler(log_file, mode="w")
    file_handler.setFormatter(formatter)

    # Console handler (keeps terminal output working)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)

    # Also capture uvicorn logs
    for logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error"]:
        logger = logging.getLogger(logger_name)
        logger.handlers = []  # Remove default handlers
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
