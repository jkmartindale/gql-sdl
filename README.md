# gqlschema

CLI tool to pull the GraphQL schema (as GraphQL SDL or JSON) from a given endpoint with introspection enabled.

This shouldn't have to be a standalone tool, but the state of GraphQL tooling is very unstable and I found myself unable to find a tool I could run just to get a remote GraphQL schema in SDL form. Every recommendation I found either:
- Only returns JSON
- No longer works or isn't maintained
- Removed the SDL download feature at some point
- Requires you to use their specific full-stack workflow

None of that makes sense, so I made this stupid script that does one thing and does it well. Please make it obsolete.

## Installation
```shell
npm install -g gqlschema
```

gqlschema is also compatible with `npx` if you prefer not to add it to your PATH.

## Usage
By default, gqlschema outputs the SDL to stdout:
```shell
$ gqlschema https://swapi-graphql.netlify.app/.netlify/functions/index
schema {
  query: Root
}

type Root {
  allFilms(after: String, first: Int, before: String, last: Int): FilmsConnection
  film(id: ID, filmID: ID): Film
  allPeople(after: String, first: Int, before: String, last: Int): PeopleConnection
  person(id: ID, personID: ID): Person
  allPlanets(after: String, first: Int, before: String, last: Int): PlanetsConnection
...[truncated]
```

Output can also be saved to a file with the `-o FILE` option. If you specify both `--json` and `--sdl`, `FILE` will be used as a base filename and output will be saved to `FILE.json` and `FILE.graphql` accordingly.

gqlschema supports introspection options provided by [GraphQL.js](https://github.com/graphql/graphql-js). These flags may not be compatible with all GraphQL servers (especially `--specified-by-url` and `--input-value-deprecation`) and could cause the introspection to fail.

### Full Usage

```shell
$ gqlschema --help
usage: gqlschema [-h] [-s] [-j] [-o FILE] [-N] [-D] [-R] [-S] [-I] endpoint

positional arguments:
  endpoint                       GraphQL endpoint with introspection enabled

optional arguments:
  -h, --help                     show this help message and exit
  -s, --sdl                      download schema as GraphQL SDL (default)
  -j, --json                     download schema as JSON
  -o, --output FILE              output to the specified file instead of stdout

introspection options:
  -N, --no-descriptions          don't include descriptions in the introspection result
  -D, --schema-description       include `description` field on schema
  -R, --repeatable-directives    include `isRepeatable` flag on directives
  -S, --specified-by-url         include `specifiedByURL` in the introspection result
  -I, --input-value-deprecation  query deprecation of input values
```
