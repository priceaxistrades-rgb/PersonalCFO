Market search and live-price fix

Copy the contents into your existing PersonalCFO GitHub Desktop repository.

Fixes:
- Mutual fund search now calls MFAPI's lightweight search endpoint, instead of downloading the complete 5MB fund directory during a user search. Fund names should populate promptly.
- Market holdings resolve a real Yahoo symbol for crypto/commodities/REITs/bonds before polling. A holding without a manual symbol receives its supported default (for example Crypto -> BTC-USD, Gold -> GOLDBEES.NS).
- Live Markets deduplication now preserves separate kinds correctly.

Test symbols: BTC-USD, ETH-USD, GOLDBEES.NS, SILVERBEES.NS, GC=F, SI=F.
Validated: TypeScript passed, Jest 91/91 passed, build passed.
