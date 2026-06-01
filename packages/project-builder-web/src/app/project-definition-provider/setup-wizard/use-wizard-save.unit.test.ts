import { describe, expect, it } from 'vitest';

import { buildInitialApps } from './use-wizard-save.js';

describe('buildInitialApps', () => {
  describe('backend app', () => {
    it('assigns portOffset + 1 as devPort', () => {
      const apps = buildInitialApps(
        { backend: true, web: false, admin: false },
        3000,
      );
      const backend = apps.find((a) => a.name === 'backend');
      expect(backend?.devPort).toBe(3001);
    });

    it('sets type to backend', () => {
      const apps = buildInitialApps(
        { backend: true, web: false, admin: false },
        3000,
      );
      expect(apps.find((a) => a.name === 'backend')?.type).toBe('backend');
    });

    it('omits backend app when disabled', () => {
      const apps = buildInitialApps(
        { backend: false, web: true, admin: false },
        3000,
      );
      expect(apps.find((a) => a.name === 'backend')).toBeUndefined();
    });
  });

  describe('web app', () => {
    it('assigns portOffset + 30 as devPort when only web is enabled', () => {
      const apps = buildInitialApps(
        { backend: false, web: true, admin: false },
        3000,
      );
      expect(apps.find((a) => a.name === 'web')?.devPort).toBe(3030);
    });

    it('sets adminApp.enabled to false', () => {
      const apps = buildInitialApps(
        { backend: false, web: true, admin: false },
        3000,
      );
      const web = apps.find((a) => a.name === 'web');
      expect(web?.type).toBe('web');
      expect(web?.type === 'web' && web.adminApp.enabled).toBe(false);
    });
  });

  describe('admin app', () => {
    it('assigns portOffset + 30 as devPort when only admin is enabled', () => {
      const apps = buildInitialApps(
        { backend: false, web: false, admin: true },
        3000,
      );
      expect(apps.find((a) => a.name === 'admin')?.devPort).toBe(3030);
    });

    it('sets adminApp.enabled to true', () => {
      const apps = buildInitialApps(
        { backend: false, web: false, admin: true },
        3000,
      );
      const admin = apps.find((a) => a.name === 'admin');
      expect(admin?.type).toBe('web');
      expect(admin?.type === 'web' && admin.adminApp.enabled).toBe(true);
    });
  });

  describe('web + admin alphabetical port assignment', () => {
    it('assigns admin portOffset + 30 and web portOffset + 31 (a < w)', () => {
      const apps = buildInitialApps(
        { backend: false, web: true, admin: true },
        3000,
      );
      expect(apps.find((a) => a.name === 'admin')?.devPort).toBe(3030);
      expect(apps.find((a) => a.name === 'web')?.devPort).toBe(3031);
    });
  });

  describe('all apps enabled', () => {
    it('returns backend, web, and admin with correct ports', () => {
      const apps = buildInitialApps(
        { backend: true, web: true, admin: true },
        3000,
      );
      expect(apps).toHaveLength(3);
      expect(apps.find((a) => a.name === 'backend')?.devPort).toBe(3001);
      expect(apps.find((a) => a.name === 'admin')?.devPort).toBe(3030);
      expect(apps.find((a) => a.name === 'web')?.devPort).toBe(3031);
    });

    it('returns apps sorted by name', () => {
      const apps = buildInitialApps(
        { backend: true, web: true, admin: true },
        3000,
      );
      const names = apps.map((a) => a.name);
      expect(names).toEqual([...names].toSorted());
    });
  });

  describe('portOffset', () => {
    it('respects a non-default portOffset', () => {
      const apps = buildInitialApps(
        { backend: true, web: true, admin: false },
        4000,
      );
      expect(apps.find((a) => a.name === 'backend')?.devPort).toBe(4001);
      expect(apps.find((a) => a.name === 'web')?.devPort).toBe(4030);
    });
  });

  describe('empty selection', () => {
    it('returns an empty array when nothing is enabled', () => {
      const apps = buildInitialApps(
        { backend: false, web: false, admin: false },
        3000,
      );
      expect(apps).toHaveLength(0);
    });
  });
});
