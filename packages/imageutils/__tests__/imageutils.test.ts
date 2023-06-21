
import { compareImages } from '../dist/index.js';
import * as path from 'path';


describe('compareImages', () => {
  it('should correctly compare two identical images', async () => {

    const image1 = path.join(__dirname, 'sampledata', 'regular_output_1684027761000.png');
    const image2 = path.join(__dirname, 'sampledata', 'regular_output_1684027764000.png');
    const distance = await compareImages(image1, image2);
    console.log('distance:', distance)
    expect(distance).toBeLessThan(5);

    // Check console log message or modify compareImages to return a value for better testing
  });

  it('should correctly compare two different images', async () => {
    const image1 = path.join(__dirname, 'sampledata', 'regular_output_1684027761000.png');
    const image2 =  path.join(__dirname, 'sampledata', 'regular_output_1684027800000.png');
    const distance = await compareImages(image1, image2);
    console.log('distance:', distance);
    expect(distance).toBeGreaterThan(5);
    // Check console log message or modify compareImages to return a value for better testing
  });
});
