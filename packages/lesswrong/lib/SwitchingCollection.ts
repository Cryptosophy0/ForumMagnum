import { MongoCollection } from "./mongoCollection";
import PgCollection from "./sql/PgCollection";

export type ReadTarget = "mongo" | "pg";
export type WriteTarget = ReadTarget | "both";

/**
 * SwitchingCollection is a temporary utility class used to enable zero
 * downtime migrations from Mongo to Postgres by allowing us to switch
 * reading and writing on and off for MongoDB and Postgres in a
 * collection independant manner whilst the server is running.
 *
 * It doesn't implement BaseCollection or extend MongoCollection for
 * implementation reasons, but the expected usage is that it will be a
 * drop-in replacement for MongoCollection or PgCollection, simply by
 * casting `const collection = new SwitchingCollection(...) as unknown
 * as MongoCollection<T>`, for instance.
 */
class SwitchingCollection<T extends DbObject> {
  static readonly readOperations = [
    "find",
    "findOne",
    "findOneArbitrary",
    "aggregate",
  ];

  static readonly writeOperations = [
    "rawInsert",
    "rawUpdateOne",
    "rawUpdateMany",
    "rawRemove",
    "_ensureIndex",
  ];

  static readonly rawReadOperations = [
    "indexes",
  ];

  static readonly rawWriteOperations = [
    "bulkWrite",
    "findOneAndUpdate",
    "dropIndex",
    "updateOne",
    "updateMany",
  ];

  private mongoCollection: MongoCollection<T>;
  private pgCollection: PgCollection<T>;
  private readTarget: ReadTarget;
  private writeTarget: WriteTarget;

  constructor(tableName: string, options?: {_suppressSameNameError?: boolean}) {
    this.mongoCollection = new MongoCollection(tableName, options);
    this.pgCollection = new PgCollection(tableName, options);
    this.readTarget = "mongo";
    this.writeTarget = "mongo";

    // Don't try this at home...
    return new Proxy(this, {
      get: (target: SwitchingCollection<T>, property: string): any => {
        if (property in target) {
          return target[property];
        }

        if (SwitchingCollection.readOperations.includes(property)) {
          return this.getReadCollection()[property];
        }

        if (SwitchingCollection.writeOperations.includes(property)) {
          return this.proxiedWrite(this.getWriteCollections(), property);
        }

        if (property === "rawCollection") {
          const targets = this.getWriteCollections().map(
            (collection) => collection.rawCollection(),
          );
          const result = {};
          const rawRead = this.getReadCollection().rawCollection();
          for (const op of SwitchingCollection.rawReadOperations) {
            result[op] = rawRead[op];
          }
          for (const op of SwitchingCollection.rawWriteOperations) {
            result[op] = this.proxiedWrite(targets, op);
          }
          return () => result;
        }

        if (property === "options") {
          return new Proxy(this, {
            get: (target: SwitchingCollection<T>, property: string) => {
              const base = target.getReadCollection() as unknown as CollectionBase<T>;
              return base.options[property];
            },

            set: (object: SwitchingCollection<T>, key: string, value: any): boolean => {
              object.mongoCollection.options[key] = value;
              object.pgCollection.options[key] = value;
              return true;
            },
          });
        }

        const base = target.getReadCollection() as unknown as CollectionBase<T>;
        return base[property];
      },

      set: (object: SwitchingCollection<T>, key: string, value: any): boolean => {
        if (key in object) {
          object[key] = value;
        } else {
          object.mongoCollection[key] = value;
          object.pgCollection[key] = value;
        }
        return true;
      },
    });
  }

  setTargets(readTarget: ReadTarget, writeTarget: WriteTarget) {
    this.readTarget = readTarget;
    this.writeTarget = writeTarget;
  }

  getReadTarget() {
    return this.readTarget;
  }

  getWriteTarget() {
    return this.writeTarget;
  }

  getReadCollection() {
    switch (this.readTarget) {
    case "mongo":
      return this.mongoCollection;
    case "pg":
      return this.pgCollection;
    default:
      throw new Error("Invalid read target");
    }
  }

  getWriteCollections() {
    switch (this.writeTarget) {
    case "mongo":
      return [this.mongoCollection];
    case "pg":
      return [this.pgCollection];
    case "both":
      return [this.mongoCollection, this.pgCollection];
    default:
      throw new Error("Invalid write target");
    }
  }

  proxiedWrite(targets: any[], operation: string) {
    return async (...args: any[]) => {
      const result = await Promise.all(
        targets.map((target) => target[operation](...args)),
      );
      return result[0];
    };
  }

  isPostgres() {
    return this.readTarget === "pg";
  }

  isConnected() {
    return this.mongoCollection.isConnected() && this.pgCollection.isConnected();
  }

  getTable() {
    return this.pgCollection.getTable();
  }

  getMongoCollection() {
    return this.mongoCollection;
  }

  setMongoCollection(mongoCollection: MongoCollection<T>) {
    this.mongoCollection = mongoCollection;
  }

  getPgCollection() {
    return this.pgCollection;
  }

  setPgCollection(pgCollection: PgCollection<T>) {
    this.pgCollection = pgCollection;
  }

  getName() {
    const base = this.mongoCollection as unknown as CollectionBase<DbObject>;
    return base.collectionName;
  }
}

export default SwitchingCollection;
