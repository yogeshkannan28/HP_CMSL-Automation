import { z } from 'zod';
import Notifications from './Notifications';
import type { ToolSpec } from '../core/types';

export const notificationsTools: ToolSpec[] = [
  {
    name: 'notifications_send',
    module: 'Notifications',
    mutates: true,
    description: 'Send a Windows toast notification (Invoke-HPNotification).',
    paramsSchema: { title: z.string(), message: z.string() },
    handler: (a) => Notifications.sendNotification(a.title as string, a.message as string),
  },
  {
    name: 'notifications_send_with_image',
    module: 'Notifications',
    mutates: true,
    description: 'Send a toast notification with a custom image/icon.',
    paramsSchema: { title: z.string(), message: z.string(), imagePath: z.string() },
    handler: (a) =>
      Notifications.sendNotificationWithImage(a.title as string, a.message as string, a.imagePath as string),
  },
  {
    name: 'notifications_verify_module_loaded',
    module: 'Notifications',
    mutates: false,
    description: 'Verify the HP.Notifications module loads correctly.',
    paramsSchema: {},
    handler: () => Notifications.verifyModuleLoaded(),
  },
];
