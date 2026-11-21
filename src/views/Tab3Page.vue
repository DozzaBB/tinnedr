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

      <ion-button @click="removeReviews" :disabled="busy">WIPE EVERYTHING</ion-button>

      <!-- <pre>
        {{ wholeDB }}
      </pre> -->
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue';
import db from '@/simpleORM';
import { removePhotos } from '@/utils/usePhotoGallery';
import { ref, onMounted } from 'vue';
import { exportBackup, pickAndImportBackup } from '@/utils/backup';

const wholeDB = ref<any>(null);
const busy = ref(false);
const status = ref('');

onMounted(async () => {
  wholeDB.value = await db.getCollection('reviews');
});

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
