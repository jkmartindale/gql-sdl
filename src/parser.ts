import { Action, ArgumentParser, HelpFormatter, Namespace } from 'argparse'
import * as path from 'path'

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

export const parser = new class extends ArgumentParser {
    constructor() {
        super({
            formatter_class: CustomHelpFormatter
        })
    }
    /**
     * Modified default argument parsing with behavior not expressible with the argparse API:
     * - If `-j, --json` isn't specified, `-s, --sdl` is assumed
     * - If exporting both JSON and SDL, the given filename gets `.json` and `.graphql` appended
     * - Conversion of the `header` array to a key-value store
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

        if (parsed.headers) {
            parsed.headers = parsed.headers.reduce((headers: any, current: string) => {
                const split = current.split(':')
                headers[split[0].trim()] = split[1].trim()
                return headers
            }, {})
        } else {
            parsed.headers = {}
        }

        return parsed
    }
}
parser.add_argument('endpoint', {
    help: 'GraphQL endpoint with introspection enabled',
})
parser.add_argument('-s', '--sdl', {
    action: 'store_true',
    help: 'download schema as GraphQL SDL (default)',
})
parser.add_argument('-j', '--json', {
    action: 'store_true',
    help: 'download schema as JSON',
})
parser.add_argument('-H', '--header', {
    action: 'append',
    dest: 'headers',
    help: 'add HTTP request header (can be specified multiple times)',
    metavar: 'HEADER'
})
parser.add_argument('-o', '--output', {
    action: 'store',
    help: 'output to the specified file instead of stdout',
    metavar: 'FILE',
})
const introspectionGroup = parser.add_argument_group({ title: 'introspection options' })
introspectionGroup.add_argument('-N', '--no-descriptions', {
    action: 'store_false',
    help: "don't include descriptions in the introspection result",
})
introspectionGroup.add_argument('-D', '--schema-description', {
    action: 'store_true',
    dest: 'schemaDescription',
    help: 'include `description` field on schema',
})
introspectionGroup.add_argument('-R', '--repeatable-directives', {
    action: 'store_true',
    dest: 'directiveIsRepeatable',
    help: 'include `isRepeatable` flag on directives',
})
introspectionGroup.add_argument('-S', '--specified-by-url', {
    action: 'store_true',
    dest: 'specifiedByUrl',
    help: 'include `specifiedByURL` in the introspection result',
})
introspectionGroup.add_argument('-I', '--input-value-deprecation', {
    action: 'store_true',
    dest: 'inputValueDeprecation',
    help: 'query deprecation of input values',
})
