// Type definitions for argparse 2.0
// Project: https://github.com/nodeca/argparse
// Definitions by: Andrew Schurman <https://github.com/arcticwaters>
//                 Tomasz Łaziuk <https://github.com/tlaziuk>
//                 Sebastian Silbermann <https://github.com/eps1lon>
//                 Kannan Goundan <https://github.com/cakoose>
//                 Halvor Holsten Strand <https://github.com/ondkloss>
//                 Dieter Oberkofler <https://github.com/doberkofler>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 4.0

export class ArgumentParser extends ArgumentGroup {
    constructor(options?: ArgumentParserOptions);
    add_subparsers(options?: SubparserOptions): SubParser;
    parse_args(args?: string[], ns?: Namespace | object): any;
    print_usage(): void;
    print_help(): void;
    format_usage(): string;
    format_help(): string;
    parse_known_args(args?: string[], ns?: Namespace | object): any[];
    convert_arg_line_to_args(argLine: string): string[];
    exit(status: number, message: string): void;
    error(err: string | Error): void;
}

// tslint:disable-next-line:no-unnecessary-class
export class Namespace {
    constructor(options: object);
    [key: string]: any;
}

export class SubParser {
    add_parser(name: string, options?: SubArgumentParserOptions): ArgumentParser;
}

export class ArgumentGroup {
    add_argument(arg: string, options?: ArgumentOptions): void;
    add_argument(arg1: string, arg2: string, options?: ArgumentOptions): void;
    add_argument_group(options?: ArgumentGroupOptions): ArgumentGroup;
    add_mutually_exclusive_group(options?: { required: boolean }): ArgumentGroup;
    set_defaults(options?: {}): void;
    get_default(dest: string): any;
}

export interface SubparserOptions {
    title?: string | undefined;
    description?: string | undefined;
    prog?: string | undefined;
    parser_class?: { new (): any } | undefined;
    action?: string | undefined;
    dest?: string | undefined;
    help?: string | undefined;
    metavar?: string | undefined;
    required?: boolean | undefined;
}

export interface SubArgumentParserOptions extends ArgumentParserOptions {
    aliases?: string[] | undefined;
    help?: string | undefined;
}

export interface ArgumentParserOptions {
    description?: string | undefined;
    epilog?: string | undefined;
    add_help?: boolean | undefined;
    argument_default?: any;
    parents?: ArgumentParser[] | undefined;
    prefix_chars?: string | undefined;
    formatter_class?: {
        new (): HelpFormatter | ArgumentDefaultsHelpFormatter | RawDescriptionHelpFormatter | RawTextHelpFormatter;
    } | undefined;
    prog?: string | undefined;
    usage?: string | undefined;
    exit_on_error?: boolean | undefined;
}

export interface ArgumentGroupOptions {
    prefix_chars?: string | undefined;
    argument_default?: any;
    title?: string | undefined;
    description?: string | undefined;
}

export abstract class Action {
    /** The name of the attribute to hold the created object(s) */
    protected dest: string;
    constructor(options: ActionConstructorOptions);
    abstract call(
        parser: ArgumentParser,
        namespace: Namespace,
        values: string | string[],
        optionString: string | null,
    ): void;
    /** A list of command-line option strings which should be associated with this action. */
    option_strings: [string]
    /**
     * The number of command-line arguments that should be
     * consumed. By default, one argument will be consumed and a single
     * value will be produced.  Other values include:
     *      - N (an integer) consumes N arguments (and produces a list)
     *      - '?' consumes zero or one arguments
     *      - '*' consumes zero or more arguments (and produces a list)
     *      - '+' consumes one or more arguments (and produces a list)
     * Note that the difference between the default and nargs=1 is that
     * with the default, a single value will be produced, while with
     * nargs=1, a list containing a single value will be produced. */
    nargs: number | string
    /** The value to be produced if the option is specified and the option uses an action that takes no values. */
    const: any
    /** The value to be produced if the option is not specified. */
    default: any
    /**
     * A container of values that should be allowed. If not None,
     * after a command-line argument has been converted to the appropriate
     * type, an exception will be raised if it is not a member of this
     * collection.
     */
    choices?: [any]
    /**
     * True if the action must always be specified at the
     * command line. This is only meaningful for optional command-line
     * arguments.
     */
    required: boolean
    /** The help string describing the argument. */
    help: string
    /**
     * The name to be used for the option's argument with the
     * help string. If None, the 'dest' value will be used as the name.
     */
    metavar?: string
}

// Can be used in conjunction with the exit_on_error flag to save the error message
// and use it in a fashion other than printing to stdout.
export class ArgumentError extends Error {
    constructor(argument: Action, message: string);
    str(): string;
}

// An error from trying to convert a command line string to a type.
export class ArgumentTypeError extends Error {
    constructor(message: string);
}

// Passed to the Action constructor.  Subclasses are just expected to relay this to
// the super() constructor, so using an "opaque type" pattern is probably fine.
// Someone may want to fill this out in the future.
export type ActionConstructorOptions = number & { _: "ActionConstructorOptions" };

export class HelpFormatterOptions {
    prog?: string | symbol
    indent_increment?: number
    max_help_position?: number
    width?: number
}

export class HelpFormatter {
    constructor(options?: HelpFormatterOptions)
    _get_default_metavar_for_positional(action: Action): string
    _metavar_formatter(action: Action, default_metavar: string): (tuple_size: number) => [string]
    _get_default_metavar_for_optional(action: Action): string
    _format_args(action: Action, default_metavar: string): string
}
export class ArgumentDefaultsHelpFormatter extends HelpFormatter {}
export class RawDescriptionHelpFormatter extends HelpFormatter {}
export class RawTextHelpFormatter extends RawDescriptionHelpFormatter {}
export class MetavarTypeHelpFormatter extends HelpFormatter {}

export interface ArgumentOptions {
    action?: string | { new (options: ActionConstructorOptions): Action } | undefined;
    option_strings?: string[] | undefined;
    dest?: string | undefined;
    nargs?: string | number | undefined;
    const?: any;
    default?: any;
    // type may be a string (primitive) or a Function (constructor)
    type?: string | Function | undefined; // tslint:disable-line:ban-types
    choices?: string | string[] | undefined;
    required?: boolean | undefined;
    help?: string | undefined;
    metavar?: string | string[] | undefined;
    version?: string | undefined;
}

export class BooleanOptionalAction extends Action {
    call(parser: ArgumentParser, namespace: Namespace, values: string | string[], optionString: string | null): void;
}

export const SUPPRESS: string;
export const OPTIONAL: string;
export const ZERO_OR_MORE: string;
export const ONE_OR_MORE: string;
export const REMAINDER: string;
export const PARSER: string;
