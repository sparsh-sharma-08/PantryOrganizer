export interface Item {
    id: string;
    name: string;
    quantity?: number;
    unit?: string | null;
    location?: string | null;
    labels?: string[] | string | null; // keeping flexible for now as legacy data might be mixed
    description?: string | null;
    category?: string | null;
    expires?: string | null; // ISO Date string
    onShoppingList?: boolean;
    createdAt?: number;
    updatedAt?: number;
    consumedAt?: number;
    purchased?: boolean;
    purchasedAt?: number; // Usage: For finance tracking
    storage_location?: string | null; // used when moving from shopping list to pantry
    notes?: string | null;
    notificationId?: string | null;
    price?: number; // Total price paid
    currency?: string; // Default 'INR'
    unitPrice?: number; // Price per unit
}

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role?: 'user' | 'admin';
    familyId?: string | null;
    createdAt?: number;
    monthlyBudget?: number;
}

export interface Family {
    id: string;
    name: string;
    ownerId: string;
    members: string[]; // UIDs
    inviteCode: string;
    createdAt: number;
    monthlyBudget?: number;
}

export interface AdjustmentHistory {
    id: string;
    itemId: string;
    oldQuantity: number;
    newQuantity: number;
    diff: number;
    reason: 'manual' | 'consumption' | 'purchase' | 'correction';
    timestamp: number;
}

export interface MealIngredient {
    pantryItemId: string;
    name: string;
    quantityUsed: number;
    unit?: string;
}

export interface MealItem {
    id: string; // UUID
    name: string;
    isPantryItem: boolean;
    pantryItemId?: string; // Legacy simple link
    ingredients?: MealIngredient[]; // New multi-ingredient support
    cooked?: boolean;
}

export interface MealPlanDay {
    date: string; // YYYY-MM-DD
    breakfast: MealItem[];
    lunch: MealItem[];
    dinner: MealItem[];
}
