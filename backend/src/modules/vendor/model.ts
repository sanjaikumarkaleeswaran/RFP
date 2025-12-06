import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
    name: string;
    companyName: string;
    emails: string[];
    phones?: string[];
    addresses?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
    }[];
    categories: string[];
    notes?: string;
    proposalsCount?: number;
    acceptedCount?: number;
    rejectedCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

const VendorSchema: Schema = new Schema({
    name: { type: String, required: true },
    companyName: { type: String, required: true },
    emails: { type: [String], required: true, index: true },
    phones: { type: [String] },
    addresses: [{
        line1: String,
        line2: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
    }],
    categories: { type: [String], default: [] },
    notes: { type: String },
    proposalsCount: { type: Number, default: 0 },
    acceptedCount: { type: Number, default: 0 },
    rejectedCount: { type: Number, default: 0 },
}, {
    timestamps: true,
    toJSON: {
        transform: function (_doc: any, ret: any) {
            const { _id, __v, ...rest } = ret;
            return { id: _id.toString(), ...rest };
        }
    }
});

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
