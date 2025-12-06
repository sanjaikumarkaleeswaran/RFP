import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorService } from '../services/vendor.service';
import type { Vendor } from '../types';

export const useVendors = () => {
    const queryClient = useQueryClient();

    const vendorsQuery = useQuery({
        queryKey: ['vendors'],
        queryFn: vendorService.getAll,
    });

    const createVendorMutation = useMutation({
        mutationFn: vendorService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
        },
    });

    const updateVendorMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Vendor> }) =>
            vendorService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
        },
    });

    const deleteVendorMutation = useMutation({
        mutationFn: vendorService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
        },
    });

    return {
        vendors: vendorsQuery.data,
        isLoading: vendorsQuery.isLoading,
        error: vendorsQuery.error,
        createVendor: createVendorMutation.mutate,
        updateVendor: updateVendorMutation.mutate,
        deleteVendor: deleteVendorMutation.mutate,
    };
};

export const useVendor = (id: string) => {
    return useQuery({
        queryKey: ['vendor', id],
        queryFn: () => vendorService.getById(id),
        enabled: !!id,
    });
};

export const useVendorSearch = (categories: string[]) => {
    return useQuery({
        queryKey: ['vendors', 'search', categories],
        queryFn: () => vendorService.search(categories),
        enabled: categories.length > 0,
    });
};
