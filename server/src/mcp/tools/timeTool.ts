import { z } from 'zod';

export const getTimeSchema = z.object({
  timezone: z.string().optional().describe('Optional IANA timezone name, e.g. "UTC", "America/New_York", "Asia/Kolkata", "Europe/London"')
});

export type GetTimeInput = z.infer<typeof getTimeSchema>;

export async function executeGetTime(input: GetTimeInput) {
  const targetTz = input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });

    const parts = formatter.formatToParts(now);
    const formattedString = formatter.format(now);
    
    return {
      success: true,
      timezone: targetTz,
      formattedTime: formattedString,
      iso: now.toISOString(),
      timestamp: now.getTime(),
      details: {
        weekday: parts.find(p => p.type === 'weekday')?.value,
        year: parts.find(p => p.type === 'year')?.value,
        month: parts.find(p => p.type === 'month')?.value,
        day: parts.find(p => p.type === 'day')?.value,
        hour: parts.find(p => p.type === 'hour')?.value,
        minute: parts.find(p => p.type === 'minute')?.value,
        timeZoneName: parts.find(p => p.type === 'timeZoneName')?.value
      }
    };
  } catch (error: any) {
    // If timezone is invalid, fallback to UTC with warning
    const now = new Date();
    return {
      success: true,
      warning: `Timezone "${targetTz}" not recognized, falling back to UTC.`,
      timezone: 'UTC',
      formattedTime: now.toUTCString(),
      iso: now.toISOString(),
      timestamp: now.getTime()
    };
  }
}
