import { getPagination } from './pagination';

describe('getPagination', () => {
  it('should return skip 0 for the first page', () => {
    expect(
      getPagination(1, 10),
    ).toEqual({
      skip: 0,
      take: 10,
    });
  });

  it('should calculate skip correctly for later pages', () => {
    expect(
      getPagination(3, 10),
    ).toEqual({
      skip: 20,
      take: 10,
    });
  });

  it('should work with different page sizes', () => {
    expect(
      getPagination(4, 20),
    ).toEqual({
      skip: 60,
      take: 20,
    });
  });
});