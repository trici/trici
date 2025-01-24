/**
 * TODO: Move this file to a separate package so that it can be used in both main and renderer processes
 *  @description This file contains utility functions that are used on the ui side of the application.
 *  These are also used in the main process of the application and for that they were originally written in the @trici/utils package.
 *  Copying here to be able to use them without build errors caused due to main process dependencies like fs etc.
 */
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { ClassValue } from 'clsx';

/*
 * Generate a new trici id for the given uuid and type
 * @description A trici is is a string of the form uuid_type_createdAtDate_muton_mutatedAtDate
 * @param uuid The uuid of the trici id
 * @param type The type of the trici id
 * @returns a trici id like 22d860cd-07e1-4d7f-bd9a-ca5ed5c242f_fss_1681757187_muton_1681757187
 *
 */
export function generateNewTriciId(uuid: string, type: string) {
  let createdAt = Date.now();
  let triciId = `${uuid}_${type}_${createdAt}_muton_${createdAt}`;
  return triciId;
}

/**
 * Generaet an uninitalized trici id for the given type
 * @description An unitialized trici id contains the keypart as well as the uninitialized part. By doing this we
 * know that this uninitialized trici id is of which type and for which keypart.
 * @param type The type of the trici id
 * @returns an uninitialized trici id like u22d860cd-07e1-4d7f-bd9a-ca5ed5c242f_fss_1681757187_muton_-1
 */
export function generateUninitializedTriciId(installationId: string, type: string) {
  let triciId = `${installationId}_${type}_${Date.now}_muton_-1`;
  return triciId;
}

/**
 *  Generate an updated trici id for the given trici id
 * @description A trici is is a string of the form uuid_type_createdAtDate_muton_mutatedAtDate
 * @param triciId The trici id to be updated
 * @returns an updated trici id like 22d860cd-07e1-4d7f-bd9a-ca5ed5c242f_fss_1681757187_muton_1681757187
 */
export function generateUpdatedTriciId(triciId: string) {
  if (!isValidTriciId(triciId)) {
    throw new Error('Invalid trici id');
  }
  let mutatedAt = Date.now();
  let triciIdParts = triciId.split('_');
  triciIdParts[triciIdParts.length - 1] = mutatedAt.toString();
  let updatedTriciId = triciIdParts.join('_');
  return updatedTriciId;
}

/**
 * Tests the given id for the Trici ID format
 * @param id
 * @returns boolean
 */
function isValidTriciId(id: string) {
  let regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_[a-z]+_\d+_muton_(-1|\d+)$/;
  return regex.test(id);
}

/**
 * Check whether the given trici id is valid for today. A trici id is valid for today if the createdAt date is today
 * @param triciId The trici id to be checked
 * @returns true if the trici id is valid for today, false otherwise
 */
export function isTriciIdValidForToday(triciId: string) {
  let triciIdParts = triciId.split('_');
  let createdAt = parseInt(triciIdParts[2]);
  console.log(`createdAt: ${createdAt}`);
  let createdAtDate = new Date(createdAt);
  console.log(`createdAtDate: ${createdAtDate}`);
  let today = new Date();
  console.log(`today: ${today}`);
  if (
    createdAtDate.getDate() === today.getDate() &&
    createdAtDate.getMonth() === today.getMonth() &&
    createdAtDate.getFullYear() === today.getFullYear()
  ) {
    return true;
  } else {
    return false;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
