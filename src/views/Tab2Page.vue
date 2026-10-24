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
    <ion-item>
      <ion-input type="text" label="Product Title" placeholder="Tinned Fish" v-model="reviewProductTitle"></ion-input>
    </ion-item>
    <ion-item>
      <!-- <ion-range :max='5' :min='0' :step="0.5" v-model="reviewRating" label-placement="start" label="Rating"></ion-range> -->
      <!-- {{ reviewRating }} <input type="range" max="5" min="0" step="0.5" v-model="reviewRating"> -->
        <star-rating :increment="0.5" :max-rating="5" v-model:rating="reviewRating" :show-rating="false"></star-rating>
    </ion-item>
    <ion-item>
      <ion-input label="Energy (kJ/100g)" type="number" v-model="kj"></ion-input>
    </ion-item>
    <ion-item>
      <ion-textarea auto-grow label="Review" placeholder="Give me some thoughts..." v-model="reviewText"></ion-textarea>
    </ion-item>
  
    <ion-item><ion-label>Image</ion-label>
      <div style="max-width: 300px">
        <ion-img style="width: 100%":src="previewImageSrc"></ion-img>
      </div>
      </ion-item>
        <ion-button @click="takePicture">Take Photo</ion-button>
        <ion-button @click="nameFromBarcode()">Proc Name API</ion-button>
  </ion-list>
  <!-- <pre>
Debug
Barcode: {{ reviewBarcode }}
Product Title: {{ reviewProductTitle }}
Rating: {{ reviewRating }}
Review: {{ reviewText }}
previewImageSrc: {{ previewImageSrc }}
previewImage: {{ previewImage }}
  </pre> -->
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonSpinner, IonPage,IonHeader, IonToolbar, IonTitle,
  IonContent, IonInput, IonList, IonItem, IonLabel,
  IonButton, IonImg, IonRow, IonCol, IonGrid, IonTextarea
} from '@ionic/vue';
import { ref } from 'vue';
import { Toast } from '@capacitor/toast';
import { Review } from '@/types';
import { Camera, MediaResult } from '@capacitor/camera';
import db from '@/simpleORM';
import { savePicture } from '@/utils/usePhotoGallery';
import router from '@/router';
// @ts-ignore
import StarRating from 'vue-star-rating';
import { useDomain } from '@/utils/store';

const reviewRating = ref<number>(0);
const reviewProductTitle = ref<string>('');
const reviewText = ref<string>('');
const reviewBarcode = ref<string>('');
const previewImageSrc = ref<string>('');
const previewImage = ref<MediaResult>();
const loading = ref(false);
const kj = ref<number>(0);
const domainStore = useDomain();

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
      reviewProductTitle.value = r.data?.product?.product_name + " - " + r.data?.product?.brands;
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
    barcode: reviewBarcode.value,
    productTitle: reviewProductTitle.value ?? '',
    reviewText: reviewText.value ?? '',
    rating: reviewRating.value ?? 0,
    imgFilepath: savedPic?.filepath,
    imgWebviewPath: savedPic?.webviewPath,
    domain: domainStore.domain,
    kj100g: kj.value ?? 0
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
