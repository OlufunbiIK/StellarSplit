export interface Participant {
    id: string;
    name: string;
    avatar?: string; // URL to avatar image
    amountOwed: number;
    status: 'paid' | 'pending';
    isCurrentUser?: boolean;
}

export interface Split {
    id: string;
    title: string;
    totalAmount: number;
    currency: string;
    date: string;
    status: 'active' | 'completed';
    receiptUrl?: string;
    participants: Participant[];
}
