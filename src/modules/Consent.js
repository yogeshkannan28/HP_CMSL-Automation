/**
 * Consent.js — POM Module for HP Consent (Analytics Privacy)
 * 
 * Manages HP Telemetry / HP Analytics consent settings.
 * IT admins can centrally manage privacy settings for enterprise environments.
 * Docs: https://developers.hp.com/hp-client-management/doc/consent
 * 
 * Whitepaper: https://ftp.hp.com/pub/caps-softpaq/cmit/whitepapers/ManagingConsentforHPAnalytics.pdf
 */

const { runCMSLCommand, runCMSLCommandJson } = require('../helpers/psRunner');

const MODULE_NAME = 'HP.Consent';

class Consent {
  /**
   * Get current consent/telemetry status.
   * Cmdlet: Get-HPDeviceAnalyticsConsent
   * @returns {Promise<Object>} Raw command result
   */
  static async getConsentStatus() {
    return runCMSLCommand(MODULE_NAME, 'Get-HPDeviceAnalyticsConsent');
  }

  /**
   * Enable analytics consent (opt-in).
   * Cmdlet: Set-HPDeviceAnalyticsConsent
   * @returns {Promise<Object>} Raw command result
   */
  static async enableConsent() {
    return runCMSLCommand(
      MODULE_NAME,
      'Set-HPDeviceAnalyticsConsent -Consent Enable'
    );
  }

  /**
   * Disable analytics consent (opt-out).
   * Cmdlet: Set-HPDeviceAnalyticsConsent
   * @returns {Promise<Object>} Raw command result
   */
  static async disableConsent() {
    return runCMSLCommand(
      MODULE_NAME,
      'Set-HPDeviceAnalyticsConsent -Consent Disable'
    );
  }

  /**
   * Get consent configuration as JSON.
   * @returns {Promise<{data: Object, raw: Object}>} Parsed consent config
   */
  static async getConsentConfig() {
    return runCMSLCommandJson(
      MODULE_NAME,
      'Get-HPDeviceAnalyticsConsent | ConvertTo-Json -Depth 5'
    );
  }
}

module.exports = Consent;
