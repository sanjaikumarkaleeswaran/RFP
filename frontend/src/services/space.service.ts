import { fetchWrapper } from '../shared/utils/fetchWrapper';
import type { Space, Vendor } from '../types';

export const spaceService = {
    getAll: async () => {
        return await fetchWrapper<Space[]>('GET', '/spaces');
    },

    getById: async (id: string) => {
        return await fetchWrapper<Space>('GET', `/spaces/${id}`);
    },

    create: async (data: Partial<Space>) => {
        return await fetchWrapper<Space>('POST', '/spaces', data);
    },

    update: async (id: string, data: Partial<Space>) => {
        return await fetchWrapper<Space>('PUT', `/spaces/${id}`, data);
    },

    delete: async (id: string) => {
        return await fetchWrapper<void>('DELETE', `/spaces/${id}`);
    },

    parseRequirements: async (id: string, requirements: string) => {
        return await fetchWrapper<Space>('POST', `/spaces/${id}/parse`, { rawRequirements: requirements });
    },

    generateTemplate: async (id: string) => {
        return await fetchWrapper<{ template: string }>('POST', `/spaces/${id}/generate-template`);
    },

    getMatchingVendors: async (id: string) => {
        return await fetchWrapper<Vendor[]>('GET', `/spaces/${id}/vendors`);
    }
};
