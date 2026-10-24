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

export const DomainList = ["fish","hotpot"] as const;
export type Domain = typeof DomainList[number]