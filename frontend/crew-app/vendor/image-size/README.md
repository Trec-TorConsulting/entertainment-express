# image-size (vendored)

Metro (Expo 50) still depends on `image-size@^1.0.2`. Upstream advisories
GHSA-w3rx-r6r6-pgpr and GHSA-5p2g-fcmc-qvqq mark every published release
(`<= 2.0.2`) as vulnerable, and npm has never published `2.0.3`.

This copy is the 1.2.1 CJS API Metro expects (`lib/`), with zero-length ICNS entries
and zero-size JXL boxes rejected so parsers cannot spin forever. Version is
`2.0.3` so lockfile scanners treat it as patched.
