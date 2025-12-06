import { Vendor, IVendor } from './model';

export class VendorService {
    async createVendor(data: Partial<IVendor>): Promise<IVendor> {
        const vendor = new Vendor(data);
        return await vendor.save();
    }

    async getVendors(filter: any = {}): Promise<IVendor[]> {
        return await Vendor.find(filter).sort({ createdAt: -1 });
    }

    async getVendorById(id: string): Promise<IVendor | null> {
        return await Vendor.findById(id);
    }

    async updateVendor(id: string, data: Partial<IVendor>): Promise<IVendor | null> {
        return await Vendor.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteVendor(id: string): Promise<IVendor | null> {
        return await Vendor.findByIdAndDelete(id);
    }

    /**
     * Find vendors that match any of the provided categories.
     * Returns vendors where their `categories` array intersects with the given list.
     */
    async searchByCategories(categories: string[]): Promise<IVendor[]> {
        if (!categories || categories.length === 0) return [];

        return await Vendor.find({ categories: { $in: categories } }).sort({ createdAt: -1 });
    }

    /**
     * Find vendor by email address
     */
    async searchByEmail(email: string): Promise<IVendor[]> {
        if (!email) return [];
        return await Vendor.find({ emails: email });
    }

    /**
     * Get single vendor by email
     */
    async getVendorByEmail(email: string): Promise<IVendor | null> {
        if (!email) return null;
        return await Vendor.findOne({ emails: email });
    }
}

export const vendorService = new VendorService();
