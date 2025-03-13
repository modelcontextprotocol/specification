# Contributing to Model Context Protocol

Thank you for your interest in contributing to the Model Context Protocol
documentation and specification!  This document outlines how to contribute to
this project.

## Prerequisites

The following software is required to work on the spec:
- Node.js 20 or above
- nvm (optional, for managing Node versions)

## Getting Started

1. Fork the repository
2. Clone your fork:

```bash
git clone https://github.com/YOUR-USERNAME/specification.git
cd specification
```

3. Install dependencies:

```bash
nvm install  # optional: install correct Node version
npm install  # install dependencies
```

4. Create a new branch for your changes:

```bash
git checkout -b your-change-name
```

## Documentation Changes

The source files for the documentation live in the [docs](docs/) folder.

Run `npm run serve:docs` to preview documentation changes locally.

## Schema Changes

Schema changes are made to `schema.ts` of the corresponding spec version, in the
[specification/schema](specification/schema) folder. `schema.json` is generated from `schema.ts`.

After making changes, validate the schema and generate the JSON Schema:

```bash
npm run validate:schema  # validate schema
npm run generate:json    # generate JSON schema
```

## Submitting Changes

1. Push your changes to your fork
2. Submit a pull request to the main repository
3. Follow the pull request template
4. Wait for review

## Code of Conduct

This project follows a Code of Conduct. Please review it in
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Questions

If you have questions, please create an issue in the repository.

## License

By contributing, you agree that your contributions will be licensed under the MIT
License.

## Security

Please review our [Security Policy](SECURITY.md) for reporting security issues.
