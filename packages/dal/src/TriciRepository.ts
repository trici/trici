import jsonpatch from "fast-json-patch";
import type { Logger } from "@trici/logger";
import PouchDB from "pouchdb";

export interface ITriciPouchDocument {
  _id: string;
}
export interface ITriciRepository {
  init(dataDirectoryPath: string): void;
  get(id: string): Promise<PouchDB.Core.Document<any> | null>;
  save(obj: ITriciPouchDocument & any , idOfDocToDelete: string): Promise<ITriciPouchDocument & any>;
  remove(idOfDocToDelete: string): Promise<any>;
  query(queryOptions: any): Promise<any>;
}

export class TriciRepository implements ITriciRepository {
  #repoInitialized: boolean;
  #db: any;
  #logger: Logger;

  constructor(logger: Logger) {
    this.#repoInitialized = false;
    this.#db = null;
    this.#logger = logger;
  }

  /**
   * Initializes the repository.
   * @param dataDirectoryPath The path to the data directory. This should include the workspace and the app name.
   * @example dataDirectoryPath = /Users/username/Library/Application Support/Trici/MyWorkspace/data
   *
   */
  public init(dataDirectoryPath: string): void {
    if (!this.#repoInitialized) {
      try {
        this.#logger.info(`Initializing repository with dataDirectoryPath: ${dataDirectoryPath}`);
        this.#db = new PouchDB(dataDirectoryPath);
        this.#db.info().then((info: PouchDB.Core.DatabaseInfo) => {
          this.#logger.info(JSON.stringify(info));
        });
        // Do other stuff such as building indexes, etc.
        this.#repoInitialized = true;
      } catch (error) {
        this.#logger.error("Error initializing repository. Error: ", error);
      }
    }
  }

  public get(_id: string): Promise<PouchDB.Core.Document<any>> {
    return new Promise((fulfill, reject) => {
      let objFromDb;
      this.#db
        .get(_id)
        .then((doc: PouchDB.Core.Document<any>) => {
          objFromDb = doc;
          this.#logger.silly(`Logging objFromDb:${JSON.stringify(objFromDb)}`);
          fulfill(objFromDb);
        })
        .catch((err: PouchDB.Core.Error) => {
          if (err.status === 404 || err.status === 400) {
            objFromDb = null;
            fulfill(objFromDb);
          } else {
            this.#logger.error("Error fetching objFromDb. Error: %o", err);
            reject(err);
          }
        });
    });
  }

  public save(obj: ITriciPouchDocument & any, idOfDocToDelete: string | null): Promise<ITriciPouchDocument & any> {
    this.#logger.debug(`Saving Obj in pouchDb:${JSON.stringify(obj)}`);
    return new Promise((fulfill, reject) => {
      this.#db
        .get(idOfDocToDelete)
        .then((objFromDb: PouchDB.Core.Document<any>) => {
          const revToDelete = objFromDb._rev;
          const changes = jsonpatch.compare(objFromDb, obj);
          const updObjFromDb = jsonpatch.applyPatch(objFromDb, changes).newDocument; // the _id of the objFromDb changed after applying patched, _rev was also
          // deleted
          this.#logger.debug(`objFromDb after changes: ${JSON.stringify(objFromDb)}`);
          this.#db
            .put(updObjFromDb)
            .then((resp: PouchDB.Core.Response) => {
              this.#logger.debug(`Saved Obj successfully in Db. Resp: ${JSON.stringify(resp)}`);
              this.#db
                .remove(idOfDocToDelete, revToDelete)
                .then((resp: PouchDB.Core.Response) => {
                  this.#logger.debug(
                    `deleted doc from pouchDB with _id:${idOfDocToDelete} and rev:${revToDelete}. Resp:`,
                    resp
                  );
                })
                .catch((error: PouchDB.Core.Error) => {
                  this.#logger.error(
                    `Error deleting doc from pouchDB. _id:${idOfDocToDelete} and rev:${revToDelete} and error:${JSON.stringify(
                      error
                    )}`
                  );
                });
              fulfill(updObjFromDb);
            })
            .catch((err: PouchDB.Core.Error) => {
              this.#logger.error(`Error saving obj in pouchDB. Error: ${JSON.stringify(err)}`);
              reject(err);
            });
        })
        .catch((error: PouchDB.Core.Error) => {
          this.#logger.error(
            `Error fetching objFromDB with idOfDocToDelete: ${idOfDocToDelete}. Error:${JSON.stringify(error)}`
          );
          if (error.status === 404) {
            this.#db
              .put(obj)
              .then((resp: PouchDB.Core.Response) => {
                this.#logger.silly(`Saved obj successfully in Db. Resp:${JSON.stringify(resp)}`);
                // earlier I was passing resp to fulfill, but we actually need the object, to cache appStateAtStartup on
                // first run. I also think that in other places where we are returning the resp, we may want to change.
                fulfill(obj);
              })
              .catch((err: PouchDB.Core.Error) => {
                this.#logger.error(`Error saving new obj in pouchDB, Error:${JSON.stringify(err)}`);
                reject(err);
              });
          }
        });
    });
  }

  public remove(idOfDocToDelete: string): Promise<any> {
    return new Promise((fulfill, reject) => {
      this.#db.get(idOfDocToDelete).then((objFromDb: PouchDB.Core.Document<any>) => {
        const revToDelete = objFromDb._rev;
        this.#db
          .remove(idOfDocToDelete, revToDelete)
          .then((resp: PouchDB.Core.Response) => {
            fulfill(resp);
          })
          .catch((error: PouchDB.Core.Error) => {
            reject(error);
          });
      });
    });
  }

  public query(queryOptions: any): Promise<any> {
    return new Promise((fulfill, reject) => {
      // logger.debug('queryOptions:%O', queryOptions);
      this.#db
        .allDocs(queryOptions)
        .then((result: PouchDB.Core.AllDocsResponse<any>) => {
          // logger.info('queryResult:%O', result);
          fulfill(result);
        })
        .catch((error: PouchDB.Core.Error) => {
          reject(error);
        });
    });
  }
}
