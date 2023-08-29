/**
 * @description Keeping imageUtils separate so that sharp is not added to bundles where it is not used.
 * (That is the intention, not sure it works that way)
 */
import sharp  from "sharp";

async function getPhash(imagePath: string) {
  const image = sharp(imagePath);
  const { format } = await image.metadata();
  if (format !== 'jpeg' && format !== 'png' && format !== 'webp' && format !== 'tiff') {
    throw new Error('Unsupported format');
  }

  return await image
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer()
    .then((data) => {
      let hash = '';
      for (let i = 0; i < data.length; i++) {
        hash += data[i] > 127 ? '1' : '0';
      }
      return hash;
    });
}

/**
 * Compare two images for similarity
 */
export async function compareImages(image1: string, image2: string): Promise<number> {
  const hash1 = await getPhash(image1);
  const hash2 = await getPhash(image2);

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }

  console.log(`The images are ${distance} bits different`);
  return distance;
}
