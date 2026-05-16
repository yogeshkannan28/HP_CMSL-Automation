/**
 * Firmware.js — POM Module for HP Firmware Management
 * 
 * Provides access to low-level firmware functionality.
 * Docs: https://developers.hp.com/hp-client-management/doc/firmware
 * 
 * Note: Functionality may differ between platforms/generations.
 */

const { runCMSLCommand, runCMSLCommandJson } = require('../helpers/psRunner');

const MODULE_NAME = 'HP.Firmware';

class Firmware {
  /**
   * Get current firmware/BIOS audit log.
   * Cmdlet: Get-HPFirmwareAuditLog
   * @returns {Promise<Object>} Raw command result
   */
  static async getAuditLog() {
    return runCMSLCommand(MODULE_NAME, 'Get-HPFirmwareAuditLog');
  }

  /**
   * Get firmware update status/history.
   * @returns {Promise<{data: Object, raw: Object}>} Parsed JSON firmware info
   */
  static async getUpdateHistory() {
    return runCMSLCommandJson(
      MODULE_NAME,
      'Get-HPFirmwareAuditLog | ConvertTo-Json -Depth 5'
    );
  }

  /**
   * Check if Sure Start is available/enabled.
   * Cmdlet: Get-HPSureStartAuditLog  (platform-dependent)
   * @returns {Promise<Object>} Raw command result
   */
  static async getSureStartAuditLog() {
    return runCMSLCommand(MODULE_NAME, 'Get-HPSureStartAuditLog');
  }

  /**
   * Get TPM (Trusted Platform Module) firmware info.
   * @returns {Promise<Object>} Raw command result
   */
  static async getTPMInfo() {
    return runCMSLCommand(
      MODULE_NAME,
      "Get-HPFirmwareAuditLog | Where-Object { $_.Description -like '*TPM*' }"
    );
  }
}

module.exports = Firmware;
