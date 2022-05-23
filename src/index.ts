#!/usr/bin/env node

import * as fs from 'fs'
import got from 'got'
import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery, printSchema } from 'graphql'
import { Action, ArgumentParser, HelpFormatter } from 'argparse'
import { URL } from 'url'

async function getIntrospectionData(endpoint: string): Promise<IntrospectionQuery> {
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
            json: { query: getIntrospectionQuery() },
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

// Define CLI and parse arguments
// Chose argparse over meow because of automatic help generation and over yargs because the help messages for positional arguments are more helpful
const parser = new ArgumentParser({
    // I hate Python's idea of doing -s1 METAVAR, -s2 METAVAR, --long METAVAR in help listings
    formatter_class: class extends HelpFormatter {
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
})
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
let args = parser.parse_args();

// Default to SDL if not specified
if (!args.json) {
    args.sdl = true;
}
// Append .json and .graphql to filenames if exporting both JSON and SDL
args.output_json = args.output_sdl = args.output
if (args.output && args.sdl && args.json) {
    args.output_json += '.json'
    args.output_sdl += '.graphql'
}

// Grab the JSON first (needed to generate SDL) and write it out if needed
const introspectionData = await getIntrospectionData(args.endpoint)
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