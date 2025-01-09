import { isUserWorking } from '../src/urlUtils';
import { IsUserWorking } from '@trici/models';

describe('isUserWorking', () => {
  // ... existing test setup code ...

  it('should return YES for known work-related URLs', () => {
    const workUrls = [
      'https://github.com/some-repo',
      'https://stackoverflow.com/questions/12345',
      'https://dev.to/article',
      'https://www.mongodb.com/docs',
    ];

    workUrls.forEach(url => {
      expect(isUserWorking(url)).toBe(IsUserWorking.YES);
    });
  });

  it('should return MAYBE for any search engine URLs', () => {
    const searchUrls = [
      // With search queries
      'https://www.google.com/search?q=typescript+error',
      'https://www.google.co.in/search?q=typescript+error',
      'https://www.bing.com/search?q=react+hooks',
      'https://duckduckgo.com/?q=python+list',
      'https://search.yahoo.com/search?p=javascript',
      'https://www.baidu.com/s?wd=programming',
      // Without search queries
      'https://www.google.com',
      'https://www.bing.com',
      'https://duckduckgo.com',
      'https://yahoo.com',
      'https://baidu.com',
    ];

    searchUrls.forEach(url => {
      console.log('seachEngineUrl:', url);
      expect(isUserWorking(url)).toBe(IsUserWorking.MAYBE);
    });
  });

  it('should return NO for empty or invalid URLs', () => {
    const urls = ['', undefined, null];

    urls.forEach(url => {
      expect(isUserWorking(url as string)).toBe(IsUserWorking.NO);
    });
  });

  it('should return NO for non-work related URLs', () => {
    const urls = ['https://facebook.com', 'https://instagram.com', 'https://netflix.com'];

    urls.forEach(url => {
      expect(isUserWorking(url)).toBe(IsUserWorking.NO);
    });
  });
});
