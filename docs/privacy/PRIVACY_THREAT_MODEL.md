# Privacy threat model

Primary threats are cross-tenant reads, replayed launches, webhook forgery, excessive evidence collection, and credential tampering. Controls are tenant-scoped queries, nonce/state TTLs, HMAC verification, data minimization, signed credentials, and revocation checks.
