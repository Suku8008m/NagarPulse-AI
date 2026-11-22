const { execSync } = require('child_process');

try {
  console.log('Staging files...');
  execSync('git add -A', { stdio: 'inherit' });
  console.log('Committing changes...');
  execSync('git commit -m "refactor: codebase deduplication and react-toastify integration across client and server"', { stdio: 'inherit' });
  console.log('Pushing to GitHub origin main...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('Successfully pushed to GitHub!');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
