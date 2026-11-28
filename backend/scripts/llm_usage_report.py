"""Print the in-process usage aggregate.

The live read is GET /api/internal/llm-usage, protected the same way as
GET /api/builder/telemetry/summary (signed-in admin). This script only sees
events recorded in the current process. It does not print secrets.
"""

from backend.app.ai.guards.llm_budget import aggregate_usage, usage_events


def main() -> None:
    import json

    print(json.dumps(aggregate_usage(usage_events()), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
