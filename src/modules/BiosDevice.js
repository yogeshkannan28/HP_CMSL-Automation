/**
 * BiosDevice.js — POM Module for HP BIOS & Device Management
 * 
 * Wraps all BIOS and Device cmdlets from HP.ClientManagement module.
 * Docs: https://developers.hp.com/hp-client-management/doc/bios-and-device
 * 
 * Pattern:
 *   test → BiosDevice.getSettingsList() → psRunner → pwsh.exe → HP CMSL
 *   Tests never build PS commands directly — they call methods here.
 */

const { runCMSLCommand, runCMSLCommandJson } = require('../helpers/psRunner');

const MODULE_NAME = 'HP.ClientManagement';

class BiosDevice {
  /**
   * Get all BIOS settings as a list.
   * Cmdlet: Get-HPBIOSSettingsList
   * @returns {Promise<Object>} Raw command result { stdout, stderr, exitCode, success, duration }
   */
  static async getSettingsList() {
    return runCMSLCommand(MODULE_NAME, 'Get-HPBIOSSettingsList');
  }

  /**
   * Get a specific BIOS setting value.
   * Cmdlet: Get-HPBIOSSettingValue
   * @param {string} settingName - Name of the BIOS setting (e.g., 'Asset Tracking Number')
   * @returns {Promise<Object>} Raw command result
   */
  static async getSettingValue(settingName) {
    return runCMSLCommand(
      MODULE_NAME,
      `Get-HPBIOSSettingValue -Name '${settingName}'`
    );
  }

  /**
   * Set a BIOS setting value.
   * Cmdlet: Set-HPBIOSSetting
   * @param {string} settingName - Name of the BIOS setting
   * @param {string} value - New value to set
   * @param {string} [password] - BIOS setup password (if required)
   * @returns {Promise<Object>} Raw command result
   */
  static async setSetting(settingName, value, password = null) {
    let cmd = `Set-HPBIOSSetting -Name '${settingName}' -Value '${value}'`;
    if (password) {
      cmd += ` -Password '${password}'`;
    }
    return runCMSLCommand(MODULE_NAME, cmd);
  }

  /**
   * Get device details (serial, product, model).
   * Cmdlet: Get-HPDeviceDetails
   * @returns {Promise<{data: Object, raw: Object}>} Parsed JSON device info
   */
  static async getDeviceDetails() {
    return runCMSLCommandJson(
      MODULE_NAME,
      'Get-HPDeviceDetails | ConvertTo-Json -Depth 5'
    );
  }

  /**
   * Get device serial number.
   * Cmdlet: Get-HPDeviceSerialNumber
   * @returns {Promise<Object>} Raw command result (stdout = serial number)
   */
  static async getSerialNumber() {
    return runCMSLCommand(MODULE_NAME, 'Get-HPDeviceSerialNumber');
  }

  /**
   * Get device product ID.
   * Cmdlet: Get-HPDeviceProductID
   * @returns {Promise<Object>} Raw command result (stdout = product ID)
   */
  static async getProductID() {
    return runCMSLCommand(MODULE_NAME, 'Get-HPDeviceProductID');
  }

  /**
   * Get the device model name.
   * Cmdlet: Get-HPDeviceModel
   * @returns {Promise<Object>} Raw command result (stdout = model name)
   */
  static async getModel() {
    return runCMSLCommand(MODULE_NAME, 'Get-HPDeviceModel');
  }

  /**
   * Get BIOS version information.
   * Cmdlet: Get-HPBIOSVersion
   * @returns {Promise<Object>} Raw command result
   */
  static async getBiosVersion() {
    return runCMSLCommand(MODULE_NAME, 'Get-HPBIOSVersion');
  }

  /**
   * Check if a BIOS setting exists.
   * @param {string} settingName - Setting name to check
   * @returns {Promise<boolean>}
   */
  static async settingExists(settingName) {
    const result = await runCMSLCommand(
      MODULE_NAME,
      `Get-HPBIOSSettingValue -Name '${settingName}' -ErrorAction SilentlyContinue`
    );
    return result.success && result.stdout.trim().length > 0;
  }
}

module.exports = BiosDevice;
