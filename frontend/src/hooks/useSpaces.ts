import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spaceService } from '../services/space.service';
import type { Space } from '../types';

export const useSpaces = () => {
    const queryClient = useQueryClient();

    const spacesQuery = useQuery({
        queryKey: ['spaces'],
        queryFn: spaceService.getAll,
    });

    const createSpaceMutation = useMutation({
        mutationFn: spaceService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spaces'] });
        },
    });

    const updateSpaceMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Space> }) =>
            spaceService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spaces'] });
            queryClient.invalidateQueries({ queryKey: ['space'] }); // Invalidate individual space too
        },
    });

    const deleteSpaceMutation = useMutation({
        mutationFn: spaceService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spaces'] });
        },
    });

    return {
        spaces: spacesQuery.data,
        isLoading: spacesQuery.isLoading,
        error: spacesQuery.error,
        createSpace: createSpaceMutation.mutate,
        updateSpace: updateSpaceMutation.mutate,
        deleteSpace: deleteSpaceMutation.mutate,
    };
};

export const useSpace = (id: string) => {
    return useQuery({
        queryKey: ['space', id],
        queryFn: () => spaceService.getById(id),
        enabled: !!id,
    });
};

export const useSpaceActions = () => {
    const queryClient = useQueryClient();

    const parseRequirementsMutation = useMutation({
        mutationFn: ({ id, requirements }: { id: string; requirements: string }) =>
            spaceService.parseRequirements(id, requirements),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['space', variables.id] });
        },
    });

    const generateTemplateMutation = useMutation({
        mutationFn: (id: string) => spaceService.generateTemplate(id),
        onSuccess: (_data, variables) => {
            // Since generating template might not update the space object directly in DB immediately 
            // (it returns the template string), we might want to refetch or just handle the data.
            // But if it saves to DB, we invalidate.
            queryClient.invalidateQueries({ queryKey: ['space', variables] });
        },
    });

    return {
        parseRequirements: parseRequirementsMutation.mutateAsync,
        generateTemplate: generateTemplateMutation.mutateAsync,
        isParsing: parseRequirementsMutation.isPending,
        isGenerating: generateTemplateMutation.isPending,
    };
};

export const useSpaceVendors = (id: string) => {
    return useQuery({
        queryKey: ['space', id, 'vendors'],
        queryFn: () => spaceService.getMatchingVendors(id),
        enabled: !!id,
    });
};
