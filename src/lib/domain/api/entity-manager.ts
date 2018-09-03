import {isDevMode} from '@angular/core';
import CryptoJS from 'crypto-js';
import {ApiRequest} from './api-request';
import {Subject} from 'rxjs/internal/Subject';
import {Observable} from 'rxjs/internal/Observable';
import {Observer} from 'rxjs/internal/types';
import {Subscription} from 'rxjs/internal/Subscription';
import {Comparateurs} from './comparateurs.enum';
import {AbstractEntity} from '../entities';
import {BaseActionsManager} from '../../stores/base.action';
import {ActionsManagerFactory} from '../../stores/action.factory';
import {ApiResponse} from './api-response';
import {RestService} from '../../services/rest-service';
import {EntityFactoryHelper} from '../helpers/entity-factory.helper';

export class EntityManager<T extends AbstractEntity> implements Iterator<[number, T]> {
  private static uniqueId = -100;
  readonly actionsManager: BaseActionsManager =
    ActionsManagerFactory.getActionsManager(CryptoJS.SHA256(String(this.modelType)).toString(CryptoJS.enc.Hex));
  // Contient la liste des objets ainsi que leur date d'expiration
  private objects: Map<number, { value: T, age: Date }> = new Map<number, { value: T, age: Date }>();
  // Permet de diffuser les changements apportés à la liste l'objets
  private subject$: Subject<Map<number, { value: T, age: Date }>> = new Subject<Map<number, { value: T, age: Date }>>();
  // Transforme la structure d'objet en liste simple et diffuse ses changements
  private observables: Map<number, Observable<T | T[]>> = new Map<number, Observable<T | T[]>>();
  private isComplete = false;
  // Contient la liste des requêtes en court
  private loading: Map<number, ApiRequest> = new Map<number, ApiRequest>();
  private loadingSubject$: Subject<{ id: number, request: ApiRequest, response: ApiResponse }> = new Subject();
  private loadingObservable: Observable<{ id: number, request: ApiRequest, response: ApiResponse }>;
  private lastInserted: T;

  constructor(private modelType, private service: RestService<T> = null, private expiration: number = 5) {
    this.observables.set(-1, Observable.create((observer: Observer<T[]>) => {
      let objects: T[] = this.toArray();
      observer.next(objects);
      const sub = this.subject$.subscribe({
        next: (objectsMap: Map<number, { value: T, age: Date }>) => {
          objects = [];
          objectsMap.forEach(function (element: { value: T, age: Date }) {
            objects.push(element.value);
          });

          observer.next(objects);
        },
        complete: () => observer.complete()
      });

      return () => sub.unsubscribe();
    }));
  }

  static getUniqueId(): number {
      return --EntityManager.uniqueId;
  }

  next(): IteratorResult<[number, T]> {
    const key = this.objects.keys().next();
    const value = this.objects.get(key.value);

    return {
      done: key.done,
      value: [key.value, value.value]
    };
  }

  /**
   * Observe la longueur de la liste
   * @param observable
   * @returns {number|Observable<number>}
   */
  length(observable: boolean = true): number | Observable<number> {
    if (observable) {
      return Observable.create((observer) => {
        let length = this.objects.size;
        observer.next(length);
        const sub = this.subject$.subscribe({
          next: (objectsMap: Map<number, { value: T, age: Date }>) => {
            length = objectsMap.size;
            observer.next(length);
          },
          complete: () => observer.complete()
        });

        return () => sub.unsubscribe();
      });
    }
    return this.objects.size;
  }

  /**
   * Retourne un observable de la liste d'objet
   * @param observable
   * @returns {Promise<T[]> | Observable<T[]>}
   */
  getAll(observable: boolean = true): Promise<T[]> | Observable<T[]> {
    if (!this.isComplete && !this.loading.has(-1)) {
      // this.service.read();
    }

    if (observable) {
      return <Observable<T[]>>this.observables.get(-1);
    }

    return new Promise((resolve): void => {
      if (this.isComplete) {
        resolve(this.toArray());
      } else {
        const sub = this.observables.get(-1).subscribe({
          next: () => {
            if (this.isComplete) {
              if (sub) {
                sub.unsubscribe();
              }
              resolve(this.toArray());
            }
          }
        });
      }
    });
  }

  /**
   * Retourne un observable de l'objet ayant l'identifiant demandé
   * @param id
   * @param getDetails
   * @param observable
   * @returns {Promise<T>|Observable<T>}
   */
  getById(
      id: number,
      getDetails: boolean = false,
      observable: boolean = true,
      params: Map<string, any> = null): Promise<T> | Observable<T> {
    if (!id || id < 0) {
      if (isDevMode()) {
        console.error('GetById: Identifiant de la ressource incorrect (' + this.modelType.name.toString() + ') : ' + id);
      }
      return;
    }

    // On récupère la valeur courrante de l'objet
    const value = this.objects.get(id);

    // On crée un observable pour cette valeur
    if (!this.observables.has(id)) {
      this.observables.set(id, Observable.create((observer) => {
        let obj: T = value ? value.value : null;
        observer.next(obj);
        const sub = this.observables.get(-1).subscribe({
          // Lorsque la liste est modifiée
          next: (array: T[]) => {
            obj = array.find((element: T): boolean => {
              return element.id === id;
            });
            observer.next(obj);
          },
          complete: () => observer.complete()
        });

        return () => sub.unsubscribe();
      }));
    }

    let requestId: number;
    // Si la valeur n'existe pas ou si elle est expirée
    if ((!value || this.isExpired(value.age)) && !this.loading.has(id) && (getDetails || !this.loading.has(-1))) {
      // requestId = this.service.read(id, params);
    }

    // Si on demande un observable, on le retourne
    if (observable) {
      return <Observable<T>>this.observables.get(id);
    }

    // Sinon, on attend (promise) que la valeur soit changée pour la retourner
    return new Promise((resolve, reject): void => {
      const sub: Subscription = this.observables.get(id).subscribe((val: T) => {
        if (val) {
          if (sub) {
            sub.unsubscribe();
          }
          if (loadingSub) {
            loadingSub.unsubscribe();
          }
          resolve(val);
        } else if (!this.loading.has(id)) {
          // requestId = this.service.read(id, params);
        }
      });
      const loadingSub: Subscription = this.observeLoading().subscribe((obj: {
        id: number,
        request: ApiRequest,
        response: ApiResponse }) => {
        if (obj.id === requestId &&
            (!obj.response || !obj.response.isValid() || !obj.response.data || (obj.response.data.id === undefined))) {
          if (sub) {
            sub.unsubscribe();
          }
          if (loadingSub) {
            loadingSub.unsubscribe();
          }
          reject(obj.response);
        }
      });
    });
  }

  /**
   * Retourne un observable contenant uniquement les objets correspondants aux paramètres demandés
   * @param values Filters
   * @param observable
   * @returns {Promise<T[]> | Observable<T[]>}
   */
  getByValues(values: Map<string, any>, observable: boolean = true): Promise<T[]> | Observable<T[]> {
    const requests: { identifiant: string, valeur: any, comparateur: number }[] = [];
    values.forEach((value: any, key: string): void => {
      requests.push({identifiant: key, valeur: value, comparateur: Comparateurs.EGAL});
    });

    return this.getByRequest(requests, observable);
  }

  /**
   * Retourne un observable contenant uniquement les objets satisfaisant la requête en entrée
   * @param {{identifiant: string, valeur: any, comparateur: number}[]} request Identifiant = variable - Valeur = valeur à tester - Comparateur = 0 -> égal à valeur 1 -> supérieur à valeur -1 inférieur à valeur
   * @param {boolean} observable
   * @returns {Promise<T[]> | Observable<T[]>}
   */
  getByRequest(request: { identifiant: string, valeur: any, comparateur: Comparateurs }[], observable: boolean = true, params: Map<string, any> = new Map()): Promise<T[]> | Observable<T[]> {
    const filter = (elements: T[]): T[] => {
      return elements.filter((element: T): boolean => {
        return !request.some((filtre: { identifiant: string, valeur: any, comparateur: Comparateurs }): boolean => {
          switch (filtre.comparateur) {
            // Si c'est 1 on vérifie que l'élément est supérieur à la valeur
            case Comparateurs.SUPERIEUR:
              return element[filtre.identifiant] <= filtre.valeur;
            // Si c'est -1 on vérifie que l'élément est inférieur à la valeur
            case Comparateurs.INFERIEUR:
              return element[filtre.identifiant] >= filtre.valeur;
            // Si c'est 0 on vérifie que l'élément est égal à la valeur
            case Comparateurs.EGAL:
              return element[filtre.identifiant] !== filtre.valeur;
            case Comparateurs.DIFFERENT:
              return element[filtre.identifiant] === filtre.valeur;
            case Comparateurs.EST_DANS:
              if (Array.isArray(filtre.valeur)) {
                return !filtre.valeur.some((val): boolean => {
                  return val === element[filtre.identifiant];
                });
              }

              throw new Error(`Valeur invalide : ${filtre.valeur}, un tableau est attendu`);
            case Comparateurs.EST_PAS_DANS:
              if (Array.isArray(filtre.valeur)) {
                return filtre.valeur.some((val): boolean => {
                  return val === element[filtre.identifiant];
                });
              }

              throw new Error(`Valeur invalide : ${filtre.valeur}, un tableau est attendu`);
            default:
              throw new Error(`Comparateur invalide : ${filtre.comparateur}`);
          }
        });
      });
    };

    const obs = Observable.create(observer => {
      let objects: T[] = this.toArray();
      observer.next(filter(objects));
      const sub = this.observables.get(-1).subscribe({
        next: (objectsArray: T[]) => {
          objects = objectsArray;
          observer.next(filter(objects));
        },
        complete: () => observer.complete()
      });

      return () => sub.unsubscribe();
    });

    let uniqueId = -1;
    if (!this.isComplete && !this.loading.has(-1)) {
      request.forEach((element: { identifiant: string, valeur: any, comparateur: number }): void => {
        if (element.comparateur === Comparateurs.EGAL) {
          params.set(element.identifiant, element.valeur);
        }
      });

      // uniqueId = this.service.read(null, params);
    }

    if (observable) {
      return obs;
    }

    return new Promise((resolve, reject): void => {
      let loadingSub: Subscription;
      const sub: Subscription = obs.subscribe((objects: T[]) => {
        if (!uniqueId || !this.loading.has(uniqueId)) {
          if (loadingSub) {
            loadingSub.unsubscribe();
          }
          if (sub) {
            sub.unsubscribe();
          }
          resolve(objects);
        }
      });

      if (!this.isComplete && this.loading.has(uniqueId)) {
        loadingSub = this.observeLoading().subscribe((obj: { id: number, request: ApiRequest, response: ApiResponse }) => {
            if ((obj.id === uniqueId || obj.id === -1) && (!obj.response || !obj.response.isValid() || !obj.response.data)) {
            if (sub) {
              sub.unsubscribe();
            }
            if (loadingSub) {
              loadingSub.unsubscribe();
            }
            reject(obj.response);
          }
        });
      }
    });
  }

  /**
   * Enregistre un élément ou une collection d'elements dans la liste
   * @param obj
   * @param estComplet
   */
  set(obj: any | T | any[] | T[], estComplet: boolean = false): void {
    if (obj instanceof this.modelType) {
      if (obj.id !== null) {
        if (!this.observables.has(obj.id)) {
          this.lastInserted = obj;
        }
        this.objects.set(obj.id, {value: obj, age: new Date()});
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((element: T): void => {
        if (element instanceof this.modelType) {
          if (element.id !== null) {
            this.objects.set(element.id, {value: element, age: new Date()});
          }
        } else {
          const newObj: T = EntityFactoryHelper.create<T>(this.modelType, element, this, this.service);
          if (newObj.id !== null) {
            this.objects.set(newObj.id, {value: newObj, age: new Date()});
          }
        }
      });
    } else {
      const newObj: T = EntityFactoryHelper.create<T>(this.modelType, obj, this, this.service);
      if (newObj.id !== null) {
        if (!this.observables.has(newObj.id)) {
          this.lastInserted = newObj;
        }
        this.objects.set(newObj.id, {value: newObj, age: new Date()});
      }
    }

    this.subject$.next(this.objects);
  }

  /**
   * Supprime un élément de la liste selon son identifiant
   * @param id
   */
  remove(id: number, changeComplete = true): void {
    if (this.objects.delete(id)) {
      this.isComplete = changeComplete ? false : this.isComplete;
      this.subject$.next(this.objects);
    } else {
      throw new Error('Identifiant inconnu dans la liste');
    }
  }

  /**
   * Supprime tous les éléments de la liste de la mémoire
   */
  removeAll(): void {
    this.objects.clear();
    this.isComplete = false;
    this.subject$.next(this.objects);
  }

  /**
   * Retourne le service permettant l'appel à l'API
   * @returns {RestService<T>}
   */
  getService(): RestService<T> {
    return this.service;
  }

  /**
   * Retourne le type de ressource de ce manager
   * @returns {any}
   */
  getType(): any {
    return this.modelType;
  }

  /**
   * Indique au manager qu'une requête est en cours pour une donnée
   * @param request
   * @param id Identifiant de la ressource, -1 pour All
   */
  setLoading(request: ApiRequest, id: number = -1): void {
    this.loading.set(id, request);
    this.loadingSubject$.next({id: id, request: request, response: null});
  }

  /**
   * Indique au manager qu'une requête a aboutie
   * @param id Identifiant de la ressource, -1 pour All
   * @param response Réponse de la requête concernée
   */
  removeLoading(id: number = -1, response: ApiResponse): void {
    if (id === -1) {
      this.isComplete = true;
    }
    this.loadingSubject$.next({id: id, request: this.loading.get(id), response: response});
    this.loading.delete(id);
  }

  /**
   * Vérifie si une requete est en cours
   * @param {number} id
   * @returns {boolean}
   */
  hasLoading(id: number): boolean {
    return this.loading.has(id);
  }

  /**
   * Retourne un observable permettant d'écouter les requêtes
   * @returns {Observable<{id: number; request: ApiRequest}>}
   */
  observeLoading(): Observable<{ id: number, request: ApiRequest, response: ApiResponse }> {
    if (!this.loadingObservable) {
      this.loadingObservable = Observable.create((observer: Observer<{ id: number, request: ApiRequest, response: ApiResponse }>) => {
        const sub = this.loadingSubject$.subscribe({
          next: (request: { id: number, request: ApiRequest, response: ApiResponse }) => {
            observer.next(request);
          },
          complete: () => observer.complete()
        });

        return () => sub.unsubscribe();
      });
    }

    return this.loadingObservable;
  }

  /**
   * Créé une nouvelle instance de la ressource du manager (attention, la ressource n'est pas enregistrée)
   * @param values
   * @returns {T}
   */
  create(values: any = {}): T {
    return EntityFactoryHelper.create<T>(
      this.modelType,
      values,
      this,
      this.service
    );
  }

  /**
   * Retourne le dernier élément inséré dans la liste
   * @param {boolean} observable
   * @returns {Promise<T extends AbstractModel> | Observable<T extends AbstractModel>}
   */
  getLastInserted(observable: boolean = true): Promise<T> | Observable<T> {
    const obs = Observable.create((observer) => {
      let obj: T = this.lastInserted;
      observer.next(obj);
      const sub = this.observables.get(-1).subscribe({
        // Lorsque la liste est modifiée
        next: () => {
          if (this.lastInserted.id !== obj.id) {
            obj = this.lastInserted;
            observer.next(obj);
          }
        },
        complete: () => observer.complete()
      });

      return () => sub.unsubscribe();
    });

    if (observable) {
      return obs;
    }

    return new Promise(function (resolve) {
      const sub = obs.subscribe((obj: T) => {
        if (obj) {
          if (sub) {
            sub.unsubscribe();
          }
          resolve(obj);
        }
      });
    });
  }

  /**
   * Vérifie si l'âge d'un objet a atteind sa date d'expiration
   * @param age
   * @returns {boolean}
   */
  private isExpired(age: Date): boolean {
    const expire: Date = new Date(age.getTime() + this.expiration * 60 * 1000);
    return expire < new Date();
  }

  /**
   * Transforme la liste d'objets courrants en tableau
   * @returns {T[]}
   */
  private toArray(): T[] {
    const result: T[] = [];
    this.objects.forEach(function (element: { value: T, age: Date }) {
      result.push(element.value);
    });
    return result;
  }
}
