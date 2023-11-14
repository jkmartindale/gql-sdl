# GraphQL Schema Downloader (gql-sdl)

CLI tool to download the GraphQL schema (as GraphQL SDL or JSON) from a given API with introspection enabled.

This shouldn't have to be a standalone tool, but the state of GraphQL tooling is very unstable and I found myself unable to find a tool I could run just to get a remote GraphQL schema in the native schema definition language (SDL). Every recommendation I found either:
- Only returns JSON
- No longer works or isn't maintained
- Removed the schema download feature at some point
- Requires you to use their specific full-stack workflow

None of that makes sense, so I made this stupid script that does one thing and does it well enough. Please make it obsolete.

## Installation
```shell
npm install -g gql-sdl
```

gql-sdl is also compatible with `npx` if you prefer not to add it to your `PATH`.

## Usage
By default, gql-sdl outputs the SDL to stdout:
```shell
$ gql-sdl https://swapi-graphql.netlify.app/.netlify/functions/index
schema {
  query: Root
}

type Root {
  allFilms(after: String, first: Int, before: String, last: Int): FilmsConnection
  film(id: ID, filmID: ID): Film
  allPeople(after: String, first: Int, before: String, last: Int): PeopleConnection
  person(id: ID, personID: ID): Person
  allPlanets(after: String, first: Int, before: String, last: Int): PlanetsConnection
...
```

Output can also be saved to a file with the `-o FILE` option. If you specify both `--json` and `--sdl`, `FILE` will be used as a base filename and output will be saved to `FILE.json` and `FILE.graphql` accordingly.

Use the `-H HEADER` option to send headers (cookies, authorization, user agent, etc.) with the introspection query. For example, the GitHub GraphQL API requires a personal access token:

```shell
$ gql-sdl https://api.github.com/graphql
Error response from server: [401] Unauthorized
$ gql-sdl https://api.github.com/graphql -H "Authorization: Bearer ghp_[redacted]"
directive @requiredCapabilities(requiredCapabilities: [String!]) on OBJECT | SCALAR | ARGUMENT_DEFINITION | INTERFACE | INPUT_OBJECT | FIELD_DEFINITION | ENUM | ENUM_VALUE | UNION | INPUT_FIELD_DEFINITION

"""Autogenerated input type of AbortQueuedMigrations"""
input AbortQueuedMigrationsInput {
  """The ID of the organization that is running the migrations."""
  ownerId: ID!

  """A unique identifier for the client performing the mutation."""
  clientMutationId: String
}
...
```

gql-sdl supports introspection options provided by [GraphQL.js](https://github.com/graphql/graphql-js). These flags may not be compatible with all GraphQL servers (especially `--specified-by-url` and `--input-value-deprecation`) and may cause the introspection query to fail.

### Full Usage

```
$ gql-sdl --help
usage: gql-sdl [-h] [-s] [-j] [-H HEADER] [-o FILE] [-v] [-N] [-D] [-R] [-S] [-I] endpoint

positional arguments:
  endpoint                       GraphQL endpoint with introspection enabled

optional arguments:
  -h, --help                     show this help message and exit
  -s, --sdl                      download schema as GraphQL SDL (default)
  -j, --json                     download schema as JSON
  -H, --header HEADER            add HTTP request header (can be specified multiple times)
  -o, --output FILE              output to the specified file instead of stdout
  -v, --version                  show gql-sdl's version number and exit

introspection options:
  -N, --no-descriptions          don't include descriptions in the introspection result
  -D, --schema-description       include `description` field on schema
  -R, --repeatable-directives    include `isRepeatable` flag on directives
  -S, --specified-by-url         include `specifiedByURL` in the introspection result
  -I, --input-value-deprecation  query deprecation of input values
```
