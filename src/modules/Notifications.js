/**
 * Notifications.js — POM Module for HP Toast Notifications
 * 
 * Provides functionality for invoking Windows toast notifications.
 * Docs: https://developers.hp.com/hp-client-management/doc/notifications
 */

const { runCMSLCommand } = require('../helpers/psRunner');

const MODULE_NAME = 'HP.Notifications';

class Notifications {
  /**
   * Send a toast notification.
   * Cmdlet: Invoke-HPNotification (or Send-HPNotification depending on CMSL version)
   * @param {string} title - Notification title
   * @param {string} message - Notification body text
   * @returns {Promise<Object>} Raw command result
   */
  static async sendNotification(title, message) {
    return runCMSLCommand(
      MODULE_NAME,
      `Invoke-HPNotification -Title '${title}' -Message '${message}'`
    );
  }

  /**
   * Send a notification with a specific icon/image.
   * @param {string} title - Notification title
   * @param {string} message - Notification body text
   * @param {string} imagePath - Absolute path to the notification image
   * @returns {Promise<Object>} Raw command result
   */
  static async sendNotificationWithImage(title, message, imagePath) {
    return runCMSLCommand(
      MODULE_NAME,
      `Invoke-HPNotification -Title '${title}' -Message '${message}' -LogoImage '${imagePath}'`
    );
  }

  /**
   * Test that the notification module loads correctly.
   * @returns {Promise<Object>} Raw command result
   */
  static async verifyModuleLoaded() {
    return runCMSLCommand(
      MODULE_NAME,
      `Get-Command -Module ${MODULE_NAME} | Select-Object Name`
    );
  }
}

module.exports = Notifications;
