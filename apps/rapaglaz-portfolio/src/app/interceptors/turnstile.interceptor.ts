import { HttpInterceptorFn } from '@angular/common/http';
import { TURNSTILE_TOKEN } from '../services';

export const turnstileInterceptor: HttpInterceptorFn = (req, next) => {
  const token = req.context.get(TURNSTILE_TOKEN);

  if (token) {
    // CF Worker reads cf-turnstile-response header to validate request
    const clonedReq = req.clone({
      setHeaders: {
        'cf-turnstile-response': token,
      },
    });
    return next(clonedReq);
  }

  return next(req);
};
