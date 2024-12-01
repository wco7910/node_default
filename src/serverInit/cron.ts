import cron from 'node-cron';
import { g_DataSource } from './database';
import { dayjsTz } from './dayjs.timezone';
const timezone = {
  schedule: true,
  timezone: 'Asia/Seoul',
};
export const cronInit = {
  cronRunning: async (schedule) => {
    cron.schedule(schedule, async () => {
      console.log('cron is running fine....');
    });
  },
  fileRemove: async (schedule) => {
    cron.schedule(
      schedule,
      async () => {
        try {

        } catch (error) {
          console.log(error);
        }
      },
      timezone
    );
  },
};
