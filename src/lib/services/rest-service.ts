import {NgRedux} from '@angular-redux/store';
import {DatePipe} from '@angular/common';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {IAppState} from '../stores/root.store';
import {RestActions} from '../stores/rest/rest.actions';
import * as moment from 'moment-timezone';
import {Observable} from 'rxjs/internal/Observable';
import {ApiRequest} from '../domain/api/api-request';
import {UrlParserHelper} from '../domain/helpers/url-parser.helper';
import {ApiResponse} from '../domain/api/api-response';
import {BaseActionsManager} from '../stores/base.action';
import {EntityManager} from '../domain/api/entity-manager';
import {AbstractRestEntity} from '../domain/entities';
import {RestEntityDescriptor} from '../domain/descriptors';
import {IEntityService} from './IEntity.service';
import {AngularRestModule} from '../angular-rest.module';

export class RestService<T extends AbstractRestEntity> implements IEntityService<RestEntityDescriptor> {
    protected static options = {
        withCredentials: true
    };

    protected path: string;
    protected resource: RestEntityDescriptor;

    constructor(protected actionsManager: BaseActionsManager,
                protected resourceType,
                protected httpClient: HttpClient,
                protected ngRedux: NgRedux<IAppState>) {
      AngularRestModule.entities.forEach((element: RestEntityDescriptor): void => {
            if (new element.class() instanceof this.resourceType) {
                this.resource = element;
            }
        });

        if (!this.resource) {
            throw new Error('Resource not found!');
        }

        // TO DO
        this.path = 'http://test' + this.resource.route;
    }

    static cleanData(data: any): any {
        const result = {};

        if (Array.isArray(data)) {
            const resultArray = [];
            data.forEach((element: any): void => {
                resultArray.push(RestService.cleanData(element));
            });
            return resultArray;
        }

        Object.getOwnPropertyNames(data).forEach((element: string): void => {
            switch (element) {
                case 'service':
                case 'manager':
                case 'estComplet':
                    break;
                default:
                    if (typeof data[element] === 'boolean') {
                        result[element] = data[element] ? 1 : 0;
                        break;
                    }
                    if (data[element] instanceof Date) {
                        const datePipe = new DatePipe('fr');
                        const dateString = datePipe.transform(data[element], 'yyyy-MM-ddTHH:mm:ss')
                            + moment(data[element]).tz('Europe/Paris').format('Z');
                        result[element] = dateString;
                        break;
                    }
                    result[element] = data[element];
            }
        });

        return result;
    }

    create(model: T, queryParams: Map<string, any> = null): number {
        let params: string;
        if (queryParams) {
            const paramsArray: string[] = [];
            queryParams.forEach(function (value: string, key: string) {
                paramsArray.push([key, value].join('='));
            });
            params = paramsArray.join('&');
        }

        return this.request(params ? [this.path, params].join('?') : this.path, RestActions.CREATE, model);
    }

    read(id: number = null, queryParams: Map<string, string> = null): number {
        let params: string;
        if (queryParams) {
            const paramsArray: string[] = [];
            queryParams.forEach(function (value: string, key: string) {
                paramsArray.push([key, value].join('='));
            });
            params = paramsArray.join('&');
        }

        console.log(this.path);

        if (id) {
            const path = [this.path, id].join('/').replace('//' + id, '/' + id);
            return this.request(params ? [path, params].join('?') : path, RestActions.READ);
        }
        return this.request(params ? [this.path, params].join('?') : this.path, RestActions.READ_ALL);
    }

    update(model: T, queryParams: Map<string, any> = null): number {
        let params: string;
        if (queryParams) {
            const paramsArray: string[] = [];
            queryParams.forEach(function (value: string, key: string) {
                paramsArray.push([key, value].join('='));
            });
            params = paramsArray.join('&');
        }

        return this.request(params ?
            [[this.path, model.id].join('/'), params].join('?') :
            [this.path, model.id].join('/'), RestActions.UPDATE, model, 'put');
    }

    patch(values: Map<string, any>): number {
        const param = {};
        values.forEach(function (value: any, key: string) {
            param[key] = value;
        });

        return this.request(this.path, RestActions.UPDATE, param, 'patch');
    }

    delete(model: T, queryParams: Map<string, any> = null): number {
        let params: string;
        if (queryParams) {
            const paramsArray: string[] = [];
            queryParams.forEach(function (value: string, key: string) {
                paramsArray.push([key, value].join('='));
            });
            params = paramsArray.join('&');
        }
        const path = (params ?
            [[this.path, model.id].join('/'), params].join('?') :
            [this.path, model.id].join('/')).replace('//' + model.id, '/' + model.id);
        return this.request(path, RestActions.DELETE);
    }

    protected request(url: string, action: string[], params: any = null, method: string = null): number {
        let observer: Observable<any>;

        const request: ApiRequest = <ApiRequest>{
            uniqueId: EntityManager.getUniqueId(),
            url: UrlParserHelper.parse(url),
            params: params,
            method: method
        };

        // const token = <AuthToken>this.ngRedux.getState().auth.get('token');
        const options = RestService.options;
        // if (token) {
        //   if (isDevMode()) {
        //     url = [url, ['token', encodeURIComponent(token.valeur)].join('=')].join(url.split('?').length > 1 ? '&' : '?');
        //   } else {
        //     options = Object.assign(options, {
        //       headers: new HttpHeaders({
        //         'X-Auth-Token': token.valeur
        //       })
        //     });
        //   }
        // }
        switch (action) {
            case RestActions.CREATE:
                request.method = 'post';
                observer = <Observable<Object>>this.httpClient.post(url, RestService.cleanData(params), options);
                break;
            case RestActions.READ:
                request.uniqueId = Number(request.url.pathname.split('/').slice(-1).pop());
                request.method = 'get';
                observer = <Observable<Object>>this.httpClient.get(url, options);
                break;
            case RestActions.READ_ALL:
                if (!request.url.search || request.url.search.length === 0) {
                    request.uniqueId = -1;
                }
                request.method = 'get';
                observer = <Observable<Object>>this.httpClient.get(url, options);
                break;
            case RestActions.UPDATE:
                observer = this.httpClient[method.toLowerCase()](url, RestService.cleanData(params), options);
                break;
            case RestActions.DELETE:
                request.method = 'delete';
                observer = <Observable<Object>>this.httpClient.delete(url, options);
                break;
            default:
                observer = this.httpClient[method.toLowerCase()](url, options);
                break;
        }

        this.ngRedux.dispatch({type: this.actionsManager.getHTTPRequestAction(action), request: request});
        observer.subscribe((response: Object) => {
            const apiResponse: ApiResponse = new ApiResponse();
            apiResponse.requestData = request;
            apiResponse.status = 200;
            apiResponse.data = response;
            this.ngRedux.dispatch({
                response: apiResponse,
                type: this.actionsManager.getHTTPResponseAction(action),
                request: request
            });
        }, (err: HttpResponse<any>) => {
            const apiResponse: ApiResponse = new ApiResponse();
            apiResponse.requestData = request;
            apiResponse.status = err.status;
            apiResponse.msg = err.body;
            this.ngRedux.dispatch({
                type: this.actionsManager.getHTTPErrorAction(action),
                request: request,
                response: apiResponse
            });
        });

        return request.uniqueId;
    }
}
