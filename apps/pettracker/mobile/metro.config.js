const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../../..");

const config = getDefaultConfig(projectRoot);

// Monorepo: watch additional directories for changes
config.watchFolders = [workspaceRoot];

// Monorepo: resolve modules from workspace root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Ensure core-mobile package is resolved
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
