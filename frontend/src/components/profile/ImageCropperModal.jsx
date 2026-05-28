import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { FaTimes, FaCheck } from 'react-icons/fa';
import './ImageCropperModal.css';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped.jpeg', { type: 'image/jpeg' });
        resolve(file);
      }
    }, 'image/jpeg', 0.9);
  });
};

function ImageCropperModal({ imageSrc, onCropComplete, onCancel, aspectRatio = 1 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      if (!croppedAreaPixels) return;
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
    } catch (e) {
      console.error(e);
      alert("Gagal memotong gambar: " + e.message);
    }
  };

  return (
    <div className="cropper-modal-overlay">
      <div className="cropper-modal-container">
        <div className="cropper-modal-header">
          <h3>Sesuaikan Gambar</h3>
          <button type="button" onClick={onCancel} className="cropper-modal-close">
            <FaTimes />
          </button>
        </div>
        <div className="cropper-container">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>
        <div className="cropper-controls">
          <label>Zoom</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>
        <div className="cropper-actions">
          <button type="button" className="cropper-btn-cancel" onClick={onCancel}>Batal</button>
          <button type="button" className="cropper-btn-save" onClick={handleSave}>
            <FaCheck /> Potong & Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCropperModal;
