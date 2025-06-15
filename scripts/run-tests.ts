/**
 * Test runner script with comprehensive reporting
 */

import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting CrawlX Test Suite\n');
    this.startTime = Date.now();

    try {
      // Ensure test results directory exists
      this.ensureDirectoryExists('./test-results');

      // Run different test suites
      await this.runTestSuite('Unit Tests', 'vitest run src/**/*.test.ts');
      await this.runTestSuite('Integration Tests', 'vitest run tests/integration/**/*.test.ts');
      await this.runTestSuite('Performance Tests', 'vitest run tests/performance/**/*.test.ts');
      await this.runTestSuite('E2E Tests', 'vitest run tests/e2e/**/*.test.ts');
      
      // Run coverage report
      await this.runCoverageReport();

      // Generate summary report
      this.generateSummaryReport();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  private async runTestSuite(name: string, command: string): Promise<void> {
    console.log(`\n📋 Running ${name}...`);
    
    const startTime = Date.now();
    
    try {
      const result = await this.executeCommand(command);
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        suite: name,
        passed: this.extractNumber(result.stdout, /(\d+) passed/) || 0,
        failed: this.extractNumber(result.stdout, /(\d+) failed/) || 0,
        skipped: this.extractNumber(result.stdout, /(\d+) skipped/) || 0,
        duration,
      };

      this.results.push(testResult);
      
      if (testResult.failed > 0) {
        console.log(`❌ ${name}: ${testResult.failed} failed, ${testResult.passed} passed`);
      } else {
        console.log(`✅ ${name}: ${testResult.passed} passed`);
      }
      
    } catch (error) {
      console.log(`❌ ${name}: Failed to execute`);
      this.results.push({
        suite: name,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: Date.now() - startTime,
      });
    }
  }

  private async runCoverageReport(): Promise<void> {
    console.log('\n📊 Generating coverage report...');
    
    try {
      const result = await this.executeCommand('vitest run --coverage');
      
      // Extract coverage information
      const coverage = {
        lines: this.extractNumber(result.stdout, /Lines\s+:\s+([\d.]+)%/) || 0,
        functions: this.extractNumber(result.stdout, /Functions\s+:\s+([\d.]+)%/) || 0,
        branches: this.extractNumber(result.stdout, /Branches\s+:\s+([\d.]+)%/) || 0,
        statements: this.extractNumber(result.stdout, /Statements\s+:\s+([\d.]+)%/) || 0,
      };

      // Add coverage to the last result or create a new one
      if (this.results.length > 0) {
        this.results[this.results.length - 1].coverage = coverage;
      }

      console.log(`✅ Coverage: ${coverage.lines}% lines, ${coverage.functions}% functions`);
      
    } catch (error) {
      console.log('⚠️  Coverage report generation failed');
    }
  }

  private generateSummaryReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0);

    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: {
        total: totalPassed + totalFailed + totalSkipped,
        passed: totalPassed,
        failed: totalFailed,
        skipped: totalSkipped,
        success: totalFailed === 0,
      },
      suites: this.results,
      coverage: this.results.find(r => r.coverage)?.coverage,
    };

    // Write JSON report
    writeFileSync(
      './test-results/summary.json',
      JSON.stringify(report, null, 2)
    );

    // Write markdown report
    this.generateMarkdownReport(report);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⏭️  Skipped: ${report.summary.skipped}`);
    console.log(`⏱️  Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    
    if (report.coverage) {
      console.log(`📈 Coverage: ${report.coverage.lines}% lines`);
    }
    
    console.log('='.repeat(60));

    if (totalFailed > 0) {
      console.log('❌ Some tests failed. Check the detailed output above.');
      process.exit(1);
    } else {
      console.log('🎉 All tests passed!');
    }
  }

  private generateMarkdownReport(report: any): void {
    const markdown = `# CrawlX Test Report

Generated: ${report.timestamp}
Duration: ${(report.duration / 1000).toFixed(2)}s

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${report.summary.total} |
| Passed | ✅ ${report.summary.passed} |
| Failed | ❌ ${report.summary.failed} |
| Skipped | ⏭️ ${report.summary.skipped} |
| Success Rate | ${((report.summary.passed / report.summary.total) * 100).toFixed(1)}% |

## Test Suites

| Suite | Passed | Failed | Skipped | Duration |
|-------|--------|--------|---------|----------|
${report.suites.map((suite: TestResult) => 
  `| ${suite.suite} | ${suite.passed} | ${suite.failed} | ${suite.skipped} | ${(suite.duration / 1000).toFixed(2)}s |`
).join('\n')}

${report.coverage ? `## Coverage

| Type | Coverage |
|------|----------|
| Lines | ${report.coverage.lines}% |
| Functions | ${report.coverage.functions}% |
| Branches | ${report.coverage.branches}% |
| Statements | ${report.coverage.statements}% |
` : ''}

## Status

${report.summary.success ? '🎉 **All tests passed!**' : '❌ **Some tests failed.**'}
`;

    writeFileSync('./test-results/report.md', markdown);
  }

  private executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, { 
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true 
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output);
      });

      child.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }

  private extractNumber(text: string, regex: RegExp): number | null {
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : null;
  }

  private ensureDirectoryExists(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
CrawlX Test Runner

Usage:
  npm run test              # Run all tests
  npm run test:watch        # Run tests in watch mode
  npm run test:coverage     # Run tests with coverage
  npm run test:ui           # Run tests with UI

Options:
  --help, -h               Show this help message
`);
    return;
  }

  await runner.runAllTests();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner };
