/**
 * SoftPaqManagement.js — POM Module for HP SoftPaq Management
 * 
 * Wraps cmdlets for identifying and downloading SoftPaqs.
 * Docs: https://developers.hp.com/hp-client-management/doc/softpaq-management
 * 
 * Pattern:
 *   test → SoftPaqManagement.getSoftPaqList() → psRunner → pwsh.exe → HP CMSL
 */

const { runCMSLCommand, runCMSLCommandJson } = require('../helpers/psRunner');

const MODULE_NAME = 'HP.Softpaq';

class SoftPaqManagement {
  /**
   * Get list of available SoftPaqs for the current platform.
   * Cmdlet: Get-SoftpaqList
   * @param {Object} [options] - Filter options
   * @param {string} [options.platform] - Platform ID override
   * @param {string} [options.os] - OS filter (e.g., 'win10', 'win11')
   * @param {string} [options.category] - Category filter (e.g., 'BIOS', 'Driver')
   * @returns {Promise<Object>} Raw command result
   */
  static async getSoftPaqList(options = {}) {
    let cmd = 'Get-SoftpaqList';
    if (options.platform) cmd += ` -Platform '${options.platform}'`;
    if (options.os) cmd += ` -Os '${options.os}'`;
    if (options.category) cmd += ` -Category '${options.category}'`;
    return runCMSLCommand(MODULE_NAME, cmd);
  }

  /**
   * Get metadata for a specific SoftPaq by ID.
   * Cmdlet: Get-Softpaq
   * @param {string} softpaqId - SoftPaq number (e.g., 'sp12345')
   * @returns {Promise<{data: Object, raw: Object}>} Parsed SoftPaq metadata
   */
  static async getSoftPaqMetadata(softpaqId) {
    return runCMSLCommandJson(
      MODULE_NAME,
      `Get-Softpaq -Number '${softpaqId}' | ConvertTo-Json -Depth 5`
    );
  }

  /**
   * Download a specific SoftPaq.
   * Cmdlet: Get-Softpaq
   * @param {string} softpaqId - SoftPaq number
   * @param {string} destinationPath - Download location
   * @param {boolean} [overwrite=false] - Overwrite existing file
   * @returns {Promise<Object>} Raw command result
   */
  static async downloadSoftPaq(softpaqId, destinationPath, overwrite = false) {
    let cmd = `Get-Softpaq -Number '${softpaqId}' -SaveAs '${destinationPath}' -Action silentinstall`;
    if (overwrite) cmd += ' -Overwrite yes';
    return runCMSLCommand(MODULE_NAME, cmd, { timeout: 120000 }); // 2 min timeout for downloads
  }

  /**
   * Get the latest BIOS SoftPaq for the current platform.
   * @returns {Promise<Object>} Raw command result
   */
  static async getLatestBIOS() {
    return runCMSLCommand(
      MODULE_NAME,
      "Get-SoftpaqList -Category BIOS | Sort-Object -Property ReleaseDate -Descending | Select-Object -First 1"
    );
  }
}

module.exports = SoftPaqManagement;
