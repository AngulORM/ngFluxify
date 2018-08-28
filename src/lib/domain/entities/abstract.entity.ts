import {EntityManager} from "../api/entity-manager";
import {IEntityService} from "../../services/IEntity.service";
import {EntityDescriptor} from "../descriptors";

export abstract class AbstractEntity {
    public static entityManager: EntityManager<AbstractEntity>;
    protected static entityService: IEntityService<EntityDescriptor>;

  id = -1;

    public abstract create(): void;

    public abstract read(): void;

    public abstract save(): void;

    public abstract remove(): void;
}
