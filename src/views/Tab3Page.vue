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
      <button @click="removeReviews">WIPE EVERYTHING</button>

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

const wholeDB = ref<any>(null);

onMounted(async () => {
  wholeDB.value = await db.getCollection('reviews');
});

async function removeReviews() {
  await db.removeCollection('reviews');
  // delete all photo files.
  await removePhotos();
}

</script>
