/**
 * bios-device.test.js — Tests for HP BIOS & Device Module
 * 
 * Module: HP.ClientManagement
 * Docs: https://developers.hp.com/hp-client-management/doc/bios-and-device
 * 
 * These tests validate BIOS settings retrieval, device info queries,
 * and basic BIOS configuration operations.
 * 
 * ⚠️  Requires: HP hardware + Admin privileges + HP CMSL installed
 */

const BiosDevice = require('../../src/modules/BiosDevice');

describe('HP BIOS & Device Module', () => {

  // ─── Device Information ────────────────────────────────────────

  describe('Device Information', () => {

    test('should retrieve device serial number', async () => {
      const result = await BiosDevice.getSerialNumber();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();
      expect(result.stdout.length).toBeGreaterThan(0);

      console.log(`  📋 Serial Number: ${result.stdout}`);
    });

    test('should retrieve device product ID', async () => {
      const result = await BiosDevice.getProductID();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();

      // Product ID is typically a 4-character hex string
      expect(result.stdout.trim().length).toBeGreaterThanOrEqual(4);

      console.log(`  📋 Product ID: ${result.stdout}`);
    });

    test('should retrieve device model name', async () => {
      const result = await BiosDevice.getModel();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();

      // Model name should contain 'HP' (sanity check)
      expect(result.stdout.toLowerCase()).toContain('hp');

      console.log(`  📋 Model: ${result.stdout}`);
    });

    test('should retrieve device details as JSON', async () => {
      const { data, raw } = await BiosDevice.getDeviceDetails();

      expect(raw.success).toBe(true);
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');

      console.log(`  📋 Device Details:`, JSON.stringify(data, null, 2));
    });

  });

  // ─── BIOS Settings ────────────────────────────────────────────

  describe('BIOS Settings', () => {

    test('should retrieve BIOS settings list', async () => {
      const result = await BiosDevice.getSettingsList();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();

      // Should return multiple lines (multiple settings)
      const lines = result.stdout.split('\n').filter(Boolean);
      expect(lines.length).toBeGreaterThan(1);

      console.log(`  📋 Found ${lines.length} BIOS settings`);
    });

    test('should retrieve BIOS version', async () => {
      const result = await BiosDevice.getBiosVersion();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();

      console.log(`  📋 BIOS Version: ${result.stdout}`);
    });

    test('should retrieve a specific BIOS setting value', async () => {
      // 'Asset Tracking Number' is a common setting on HP devices
      const result = await BiosDevice.getSettingValue('Asset Tracking Number');

      // The command should succeed even if the value is empty
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);

      console.log(`  📋 Asset Tracking Number: "${result.stdout}"`);
    });

    test('should check if a known BIOS setting exists', async () => {
      const exists = await BiosDevice.settingExists('Asset Tracking Number');
      expect(typeof exists).toBe('boolean');

      console.log(`  📋 'Asset Tracking Number' exists: ${exists}`);
    });

  });

  // ─── Error Handling ────────────────────────────────────────────

  describe('Error Handling', () => {

    test('should handle non-existent BIOS setting gracefully', async () => {
      const result = await BiosDevice.getSettingValue('ThisSettingDoesNotExist12345');

      // Should either fail gracefully or return empty
      // We just ensure it doesn't throw an unhandled exception
      expect(result).toBeDefined();
      expect(result.exitCode).toBeDefined();

      console.log(`  📋 Non-existent setting exitCode: ${result.exitCode}`);
    });

  });

});
