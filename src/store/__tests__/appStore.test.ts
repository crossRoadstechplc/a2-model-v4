import { useAppStore } from '../appStore';

describe('app store architecture', () => {
  it('mutates assumptions and resets them to base', () => {
    const store = useAppStore.getState();
    const baseValue =
      store.assumptions.baseValues['integrated.global.discount_rate_pct'];

    store.setAssumption('integrated.global.discount_rate_pct', 15);
    expect(
      useAppStore.getState().assumptions.currentValues[
        'integrated.global.discount_rate_pct'
      ],
    ).toBe(15);
    expect(useAppStore.getState().assumptions.changedKeys).toContain(
      'integrated.global.discount_rate_pct',
    );

    useAppStore.getState().resetToBase();

    expect(
      useAppStore.getState().assumptions.currentValues[
        'integrated.global.discount_rate_pct'
      ],
    ).toBe(baseValue);
  });

  it('resets a single group to base', () => {
    useAppStore
      .getState()
      .setAssumption('integrated.platform.take_rate_pct', 22.5);
    useAppStore
      .getState()
      .setAssumption('integrated.global.discount_rate_pct', 17.2);

    useAppStore.getState().resetGroupToBase('platform');

    expect(
      useAppStore.getState().assumptions.currentValues[
        'integrated.platform.take_rate_pct'
      ],
    ).toBe(
      useAppStore.getState().assumptions.baseValues[
        'integrated.platform.take_rate_pct'
      ],
    );
    expect(useAppStore.getState().assumptions.changedKeys).toContain(
      'integrated.global.discount_rate_pct',
    );
  });

  it('supports scenario save, duplicate, load, and dirty tracking', () => {
    useAppStore.getState().setAssumption('integrated.global.discount_rate_pct', 16);

    const savedId = useAppStore.getState().saveScenario('Downside');
    expect(savedId).not.toBeNull();
    expect(useAppStore.getState().scenarios.byId[savedId!].name).toBe('Downside');

    useAppStore.getState().setAssumption('integrated.global.discount_rate_pct', 18);
    expect(useAppStore.getState().scenarios.dirtyIds).toContain(savedId!);

    const duplicateId = useAppStore.getState().duplicateScenario(savedId!);
    expect(duplicateId).not.toBeNull();
    expect(useAppStore.getState().scenarios.byId[duplicateId!].name).toMatch(
      /Copy$/,
    );

    useAppStore
      .getState()
      .setAssumption('integrated.global.discount_rate_pct', 11.5);
    useAppStore.getState().loadScenario(savedId!);

    expect(
      useAppStore.getState().assumptions.currentValues[
        'integrated.global.discount_rate_pct'
      ],
    ).toBe(16);
  });

  it('detects changes from base using stable keys', () => {
    useAppStore
      .getState()
      .setAssumption('a2_fleet.number_of_trucks.cy_2027', 800);

    expect(useAppStore.getState().assumptions.changedKeys).toContain(
      'a2_fleet.number_of_trucks.cy_2027',
    );
  });
});
