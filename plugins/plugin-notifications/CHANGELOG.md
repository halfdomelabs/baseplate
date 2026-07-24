# @baseplate-dev/plugin-notifications

## 0.6.13

### Patch Changes

- [#923](https://github.com/halfdomelabs/baseplate/pull/923) [`8b0e1cd`](https://github.com/halfdomelabs/baseplate/commit/8b0e1cdf33682edd592a69f961be5f489356d11b) Thanks [@kingston](https://github.com/kingston)! - Add a native notification engine plugin (`@baseplate-dev/plugin-notifications`). The GraphQL Yoga plugin generator now exposes `getPubSub` as an import provider so notification (and other) modules can consume the real-time pubsub instance; this is an additive change with no effect on generated output for projects that don't use it.

- [#927](https://github.com/halfdomelabs/baseplate/pull/927) [`0d3cd21`](https://github.com/halfdomelabs/baseplate/commit/0d3cd21bec022599977539f65fb2431d28574c83) Thanks [@kingston](https://github.com/kingston)! - Remove a now-redundant type assertion in the generated notification service surfaced by TypeScript 6's improved inference.

- Updated dependencies [[`b03e69b`](https://github.com/halfdomelabs/baseplate/commit/b03e69b816d678140fee4dc023416b313a356edc), [`45886a6`](https://github.com/halfdomelabs/baseplate/commit/45886a6fc3ac02f37bf19a3dae45d38186c9ad8a), [`8b0e1cd`](https://github.com/halfdomelabs/baseplate/commit/8b0e1cdf33682edd592a69f961be5f489356d11b), [`1d5f3c0`](https://github.com/halfdomelabs/baseplate/commit/1d5f3c0724c30c99d16ecb6563c2c799ef05e5eb), [`1fd6ccb`](https://github.com/halfdomelabs/baseplate/commit/1fd6ccb695c8c0b4412248364c12f555419844c4), [`f596b4b`](https://github.com/halfdomelabs/baseplate/commit/f596b4b43bd9f0ecb7d5379739b0e36a01c40c70), [`ed5d784`](https://github.com/halfdomelabs/baseplate/commit/ed5d784a0edb2f794ae723ba3fb46a3768cade4c), [`d0f8726`](https://github.com/halfdomelabs/baseplate/commit/d0f87265f16bfbde6c1525b0655850e906a7c3ed), [`9548f2d`](https://github.com/halfdomelabs/baseplate/commit/9548f2d12af830e28187efed4b5a27d42020b289), [`e89c814`](https://github.com/halfdomelabs/baseplate/commit/e89c8143a7a4ea45817a45544fba6bf0ba6fe758), [`9030d45`](https://github.com/halfdomelabs/baseplate/commit/9030d45cd00ff8e3b9ea20744499457e25b0fbf4), [`0d3cd21`](https://github.com/halfdomelabs/baseplate/commit/0d3cd21bec022599977539f65fb2431d28574c83), [`0d3cd21`](https://github.com/halfdomelabs/baseplate/commit/0d3cd21bec022599977539f65fb2431d28574c83)]:
  - @baseplate-dev/fastify-generators@0.6.13
  - @baseplate-dev/core-generators@0.6.13
  - @baseplate-dev/project-builder-lib@0.6.13
  - @baseplate-dev/ui-components@0.6.13
  - @baseplate-dev/sync@0.6.13
  - @baseplate-dev/utils@0.6.13
