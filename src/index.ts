#!/usr/bin/env node

import { Action, ArgumentParser, HelpFormatter, Namespace } from 'argparse'
import * as fs from 'fs'
import got from 'got'
import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery, printSchema } from 'graphql'
import * as path from 'path'
import { URL } from 'url'

const CustomHelpFormatter = class extends HelpFormatter {
    /**
     * Expands the help position to allow argument listings to fit in one line
     */
    constructor() {
        super({
            max_help_position: 34,
            // Required if other arguments present
            prog: path.basename(process.argv.slice(1)[0]),
        })
    }

    /**
     * Modified formatter that doesn't repeat the metavar in help output
     *
     * Before: `-s METAVAR, --long METAVAR`
     * After: `-s1, --long METAVAR`
     */
    _format_action_invocation(action: Action) {
        if (!action.option_strings.length) {
            let default_value = this._get_default_metavar_for_positional(action)
            let metavar = this._metavar_formatter(action, default_value)(1)[0]
            return metavar
        }

        // if the Optional doesn't take a value, format is:
        //    -s, --long
        if (action.nargs === 0) {
            return action.option_strings.join(', ')
        }

        // if the Optional takes a value, format is:
        //    -s, --long ARGS
        let default_value = this._get_default_metavar_for_optional(action)
        let args_string = this._format_args(action, default_value)
        return `${action.option_strings.join(', ')} ${args_string}`
    }
}

// Chose argparse over meow because of automatic help generation and over yargs because the help messages for positional arguments are more helpful
const parser = new class extends ArgumentParser {
    constructor() {
        super({
            formatter_class: CustomHelpFormatter
        })
    }
    /**
     * Augments the standard argument parser with a couple defaults not expressible with the argparse API:
     * - If `-j, --json` isn't specified, `-s, --sdl` is assumed
     * - If exporting both JSON and SDL, the given filename gets `.json` and `.graphql` appended
     */
    parse_args(args?: string[], ns?: Namespace | object): Namespace {
        const parsed = super.parse_args(args, ns)

        if (!parsed.json) {
            parsed.sdl = true
        }

        parsed.output_json = parsed.output_sdl = parsed.output
        if (parsed.output && parsed.sdl && parsed.json) {
            parsed.output_json += '.json'
            parsed.output_sdl += '.graphql'
        }

        return parsed
    }
}
parser.add_argument('endpoint', {
    help: 'GraphQL endpoint with introspection enabled'
})
parser.add_argument('-s', '--sdl', {
    action: 'store_true',
    help: 'download schema as GraphQL SDL (default)',
})
parser.add_argument('-j', '--json', {
    action: 'store_true',
    help: 'download schema as JSON'
})
parser.add_argument('-o', '--output', {
    action: 'store',
    help: 'output to the specified file instead of stdout',
    metavar: 'FILE',
})
const introspectionGroup = parser.add_argument_group({ title: 'introspection options' })
introspectionGroup.add_argument('-D', '--no-descriptions', {
    action: 'store_false',
    help: "don't include descriptions in the introspection result",
})
introspectionGroup.add_argument('-U', '--specified-by-url', {
    action: 'store_true',
    help: 'include `specifiedByURL` in the introspection result',
    dest: 'specifiedByUrl',
})
introspectionGroup.add_argument('-R', '--directive-is-repeatable', {
    action: 'store_true',
    help: 'include `isRepeatable` flag on directives',
    dest: 'directiveIsRepeatable',
})
introspectionGroup.add_argument('-S', '--schema-description', {
    action: 'store_true',
    help: 'include `description` field on schema',
    dest: 'schemaDescription',
})
introspectionGroup.add_argument('-I', '--input-value-deprecation', {
    action: 'store_true',
    help: 'whether target GraphQL server supports deprecation of input values',
    dest: 'inputValueDeprecation',
})
let args = parser.parse_args()

async function getQueryData(endpoint: string, query: string): Promise<IntrospectionQuery> {
    // Ensure URL is valid
    try {
        new URL(endpoint)
    } catch (error) {
        console.error('Invalid URL')
        process.exit(-2)
    }

    try {
        const { data } = await got.post({
            http2: true,
            json: { query },
            url: endpoint
        }).json()
        return data
    } catch (error) {
        console.error(`Failed to connect to API endpoint: ${error}`)
        process.exit(-1)
    }
}

async function outputResult(data: string, file: fs.PathLike | fs.promises.FileHandle | undefined) {
    if (file) {
        fs.promises.writeFile(file, data)
    } else {
        process.stdout.write(data)
    }
}

// Grab the JSON first (needed to generate SDL) and write it out if needed
const introspectionData = await getQueryData(args.endpoint, getIntrospectionQuery(args))
if (args.json) {
    const json = JSON.stringify(introspectionData) + '\n'
    outputResult(json, args.output_json)
}

// Extra newline if printing both to stdout
if (args.sdl && args.json && !args.output) {
    process.stdout.write('\n')
}

// SDL time
if (args.sdl) {
    const sdl = printSchema(buildClientSchema(introspectionData)) + '\n'
    outputResult(sdl, args.output_sdl)
}
