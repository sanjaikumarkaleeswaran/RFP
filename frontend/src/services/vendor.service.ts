import { fetchWrapper } from '../shared/utils/fetchWrapper';
import type { Vendor } from '../types';

export const vendorService = {
    getAll: async () => {
        return await fetchWrapper<Vendor[]>('GET', '/vendors');
    },

    getById: async (id: string) => {
        return await fetchWrapper<Vendor>('GET', `/vendors/${id}`);
    },

    create: async (data: Partial<Vendor>) => {
        return await fetchWrapper<Vendor>('POST', '/vendors', data);
    },

    update: async (id: string, data: Partial<Vendor>) => {
        return await fetchWrapper<Vendor>('PUT', `/vendors/${id}`, data);
    },

    delete: async (id: string) => {
        return await fetchWrapper<void>('DELETE', `/vendors/${id}`);
    },

    search: async (categories: string[]) => {
        // Pass categories as query param
        const params = new URLSearchParams();
        if (categories.length) {
            params.append('categories', categories.join(','));
        }
        return await fetchWrapper<Vendor[]>('GET', `/vendors/search?${params.toString()}`);
    }
};
