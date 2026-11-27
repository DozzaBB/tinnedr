<template>
  <div v-if="gridView" class="review-grid">
    <button
      v-for="review in reviews"
      :key="review.barcode"
      class="review-grid-item"
      type="button"
      @click="emit('select', review)"
    >
      <img v-if="imageSources[review.barcode]" :src="imageSources[review.barcode]" alt="" />
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

  <DataTable v-else :value="reviews">
    <Column sortable field="productTitle" header="Product" />
    <!-- <Column field="barcode" header="Barcode"></Column> -->
    <Column sortable field="rating" header="Rating" />
    <Column sortable field="kj100g" header="E" />
    <Column field="imgSrc" header="Image">
      <template #body="slotProps">
        <img
          v-if="imageSources[slotProps.data.barcode]"
          @click="emit('select', slotProps.data)"
          :src="imageSources[slotProps.data.barcode]"
          style="width: 100px; height: auto;"
        />
        <span v-else @click="emit('select', slotProps.data)">No image</span>
      </template>
    </Column>
    <template #empty>
      no reviews to find.
    </template>
  </DataTable>
</template>

<script setup lang="ts">
import { Column, DataTable } from 'primevue';
import type { Review } from '@/types';
// @ts-ignore
import StarRating from 'vue-star-rating';

defineProps<{
  reviews: Review[];
  imageSources: Record<string, string>;
  gridView: boolean;
  gridSort: 'database' | 'rating' | 'kj';
}>();

const emit = defineEmits<{
  select: [review: Review];
}>();
</script>

<style scoped>
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

.review-grid-kj {
  font-size: 12px;
  line-height: 1.2;
  font-weight: 600;
}
</style>
