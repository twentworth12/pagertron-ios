// CommonJS build script
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { execSync } = require('child_process');

// Get the current directory
const rootDir = join(__dirname, '..');
const versionFilePath = join(rootDir, 'src', 'version.js');

try {
  // Read current version file
  let versionContent = readFileSync(versionFilePath, 'utf8');
  
  // Extract current version and build number
  const versionMatch = versionContent.match(/VERSION\s*=\s*['"]([^'"]+)['"]/);
  const buildMatch = versionContent.match(/BUILD_NUMBER\s*=\s*['"]([^'"]+)['"]/);
  
  if (!versionMatch || !buildMatch) {
    throw new Error('Could not find version or build number in version.js');
  }
  
  const currentVersion = versionMatch[1];
  const currentBuild = parseInt(buildMatch[1], 10);
  
  // Increment build number
  const newBuildNumber = currentBuild + 1;
  
  // Get current date in YYYY-MM-DD format
  const today = new Date();
  const buildDate = today.toISOString().split('T')[0];
  
  // Create new version content
  const newVersionContent = versionContent
    .replace(/BUILD_NUMBER\s*=\s*['"]([^'"]+)['"]/, `BUILD_NUMBER = '${newBuildNumber}'`)
    .replace(/BUILD_DATE\s*=\s*['"]([^'"]+)['"]/, `BUILD_DATE = '${buildDate}'`);
  
  // Write updated version file
  writeFileSync(versionFilePath, newVersionContent, 'utf8');
  
  console.log(`Updated build number to ${newBuildNumber} and date to ${buildDate}`);
  
  // Optional: Commit the changes
  // execSync('git add src/version.js', { cwd: rootDir });
  // execSync('git commit -m "Update build number to ' + newBuildNumber + '"', { cwd: rootDir });
  
} catch (error) {
  console.error('Error updating build:', error.message);
  process.exit(1);
}