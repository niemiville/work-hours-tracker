import express from 'express';
import cors from 'cors';
import timeEntryRoutes from './routes/timeEntryRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/time-entries', timeEntryRoutes);

export default app;
