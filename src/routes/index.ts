import { Router } from 'express';
import adminRoutes from './admin.routes';
import publicRoutes from './public.routes';
import { protect } from '../common/middlewares/protect';

const rootRouter = Router();

rootRouter.use('/admin', protect, adminRoutes);
rootRouter.use('/', publicRoutes);

export default rootRouter;