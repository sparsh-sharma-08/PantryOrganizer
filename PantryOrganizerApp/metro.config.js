const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Ensure we strictly watch the project root to avoid accidentally bundling files from the parent directory
config.watchFolders = [projectRoot];

module.exports = config;
