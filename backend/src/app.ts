import express from 'express';
import cors from 'cors';
import timeEntryRoutes from './routes/timeEntryRoutes';
import authRoutes from './routes/authRoutes';
import helmet from 'helmet';

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());

app.use('/api/auth', authRoutes);
app.use('/api/time-entries', timeEntryRoutes);

export default app;
