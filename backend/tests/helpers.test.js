const {
  formatDate,
  generateDateRange,
  doDateRangesOverlap,
  generateOTP,
  generateTransactionId,
  cleanObject,
  paginate
} = require('../src/utils/helpers');

describe('Helper Utilities - Deep Testing', () => {
  
  describe('formatDate', () => {
    it('should format YYYY-MM-DD correctly', () => {
      expect(formatDate('2023-12-25')).toBe('December 25, 2023');
    });

    it('should handle different date strings', () => {
      expect(formatDate('2023/12/25')).toBe('December 25, 2023');
    });

    it('should handle ISO strings', () => {
      expect(formatDate('2023-12-25T10:00:00Z')).toBe('December 25, 2023');
    });

    it('should handle leap years correctly', () => {
      expect(formatDate('2024-02-29')).toBe('February 29, 2024');
    });
    
    it('should handle single digit days', () => {
      expect(formatDate('2023-01-05')).toBe('January 5, 2023');
    });

    it('should handle month transitions', () => {
      expect(formatDate('2023-01-31')).toBe('January 31, 2023');
    });
  });

  describe('generateDateRange', () => {
    it('should generate a correct range for a week', () => {
      const range = generateDateRange('2023-01-01', '2023-01-07');
      expect(range).toHaveLength(7);
      expect(range[0]).toBe('2023-01-01');
      expect(range[6]).toBe('2023-01-07');
    });

    it('should handle range crossing month boundary', () => {
      const range = generateDateRange('2023-01-30', '2023-02-02');
      expect(range).toEqual(['2023-01-30', '2023-01-31', '2023-02-01', '2023-02-02']);
    });

    it('should handle range crossing year boundary', () => {
      const range = generateDateRange('2023-12-31', '2024-01-01');
      expect(range).toEqual(['2023-12-31', '2024-01-01']);
    });

    it('should return empty array if end is before start', () => {
      const range = generateDateRange('2023-01-10', '2023-01-01');
      expect(range).toEqual([]);
    });

    it('should handle leap day in range', () => {
      const range = generateDateRange('2024-02-28', '2024-03-01');
      expect(range).toContain('2024-02-29');
    });
  });

  describe('doDateRangesOverlap', () => {
    it('should detect overlap when one range is inside another', () => {
      expect(doDateRangesOverlap('2023-01-01', '2023-01-31', '2023-01-10', '2023-01-20')).toBe(true);
    });

    it('should detect overlap when start dates match', () => {
      expect(doDateRangesOverlap('2023-01-01', '2023-01-10', '2023-01-01', '2023-01-05')).toBe(true);
    });

    it('should detect overlap when end dates match', () => {
      expect(doDateRangesOverlap('2023-01-01', '2023-01-10', '2023-01-05', '2023-01-10')).toBe(true);
    });

    it('should return false for ranges separated by one day', () => {
      expect(doDateRangesOverlap('2023-01-01', '2023-01-05', '2023-01-06', '2023-01-10')).toBe(false);
    });

    it('should handle multiple overlaps - 1', () => expect(doDateRangesOverlap('2023-01-01', '2023-01-10', '2023-01-02', '2023-01-03')).toBe(true));
    it('should handle multiple overlaps - 2', () => expect(doDateRangesOverlap('2023-01-01', '2023-01-10', '2023-01-09', '2023-01-11')).toBe(true));
    it('should handle multiple overlaps - 3', () => expect(doDateRangesOverlap('2023-01-05', '2023-01-15', '2023-01-01', '2023-01-06')).toBe(true));
  });

  describe('generateOTP', () => {
    it('should generate different OTPs each time', () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      expect(otp1).not.toBe(otp2);
    });

    it('should only contain digits', () => {
      const otp = generateOTP();
      expect(/^[0-9]+$/.test(otp)).toBe(true);
    });
  });

  describe('generateTransactionId', () => {
    it('should start with TXN', () => {
      expect(generateTransactionId()).toMatch(/^TXN/);
    });

    it('should be unique', () => {
      const id1 = generateTransactionId();
      const id2 = generateTransactionId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('cleanObject', () => {
    it('should handle empty objects', () => {
      expect(cleanObject({})).toEqual({});
    });

    it('should handle objects with only null/undefined', () => {
      expect(cleanObject({ a: null, b: undefined })).toEqual({});
    });

    it('should preserve boolean values', () => {
      expect(cleanObject({ active: true, closed: false })).toEqual({ active: true, closed: false });
    });

    it('should handle nested objects (shallow clean)', () => {
      const obj = { a: 1, b: { c: null } };
      expect(cleanObject(obj)).toEqual({ a: 1, b: { c: null } });
    });
  });

  describe('paginate', () => {
    const data = Array.from({ length: 50 }, (_, i) => i + 1);
    
    it('should return correct limit of items', () => {
      const result = paginate(data, 1, 5);
      expect(result.data).toHaveLength(5);
    });

    it('should return correct metadata for last page', () => {
      const result = paginate(data, 10, 5);
      expect(result.pagination.page).toBe(10);
      expect(result.data[4]).toBe(50);
    });

    it('should handle out of bounds page', () => {
      const result = paginate(data, 11, 5);
      expect(result.data).toHaveLength(0);
    });

    it('should handle small arrays', () => {
      const result = paginate([1], 1, 10);
      expect(result.data).toEqual([1]);
      expect(result.pagination.pages).toBe(1);
    });
  });
});

