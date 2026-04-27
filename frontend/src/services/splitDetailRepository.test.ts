import { describe, expect, it, vi, beforeEach } from 'vitest';
import { splitDetailRepository } from './splitDetailRepository';
import {
    fetchProfile,
    fetchReceiptSignedUrl,
    fetchSplitById,
    fetchSplitReceipts,
    fetchUserActivities,
} from '../utils/api-client';
import { getStoredSplitParticipantDirectory } from '../utils/session';

vi.mock('../utils/api-client');
vi.mock('../utils/session');

describe('splitDetailRepository', () => {
    const mockSplitId = 'split-123';
    const mockCurrentUserId = 'user-abc';
    const mockWalletAddress = 'wallet-xyz';

    const mockSplitRecord = {
        id: mockSplitId,
        totalAmount: '100.00',
        amountPaid: '50.00',
        status: 'active' as const,
        description: 'Test Split',
        preferredCurrency: 'USD',
        creatorWalletAddress: mockWalletAddress,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        participants: [
            {
                id: 'participant-1',
                userId: 'user-abc',
                amountOwed: '50.00',
                amountPaid: '25.00',
                status: 'partial' as const,
                walletAddress: mockWalletAddress,
            },
            {
                id: 'participant-2',
                userId: 'user-def',
                amountOwed: '50.00',
                amountPaid: '25.00',
                status: 'partial' as const,
                walletAddress: 'wallet-def',
            },
        ],
        items: [],
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getStoredSplitParticipantDirectory).mockReturnValue({});
    });

    it('fetches and composes split detail with all data', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockResolvedValue({
            walletAddress: mockWalletAddress,
            displayName: 'Test User',
            avatarUrl: null,
            preferredCurrency: 'USD',
        });
        vi.mocked(fetchSplitReceipts).mockResolvedValue([
            {
                id: 'receipt-1',
                splitId: mockSplitId,
                uploadedBy: mockCurrentUserId,
                originalFilename: 'receipt.jpg',
                storagePath: '/path/to/receipt.jpg',
                fileSize: 1024,
                mimeType: 'image/jpeg',
                ocrProcessed: false,
                createdAt: '2026-01-01T00:00:00.000Z',
            },
        ]);
        vi.mocked(fetchReceiptSignedUrl).mockResolvedValue('https://example.com/receipt.jpg');
        vi.mocked(fetchUserActivities).mockResolvedValue({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasMore: false,
            unreadCount: 0,
        });

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: mockCurrentUserId,
        });

        expect(result.split.id).toBe(mockSplitId);
        expect(result.split.title).toBe('Test Split');
        expect(result.split.participants).toHaveLength(2);
        expect(result.activityItems).toEqual([]);
    });

    it('handles missing profiles gracefully', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockResolvedValue(null);
        vi.mocked(fetchSplitReceipts).mockResolvedValue([]);
        vi.mocked(fetchUserActivities).mockResolvedValue({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasMore: false,
            unreadCount: 0,
        });

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: mockCurrentUserId,
        });

        expect(result.split.participants[0].name).toBe('You');
        expect(result.split.participants[1].name).toContain('...');
    });

    it('handles profile fetch failures gracefully', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockRejectedValue(new Error('Profile fetch failed'));
        vi.mocked(fetchSplitReceipts).mockResolvedValue([]);
        vi.mocked(fetchUserActivities).mockResolvedValue({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasMore: false,
            unreadCount: 0,
        });

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: mockCurrentUserId,
        });

        expect(result.split.participants).toHaveLength(2);
        expect(result.split.participants[0].name).toBe('You');
    });

    it('handles missing receipts gracefully', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockResolvedValue(null);
        vi.mocked(fetchSplitReceipts).mockResolvedValue([]);
        vi.mocked(fetchUserActivities).mockResolvedValue({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasMore: false,
            unreadCount: 0,
        });

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: mockCurrentUserId,
        });

        expect(result.split.receiptUrl).toBeUndefined();
    });

    it('handles receipt fetch failures gracefully', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockResolvedValue(null);
        vi.mocked(fetchSplitReceipts).mockRejectedValue(new Error('Receipt fetch failed'));
        vi.mocked(fetchUserActivities).mockResolvedValue({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasMore: false,
            unreadCount: 0,
        });

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: mockCurrentUserId,
        });

        expect(result.split.receiptUrl).toBeUndefined();
    });

    it('handles signed URL fetch failures gracefully', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockResolvedValue(null);
        vi.mocked(fetchSplitReceipts).mockResolvedValue([
            {
                id: 'receipt-1',
                splitId: mockSplitId,
                uploadedBy: mockCurrentUserId,
                originalFilename: 'receipt.jpg',
                storagePath: '/path/to/receipt.jpg',
                fileSize: 1024,
                mimeType: 'image/jpeg',
                ocrProcessed: false,
                createdAt: '2026-01-01T00:00:00.000Z',
            },
        ]);
        vi.mocked(fetchReceiptSignedUrl).mockRejectedValue(new Error('Signed URL fetch failed'));
        vi.mocked(fetchUserActivities).mockResolvedValue({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasMore: false,
            unreadCount: 0,
        });

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: mockCurrentUserId,
        });

        expect(result.split.receiptUrl).toBeUndefined();
    });

    it('handles activity fetch failures gracefully', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockResolvedValue(null);
        vi.mocked(fetchSplitReceipts).mockResolvedValue([]);
        vi.mocked(fetchUserActivities).mockRejectedValue(new Error('Activity fetch failed'));

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: mockCurrentUserId,
        });

        expect(result.activityItems).toEqual([]);
    });

    it('resolves participant names from session directory as fallback', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockResolvedValue(null);
        vi.mocked(fetchSplitReceipts).mockResolvedValue([]);
        vi.mocked(fetchUserActivities).mockResolvedValue({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasMore: false,
            unreadCount: 0,
        });
        vi.mocked(getStoredSplitParticipantDirectory).mockReturnValue({
            'user-def': { name: 'Fallback Name' },
        });

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: mockCurrentUserId,
        });

        expect(result.split.participants[1].name).toBe('Fallback Name');
    });

    it('uses wallet address short ID when no profile or session data exists', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockResolvedValue(null);
        vi.mocked(fetchSplitReceipts).mockResolvedValue([]);
        vi.mocked(fetchUserActivities).mockResolvedValue({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasMore: false,
            unreadCount: 0,
        });

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: mockCurrentUserId,
        });

        expect(result.split.participants[1].name).toBe('wallet...-def');
    });

    it('returns null for receipt URL when no current user', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockResolvedValue(null);

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: null,
        });

        expect(result.split.receiptUrl).toBeUndefined();
        expect(result.activityItems).toEqual([]);
    });

    it('builds activity messages correctly', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockResolvedValue({
            walletAddress: mockWalletAddress,
            displayName: 'Test User',
            avatarUrl: null,
            preferredCurrency: 'USD',
        });
        vi.mocked(fetchSplitReceipts).mockResolvedValue([]);
        vi.mocked(fetchUserActivities).mockResolvedValue({
            data: [
                {
                    id: 'activity-1',
                    userId: mockCurrentUserId,
                    activityType: 'payment_made',
                    splitId: mockSplitId,
                    metadata: {
                        actorName: 'Test User',
                        title: 'Test Split',
                        amount: 25.50,
                    },
                    isRead: false,
                    createdAt: '2026-01-01T00:00:00.000Z',
                },
            ],
            total: 1,
            page: 1,
            limit: 20,
            totalPages: 1,
            hasMore: false,
            unreadCount: 0,
        });

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: mockCurrentUserId,
        });

        expect(result.activityItems).toHaveLength(1);
        expect(result.activityItems[0].type).toBe('payment-status');
        expect(result.activityItems[0].message).toContain('paid');
        expect(result.activityItems[0].message).toContain('Test Split');
    });

    it('maps participant structure correctly', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockResolvedValue({
            walletAddress: mockWalletAddress,
            displayName: 'Test User',
            avatarUrl: null,
            preferredCurrency: 'USD',
        });
        vi.mocked(fetchSplitReceipts).mockResolvedValue([]);
        vi.mocked(fetchUserActivities).mockResolvedValue({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasMore: false,
            unreadCount: 0,
        });

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: mockCurrentUserId,
        });

        expect(result.split.participants).toHaveLength(2);
        const firstParticipant = result.split.participants[0];
        expect(firstParticipant).toBeDefined();
        expect(firstParticipant.id).toBe('participant-1');
        expect(firstParticipant.userId).toBe('user-abc');
        expect(firstParticipant.name).toBeDefined();
        expect(firstParticipant.status).toBeDefined();
    });

    it('identifies current user correctly', async () => {
        vi.mocked(fetchSplitById).mockResolvedValue(mockSplitRecord);
        vi.mocked(fetchProfile).mockResolvedValue(null);
        vi.mocked(fetchSplitReceipts).mockResolvedValue([]);
        vi.mocked(fetchUserActivities).mockResolvedValue({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasMore: false,
            unreadCount: 0,
        });

        const result = await splitDetailRepository.getSplitDetail(mockSplitId, {
            currentUserId: mockCurrentUserId,
        });

        expect(result.split.participants[0].isCurrentUser).toBe(true);
        expect(result.split.participants[1].isCurrentUser).toBe(false);
    });
});
