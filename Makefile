.PHONY: build test deploy verify shell build-bpf clean

# Run Anchor build in Docker
build:
	docker compose run --rm anchor anchor build

# Run Anchor test in Docker
test:
	docker compose run --rm anchor anchor test --skip-local-validator

# Run Anchor deploy in Docker
deploy:
	docker compose run --rm anchor anchor deploy

# Run Anchor verify in Docker
verify:
	docker compose run --rm anchor anchor verify

# Run Anchor shell in Docker
shell:
	docker compose run --rm anchor /bin/bash

# Clean build artifacts
clean:
	docker compose run --rm anchor cargo clean
	rm -rf target/
