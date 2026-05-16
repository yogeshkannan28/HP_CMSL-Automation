/**
 * notifications.test.js — Tests for HP Notifications Module
 * 
 * Module: HP.Notifications
 * Docs: https://developers.hp.com/hp-client-management/doc/notifications
 * 
 * Tests toast notification invocation and module availability.
 * 
 * ⚠️  Requires: Admin privileges + HP CMSL installed
 * ⚠️  Toast notifications will visually appear on the test machine.
 */

const Notifications = require('../../src/modules/Notifications');

describe('HP Notifications Module', () => {

  // ─── Module Availability ───────────────────────────────────────

  describe('Module Availability', () => {

    test('should verify Notifications module is loaded', async () => {
      const result = await Notifications.verifyModuleLoaded();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeTruthy();

      // Should list at least one command
      const commands = result.stdout.split('\n').filter(Boolean);
      expect(commands.length).toBeGreaterThan(0);

      console.log(`  🔔 Available commands: ${commands.join(', ')}`);
    });

  });

  // ─── Toast Notifications ──────────────────────────────────────

  describe('Toast Notifications', () => {

    test('should send a basic toast notification', async () => {
      const result = await Notifications.sendNotification(
        'HP CMSL Test',
        'This is an automated test notification from hp-cmsl-automation'
      );

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);

      console.log(`  🔔 Toast notification sent successfully`);
      console.log(`  ⏱️  Duration: ${result.duration}ms`);
    });

    test('should send a notification with special characters in message', async () => {
      const result = await Notifications.sendNotification(
        'Test: Special Chars',
        'Testing with symbols: #1 @ 100% & done!'
      );

      // Should handle special characters without crashing
      expect(result).toBeDefined();
      expect(result.exitCode).toBeDefined();

      console.log(`  🔔 Special char notification exitCode: ${result.exitCode}`);
    });

  });

});
