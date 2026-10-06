import { describe, it, expect, vi } from 'vitest';

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock as any;

import { useDispatchStore } from '../DispatchBoard';


describe('Dispatch Store', () => {
  it('initializes with default state', () => {
    const state = useDispatchStore.getState();
    expect(state.selectedDate).toBeDefined();
    expect(state.activeBooking).toBeNull();
    expect(state.crewLocations).toEqual({});
  });
});
