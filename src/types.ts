export interface Review {
    barcode:string;
    productTitle:string;
    reviewText:string;
    rating:number;
    imgFilepath: string;
    imgWebviewPath: string;
    kj100g: number;
    domain: Domain
}

export type Domain = 'fish' | 'hotpot'