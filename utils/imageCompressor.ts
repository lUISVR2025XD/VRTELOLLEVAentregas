export const compressImage = (file: File, maxSizeKB: number = 250): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("FileReader failed to read file."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }

                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let { width, height } = img;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const tryCompress = (quality: number) => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                return reject(new Error('Canvas toBlob failed'));
                            }
                            // If blob is small enough or quality is very low, resolve
                            if (blob.size / 1024 <= maxSizeKB || quality <= 0.1) {
                                const compressedFile = new File([blob], file.name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now(),
                                });
                                console.log(`Image compressed from ${file.size / 1024}KB to ${compressedFile.size / 1024}KB`);
                                resolve(compressedFile);
                            } else {
                                // Recursive call with lower quality
                                tryCompress(quality - 0.1);
                            }
                        },
                        'image/jpeg',
                        quality
                    );
                };

                tryCompress(0.9); // Start with high quality
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
