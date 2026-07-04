import Consent from './Consent';
import type { ToolSpec } from '../core/types';

export const consentTools: ToolSpec[] = [
  {
    name: 'consent_get_status',
    module: 'Consent',
    mutates: false,
    description: 'Get current consent/telemetry status (Get-HPDeviceAnalyticsConsent).',
    paramsSchema: {},
    handler: () => Consent.getConsentStatus(),
  },
  {
    name: 'consent_enable',
    module: 'Consent',
    mutates: true,
    description: 'Enable analytics consent / opt-in (Set-HPDeviceAnalyticsConsent -Consent Enable).',
    paramsSchema: {},
    handler: () => Consent.enableConsent(),
  },
  {
    name: 'consent_disable',
    module: 'Consent',
    mutates: true,
    description: 'Disable analytics consent / opt-out (Set-HPDeviceAnalyticsConsent -Consent Disable).',
    paramsSchema: {},
    handler: () => Consent.disableConsent(),
  },
  {
    name: 'consent_get_config',
    module: 'Consent',
    mutates: false,
    description: 'Get consent configuration as parsed JSON.',
    paramsSchema: {},
    handler: () => Consent.getConsentConfig(),
  },
];
