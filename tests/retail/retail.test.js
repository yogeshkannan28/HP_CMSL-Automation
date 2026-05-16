/**
 * retail.test.js — Tests for HP Retail Module
 * 
 * Module: HP.Retail
 * Docs: https://developers.hp.com/hp-client-management/doc/retail
 * 
 * Tests retail device info and configuration queries.
 * 
 * ⚠️  Requires: Admin privileges + HP CMSL installed
 * ⚠️  Full retail tests require HP Retail hardware (e.g., HP Engage Go).
 *     Tests are designed to pass gracefully on non-retail hardware.
 */

const Retail = require('../../src/modules/Retail');

describe('HP Retail Module', () => {

  // ─── Module Availability ───────────────────────────────────────

  describe('Module Availability', () => {

    test('should verify Retail module is loaded', async () => {
      const result = await Retail.verifyModuleLoaded();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();

      const commands = result.stdout.split('\n').filter(Boolean);
      expect(commands.length).toBeGreaterThan(0);

      console.log(`  🏪 Available retail commands: ${commands.join(', ')}`);
    });

  });

  // ─── Retail Device Info ────────────────────────────────────────

  describe('Retail Device Info', () => {

    test('should attempt to retrieve retail device info', async () => {
      const result = await Retail.getRetailDeviceInfo();

      // This will likely fail on non-retail hardware — that's expected
      expect(result).toBeDefined();
      expect(result.exitCode).toBeDefined();

      if (result.success && result.stdout.trim()) {
        console.log(`  🏪 Retail device detected!`);
        console.log(`  📋 Device Info:\n${result.stdout.substring(0, 500)}`);
      } else {
        console.log(`  ℹ️  Not a retail device (expected on non-retail HP hardware)`);
      }
    });

    test('should attempt to retrieve retail configuration', async () => {
      const result = await Retail.getConfiguration();

      expect(result).toBeDefined();
      expect(result.exitCode).toBeDefined();

      if (result.success && result.stdout.trim()) {
        console.log(`  🏪 Retail configuration retrieved`);
      } else {
        console.log(`  ℹ️  Retail configuration not available on this device`);
      }
    });

  });

});
