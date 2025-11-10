/**
 * Comprehensive Download System Diagnostic
 * Tests all components of the bulk download flow
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DOWNLOAD SYSTEM DIAGNOSTIC\n');
console.log('=' .repeat(80));

// Test 1: Check API endpoint existence
console.log('\n✅ TEST 1: API Endpoints Existence');
console.log('-'.repeat(80));

const endpoints = [
  'src/app/api/download/route.ts',
  'src/app/api/bulk-download/route.ts'
];

endpoints.forEach(endpoint => {
  const fullPath = path.join(__dirname, endpoint);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ ${endpoint} EXISTS`);
  } else {
    console.log(`✗ ${endpoint} MISSING`);
  }
});

// Test 2: Check component files
console.log('\n✅ TEST 2: Component Files');
console.log('-'.repeat(80));

const components = [
  'src/components/SimpleEventGallery.tsx',
  'src/lib/zipDownload.ts'
];

components.forEach(component => {
  const fullPath = path.join(__dirname, component);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ ${component} EXISTS`);
  } else {
    console.log(`✗ ${component} MISSING`);
  }
});

// Test 3: Analyze bulk-download endpoint code
console.log('\n✅ TEST 3: Bulk Download Endpoint Analysis');
console.log('-'.repeat(80));

const bulkDownloadPath = path.join(__dirname, 'src/app/api/bulk-download/route.ts');
const bulkDownloadContent = fs.readFileSync(bulkDownloadPath, 'utf8');

const checks = [
  {
    name: 'Uses /api/download proxy',
    pattern: /fetch\('\/api\/download'/,
    critical: true
  },
  {
    name: 'Uses archiver for ZIP creation',
    pattern: /archiver\('zip'/,
    critical: true
  },
  {
    name: 'Has TransformStream for streaming',
    pattern: /new TransformStream\(\)/,
    critical: true
  },
  {
    name: 'Has error handling',
    pattern: /catch \(error\)/,
    critical: true
  },
  {
    name: 'Has file size validation',
    pattern: /MAX_FILE_SIZE|MAX_TOTAL_SIZE/,
    critical: true
  },
  {
    name: 'Has request delay (rate limiting)',
    pattern: /REQUEST_DELAY|setTimeout.*resolve.*REQUEST_DELAY/,
    critical: false
  },
  {
    name: 'Has timeout protection',
    pattern: /FETCH_TIMEOUT|setTimeout.*controller.abort/,
    critical: true
  }
];

let criticalIssues = 0;
checks.forEach(check => {
  const hasFeature = check.pattern.test(bulkDownloadContent);
  const status = hasFeature ? '✓' : '✗';
  console.log(`${status} ${check.name}`);
  if (!hasFeature && check.critical) {
    criticalIssues++;
  }
});

// Test 4: Analyze download proxy endpoint
console.log('\n✅ TEST 4: Download Proxy Endpoint Analysis');
console.log('-'.repeat(80));

const downloadPath = path.join(__dirname, 'src/app/api/download/route.ts');
const downloadContent = fs.readFileSync(downloadPath, 'utf8');

const proxyChecks = [
  {
    name: 'Accepts POST requests',
    pattern: /export async function POST/,
    critical: true
  },
  {
    name: 'Validates URL input',
    pattern: /if \(!url\)/,
    critical: true
  },
  {
    name: 'Validates URL source (Supabase)',
    pattern: /supabase.*snapworxx/,
    critical: true
  },
  {
    name: 'Fetches from URL',
    pattern: /fetch\(url/,
    critical: true
  },
  {
    name: 'Returns blob response',
    pattern: /response.blob\(\)|new NextResponse\(blob/,
    critical: true
  },
  {
    name: 'Has error handling',
    pattern: /catch \(error\)/,
    critical: true
  }
];

let proxyIssues = 0;
proxyChecks.forEach(check => {
  const hasFeature = check.pattern.test(downloadContent);
  const status = hasFeature ? '✓' : '✗';
  console.log(`${status} ${check.name}`);
  if (!hasFeature && check.critical) {
    proxyIssues++;
  }
});

// Test 5: Analyze client-side component
console.log('\n✅ TEST 5: Client Component Analysis');
console.log('-'.repeat(80));

const componentPath = path.join(__dirname, 'src/components/SimpleEventGallery.tsx');
const componentContent = fs.readFileSync(componentPath, 'utf8');

const clientChecks = [
  {
    name: 'Has handleBulkDownload function',
    pattern: /const handleBulkDownload|function handleBulkDownload/,
    critical: true
  },
  {
    name: 'Validates items before download',
    pattern: /itemsToDownload.length === 0|if \(itemsToDownload.length/,
    critical: true
  },
  {
    name: 'Calls /api/bulk-download endpoint',
    pattern: /fetch\('\/api\/bulk-download'/,
    critical: true
  },
  {
    name: 'Handles response blob',
    pattern: /response.blob\(\)/,
    critical: true
  },
  {
    name: 'Has error handling',
    pattern: /catch \(err\)/,
    critical: true
  },
  {
    name: 'Triggers file download',
    pattern: /window.URL.createObjectURL|link.click\(\)/,
    critical: true
  }
];

let clientIssues = 0;
clientChecks.forEach(check => {
  const hasFeature = check.pattern.test(componentContent);
  const status = hasFeature ? '✓' : '✗';
  console.log(`${status} ${check.name}`);
  if (!hasFeature && check.critical) {
    clientIssues++;
  }
});

// Test 6: Check dependencies
console.log('\n✅ TEST 6: Dependencies Check');
console.log('-'.repeat(80));

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredDeps = [
  'archiver',
  'jszip',
  'file-saver'
];

requiredDeps.forEach(dep => {
  const hasInDeps = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
  const status = hasInDeps ? '✓' : '✗';
  console.log(`${status} ${dep}${hasInDeps ? ` (${hasInDeps})` : ' MISSING'}`);
});

// Test 7: Potential Issues Analysis
console.log('\n✅ TEST 7: Potential Issues Detection');
console.log('-'.repeat(80));

const potentialIssues = [];

// Issue 1: Check if bulk-download is calling itself instead of /api/download
if (/fetch\('\/api\/bulk-download'/.test(bulkDownloadContent)) {
  potentialIssues.push('⚠️ Bulk-download endpoint appears to call itself (recursive call)');
}

// Issue 2: Check if proxy timeout is set
if (!downloadContent.includes('FETCH_TIMEOUT') && !downloadContent.includes('setTimeout')) {
  potentialIssues.push('⚠️ Download proxy has no timeout protection');
}

// Issue 3: Check for proper stream handling in bulk-download
if (!bulkDownloadContent.includes('archive.finalize')) {
  potentialIssues.push('⚠️ Archive may not finalize properly');
}

// Issue 4: Check if error handling prevents empty ZIPs
if (!bulkDownloadContent.includes('processedCount === 0') && !bulkDownloadContent.includes('No items were successfully downloaded')) {
  potentialIssues.push('⚠️ No check for all items failing - could create empty ZIP');
}

// Issue 5: Check if client validates response size
if (!componentContent.includes('zipBlob.size === 0') && !componentContent.includes('Downloaded file is empty')) {
  potentialIssues.push('⚠️ Client doesn\'t validate ZIP file size');
}

if (potentialIssues.length > 0) {
  potentialIssues.forEach(issue => console.log(issue));
} else {
  console.log('✓ No obvious issues detected');
}

// Test 8: Data Flow Analysis
console.log('\n✅ TEST 8: Data Flow Analysis');
console.log('-'.repeat(80));

console.log(`
Expected Data Flow:
1. User clicks "Download All"
   ↓
2. handleBulkDownload() collects items
   ↓
3. Validates items (count, size)
   ↓
4. POST to /api/bulk-download with item URLs
   ↓
5. /api/bulk-download loops through items:
   - For each item, POST to /api/download with URL
   - /api/download fetches from Supabase
   - Returns blob to /api/bulk-download
   - /api/bulk-download adds to archive
   ↓
6. Archive finalizes and streams to client
   ↓
7. Client receives ZIP blob
   ↓
8. Client triggers browser download
`);

// Summary
console.log('=' .repeat(80));
console.log('\n📊 DIAGNOSTIC SUMMARY\n');

const totalIssues = criticalIssues + proxyIssues + clientIssues + potentialIssues.length;

console.log(`Critical Issues Found: ${criticalIssues}`);
console.log(`Proxy Issues Found: ${proxyIssues}`);
console.log(`Client Issues Found: ${clientIssues}`);
console.log(`Potential Issues: ${potentialIssues.length}`);
console.log(`\nTotal Issues: ${totalIssues}`);

if (totalIssues === 0) {
  console.log('\n✅ ALL SYSTEMS APPEAR HEALTHY');
} else if (totalIssues <= 2) {
  console.log('\n⚠️ MINOR ISSUES DETECTED - Review above');
} else {
  console.log('\n❌ SIGNIFICANT ISSUES DETECTED - Requires investigation');
}

console.log('\n' + '='.repeat(80));
