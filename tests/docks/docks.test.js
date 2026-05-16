/**
 * docks.test.js — Tests for HP Docks Module
 * 
 * Module: HP.Docks
 * Docs: https://developers.hp.com/hp-client-management/doc/docks
 * 
 * Tests dock detection, info retrieval, and firmware update queries.
 * 
 * ⚠️  Requires: Admin privileges + HP CMSL installed
 * ⚠️  Full dock tests require a physical HP dock to be connected.
 *     Tests are designed to pass gracefully when no dock is present.
 */

const Docks = require('../../src/modules/Docks');

describe('HP Docks Module', () => {

  // ─── Module Availability ───────────────────────────────────────

  describe('Module Availability', () => {

    test('should verify Docks module is loaded', async () => {
      const result = await Docks.verifyModuleLoaded();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();

      const commands = result.stdout.split('\n').filter(Boolean);
      expect(commands.length).toBeGreaterThan(0);

      console.log(`  🔌 Available dock commands: ${commands.join(', ')}`);
    });

  });

  // ─── Dock Detection ───────────────────────────────────────────

  describe('Dock Detection', () => {

    test('should attempt to retrieve dock info', async () => {
      const result = await Docks.getDockInfo();

      // This may fail if no dock is connected — that's OK
      expect(result).toBeDefined();
      expect(result.exitCode).toBeDefined();

      if (result.success && result.stdout.trim()) {
        console.log(`  🔌 Dock detected!`);
        console.log(`  📋 Dock Info:\n${result.stdout.substring(0, 500)}`);
      } else {
        console.log(`  ℹ️  No dock detected (expected if no dock is connected)`);
      }
    });

    test('should attempt to retrieve dock update details', async () => {
      const result = await Docks.getUpdateDetails();

      expect(result).toBeDefined();
      expect(result.exitCode).toBeDefined();

      if (result.success && result.stdout.trim()) {
        console.log(`  🔌 Dock update info available`);
      } else {
        console.log(`  ℹ️  No dock update details available`);
      }
    });

  });

  // ─── NOTE: Firmware update test is intentionally excluded ─────
  // Docks.updateFirmware() is NOT tested automatically because it
  // actually flashes the dock firmware. This should be a manual test only.

});
