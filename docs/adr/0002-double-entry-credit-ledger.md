# ADR 0002: Idempotent credit reservations

Every issuance request derives a SHA-256 idempotency key. Reservations are append-only in production and transition only through explicit guards. Provider failures release the hold; confirmed issuance consumes it.
