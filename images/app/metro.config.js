const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];
config.resolver.sourceExts = ['js', 'json', 'ts', 'tsx', 'jsx'];

module.exports = config;
