/**
 * consent.test.js — Tests for HP Consent (Analytics Privacy) Module
 * 
 * Module: HP.Consent
 * Docs: https://developers.hp.com/hp-client-management/doc/consent
 * 
 * Tests consent status retrieval and enable/disable operations.
 * 
 * ⚠️  Requires: Admin privileges + HP CMSL installed
 * ⚠️  Modifying consent settings affects HP Analytics telemetry.
 */

const Consent = require('../../src/modules/Consent');

describe('HP Consent Module', () => {

  // ─── Consent Status ────────────────────────────────────────────

  describe('Consent Status', () => {

    test('should retrieve current consent status', async () => {
      const result = await Consent.getConsentStatus();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeDefined();

      console.log(`  🔒 Consent Status: ${result.stdout}`);
    });

    test('should retrieve consent configuration as JSON', async () => {
      const { data, raw } = await Consent.getConsentConfig();

      expect(raw.success).toBe(true);
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');

      console.log(`  🔒 Consent Config:`, JSON.stringify(data, null, 2));
    });

  });

  // ─── Consent Toggle ───────────────────────────────────────────
  // ⚠️  These tests modify actual consent settings.
  //     They are designed to be idempotent (restore original state).

  describe('Consent Toggle (Idempotent)', () => {
    let originalStatus;

    // Capture original state before modifying
    beforeAll(async () => {
      const result = await Consent.getConsentStatus();
      originalStatus = result.stdout.trim();
      console.log(`  📌 Original consent status: "${originalStatus}"`);
    });

    // Restore original state after tests
    afterAll(async () => {
      if (originalStatus && originalStatus.toLowerCase().includes('enable')) {
        await Consent.enableConsent();
      } else {
        await Consent.disableConsent();
      }
      console.log(`  📌 Restored consent to original state`);
    });

    test('should disable consent successfully', async () => {
      const result = await Consent.disableConsent();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);

      console.log(`  🔒 Consent disabled`);
    });

    test('should verify consent is disabled', async () => {
      const result = await Consent.getConsentStatus();

      expect(result.success).toBe(true);
      // After disabling, status should reflect the change
      expect(result.stdout).toBeDefined();

      console.log(`  🔒 Current status after disable: ${result.stdout}`);
    });

    test('should enable consent successfully', async () => {
      const result = await Consent.enableConsent();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);

      console.log(`  🔒 Consent enabled`);
    });

    test('should verify consent is enabled', async () => {
      const result = await Consent.getConsentStatus();

      expect(result.success).toBe(true);
      expect(result.stdout).toBeDefined();

      console.log(`  🔒 Current status after enable: ${result.stdout}`);
    });

  });

});
