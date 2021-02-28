import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

/* eslint-disable no-console */

function startServer(): void {
  const app = express();

  app.use(cors());
  app.use(helmet({ contentSecurityPolicy: { reportOnly: true } }));

  SERVER_MIDDLEWARE;

  app.all('*', (req, res) => {
    res.sendStatus(404);
  });

  const port = PORT;

  app.listen(port, () => {
    console.log(START_MESSAGE);
    POST_START;
  });
}

startServer();
