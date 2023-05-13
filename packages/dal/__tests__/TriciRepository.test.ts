import { TriciRepository } from "../src/TriciRepository";
import { Constants } from "@trici/models";
import PouchDB from "pouchdb";
import { v4 as uuidv4 } from "uuid";
import type { Logger } from "@trici/logger";
import LoggingService from "@trici/logger";
import { deleteDirectoryWithContents } from "@trici/utils";
import path from "path";

// Mock the logger to silence the output during tests

describe("TriciRepository", () => {
  let logger: Logger;
  let repository: TriciRepository;

  const appDataDirectory = path.join(__dirname, "testAppData");
  const workspaceName = "default";

  beforeAll(() => {
    const dirPath = path.join(__dirname, "logs");

    return new Promise(async (resolve, reject) => {
      try {
        console.log("Cleaning test logs directory");
        await deleteDirectoryWithContents(dirPath);
        console.log("Cleaned test logs directory");
      } catch (err) {
        console.log("Error initializing logger: ", err);
        reject(err);
      }

      // Initialize the logger with the logs directory path to be the current directory
      console.log("dirPath: ", dirPath);
      logger = LoggingService.init(dirPath, "test-%DATE%.log", {
        installationId: "test-installation-id",
        appDetails: "darwin-dev-2.1.1",
      });
      console.log("Initialized logger");
      repository = new TriciRepository(logger);
      console.log("Initializing repository with appDataDirectory: ", appDataDirectory);
      repository.init(appDataDirectory);
      resolve(true);
    });
  });

  afterAll(async () => {
    // Clean up the test database
    // const db = new PouchDB(`${appDataDirectory}/trici/${workspaceName}/data/`);
    // await db.destroy();
  });

  test("Save, Get, and Remove", async () => {
    const testId = uuidv4();
    console.log("testId: ", testId);
    const testDocument = {
      _id: testId,
      name: "Test Document",
      value: 42,
    };

    const savedDoc = await repository.save(testDocument, Constants.UNINITIALIZED_ID);
    expect(savedDoc._id).toBe(testDocument._id);

    const fetchedDoc = await repository.get(savedDoc._id);
    expect(fetchedDoc).toMatchObject(testDocument);

    const removeResp = await repository.remove(savedDoc._id);
    expect(removeResp.ok).toBe(true);

    const nonExistentDoc = await repository.get(savedDoc._id);
    expect(nonExistentDoc).toBeNull();
  });

  test("Query", async () => {
    const testDocId1 = uuidv4();
    const testDocId2 = uuidv4();

    const testDocument1 = {
      _id: testDocId1,
      name: "Test Document 1",
      value: 10,
    };

    const testDocument2 = {
      _id: testDocId2,
      name: "Test Document 2",
      value: 20,
    };

    await repository.save(testDocument1, Constants.UNINITIALIZED_ID);
    await repository.save(testDocument2, Constants.UNINITIALIZED_ID);

    const queryOptions = {
      include_docs: true,
    };

    const queryResult = await repository.query(queryOptions);
    expect(queryResult.rows.length).toBeGreaterThanOrEqual(2);
    expect(queryResult.rows.some((row: any) => row.id === testDocument1._id)).toBe(true);
    expect(queryResult.rows.some((row: any) => row.id === testDocument2._id)).toBe(true);
  });
});
