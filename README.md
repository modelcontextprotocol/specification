# Model Context Protocol specification

This repo contains the specification and protocol schema for the Model Context Protocol.

The schema is available in two implementations:

1. **JSON-RPC based implementation**:

   - [TypeScript Schema](schema/2025-03-26/schema.ts)
   - [JSON Schema](schema/2025-03-26/schema.json)

2. **HTTP-based implementation**:
   - [TypeScript Schema](schema/2025-03-26/http-schema.ts)
   - [JSON Schema](schema/2025-03-26/http-schema.json)
   - [Documentation](docs/http-protocol.md)

The HTTP-based implementation simplifies the protocol by using standard HTTP methods and
conventions rather than a custom JSON-RPC envelope.

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this
project.

## License

This project is licensed under the MIT License—see the [LICENSE](LICENSE) file for
details.
