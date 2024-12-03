import { isUserWorking } from '../src/urlUtils';

describe('urlUtils', () => {
  describe('isUserWorking', () => {
    test('should return true for work-related URLs', () => {
      const workUrls = [
        'https://github.com/user/repo',
        'https://stackoverflow.com/questions/12345',
        'https://www.python.org/docs',
        'https://nodejs.org/en/docs',
        'https://dev.to/article',
        'https://www.mongodb.com/cloud',
        'https://kubernetes.io/docs',
      ];

      workUrls.forEach(url => {
        expect(isUserWorking(url)).toBe(true);
      });
    });

    test('should return false for non-work-related URLs', () => {
      const nonWorkUrls = [
        'https://facebook.com',
        'https://youtube.com',
        'https://netflix.com',
        'https://instagram.com',
        'https://example.com',
      ];

      nonWorkUrls.forEach(url => {
        expect(isUserWorking(url)).toBe(false);
      });
    });

    test('should return true for URLs containing work patterns as subdomains', () => {
      const subdomainUrls = [
        'https://docs.github.com/en/actions',
        'https://cloud.mongodb.com/dashboard',
        'https://learn.microsoft.com/en-us/docs',
      ];

      subdomainUrls.forEach(url => {
        const result = isUserWorking(url);
        console.log('url:', url);
        console.log('result:', result);
        expect(isUserWorking(url)).toBe(true);
      });
    });

    test('should return true for URLs containing work patterns in paths', () => {
      const pathUrls = [
        'https://somesite.com/python.org/tutorial',
        'https://example.com/redirect/github.com',
      ];

      pathUrls.forEach(url => {
        expect(isUserWorking(url)).toBe(true);
      });
    });

    test('should handle empty URLs', () => {
      expect(isUserWorking('')).toBe(false);
    });

    test('should handle undefined URLs', () => {
      expect(isUserWorking(undefined as unknown as string)).toBe(false);
    });
  });
});
