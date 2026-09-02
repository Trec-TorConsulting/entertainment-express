# decode-uri-component (vendored)

React Navigation 6 pulls `query-string@7.1.3`, which does
`require('decode-uri-component')`. Upstream `0.5.0` (the CVE-2026-45822 /
GHSA-vcc3-ghjq-m6fr fix) is ESM-only, so a plain npm override breaks that
require in Jest and Metro.

This copy is the published 0.5.0 decoder (linear-time UTF-8 scanner) with a
CommonJS export. Version is `0.5.0` so lockfile scanners treat it as patched.
