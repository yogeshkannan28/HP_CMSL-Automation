/**
 * softpaq-mgmt.test.js — Tests for HP SoftPaq Management Module
 * 
 * Module: HP.Softpaq
 * Docs: https://developers.hp.com/hp-client-management/doc/softpaq-management
 * 
 * These tests validate SoftPaq listing, metadata retrieval,
 * and download capabilities.
 * 
 * ⚠️  Requires: HP hardware + Admin privileges + HP CMSL installed
 * ⚠️  Some tests may require internet connectivity for SoftPaq downloads.
 */

const SoftPaqManagement = require('../../src/modules/SoftPaqManagement');

describe('HP SoftPaq Management Module', () => {

  // ─── SoftPaq Listing ──────────────────────────────────────────

  describe('SoftPaq Listing', () => {

    test('should retrieve SoftPaq list for current platform', async () => {
      const result = await SoftPaqManagement.getSoftPaqList();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();

      console.log(`  📦 SoftPaq list retrieved (${result.stdout.length} chars)`);
      console.log(`  ⏱️  Duration: ${result.duration}ms`);
    }, 120000); // 2 min timeout — listing can be slow

    test('should filter SoftPaq list by BIOS category', async () => {
      const result = await SoftPaqManagement.getSoftPaqList({
        category: 'BIOS',
      });

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);

      console.log(`  📦 BIOS SoftPaqs retrieved (${result.stdout.length} chars)`);
    }, 120000);

    test('should filter SoftPaq list by Driver category', async () => {
      const result = await SoftPaqManagement.getSoftPaqList({
        category: 'Driver',
      });

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);

      console.log(`  📦 Driver SoftPaqs retrieved (${result.stdout.length} chars)`);
    }, 120000);

  });

  // ─── SoftPaq Metadata ─────────────────────────────────────────

  describe('SoftPaq Metadata', () => {

    test('should get the latest BIOS SoftPaq info', async () => {
      const result = await SoftPaqManagement.getLatestBIOS();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();

      console.log(`  📦 Latest BIOS SoftPaq:\n${result.stdout.substring(0, 500)}`);
    }, 120000);

  });

  // ─── Error Handling ────────────────────────────────────────────

  describe('Error Handling', () => {

    test('should handle invalid platform ID gracefully', async () => {
      const result = await SoftPaqManagement.getSoftPaqList({
        platform: 'INVALID_PLATFORM_00000',
      });

      // Should either fail with an error or return empty results
      expect(result).toBeDefined();
      expect(result.exitCode).toBeDefined();

      console.log(`  📦 Invalid platform exitCode: ${result.exitCode}`);
    });

  });

});
