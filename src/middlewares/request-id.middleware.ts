import { v4 as uuidv4 } from 'uuid';
import { asyncLocalStorage } from '../config/elasticsearch'; // path to your logger.ts

export function requestIdMiddleware(req: Request, res: Response, next: any) {
  const requestId = uuidv4();

  asyncLocalStorage.run({ requestId }, () => {
    // Optionally add requestId to response headers
    res.setHeader('X-Request-Id', requestId);

    next();
  });
}