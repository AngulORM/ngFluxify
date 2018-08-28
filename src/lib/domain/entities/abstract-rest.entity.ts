import {AbstractEntity} from "./abstract.entity";
import {EntityManager} from "../api/entity-manager";
import {RestService} from "../../services/rest-service";

export abstract class AbstractRestEntity extends AbstractEntity {
    public static entityManager: EntityManager<AbstractRestEntity>;
    protected static entityService: RestService<AbstractRestEntity>;

    public create(): void {

    }

    public read(): void {

    }

    public save(): void {

    }

    public remove(): void {

    }
}
