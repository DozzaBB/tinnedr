import { OpenFoodFacts } from '@openfoodfacts/openfoodfacts-nodejs';

interface ProductLookupResponse {
  data?: {
    product?: {
      product_name?: string;
      brands?: string;
      image_url?: string;
    };
  };
}

const foodClient = new OpenFoodFacts(fetch);

export async function lookupProduct(barcode: string) {
  const response = await foodClient.getProductV3(barcode) as ProductLookupResponse;
  const product = response.data?.product;
  if (!product?.product_name) return undefined;

  return {
    productTitle: `${product.product_name} - ${product.brands}`,
    imageUrl: product.image_url,
  };
}