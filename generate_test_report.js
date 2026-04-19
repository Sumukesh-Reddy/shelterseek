const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Universal Test Report Generation...');

const runCommand = (cmd, cwd) => {
  try {
    console.log(`\nExecuting: ${cmd} in ${cwd}`);
    execSync(cmd, { cwd, stdio: 'inherit' });
    return true;
  } catch (err) {
    console.error(`❌ Command failed: ${cmd}`);
    return false;
  }
};

// 1. Run Backend Tests
const backendPassed = runCommand('npm run test:report', path.join(__dirname, 'backend'));

// 2. Run Frontend Tests
const frontendPassed = runCommand('npm run test:report', path.join(__dirname, 'frontend'));

// 3. Create Summary Report
const summaryHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>ShelterSeek Project Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f7f6; color: #333; padding: 40px; }
        .container { max-width: 800px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .status { padding: 10px 15px; border-radius: 6px; font-weight: bold; margin-bottom: 20px; }
        .success { background: #d4edda; color: #155724; }
        .failure { background: #f8d7da; color: #721c24; }
        .link-card { display: flex; justify-content: space-between; align-items: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; transition: 0.2s; }
        .link-card:hover { border-color: #3498db; background: #f9fcff; }
        .btn { text-decoration: none; background: #3498db; color: white; padding: 8px 16px; border-radius: 4px; font-size: 14px; }
        .footer { margin-top: 30px; font-size: 12px; color: #95a5a6; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>ShelterSeek Test Summary</h1>
        <div class="status ${backendPassed && frontendPassed ? 'success' : 'failure'}">
            Overall Status: ${backendPassed && frontendPassed ? '✅ All Tests Passed' : '⚠️ Some Tests Failed'}
        </div>
        
        <div class="link-card">
            <span>Backend API Tests</span>
            <span style="color: ${backendPassed ? 'green' : 'red'}">${backendPassed ? 'Passed' : 'Failed'}</span>
            <a href="backend/test-report.html" class="btn">View Detailed Report</a>
        </div>
        
        <div class="link-card">
            <span>Frontend UI Tests</span>
            <span style="color: ${frontendPassed ? 'green' : 'red'}">${frontendPassed ? 'Passed' : 'Failed'}</span>
            <a href="frontend/test-report.html" class="btn">View Detailed Report</a>
        </div>
        
        <p style="margin-top: 30px;">
            <b>Instructions:</b> Click the buttons above to view specific reports for each layer. 
            Ensure your local server environment (Redis/MongoDB) is either mocked or running for live integration tests.
        </p>
        
        <div class="footer">
            Generated on ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'combined-test-report.html'), summaryHtml);

console.log('\n✨ Combined report generated: combined-test-report.html');
console.log('Backend Report: backend/test-report.html');
console.log('Frontend Report: frontend/test-report.html');
