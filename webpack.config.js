const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: './src/index.ts',
    devtool: 'source-map',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
    },
    plugins: [
        new CleanWebpackPlugin(),
    ],
    output: {
        library: 'PlotJsonConverter',
        libraryTarget: 'umd',
        globalObject: 'this',
        filename: 'plot-converter.dev.js',
        path: path.resolve(__dirname, 'dist'),
    },
};
