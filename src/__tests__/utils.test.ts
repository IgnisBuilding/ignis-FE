import { describe, it, expect } from 'vitest';
import { cn, formatDate, truncateText, debounce } from '@/lib/utils';

describe('Utils', () => {
  describe('cn (classNames utility)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'active', false && 'inactive');
      expect(result).toContain('base');
      expect(result).toContain('active');
      expect(result).not.toContain('inactive');
    });

    it('should handle undefined and null', () => {
      const result = cn('class1', undefined, null, 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/Jan|January/);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/2024/);
    });

    it('should handle string dates', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toBeTruthy();
    });

    it('should handle invalid dates', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      expect(result.length).toBeLessThanOrEqual(23); // 20 + '...'
      expect(result).toContain('...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe(text);
      expect(result).not.toContain('...');
    });

    it('should handle empty string', () => {
      const result = truncateText('', 20);
      expect(result).toBe('');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const fn = () => callCount++;
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(callCount).toBe(0);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(callCount).toBe(1);
    });

    it('should pass arguments to debounced function', async () => {
      let capturedArgs: any[] = [];
      const fn = (...args: any[]) => {
        capturedArgs = args;
      };
      const debouncedFn = debounce(fn, 100);

      debouncedFn('arg1', 'arg2');

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(capturedArgs).toEqual(['arg1', 'arg2']);
    });
  });
});
