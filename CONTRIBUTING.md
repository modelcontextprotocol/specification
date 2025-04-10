# Contributing to Model Context Protocol

Thank you for your interest in contributing to the Model Context Protocol specification!
This document outlines how to contribute to this project.

## Prerequisites

The following software is required to work on the spec:

- Node.js 20 or above
- TypeScript
- TypeScript JSON Schema (for generating JSON schema)
- [Mintlify](https://mintlify.com/) (optional, for docs)
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
nvm install  # install correct Node version
npm install  # install dependencies
```

## Making Changes

Note that schema changes are made to `schema.ts`. `schema.json` is generated from
`schema.ts` using `npm run validate:schema`.

1. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes
3. Validate your changes:

```bash
npm run validate:schema    # validate schema
npm run generate:json     # generate JSON schema
```

4. Run docs locally (optional):

```bash
npm run serve:docs
```

### Documentation Guidelines

When contributing to the documentation:

- Keep content clear, concise, and technically accurate
- Follow the existing file structure and naming conventions
- Include code examples where appropriate
- Use proper MDX formatting and components
- Test all links and code samples
- Use appropriate headings: "When to use", "Steps", and "Tips" for tutorials
- Place new pages in appropriate sections (concepts, tutorials, etc.)
- Update docs.json when adding new pages
- Follow existing file naming conventions (kebab-case.mdx)
- Include proper frontmatter in MDX files

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
