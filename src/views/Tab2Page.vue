<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <ion-grid>
            <ion-row class="ion-justify-content-between">
              <ion-col>
                Add Review
              </ion-col>
              <ion-col>
                <ion-button expand="block" @click="submitReview">Submit Review</ion-button>
              </ion-col>
            </ion-row>
          </ion-grid>
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tab 2</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list>
    <ion-item>
      <ion-input label="Barcode" placeholder="manually enter" type="text" v-model="reviewBarcode"></ion-input>
      <ion-spinner v-if="loading"></ion-spinner>
      <span v-else>
        <ion-button @click="scan">Open Scanner</ion-button>
      </span>
    </ion-item>
        <ReviewFields
          v-model:review="reviewDraft"
          :editable="true"
          :image-src="previewImageSrc"
          image-action-label="Take Photo"
          product-title-placeholder="Tinned Fish"
          @image-action="takePicture"
        />
        <ion-item lines="none">
          <ion-button @click="nameFromBarcode">Proc Name API</ion-button>
        </ion-item>
  </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonSpinner, IonPage,IonHeader, IonToolbar, IonTitle,
  IonContent, IonInput, IonList, IonItem,
  IonButton, IonRow, IonCol, IonGrid
} from '@ionic/vue';
import { ref } from 'vue';
import { Toast } from '@capacitor/toast';
import type { Review } from '@/types';
import { Camera, MediaResult } from '@capacitor/camera';
import db from '@/simpleORM';
import { savePicture } from '@/utils/usePhotoGallery';
import router from '@/router';
import ReviewFields from '@/components/ReviewFields.vue';
import { useDomain } from '@/utils/store';

const reviewBarcode = ref<string>('');
const previewImageSrc = ref<string>('');
const previewImage = ref<MediaResult>();
const loading = ref(false);
const domainStore = useDomain();
const reviewDraft = ref<Review>({
  barcode: '',
  productTitle: '',
  reviewText: '',
  rating: 0,
  imgFilepath: '',
  imgWebviewPath: '',
  kj100g: 0,
  domain: domainStore.domain,
});

import { OpenFoodFacts } from "@openfoodfacts/openfoodfacts-nodejs";
const foodClient = new OpenFoodFacts(fetch);

async function takePicture() {
  const image = await Camera.takePhoto({
    quality: 50
  }).catch((e) => {
    Toast.show({
      text: 'Failed to take picture'
    });
  });
  // save the picture once submitted.
  previewImageSrc.value = image?.webPath ?? '';
  // dunno if this ever happens, but it makes the typescript happy.
  if (!image) {
    return;
  }
  previewImage.value = image;
}

const nameFromBarcode = async () => {
  loading.value = true;
  foodClient.getProductV3(reviewBarcode.value).then((r: any) => {
    console.log(r);
    if (r.data?.product?.product_name) {
      reviewDraft.value.productTitle = r.data?.product?.product_name + " - " + r.data?.product?.brands;
      previewImageSrc.value = r.data?.product?.image_url
    } else {
      Toast.show({
        text: 'Product not found, no data in response.'
      });
    }
  }).finally(() => {
    loading.value = false;
  });
};

async function submitReview() {
  if (reviewBarcode.value==='') {
    Toast.show({
      text: 'Need barcode'
    });
    console.error('Need barcode');
    return;
  }
  // post review to Preferences.
  let reviews = await db.getCollection('reviews');
  if (reviews.map((r: Review) => r.barcode).includes(reviewBarcode.value)) {
    Toast.show({
      text: 'You have already reviewed this product'
    });
    console.error('Product already reviewed');
    return;
  }

  reviews ??= [];

 let savedPic: any = {filepath: '', webviewPath: ''};
  if (previewImage.value) {
    savedPic = await savePicture(previewImage.value, new Date().getTime() + '.jpeg').catch((e) => {
      Toast.show({
        text: 'Failed to save picture'
      });
      console.error('Failed to save picture', e);
    });  
} else if (previewImageSrc.value) {
  savedPic = {
    filepath: null,
    webviewPath: previewImageSrc.value
  }
}

  const newReview: Review = {
    ...reviewDraft.value,
    barcode: reviewBarcode.value,
    imgFilepath: savedPic?.filepath,
    imgWebviewPath: savedPic?.webviewPath,
    domain: domainStore.domain,
  }

  reviews.push(newReview);
  await db.saveCollection('reviews', reviews);
  await domainStore.loadDomain();
  Toast.show({
    text: 'Review submitted'
  });
  console.log('Saved review');
  console.log(newReview)
  await router.push({
    path: '/tabs/tab1',
    query: { refresh: Date.now().toString() },
  });
}
// 
import { scanBC } from '../utils/barcode'; 

function scan() {
  scanBC((result) => {
    reviewBarcode.value = result;
    nameFromBarcode();
  })
}


</script>
