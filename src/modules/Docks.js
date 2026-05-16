/**
 * Docks.js — POM Module for HP Docking Station Management
 * 
 * Provides functionality for querying dock info and updating dock firmware.
 * Docs: https://developers.hp.com/hp-client-management/doc/docks
 * 
 * Note: Requires an HP dock to be connected for most commands.
 */

const { runCMSLCommand, runCMSLCommandJson } = require('../helpers/psRunner');

const MODULE_NAME = 'HP.Docks';

class Docks {
  /**
   * Get connected dock information.
   * Cmdlet: Get-HPDockInfo
   * @returns {Promise<Object>} Raw command result
   */
  static async getDockInfo() {
    return runCMSLCommand(MODULE_NAME, 'Get-HPDockInfo');
  }

  /**
   * Get connected dock information as JSON.
   * @returns {Promise<{data: Object, raw: Object}>} Parsed dock info
   */
  static async getDockInfoJson() {
    return runCMSLCommandJson(
      MODULE_NAME,
      'Get-HPDockInfo | ConvertTo-Json -Depth 5'
    );
  }

  /**
   * Get dock firmware update availability.
   * Cmdlet: Get-HPDockUpdateDetails
   * @returns {Promise<Object>} Raw command result
   */
  static async getUpdateDetails() {
    return runCMSLCommand(MODULE_NAME, 'Get-HPDockUpdateDetails');
  }

  /**
   * Update dock firmware.
   * Cmdlet: Update-HPDockFirmware  (or Invoke-HPDockFirmwareUpdate)
   * ⚠️  Use with caution — this actually flashes the dock firmware.
   * @returns {Promise<Object>} Raw command result
   */
  static async updateFirmware() {
    return runCMSLCommand(
      MODULE_NAME,
      'Update-HPDockFirmware',
      { timeout: 300000 } // 5 min timeout for firmware update
    );
  }

  /**
   * Test that the docks module loads correctly.
   * @returns {Promise<Object>} Raw command result
   */
  static async verifyModuleLoaded() {
    return runCMSLCommand(
      MODULE_NAME,
      `Get-Command -Module ${MODULE_NAME} | Select-Object Name`
    );
  }
}

module.exports = Docks;
