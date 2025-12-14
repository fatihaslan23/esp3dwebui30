/* config/webpack.dev.js - PROXY HARİÇ ÇALIŞAN HALE YAKIN VERSİYON */

const webpack = require('webpack');
const path = require('path');

module.exports = { 
    mode: 'development',
    devtool: 'inline-source-map',
    
    entry: {
        main: './src/index.js',
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, '../dist'),
        publicPath: '/',
    },

    // ALIASLAR (App'in açılması için gerekli)
    resolve: {
        alias: {
            TargetDir: path.resolve(__dirname, '../src/targets/Printer3D'),
            SubTargetDir: path.resolve(__dirname, '../src/targets/Printer3D/Marlin'),
            '~': path.resolve(__dirname, '../src'),
            '../../targets': path.resolve(__dirname, '../src/targets')
        },
        extensions: ['.js', '.jsx', '.json'],
    },
    
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react'],
                    },
                },
            },
            {
                test: /\.(s[ac]ss|css)$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
        ],
    },
    
    devServer: {
        host: '0.0.0.0',
        port: 8088,
        hot: true,
        historyApiFallback: true,
        client: {
            overlay: true,
        },
        static: {
            directory: path.join(__dirname, 'server', 'public'),
        },
        
        // KRİTİK PROXY: Proxy'yi sadece API yollarına sınırlandırarak, 
        // Electron'un kendi kendine proxy yapmasını engellemeyi deniyoruz.
        proxy: [
            {
                // Önceki denememizdeki statik filtreyi kaldırıp, 
                // sadece API yollarına odaklanıyoruz.
                context: ['/api', '/command', '/files', '/ws'], 
                
                router: function (req) {
                    const targetIp = req.headers['http-x-target-ip'];
                    
                    if (targetIp) {
                        const newTarget = `http://${targetIp}`;
                        // console.log(`[PROXY DEBUG] BAŞLIK OKUNDU. Hedef: ${newTarget}`);
                        return newTarget;
                    }
                    
                    // Bu kurala uyan ve başlığı olmayan her şey localhost:8080'e dönecek.
                    return 'http://localhost:8080';
                },
                changeOrigin: true,
                secure: false,
                ws: true,
            },
        ],
    },
    
    plugins: [
        new webpack.DefinePlugin({
            'process.env.PUBLIC_URL': JSON.stringify('/')
        }),
    ],
};