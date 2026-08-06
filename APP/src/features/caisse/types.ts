// POS Item Types
export interface POSItem {
    id: string;
    name: string | { fr: string; ar: string };
    price: number;
    quantity: number;
    type: 'service' | 'product';
    category?: string;
}
