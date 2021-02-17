import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

/* eslint-disable no-console */

function startServer(): void {
  const app = express();

  app.use(cors());
  app.use(helmet());

  SERVER_MIDDLEWARE;

  app.all('*', (req, res) => {
    res.sendStatus(404);
  });

  app.listen(PORT, () => {
    console.log(`Server listening and ready at http://localhost:${PORT}!`);
  });
}

startServer();
