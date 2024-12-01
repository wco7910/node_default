import 'module-alias/register';
import * as http from 'http';
import app from './serverInit';
import { cronInit } from './serverInit/cron';

app.launch().then(({ app, setSocket }: any) => {
  const server = http.createServer(app);
  const port = process.env.PORT || 3000;
  server.listen(port, () => {

    console.log(
      `Express server has started on port ${port}. Open http://localhost:${port} to see results.`
    );

    const cronTimes = {
      fileRemove: '0 0 0 * * MON,WED,FRI,SUN',
      cronRunning: '* * * * *',
    };

    cronInit.fileRemove(cronTimes.fileRemove);
  });
});
