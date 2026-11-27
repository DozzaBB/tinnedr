<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tab 3</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tab 3</ion-title>
        </ion-toolbar>
      </ion-header>
      <div class="backup-actions">
        <ion-button @click="createBackup" :disabled="busy">Export backup</ion-button>
        <ion-button @click="restoreBackup" :disabled="busy">Import backup</ion-button>
        <p v-if="status" class="status">{{ status }}</p>
      </div>

      <ion-list>
        <ion-list-header>
          <ion-label>Domains</ion-label>
        </ion-list-header>
        <ion-item v-for="domain in domainStore.domains" :key="domain">
          <ion-label>{{ domain }}</ion-label>
          <ion-button slot="end" color="danger" @click="domainStore.removeDomain(domain)">Remove</ion-button>
        </ion-item>
      </ion-list>
      <ion-item>
        <ion-input v-model="domainInput" label="New domain" @keyup.enter="addDomain()" />
        <ion-button slot="end" @click="addDomain()" :disabled="!domainInput.trim()">Add</ion-button>
      </ion-item>
      <div v-if="suggestedDomains.length" class="domain-suggestions">
        <ion-label>Found in reviews</ion-label>
        <ion-button
          v-for="domain in suggestedDomains"
          :key="domain"
          fill="outline"
          @click="addDomain(domain)"
        >
          Add {{ domain }}
        </ion-button>
      </div>

      <ion-button @click="removeReviews" :disabled="busy">WIPE EVERYTHING</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonList, IonListHeader } from '@ionic/vue';
import db from '@/simpleORM';
import { removePhotos } from '@/utils/usePhotoGallery';
import { computed, ref, onMounted } from 'vue';
import { exportBackup, pickAndImportBackup } from '@/utils/backup';
import { useDomain } from '@/utils/store';

const busy = ref(false);
const status = ref('');
const domainInput = ref('');
const domainStore = useDomain();
const reviewDomains = ref<string[]>([]);
const suggestedDomains = computed(() => reviewDomains.value.filter(
  (domain) => !domainStore.domains.some((saved) => saved.toLocaleLowerCase() === domain.toLocaleLowerCase()),
));

onMounted(async () => {
  await domainStore.loadDomain();
  const reviews = await db.getCollection('reviews');
  reviewDomains.value = [...new Set(
    (Array.isArray(reviews) ? reviews : [])
      .map((review: { domain?: string }) => review.domain?.trim())
      .filter((domain: string | undefined): domain is string => Boolean(domain)),
  )];
});

async function addDomain(value = domainInput.value) {
  await domainStore.addDomain(value);
  if (value === domainInput.value) domainInput.value = '';
}

async function removeReviews() {
  await db.removeCollection('reviews');
  // delete all photo files.
  await removePhotos();
}

async function createBackup() {
  busy.value = true;
  status.value = 'Creating backup...';
  try {
    await exportBackup();
    status.value = 'Backup created.';
  } catch (error: any) {
    status.value = `Backup failed: ${error?.message ?? error}`;
  } finally {
    busy.value = false;
  }
}

async function restoreBackup() {
  busy.value = true;
  status.value = 'Selecting backup...';
  try {
    await pickAndImportBackup();
    status.value = 'Backup restored.';
  } catch (error: any) {
    status.value = `Restore failed: ${error?.message ?? error}`;
  } finally {
    busy.value = false;
  }
}
</script>
