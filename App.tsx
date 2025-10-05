import React, { useState, useCallback, useRef } from 'react';
import { generateImage } from './services/geminiService';
import type { ImageFile } from './types';
import { fileToGenerativePart } from './utils/fileUtils';
import { UploadIcon, SparklesIcon, MagicWandIcon, DownloadIcon, UpscaleIcon } from './components/icons';

// Component for the Header
const Header: React.FC = () => (
  <header className="text-center py-5 border-b border-gray-200">
    <h1 className="text-4xl font-bold text-gray-800">TRÀ THƯƠNG AI</h1>
    <p className="text-lg text-gray-500 mt-1">កម្មវិធីផ្លាស់ប្តូរផ្ទៃខាងក្រោយ AI</p>
  </header>
);

// Component for the initial image upload area
interface OriginalImageUploaderProps {
  onImageUpload: (file: File) => void;
}
const OriginalImageUploader: React.FC<OriginalImageUploaderProps> = ({ onImageUpload }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageUpload(event.target.files[0]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        onImageUpload(event.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="w-full h-full bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center p-4">
       <input
            type="file"
            id="original-image-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
        />
        <label
            htmlFor="original-image-upload"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="w-full h-full flex flex-col items-center justify-center text-center cursor-pointer text-gray-500 hover:text-blue-600 transition-colors"
        >
          <UploadIcon className="w-12 h-12 mb-2" />
          <p className="font-semibold">ចុចដើម្បីផ្ទុកឡើង ឬអូសและទម្លាក់</p>
          <p className="text-sm">PNG, JPG, WEBP</p>
        </label>
    </div>
  );
};

// Component for displaying the original uploaded image
interface OriginalImageViewProps {
    image: ImageFile;
}
const OriginalImageView: React.FC<OriginalImageViewProps> = ({ image }) => (
    <div className="w-full h-full p-2 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
            <img src={image.previewUrl} alt="Original" className="w-full h-auto object-contain rounded-md max-h-[75vh]" />
            <span className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded-full">ដើម</span>
        </div>
    </div>
);


// Component for displaying generated images
interface GeneratedImageDisplayProps {
    images: string[];
    isLoading: boolean;
}
const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({ images, isLoading }) => {
    const handleDownload = (imgSrc: string, index: number) => {
        const link = document.createElement('a');
        link.href = imgSrc;
        link.download = `tra-thuong-generated-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownload8K = (imgSrc: string, index: number) => {
        const image = new Image();
        image.onload = () => {
            const aspectRatio = image.naturalWidth / image.naturalHeight;
            const newWidth = 7680;
            const newHeight = Math.round(newWidth / aspectRatio);

            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                alert("Could not get canvas context to upscale image.");
                return;
            }
            
            // Disable image smoothing to prevent blurriness when upscaling.
            // This uses a nearest-neighbor algorithm, resulting in a sharper, pixel-perfect image.
            // @ts-ignore - for vendor prefixes
            ctx.mozImageSmoothingEnabled = false;
            // @ts-ignore
            ctx.webkitImageSmoothingEnabled = false;
            // @ts-ignore
            ctx.msImageSmoothingEnabled = false;
            ctx.imageSmoothingEnabled = false;

            ctx.drawImage(image, 0, 0, newWidth, newHeight);

            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `tra-thuong-generated-8k-${index + 1}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        image.onerror = () => {
            alert("Failed to load image for upscaling.");
        };
        image.src = imgSrc;
    };

    return (
        <div className="w-full h-full bg-white/50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center p-4 min-h-[400px]">
            {isLoading ? (
            <div className="flex flex-col items-center text-gray-600">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="font-semibold">កំពុងបង្កើតរូបភាព...</p>
                <p className="text-sm">សូមរង់ចាំបន្តិច</p>
            </div>
            ) : images.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 w-full h-full overflow-y-auto">
                {images.map((imgSrc, index) => (
                    <div key={index} className="relative group">
                        <img src={imgSrc} alt={`Generated ${index + 1}`} className="w-full h-auto object-contain rounded-lg shadow-md" />
                        <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                                onClick={() => handleDownload(imgSrc, index)}
                                className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors"
                                aria-label="Download Image"
                                title="ទាញយករូបភាព"
                            >
                                <DownloadIcon className="w-5 h-5" />
                            </button>
                             <button
                                onClick={() => handleDownload8K(imgSrc, index)}
                                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors flex items-center"
                                aria-label="Download 8K Image"
                                title="ទាញយករូបភាព 8K"
                            >
                                <UpscaleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            ) : (
            <div className="text-center text-gray-500">
                <SparklesIcon className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700">រូបភាពដែលបានបង្កើតនឹងបង្ហាញនៅទីនេះ</h3>
                <p className="mt-1">ប្រើផ្ទាំងបញ្ជានៅខាងស្តាំដើម្បីចាប់ផ្តើម។</p>
            </div>
            )}
        </div>
    );
};

// Component for the control panel on the right
interface ControlPanelProps {
    prompt: string;
    onPromptChange: (value: string) => void;
    onGenerate: () => void;
    onStartOver: () => void;
    onBackgroundImageUpload: (file: File) => void;
    isLoading: boolean;
    hasOriginalImage: boolean;
    backgroundImage: ImageFile | null;
    numImages: number;
    onNumImagesChange: (value: number) => void;
}
const ControlPanel: React.FC<ControlPanelProps> = (props) => {
    const { prompt, onPromptChange, onGenerate, onStartOver, onBackgroundImageUpload, isLoading, hasOriginalImage, backgroundImage, numImages, onNumImagesChange } = props;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBgUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        onBackgroundImageUpload(event.target.files[0]);
      }
    };
    
    return (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-5">
            <button
                onClick={onStartOver}
                className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                disabled={!hasOriginalImage && !backgroundImage}
            >
                ចាប់ផ្តើមម្តងទៀតជាមួយរូបភាពថ្មី
            </button>
            <div className="space-y-4">
                <label className="flex items-center gap-2 font-semibold text-gray-800">
                    <MagicWandIcon className="w-5 h-5 text-blue-600" />
                    ពិពណ៌នាផ្ទៃខាងក្រោយថ្មី
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder="ឧទាហរណ៍៖ 'សួនជប៉ុនដ៏ស្ងប់ស្ងាត់'"
                    className="w-full h-28 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    rows={4}
                    disabled={!hasOriginalImage || isLoading}
                />
                <div className="flex items-center gap-3">
                    <select 
                        className="flex-shrink-0 w-auto px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                        disabled={isLoading || !hasOriginalImage}
                        value={numImages}
                        onChange={(e) => onNumImagesChange(parseInt(e.target.value, 10))}
                    >
                        <option value={1}>១ រូបភាព</option>
                        <option value={2}>២ រូបភាព</option>
                        <option value={3}>៣ រូបភាព</option>
                        <option value={4}>៤ រូបភាព</option>
                    </select>
                    <button
                        onClick={onGenerate}
                        disabled={isLoading || !hasOriginalImage || (!prompt && !backgroundImage)}
                        className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'កំពុងបង្កើត...' : 'បង្កើតរូបភាព'}
                    </button>
                </div>
            </div>

            <div className="flex items-center text-gray-400">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 px-3 text-sm font-medium">ឬ</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={!hasOriginalImage || isLoading}
                />
                <button
                    onClick={handleBgUploadClick}
                    className="w-full py-2.5 px-4 flex items-center justify-center gap-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                    disabled={!hasOriginalImage || isLoading}
                >
                    <UploadIcon className="w-5 h-5" />
                    {backgroundImage ? backgroundImage.file.name : 'ជ្រើសរើសផ្ទៃខាងក្រោយពីកុំព្យូទ័រ'}
                </button>
            </div>
        </div>
    );
};


export default function App() {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<ImageFile | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [numImages, setNumImages] = useState<number>(1);

  const handleImageUpload = (setter: React.Dispatch<React.SetStateAction<ImageFile | null>>) => (file: File) => {
    setter({
        file,
        previewUrl: URL.createObjectURL(file),
    });
    setGeneratedImages([]);
    setError(null);
  };

  const handleStartOver = useCallback(() => {
    setOriginalImage(null);
    setBackgroundImage(null);
    setPrompt('');
    setGeneratedImages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!originalImage) {
      setError("សូមផ្ទុកឡើងរូបភាពដើមជាមុនសិន។");
      return;
    }
    if (!prompt && !backgroundImage) {
        setError("សូមបញ្ចូលការពិពណ៌នា ឬផ្ទុកឡើងរូបភាពផ្ទៃខាងក្រោយ។");
        return;
    }

    setIsLoading(true);
    setGeneratedImages([]);
    setError(null);

    try {
        const originalImagePart = await fileToGenerativePart(originalImage.file);
        const backgroundImagePart = backgroundImage ? await fileToGenerativePart(backgroundImage.file) : null;
        
        const generationPromises = Array.from({ length: numImages }).map(() => 
            generateImage(originalImagePart, prompt, backgroundImagePart)
        );

        const results = await Promise.all(generationPromises);
        const validImages = results.filter((result): result is string => result !== null);

        if (validImages.length > 0) {
            setGeneratedImages(validImages);
        } else {
            setError("មិនអាចបង្កើតរូបភាពបានទេ។ សូមព្យាយាមម្តងទៀត។");
        }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "មានកំហុសមួយបានកើតឡើង។");
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, backgroundImage, prompt, numImages]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-screen-2xl mx-auto">
          <div className="lg:col-span-4 flex items-center justify-center">
            {originalImage ? 
                <OriginalImageView image={originalImage} /> : 
                <OriginalImageUploader onImageUpload={handleImageUpload(setOriginalImage)} />
            }
          </div>

          <div className="lg:col-span-5 flex items-center justify-center">
            <GeneratedImageDisplay images={generatedImages} isLoading={isLoading} />
          </div>

          <div className="lg:col-span-3">
            <ControlPanel
                prompt={prompt}
                onPromptChange={setPrompt}
                onGenerate={handleGenerate}
                onStartOver={handleStartOver}
                onBackgroundImageUpload={handleImageUpload(setBackgroundImage)}
                isLoading={isLoading}
                hasOriginalImage={!!originalImage}
                backgroundImage={backgroundImage}
                numImages={numImages}
                onNumImagesChange={setNumImages}
            />
             {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}