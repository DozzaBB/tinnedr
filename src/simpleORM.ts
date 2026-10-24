import {Preferences} from '@capacitor/preferences';

export default {
    saveCollection: async function(collection: string, data: any) {
        await Preferences.set({ key: collection, value: JSON.stringify(data) });
    },
    getCollection: async function(collection: string) {
        const ret = await Preferences.get({ key: collection });
        console.log(ret);
        return JSON.parse(ret.value ?? '[]');
    },
    removeCollection: async function(collection: string) {
        await this.saveCollection(collection, []);
    },
    removeById: async function (collection: string, barcode: string) {
        const reviews = await this.getCollection(collection);
        const updatedReviews = reviews.filter((review: any) => review.barcode !== barcode);
        await this.saveCollection(collection, updatedReviews);
    },
    updateById: async function (collection: string, id: string, updatedReview: any) {
        const records = await this.getCollection(collection);
        const updatedReviews = records.map((review: any) => {
            if (review.barcode === id) {
                return { ...review, ...updatedReview };
            }
            return review;
        });
        await this.saveCollection(collection, updatedReviews);
    }
}
