<template>
    <ion-item v-if="editable || review.productTitle">
      <ion-input
        label="Product Title"
        :placeholder="productTitlePlaceholder"
        :readonly="!editable"
        :model-value="review.productTitle"
        @ion-input="updateText('productTitle', $event)"
      />
    </ion-item>
    <ion-item v-if="editable || review.rating">
      <star-rating
        :rating="review.rating"
        :read-only="!editable"
        :increment="0.5"
        :max-rating="5"
        :show-rating="false"
        @update:rating="updateRating"
      />
    </ion-item>
    <ion-item v-if="editable || review.kj100g">
      <ion-input
        label="Energy (kJ/100g)"
        type="number"
        :readonly="!editable"
        :model-value="review.kj100g"
        @ion-input="updateEnergy"
      />
    </ion-item>
    <ion-item v-if="editable || review.reviewText">
      <ion-textarea
        auto-grow
        label="Review"
        placeholder="Give me some thoughts..."
        :readonly="!editable"
        :model-value="review.reviewText"
        @ion-input="updateText('reviewText', $event)"
      />
    </ion-item>
    <ion-item v-if="domains.length > 0 && editable">
      <ion-label>Domain</ion-label>
      <ion-select :value="review.domain" interface="popover" @ion-change="updateDomain">
        <ion-select-option v-for="domain in domains" :key="domain" :value="domain">
          {{ domain }}
        </ion-select-option>
      </ion-select>
    </ion-item>
    <ion-item v-if="editable || imageSrc" class="review-image-item">
      <ion-label position="stacked">Image</ion-label>
      <div class="review-image-preview">
        <ion-img v-if="imageSrc" :src="imageSrc" />
        <span v-else>No image</span>
      </div>
    </ion-item>
    <ion-item v-if="editable && imageActionLabel" lines="none">
      <ion-button fill="outline" @click="$emit('image-action')">
        {{ imageActionLabel }}
      </ion-button>
    </ion-item>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from '@ionic/vue';
import type { Review } from '@/types';
// @ts-ignore
import StarRating from 'vue-star-rating';

const props = withDefaults(defineProps<{
  review: Review;
  editable: boolean;
  imageSrc: string;
  domains?: string[];
  imageActionLabel?: string;
  productTitlePlaceholder?: string;
}>(), {
  domains: () => [],
  imageActionLabel: '',
  productTitlePlaceholder: '',
});

const emit = defineEmits<{
  'update:review': [review: Review];
  'image-action': [];
}>();

function updateField<Key extends keyof Review>(key: Key, value: Review[Key]) {
  emit('update:review', { ...props.review, [key]: value });
}

function updateText(key: 'productTitle' | 'reviewText', event: CustomEvent<{ value?: string | null }>) {
  updateField(key, event.detail.value ?? '');
}

function updateEnergy(event: CustomEvent<{ value?: string | null }>) {
  updateField('kj100g', Number(event.detail.value) || 0);
}

function updateRating(rating: number) {
  updateField('rating', rating);
}

function updateDomain(event: CustomEvent<{ value?: string }>) {
  updateField('domain', event.detail.value ?? '');
}
</script>

<style scoped>
.review-image-item {
  --inner-padding-top: 8px;
  --inner-padding-bottom: 8px;
}

.review-image-preview {
  display: grid;
  width: 100%;
  max-width: 300px;
  min-height: 48px;
  margin: 8px auto;
  place-items: center;
}

.review-image-preview ion-img {
  width: 100%;
}
</style>