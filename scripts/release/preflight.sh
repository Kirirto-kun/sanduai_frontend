#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
cd "$repo_root"

fail() {
  printf 'frontend preflight: %s\n' "$*" >&2
  exit 1
}

for command_name in docker git grep; do
  command -v "$command_name" >/dev/null 2>&1 \
    || fail "required command is missing: $command_name"
done

release_revision="${FRONTEND_IMAGE_TAG:-}"
[[ "$release_revision" =~ ^[0-9a-f]{40}$ ]] \
  || fail "FRONTEND_IMAGE_TAG must be a full 40-character lowercase Git SHA"
git_revision="$(git rev-parse HEAD)"
[[ "$release_revision" == "$git_revision" ]] \
  || fail "FRONTEND_IMAGE_TAG does not match the checked-out commit"

expected_api_base="${NEXT_PUBLIC_API_BASE:-}"
[[ "$expected_api_base" == https://* ]] \
  || fail "NEXT_PUBLIC_API_BASE must be the production HTTPS API URL"
if [[ "$expected_api_base" == *localhost* || "$expected_api_base" == *127.0.0.1* ]]; then
  fail "NEXT_PUBLIC_API_BASE must not use a loopback host"
fi

if [[ "${ALLOW_DIRTY_RELEASE:-0}" != "1" ]] \
  && [[ -n "$(git status --porcelain --untracked-files=all)" ]]; then
  fail "git worktree is dirty; build and deploy a committed release"
fi

docker compose -f docker-compose.production.yml config --quiet
resolved_config="$(docker compose -f docker-compose.production.yml config)"
if grep -Eq '^[[:space:]]+build:' <<<"$resolved_config"; then
  fail "production Compose must not contain build directives"
fi
expected_image="sanduai-frontend:$release_revision"
image_count="$(
  docker compose -f docker-compose.production.yml config --images \
    | grep -Fxc "$expected_image" || true
)"
[[ "$image_count" == "1" ]] || fail "frontend must use exactly $expected_image"
grep -Fq 'host_ip: 127.0.0.1' <<<"$resolved_config" \
  || fail "frontend must bind to 127.0.0.1"
grep -Fq 'read_only: true' <<<"$resolved_config" \
  || fail "frontend root filesystem must be read-only"

if [[ "${PREFLIGHT_SKIP_IMAGE_CHECKS:-0}" != "1" ]]; then
  docker image inspect "$expected_image" >/dev/null 2>&1 \
    || fail "release image is not loaded: $expected_image"
  image_revision="$(
    docker image inspect --format \
      '{{ index .Config.Labels "org.opencontainers.image.revision" }}' \
      "$expected_image"
  )"
  [[ "$image_revision" == "$release_revision" ]] \
    || fail "release image OCI revision does not match FRONTEND_IMAGE_TAG"
  image_api_base="$(
    docker image inspect --format \
      '{{ index .Config.Labels "io.sanduai.frontend.api-base" }}' \
      "$expected_image"
  )"
  [[ "$image_api_base" == "$expected_api_base" ]] \
    || fail "frontend image was built for a different NEXT_PUBLIC_API_BASE"
  image_user="$(docker image inspect --format '{{ .Config.User }}' "$expected_image")"
  [[ -n "$image_user" && "$image_user" != "0" && "$image_user" != "root" ]] \
    || fail "release image must run as a non-root user"
fi

printf 'frontend preflight: OK\n'
