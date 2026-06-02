import express from 'express';
import session from 'express-session';
import cors from 'cors';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: 'change-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 8 },
  }),
);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.listen(4000, () => console.log('Server on http://localhost:4000'));
