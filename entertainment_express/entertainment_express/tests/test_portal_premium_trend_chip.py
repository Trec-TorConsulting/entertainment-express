"""Unit tests validating portal-kit TrendChip contract (backend strings only)."""

from __future__ import annotations

import re
import pytest


def test_trend_chip_rejects_numeric_currency_parsing():
    """
    Spec portal-premium-experience:
    Data visualization for owner Today and Reports (sparklines, trend chips, utilization rings)
    using backend-formatted strings only — no client-side money math.
    """
    # Verify the implementation file enforces pre-formatted string contract
    import os

    pattern_file = os.path.join(
        os.path.dirname(__file__),
        "..", "..", "..",
        "frontend", "portal-kit", "src", "patterns", "TrendChip.tsx"
    )
    with open(pattern_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Must type trend strictly as string
    assert "trend: string" in content

    # Forbidden client-side currency operations: parseFloat/parseInt/Intl.NumberFormat of money
    assert "parseFloat(" not in content
    assert "Intl.NumberFormat" not in content
    assert "Number(" not in content

    # Direction resolution is based only on pre-formatted string indicators
    assert 'trend.startsWith("+")' in content
    assert 'trend.startsWith("-")' in content
