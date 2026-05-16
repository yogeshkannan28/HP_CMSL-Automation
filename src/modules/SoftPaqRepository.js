/**
 * SoftPaqRepository.js — POM Module for HP SoftPaq Repository Management
 * 
 * Extends SoftPaq Management to manage local SoftPaq repositories.
 * Docs: https://developers.hp.com/hp-client-management/doc/SoftPaq-Repository
 * 
 * Pattern:
 *   test → SoftPaqRepository.initRepo() → psRunner → pwsh.exe → HP CMSL
 */

const { runCMSLCommand, runCMSLCommandJson } = require('../helpers/psRunner');

const MODULE_NAME = 'HP.Repo';

class SoftPaqRepository {
  /**
   * Initialize a new SoftPaq repository.
   * Cmdlet: Initialize-Repository
   * @param {string} repoPath - Path to create the repository
   * @returns {Promise<Object>} Raw command result
   */
  static async initializeRepository(repoPath) {
    return runCMSLCommand(
      MODULE_NAME,
      `Initialize-Repository -Path '${repoPath}'`
    );
  }

  /**
   * Add a SoftPaq filter to the repository.
   * Cmdlet: Add-RepositoryFilter
   * @param {string} repoPath - Repository path
   * @param {string} platform - Platform ID
   * @param {string} os - Operating system
   * @param {string} [category] - SoftPaq category
   * @returns {Promise<Object>} Raw command result
   */
  static async addFilter(repoPath, platform, os, category = null) {
    let cmd = `Set-RepositoryConfiguration -Path '${repoPath}'; Add-RepositoryFilter -Platform '${platform}' -Os '${os}'`;
    if (category) cmd += ` -Category '${category}'`;
    return runCMSLCommand(MODULE_NAME, cmd);
  }

  /**
   * Sync/update repository with latest SoftPaqs.
   * Cmdlet: Invoke-RepositorySync
   * @param {string} repoPath - Repository path
   * @returns {Promise<Object>} Raw command result
   */
  static async syncRepository(repoPath) {
    return runCMSLCommand(
      MODULE_NAME,
      `Set-RepositoryConfiguration -Path '${repoPath}'; Invoke-RepositorySync`,
      { timeout: 300000 } // 5 min timeout for sync
    );
  }

  /**
   * Clean up obsolete SoftPaqs from repository.
   * Cmdlet: Invoke-RepositoryCleanup
   * @param {string} repoPath - Repository path
   * @returns {Promise<Object>} Raw command result
   */
  static async cleanupRepository(repoPath) {
    return runCMSLCommand(
      MODULE_NAME,
      `Set-RepositoryConfiguration -Path '${repoPath}'; Invoke-RepositoryCleanup`
    );
  }

  /**
   * Get repository configuration.
   * Cmdlet: Get-RepositoryInfo
   * @param {string} repoPath - Repository path
   * @returns {Promise<{data: Object, raw: Object}>} Parsed repo info
   */
  static async getRepositoryInfo(repoPath) {
    return runCMSLCommandJson(
      MODULE_NAME,
      `Set-RepositoryConfiguration -Path '${repoPath}'; Get-RepositoryInfo | ConvertTo-Json -Depth 5`
    );
  }
}

module.exports = SoftPaqRepository;
