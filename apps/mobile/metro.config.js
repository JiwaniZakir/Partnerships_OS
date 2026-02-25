const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Only watch specific shared packages, NOT the monorepo root
// This prevents Metro from trying to resolve entries from the root
config.watchFolders = [
  path.resolve(monorepoRoot, 'packages/shared'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Resolve from both local and hoisted node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
