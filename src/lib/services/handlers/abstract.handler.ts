import { HttpResponse } from '@angular/common/http';
import { ApiResponse } from '../../domain/api/api-reponse';

export abstract class AbstractHandler {
  abstract handle(response: HttpResponse<any>): ApiResponse;
}
