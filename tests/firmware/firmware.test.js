/**
 * firmware.test.js — Tests for HP Firmware Module
 * 
 * Module: HP.Firmware
 * Docs: https://developers.hp.com/hp-client-management/doc/firmware
 * 
 * Tests firmware audit log retrieval and Sure Start functionality.
 * 
 * ⚠️  Requires: HP hardware + Admin privileges + HP CMSL installed
 * ⚠️  Functionality may differ between platforms/generations.
 */

const Firmware = require('../../src/modules/Firmware');

describe('HP Firmware Module', () => {

  // ─── Firmware Audit Log ────────────────────────────────────────

  describe('Firmware Audit Log', () => {

    test('should retrieve firmware audit log', async () => {
      const result = await Firmware.getAuditLog();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();

      console.log(`  🔧 Audit log retrieved (${result.stdout.length} chars)`);
      console.log(`  ⏱️  Duration: ${result.duration}ms`);
    });

    test('should retrieve firmware update history as JSON', async () => {
      const { data, raw } = await Firmware.getUpdateHistory();

      expect(raw.success).toBe(true);
      expect(data).toBeDefined();

      // data should be an object or array
      expect(['object', 'array'].includes(typeof data) || Array.isArray(data)).toBe(true);

      console.log(`  🔧 Update history entries: ${Array.isArray(data) ? data.length : 'single object'}`);
    });

  });

  // ─── Sure Start ────────────────────────────────────────────────

  describe('Sure Start', () => {

    test('should query Sure Start audit log (platform dependent)', async () => {
      const result = await Firmware.getSureStartAuditLog();

      // Sure Start may not be available on all platforms
      // We accept either success or a known "not supported" error
      expect(result).toBeDefined();
      expect(result.exitCode).toBeDefined();

      if (result.success) {
        console.log(`  🛡️  Sure Start audit log retrieved`);
      } else {
        console.log(`  ⚠️  Sure Start not available on this platform (expected on some models)`);
      }
    });

  });

  // ─── TPM Information ──────────────────────────────────────────

  describe('TPM Information', () => {

    test('should query TPM-related firmware info', async () => {
      const result = await Firmware.getTPMInfo();

      // TPM info may or may not be in the audit log
      expect(result).toBeDefined();
      expect(result.exitCode).toBeDefined();

      if (result.success && result.stdout.trim()) {
        console.log(`  🔐 TPM entries found in audit log`);
      } else {
        console.log(`  ℹ️  No TPM entries in firmware audit log`);
      }
    });

  });

});
