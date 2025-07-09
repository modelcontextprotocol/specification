# Update MCP Compliance Scenarios

This command updates or creates the `compliance/scenarios/data.json` file based on the MCP specification.

## Usage

Run this command to:
1. Create initial scenarios if `data.json` doesn't exist
2. Update scenarios after spec changes to ensure coverage

## Context

The scenarios should cover all major features of the MCP protocol based on the specification files:

- Architecture: `/docs/specification/draft/architecture/index.mdx`
- Basic Protocol: 
  - `/docs/specification/draft/basic/index.mdx`
  - `/docs/specification/draft/basic/lifecycle.mdx`
  - `/docs/specification/draft/basic/transports.mdx`
  - `/docs/specification/draft/basic/authorization.mdx`
  - `/docs/specification/draft/basic/security_best_practices.mdx`
  - `/docs/specification/draft/basic/utilities/cancellation.mdx`
  - `/docs/specification/draft/basic/utilities/ping.mdx`
  - `/docs/specification/draft/basic/utilities/progress.mdx`
- Server Features:
  - `/docs/specification/draft/server/index.mdx`
  - `/docs/specification/draft/server/tools.mdx`
  - `/docs/specification/draft/server/resources.mdx`
  - `/docs/specification/draft/server/prompts.mdx`
  - `/docs/specification/draft/server/utilities/completion.mdx`
  - `/docs/specification/draft/server/utilities/logging.mdx`
  - `/docs/specification/draft/server/utilities/pagination.mdx`
- Client Features:
  - `/docs/specification/draft/client/elicitation.mdx`
  - `/docs/specification/draft/client/roots.mdx`
  - `/docs/specification/draft/client/sampling.mdx`

## Implementation

1. Read and analyze all specification files
2. Extract protocol features and requirements
3. Design test scenarios that cover:
   - Basic connectivity and initialization
   - Tool invocation (simple and with elicitation)
   - Resource management
   - Prompt templates
   - Multi-client scenarios
   - Transport-specific scenarios (stdio, SSE, streamable HTTP)
   - Error handling
   - Cancellation
   - Progress notifications
4. Update or create `compliance/scenarios/data.json` with comprehensive scenarios

## Output

The command should produce a valid JSON file matching the `Scenarios` type defined in `compliance/src/types.ts`.