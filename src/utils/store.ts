import { defineStore } from 'pinia';
import type { Domain } from '@/types';
import db from '@/simpleORM';

export const useDomain = defineStore('domain', {
  state: (): { domain: Domain; domains: Domain[] } => ({
    domain: '',
    domains: [],
  }),
  actions: {
    async loadDomain() {
      try {
        const savedDomainsExist = await db.hasCollection('domains');
        const savedDomains = await db.getCollection('domains');
        if (savedDomainsExist && Array.isArray(savedDomains)) {
          this.domains = savedDomains;
        } else {
          const reviews = await db.getCollection('reviews');
          this.domains = [...new Set(
            (Array.isArray(reviews) ? reviews : [])
              .map((review: { domain?: string }) => review.domain?.trim())
              .filter((domain: string | undefined): domain is string => Boolean(domain)),
          )];
          await db.saveCollection('domains', this.domains);
        }

        const saved = await db.getCollection('domain');
        const savedDomain = Array.isArray(saved) ? saved[0]?.domain : saved?.domain;
        this.domain = this.domains.includes(savedDomain) ? savedDomain : (this.domains[0] ?? '');
        await db.saveCollection('domain', { domain: this.domain });
      } catch (error) {
        console.error('Failed to load saved domains', error);
      }
    },
    async setDomain(val: Domain) {
      if (!this.domains.includes(val)) return;
      this.domain = val;
      try {
        await db.saveCollection('domain', { domain: val });
      } catch (error) {
        console.error('Failed to save domain', error);
      }
    },
    async addDomain(value: string) {
      const domain = value.trim();
      if (!domain || this.domains.some((existing) => existing.toLocaleLowerCase() === domain.toLocaleLowerCase())) {
        return;
      }
      this.domains.push(domain);
      if (!this.domain) this.domain = domain;
      await db.saveCollection('domains', this.domains);
      await db.saveCollection('domain', { domain: this.domain });
    },
    async removeDomain(domain: string) {
      this.domains = this.domains.filter((existing) => existing !== domain);
      if (this.domain === domain) this.domain = this.domains[0] ?? '';
      await db.saveCollection('domains', this.domains);
      await db.saveCollection('domain', { domain: this.domain });
    },
  },
});