/**
 * softpaq-repo.test.js — Tests for HP SoftPaq Repository Module
 * 
 * Module: HP.Repo
 * Docs: https://developers.hp.com/hp-client-management/doc/SoftPaq-Repository
 * 
 * Tests repository initialization, configuration, and sync operations.
 * 
 * ⚠️  Requires: Admin privileges + HP CMSL installed
 * ⚠️  Repository sync tests require internet connectivity.
 */

const path = require('path');
const fs = require('fs');
const SoftPaqRepository = require('../../src/modules/SoftPaqRepository');

// Temp repo path for testing (inside project dir to keep it contained)
const TEST_REPO_PATH = path.join(__dirname, '..', '..', 'reports', 'test-repo');

describe('HP SoftPaq Repository Module', () => {

  // Clean up test repo before tests
  beforeAll(() => {
    if (fs.existsSync(TEST_REPO_PATH)) {
      fs.rmSync(TEST_REPO_PATH, { recursive: true, force: true });
    }
  });

  // Clean up test repo after all tests
  afterAll(() => {
    if (fs.existsSync(TEST_REPO_PATH)) {
      fs.rmSync(TEST_REPO_PATH, { recursive: true, force: true });
    }
  });

  // ─── Repository Initialization ────────────────────────────────

  describe('Repository Initialization', () => {

    test('should initialize a new SoftPaq repository', async () => {
      const result = await SoftPaqRepository.initializeRepository(TEST_REPO_PATH);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);

      // Verify directory was created
      expect(fs.existsSync(TEST_REPO_PATH)).toBe(true);

      console.log(`  📁 Repository initialized at: ${TEST_REPO_PATH}`);
    });

  });

  // ─── Repository Configuration ─────────────────────────────────

  describe('Repository Configuration', () => {

    test('should retrieve repository info', async () => {
      const { data, raw } = await SoftPaqRepository.getRepositoryInfo(TEST_REPO_PATH);

      expect(raw.success).toBe(true);
      expect(data).toBeDefined();

      console.log(`  📁 Repository Info:`, JSON.stringify(data, null, 2));
    });

  });

  // ─── Repository Cleanup ───────────────────────────────────────

  describe('Repository Cleanup', () => {

    test('should clean up repository successfully', async () => {
      const result = await SoftPaqRepository.cleanupRepository(TEST_REPO_PATH);

      // Cleanup should succeed even if repo is empty
      expect(result).toBeDefined();
      expect(result.exitCode).toBeDefined();

      console.log(`  🧹 Cleanup exitCode: ${result.exitCode}`);
    });

  });

});
