import { defineStore } from 'pinia';
import type { Domain } from '@/types';
import db from '@/simpleORM';

export const useDomain = defineStore('domain', {
  state: (): { domain: Domain } => ({
    domain: 'fish',
  }),
  actions: {
    async loadDomain() {
      try {
        const saved = await db.getCollection('domain');
        const savedDomain = Array.isArray(saved) ? saved[0]?.domain : saved?.domain;

        if (savedDomain === 'fish' || savedDomain === 'hotpot') {
          this.domain = savedDomain;
        }
      } catch (error) {
        console.error('Failed to load saved domain', error);
      }
    },
    async setDomain(val: Domain) {
      this.domain = val;

      try {
        await db.saveCollection('domain', { domain: val });
      } catch (error) {
        console.error('Failed to save domain', error);
      }
    },
  },
});