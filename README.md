<p align="center">
  <img height="100px" src="./logo.png">
</p>

# Baseplate

![tests](https://github.com/halfdomelabs/baseplate/actions/workflows/test.yml/badge.svg)

> **🚧 Rebuild in progress**
>
> Baseplate is being rebuilt on a new stack. `main` currently holds only the packages the rebuild reuses: the sync engine, the TypeScript rendering primitives, the plugin system, code-morph, the UI component library and shared tooling. Nothing is published from `main` until the first early-access release.

## Looking for the original Baseplate?

The original Baseplate (project builder, React/Fastify generators, plugins and example projects) is frozen on the [`legacy`](https://github.com/halfdomelabs/baseplate/tree/legacy) branch and the `legacy-final` tag. Its last published packages remain available on npm under `@baseplate-dev/*`.

To browse it next to `main`, for example when porting logic over, check it out as a worktree:

```bash
git worktree add ../baseplate-legacy legacy-final
```

## Development

```bash
git clone https://github.com/halfdomelabs/baseplate.git
cd baseplate
pnpm install
pnpm build
```

See [AGENTS.md](./AGENTS.md) for build commands, code style and repository structure, and [CONTRIBUTING.md](./CONTRIBUTING.md) for changesets and releases.

## Support

If you encounter any issues or have questions, please:

- Open an [issue](https://github.com/halfdomelabs/baseplate/issues) on GitHub.
- Contact our team at [support@halfdomelabs.com](mailto:support@halfdomelabs.com).

## License

Baseplate is licensed under the [MIT License](LICENSE).
