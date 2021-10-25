import path from 'path';
import webpack from 'webpack';
import StatoscopePlugin from '@statoscope/webpack-plugin';

import ModuleLogger from './plugins/moduleLogger';

const config: webpack.Configuration = {
    mode: 'development',
    entry: {
        root: './src/pages/root.tsx',
        root2: './src/pages/root2.tsx',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[contenthash].js',
        clean: true
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    },
    plugins: [
        new ModuleLogger(),
        new StatoscopePlugin({
            saveStatsTo: 'stats.json',
            saveOnlyStats: false,
            open: false,
        })
    ],
    resolve: {
        fallback: {
            buffer: require.resolve('buffer'),
            stream: false,
        },
        alias: {
            'bn.js': false,
            'crypto-browserify': false,
        },
        extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    transpileOnly: true
                }
            },
        ],
    },
};

export default config;