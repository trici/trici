import si from 'systeminformation';
import crypto from 'crypto';

export async function generateSystemFingerprint() {
  try {
    const systemData = await Promise.all([
      si.system(),
      si.bios(),
      si.baseboard(),
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.blockDevices(),
    ]);

    const [
      { manufacturer, model, serial, uuid },
      { vendor, version: biosVersion, releaseDate },
      { manufacturer: boardManufacturer, model: boardModel, serial: boardSerial },
      { manufacturer: cpuManufacturer, brand, speedMax, cores, physicalCores, socket },
      { total: memTotal },
      { platform, arch },
      devices,
    ] = systemData;

    const hdds = devices
      .filter(({ type, removable }) => type === 'disk' && !removable)
      .map(({ model, serial }) => model + serial)
      .join('');

    const fingerprintString = [
      manufacturer,
      model,
      serial,
      uuid,
      vendor,
      biosVersion,
      releaseDate,
      boardManufacturer,
      boardModel,
      boardSerial,
      cpuManufacturer,
      brand,
      speedMax.toFixed(2),
      cores,
      physicalCores,
      socket,
      memTotal,
      platform,
      arch,
      hdds,
    ].join('');

    const hash = crypto.createHash('sha512');
    hash.update(fingerprintString);
    return hash.digest('hex');
  } catch (error) {
    console.error('Error generating system fingerprint:', error);
    return null;
  }
}
