import path from 'path'
import fs from 'fs'
import * as esbuild from 'esbuild'

export function NodeGlobalsPolyfillPlugin({
    buffer = false,
    define = {},
    process = true,
} = {}): esbuild.Plugin {
    return {
        name: 'node-globals-polyfill',
        setup({ initialOptions, onResolve, onLoad }) {
            onResolve({ filter: /_node-buffer-polyfill_\.js/ }, (arg) => {
                return {
                    path: path.resolve(__dirname, '../Buffer.js'),
                }
            })
            onResolve({ filter: /_node-process-polyfill_\.js/ }, (arg) => {
                return {
                    path: path.resolve(__dirname, '../process.js'),
                }
            })

            onLoad({ filter: /_virtual-process-polyfill_\.js/ }, (arg) => {
                const data = fs
                    .readFileSync(path.resolve(__dirname, '../process.js'))
                    .toString()

                const keys = Object.keys(define)
                return {
                    loader: 'js',
                    contents: data.replace(
                        `const defines = {}`,
                        'const defines = {\n' +
                            keys
                                .filter((x) => x.startsWith('process.'))
                                .sort((a, b) => a.length - b.length)
                                .map(
                                    (k) =>
                                        `  ${JSON.stringify(k).replace(
                                            'process.',
                                            '',
                                        )}: ${define[k]},`,
                                )
                                .join('\n') +
                            '\n}',
                    ),
                }
            })

            const polyfills: string[] = []
            if (process) {
                polyfills.push(
                    path.resolve(__dirname, '../_virtual-process-polyfill_.js'),
                )
            }
            if (buffer) {
                polyfills.push(path.resolve(__dirname, '../_buffer.js'))
            }
            if (initialOptions.inject) {
                initialOptions.inject = Array.from(new Set([...initialOptions.inject, ...polyfills]))
            } else {
                initialOptions.inject = Array.from(new Set([...polyfills]))
            }
        },
    }
}

export default NodeGlobalsPolyfillPlugin
