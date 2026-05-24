const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock deployment history
let deploymentHistory = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'success',
    environment: 'production',
    branch: 'main',
    commit: 'a1b2c3d',
    duration: '2m 34s',
    checks: { passed: 8, failed: 0 }
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'rolled_back',
    environment: 'production',
    branch: 'feature/new-ui',
    commit: 'e4f5g6h',
    duration: '1m 12s',
    checks: { passed: 6, failed: 2 }
  }
];

// API: Pre-deployment validation
app.post('/api/validate', (req, res) => {
  const { environment, branch, envVars } = req.body;
  
  const checks = [
    { name: 'Environment Variables', status: envVars?.length > 0 ? 'pass' : 'fail', message: envVars?.length > 0 ? 'All required vars present' : 'Missing critical env vars' },
    { name: 'Dependencies Check', status: 'pass', message: 'All dependencies up to date' },
    { name: 'Breaking Changes', status: 'pass', message: 'No breaking changes detected' },
    { name: 'Database Migrations', status: branch === 'main' ? 'pass' : 'warning', message: branch === 'main' ? 'Migrations ready' : 'Pending migrations detected' },
    { name: 'Test Coverage', status: 'pass', message: '87% coverage (threshold: 80%)' },
    { name: 'Security Scan', status: 'pass', message: 'No vulnerabilities found' },
    { name: 'Build Size', status: 'warning', message: 'Bundle size increased by 12%' },
    { name: 'API Compatibility', status: 'pass', message: 'Backward compatible' }
  ];
  
  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const warnings = checks.filter(c => c.status === 'warning').length;
  
  res.json({
    success: failed === 0,
    checks,
    summary: { passed, failed, warnings },
    recommendation: failed > 0 ? 'Fix critical issues before deploying' : warnings > 0 ? 'Review warnings before proceeding' : 'Safe to deploy'
  });
});

// API: Simulate deployment
app.post('/api/deploy', (req, res) => {
  const { environment, branch, commit } = req.body;
  
  const deployment = {
    id: deploymentHistory.length + 1,
    timestamp: new Date().toISOString(),
    status: Math.random() > 0.2 ? 'success' : 'rolled_back',
    environment,
    branch,
    commit: commit || Math.random().toString(36).substring(7),
    duration: `${Math.floor(Math.random() * 3) + 1}m ${Math.floor(Math.random() * 60)}s`,
    checks: { passed: 8, failed: 0 }
  };
  
  deploymentHistory.unshift(deployment);
  
  res.json({
    success: deployment.status === 'success',
    deployment
  });
});

// API: Get deployment history
app.get('/api/history', (req, res) => {
  res.json({ deployments: deploymentHistory });
});

// API: Rollback
app.post('/api/rollback/:id', (req, res) => {
  const deployment = deploymentHistory.find(d => d.id === parseInt(req.params.id));
  
  if (!deployment) {
    return res.status(404).json({ error: 'Deployment not found' });
  }
  
  const rollback = {
    id: deploymentHistory.length + 1,
    timestamp: new Date().toISOString(),
    status: 'success',
    environment: deployment.environment,
    branch: deployment.branch,
    commit: deployment.commit,
    duration: '45s',
    checks: { passed: 8, failed: 0 },
    isRollback: true
  };
  
  deploymentHistory.unshift(rollback);
  
  res.json({
    success: true,
    rollback
  });
});

app.listen(PORT, () => {
  console.log(`Deploy Guardian running on port ${PORT}`);
});
