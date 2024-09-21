import multer from 'multer';
import { Router, Request, Response } from 'express';
import { TransactionController } from './controllers/transactions';
import { validateTransaction } from './middleware';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export function createTransactionRoutes(transactionController: TransactionController): Router {
  const router = Router();
  router.post('/upload', upload.single('file'), (req: Request, res: Response) =>
    transactionController.submitFile(req, res),
  );
  router.post('/', validateTransaction, (req: Request, res: Response) =>
    transactionController.submit(req, res),
  );
  router.get('/', (req: Request, res: Response) => transactionController.getAll(req, res));
  router.get('/:id', (req: Request, res: Response) => transactionController.getById(req, res));

  return router;
}
