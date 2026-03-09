// src/lib/cloudinary/uploadService.ts
import { Attachment } from '@/lib/firebase/taskService';

export const uploadToCloudinary = async (file: File): Promise<Attachment> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary configuration missing");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    // auto allows all file types, but typically image/raw/video depending on the file
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
        id: data.asset_id || data.public_id,
        url: data.secure_url,
        publicId: data.public_id,
        name: file.name,
        type: file.type || data.resource_type,
        size: file.size || data.bytes,
    };
};
