<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Home</ion-title>
        <ion-buttons slot="end">
          <ion-button
            @click="gridView = !gridView"
            :aria-label="gridView ? 'Switch to list view' : 'Switch to grid view'"
            :color="gridView ? 'primary' : undefined"
          >
            <ion-icon :icon="gridOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tab 1</ion-title>
          blah
        </ion-toolbar>
      </ion-header>
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
      <ion-refresher-content />
    </ion-refresher>
    <ion-item>
      <ion-label>Domain</ion-label>
      <ion-select
        :value="showAllDomains ? ALL_DOMAINS : domainStore.domain"
        interface="popover"
        @ionChange="handleDomainChange($event.detail.value)"
      >
      <ion-select-option :value="ALL_DOMAINS">All domains</ion-select-option>
      <ion-select-option v-for="domain in domainStore.domains" :key="domain" :value="domain">{{ domain }}</ion-select-option>
      </ion-select>
    </ion-item>
    <ion-item>
      <ion-input @ion-input="executeFilter" label="Filter" v-model="tableFilterTerm" />
      <ion-button @click="scan">𝄃𝄃𝄄𝄂𝄀𝄁𝄃𝄂𝄂𝄃</ion-button>
    </ion-item>

    <ion-toolbar v-if="gridView" class="grid-sort-toolbar">
      <ion-segment
        :value="gridSort"
        @ionChange="gridSort = $event.detail.value as 'database' | 'rating' | 'kj'; executeFilter()"
      >
        <ion-segment-button value="database">
          <ion-label>Database order</ion-label>
        </ion-segment-button>
        <ion-segment-button value="rating">
          <ion-label>Rating</ion-label>
        </ion-segment-button>
        <ion-segment-button value="kj">
          <ion-label>kJ/100g</ion-label>
        </ion-segment-button>
      </ion-segment>
    </ion-toolbar>

    <div v-if="gridView" class="review-grid">
      <button
        v-for="review in filteredReviews"
        :key="review.barcode"
        class="review-grid-item"
        type="button"
        @click="setModalContent(review)"
      >
        <img
          v-if="imgSrc[review.barcode]"
          :src="imgSrc[review.barcode]"
          alt=""
        />
        <span v-else class="review-grid-no-image">No image</span>
        <star-rating
          :rating="review.rating"
          star-size="20"
          :read-only="true"
          :increment="0.5"
          :show-rating="false"
        />
        <span v-if="gridSort === 'kj'" class="review-grid-kj">
          {{ Number(review.kj100g) || 0 }} kJ/100g
        </span>
      </button>
    </div>

    <DataTable v-else :value="filteredReviews">
      <Column sortable field="productTitle" header="Product" />
      <!-- <Column field="barcode" header="Barcode"></Column> -->
      <Column sortable field="rating" header="Rating" />
      <Column sortable field="kj100g" header="E" />
      <Column field="imgSrc" header="Image">
        <template #body="slotProps">
          <img v-if="imgSrc[slotProps.data.barcode]" @click="setModalContent(slotProps.data)" :src="imgSrc[slotProps.data.barcode]" style="width: 100px; height: auto;" />
          <span v-else @click="setModalContent(slotProps.data)">No image</span>
        </template>
      </Column>
      <template #empty>
        no reviews to find.
      </template>
    </DataTable>
    <ion-modal ref="details-modal">
      <ion-header>
        <ion-toolbar>
              <ion-input label="Product Title" :readonly="!editing" v-model="selectedReview.productTitle"></ion-input>
            
            <star-rating v-model:rating="selectedReview.rating" :read-only="!editing" :increment="0.5"></star-rating>
    
            <img :src="imgSrc[selectedReview!.barcode]" />
            
            <ion-textarea auto-grow :readonly="!editing" label="Review Text" v-model="selectedReview.reviewText"></ion-textarea>
            <ion-item v-if="editing">
              <ion-label>Domain</ion-label>
              <ion-select
                :value="selectedReview.domain"
                interface="popover"
                @ionChange="selectedReview.domain = $event.detail.value as Domain"
              >
                <ion-select-option v-for="domain in domainStore.domains" :key="domain" :value="domain">{{ domain }}</ion-select-option>
              </ion-select>
            </ion-item>
            <!-- <div v-else>{{ selectedReview!.reviewText }}</div> -->
             <ion-input label="Energy (kJ/100g)" type="number" :readonly="!editing" v-model="selectedReview.kj100g"></ion-input>
              <div>Barcode: {{ selectedReview!.barcode }}
                <ion-spinner v-if="loading"></ion-spinner>
                <ion-button v-if="editing" @click="nameFromBarcode">Get Product Info</ion-button><ion-button @click="openBarcode">↗️🔗</ion-button>
              </div>
              
    
            <IonButton @click="presentDelete" color="danger" >Delete</IonButton>
            <ion-button @click="editing = !editing">{{ editing ? "Cancel" : '' }} Edit</ion-button>
            <ion-button v-if="editing" @click="saveEdit">Save</ion-button>
        </ion-toolbar>
      </ion-header>
    </ion-modal>
    <ion-alert
      ref="delete-alert"
      header="Confirm Deletion"
      message="Are you sure you want to delete this review?"
      :buttons="[
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            // Implement deletion logic here

            console.log('Review deleted');
            // @ts-ignore
            console.log(selectedReview.barcode);
            // @ts-ignore
            detailsModal.$el.dismiss();
            deleteSelectedReview();

          },
        },
      ]" />
    <!-- <ion-modal ref="modal" trigger="open-modal">
      Details
      </ion-modal>  -->
      <div v-if="reviews.length === 0"
      >no reviews to find.</div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton, IonPage,
  IonHeader, IonToolbar,
  IonTitle, IonContent,
  IonRefresher, IonRefresherContent, 
  RefresherCustomEvent, IonModal, 
  IonAlert, IonInput,
  IonSpinner, IonItem,
  IonTextarea,
  IonLabel, IonSelect, IonSelectOption, IonButtons, IonIcon,
  IonSegment, IonSegmentButton,
} from '@ionic/vue';
import db from '@/simpleORM';
import { ref, onMounted, onActivated, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Domain, Review } from '@/types';
import { loadPicture } from '@/utils/usePhotoGallery';
// @ts-ignore
import StarRating from 'vue-star-rating';
import { Column, DataTable } from 'primevue';
import { OpenFoodFacts } from "@openfoodfacts/openfoodfacts-nodejs";
import { Toast } from '@capacitor/toast';
import { scanBC } from '../utils/barcode';
import { Browser } from '@capacitor/browser';
import { useDomain } from '@/utils/store';
import { gridOutline } from 'ionicons/icons';

const domainStore = useDomain();
const route = useRoute();
const ALL_DOMAINS = '__all_domains__';
const showAllDomains = ref(false);

async function handleDomainChange(nextDomain: string) {
  if (nextDomain === ALL_DOMAINS) {
    showAllDomains.value = true;
    executeFilter();
    return;
  }
  showAllDomains.value = false;
  await domainStore.setDomain(nextDomain);
  await getReviews();
}

watch(
  () => domainStore.domain,
  async () => {
    await getReviews();
  },
  { flush: 'post' }
);

watch(
  () => route.fullPath,
  async (newPath) => {
    if (newPath.startsWith('/tabs/tab1')) {
      await getReviews();
    }
  },
  { flush: 'post' }
);

function openBarcode() {
  Browser.open({ url: `https://world.openfoodfacts.org/product/${selectedReview.value.barcode}` });

  // https://world.openfoodfacts.org/product/
}

onMounted(() => {
  getReviews();
});

onActivated(() => {
  getReviews();
});


const foodClient = new OpenFoodFacts(fetch);

const detailsModal = useTemplateRef('details-modal')
const deleteAlert = useTemplateRef('delete-alert');

const imgSrc = ref<Record<string, string>>({});
let reviews: Review[] = [];
const loading = ref(false);
const editing = ref(false);
const tableFilterTerm = ref<string>('');
const gridView = ref(false);
const gridSort = ref<'database' | 'rating' | 'kj'>('database');
const filteredReviews = ref<Review[]>([]);
const selectedReview = ref<Review>({
  barcode: '',
  productTitle: '',
  domain: domainStore.domain,
  reviewText: '',
  rating: 0,
  imgFilepath: '',
imgWebviewPath: '',
kj100g: 0,
});
function setModalContent(review: Review) {
  selectedReview.value = review;
  // @ts-ignore
  detailsModal.value.$el.present();
}

const nameFromBarcode = async () => {
  loading.value = true;
  foodClient.getProductV3(selectedReview.value.barcode).then((r: any) => {
    console.log(r);
    if (r.data?.product?.product_name) {
      selectedReview.value.productTitle = r.data?.product?.product_name + " - " + r.data?.product?.brands;
      imgSrc.value[selectedReview.value.barcode] = r.data?.product?.image_url;
    } else {
      Toast.show({
      text: 'Failed to get product information.'
    });
    }
  }).finally(() => {
    loading.value = false;
  });
};

function handleRefresh(event: RefresherCustomEvent) {

  getReviews().then(() => {
    event.detail.complete();}
  );
}

async function getReviews() {
  const result = await db.getCollection('reviews');
  console.log(result);
  reviews = result;
  for (const review of reviews) {
    imgSrc.value[review.barcode] = await loadPicture(review);
    review.domain ??= '';
  }
  executeFilter();
}

function presentDelete() {
  // @ts-ignore
  deleteAlert.value.$el.present();
}

async function deleteSelectedReview() {
  await db.removeById('reviews',selectedReview.value.barcode);
  reviews = reviews.filter ((r) => r.barcode !== selectedReview.value.barcode);
  executeFilter();
}

async function saveEdit() {
  await db.updateById('reviews', selectedReview.value.barcode, selectedReview.value);
  // @ts-expect-error
  detailsModal.value.$el.dismiss();

}

function executeFilter() {
  const query = tableFilterTerm.value.trim().toLowerCase();
  filteredReviews.value = reviews.filter((r) => {
    const matchesDomain = showAllDomains.value || r.domain === domainStore.domain;
    const matchesText = !query || JSON.stringify(r).toLowerCase().includes(query);
    return matchesDomain && matchesText;
  });

  if (gridSort.value === 'rating') {
    filteredReviews.value.sort((a, b) => b.rating - a.rating);
  } else if (gridSort.value === 'kj') {
    filteredReviews.value.sort((a, b) => (Number(b.kj100g) || 0) - (Number(a.kj100g) || 0));
  }
}

function scan() {
  scanBC((r) => {
    tableFilterTerm.value = r;
    executeFilter();
  });
}


</script>

<style>
.review-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 8px;
}

.review-grid-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border: 0;
  border-radius: 8px;
  background: var(--ion-card-background, var(--ion-background-color));
  color: inherit;
}

.review-grid-item img,
.review-grid-no-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 6px;
}

.review-grid-no-image {
  display: grid;
  place-items: center;
  background: var(--ion-color-light);
}

.grid-sort-toolbar {
  --ion-padding-start: 0;
  --ion-padding-end: 0;
  --ion-padding-top: 0;
  --ion-padding-bottom: 0;
  background: transparent;
  border-bottom: 1px solid var(--ion-color-light);
}

.grid-sort-toolbar ion-segment {
  padding: 0;
}

.grid-sort-toolbar ion-segment-button {
  --ion-color-checked: var(--ion-color-primary);
  --ion-color-checked-rgb: var(--ion-color-primary-rgb);
}

.review-grid-kj {
  font-size: 12px;
  line-height: 1.2;
  font-weight: 600;
}
</style>
