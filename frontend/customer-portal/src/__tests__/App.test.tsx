import { describe, it, expect } from 'vitest';
import { CLIENT_NAV_FLOW } from '../App';

describe('Customer Portal App', () => {
  it('defines the correct navigation flow', () => {
    expect(CLIENT_NAV_FLOW).toEqual([
      { to: "/pay", label: "Pay" },
      { to: "/documents", label: "Documents" },
      { to: "/planning", label: "Planning" },
    ]);
  });
});
