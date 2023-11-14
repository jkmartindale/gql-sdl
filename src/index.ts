#!/usr/bin/env node

import * as fs from 'fs'
import { buildClientSchema, getIntrospectionQuery, IntrospectionQuery, printSchema } from 'graphql'
import { URL } from 'url'
import { parser } from './parser.js'

async function getQueryData(endpoint: string, query: string, headers?: any): Promise<IntrospectionQuery> {
    try {
        new URL(endpoint)
    } catch (error) {
        console.error('Invalid URL')
        process.exit(-2)
    }

    let response;
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json', ...headers },
            body: JSON.stringify({ query }),
        })
    } catch (error) {
        console.error(`Failed to connect to API endpoint.\n${error}`)
        process.exit(-1)
    }

    if (!response.ok) {
        console.error(`Error response from server: [${response.status}] ${response.statusText}`)
        process.exit(-3)
    }

    try {
        const { data } = await response.json()
        return data
    } catch (error) {
        console.error(`Error parsing server response.\n${error}`)
        process.exit(-4)
    }
}

async function outputResult(data: string, file: fs.PathLike | fs.promises.FileHandle | undefined) {
    if (file) {
        fs.promises.writeFile(file, data)
    } else {
        process.stdout.write(data)
    }
}

let args = parser.parse_args()

// Grab the JSON first (needed to generate SDL) and write it out if requested
const introspectionData = await getQueryData(args.endpoint, getIntrospectionQuery(args), args.headers)
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
