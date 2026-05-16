/**
 * Retail.js — POM Module for HP Retail Systems
 * 
 * Provides functionality for HP Retail Systems (e.g., HP Engage Go).
 * Docs: https://developers.hp.com/hp-client-management/doc/retail
 * 
 * Note: Requires HP Retail hardware (e.g., HP Engage Go, Engage Flex).
 */

const { runCMSLCommand, runCMSLCommandJson } = require('../helpers/psRunner');

const MODULE_NAME = 'HP.Retail';

class Retail {
  /**
   * Get retail device information.
   * @returns {Promise<Object>} Raw command result
   */
  static async getRetailDeviceInfo() {
    return runCMSLCommand(MODULE_NAME, 'Get-HPRetailDeviceInfo');
  }

  /**
   * Get retail device info as JSON.
   * @returns {Promise<{data: Object, raw: Object}>} Parsed retail device info
   */
  static async getRetailDeviceInfoJson() {
    return runCMSLCommandJson(
      MODULE_NAME,
      'Get-HPRetailDeviceInfo | ConvertTo-Json -Depth 5'
    );
  }

  /**
   * Get retail device configuration.
   * @returns {Promise<Object>} Raw command result
   */
  static async getConfiguration() {
    return runCMSLCommand(MODULE_NAME, 'Get-HPRetailConfiguration');
  }

  /**
   * Test that the retail module loads correctly.
   * @returns {Promise<Object>} Raw command result
   */
  static async verifyModuleLoaded() {
    return runCMSLCommand(
      MODULE_NAME,
      `Get-Command -Module ${MODULE_NAME} | Select-Object Name`
    );
  }
}

module.exports = Retail;
