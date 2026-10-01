"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Camera, Pencil, Plus } from "lucide-react";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Needed to re-crop an already-hosted photo (not a freshly picked
    // local file) without the canvas being flagged as cross-origin
    // "tainted," which would block reading pixel data back out of it.
    img.crossOrigin = "anonymous";
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = area.width;
  canvas.height = area.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))), "image/jpeg", 0.92);
  });
}

export default function CroppablePhotoInput({
  name,
  existingPhotoUrl,
  formIdToSubmit,
  glass = false,
  fallbackInitial,
}: {
  name: string;
  existingPhotoUrl?: string | null;
  formIdToSubmit?: string;
  /** Dark "Ethereal Glass" look (larger rounded tile). Default = original small circle. */
  glass?: boolean;
  /** Letter shown on the empty tile in glass mode. */
  fallbackInitial?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingPhotoUrl || null);
  const [showMenu, setShowMenu] = useState(false);
  const [cropError, setCropError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropError(false);
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const confirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const dt = new DataTransfer();
      dt.items.add(file);
      if (fileInputRef.current) fileInputRef.current.files = dt.files;
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setImageSrc(null);
      if (formIdToSubmit) {
        (document.getElementById(formIdToSubmit) as HTMLFormElement | null)?.requestSubmit();
      }
    } catch (err) {
      console.error("Crop failed:", err);
      setCropError(true);
    }
  };

  const openReposition = () => {
    setShowMenu(false);
    setCropError(false);
    if (previewUrl) setImageSrc(previewUrl);
  };

  const openReplace = () => {
    setShowMenu(false);
    pickerRef.current?.click();
  };

  return (
    <div>
      {/* This is the real field the form submits — its files are set
          programmatically once the user confirms a crop. */}
      <input ref={fileInputRef} type="file" name={name} accept="image/*" className="hidden" />
      {/* This is just the picker the person actually clicks. */}
      <input ref={pickerRef} type="file" accept="image/*" className="hidden" onChange={onPick} />

      <div ref={containerRef} className={glass ? "relative w-[84px] h-[84px]" : "relative w-16 h-16"}>
        {previewUrl && glass ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="w-[84px] h-[84px] rounded-[26px] object-cover border border-paper/15" />
            <button
              type="button"
              onClick={() => setShowMenu((v) => !v)}
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-apricot text-ink flex items-center justify-center border-2 border-[#1d2026] hover:scale-110 hover:-rotate-6 transition-transform duration-300"
              title="Edit photo"
              aria-label="Change photo"
            >
              <Camera size={15} strokeWidth={1.6} />
            </button>
            {showMenu && (
              <div className="absolute top-full mt-2 left-0 z-20 bg-[#15181d]/95 backdrop-blur-xl border border-paper/15 rounded-2xl p-1.5 shadow-[0_24px_50px_-20px_rgba(0,0,0,.9)] whitespace-nowrap">
                <button type="button" onClick={openReposition} className="block w-full text-left px-3 py-2 text-[13px] text-paper/85 rounded-xl hover:bg-paper/[.07]">
                  Reposition this photo
                </button>
                <button type="button" onClick={openReplace} className="block w-full text-left px-3 py-2 text-[13px] text-paper/85 rounded-xl hover:bg-paper/[.07]">
                  Upload a different photo
                </button>
              </div>
            )}
          </>
        ) : glass ? (
          <button
            type="button"
            onClick={() => pickerRef.current?.click()}
            className="relative w-[84px] h-[84px] rounded-[26px] border border-paper/15 bg-gradient-to-br from-[#2a2f38] to-[#171A1F] flex items-center justify-center font-display font-semibold text-[32px] text-apricot hover:border-apricot transition-colors"
            title="Add a photo"
            aria-label="Add a photo"
          >
            {fallbackInitial || <Plus size={22} />}
            <span className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-apricot text-ink flex items-center justify-center border-2 border-[#1d2026]">
              <Camera size={15} strokeWidth={1.6} />
            </span>
          </button>
        ) : previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
            <button
              type="button"
              onClick={() => setShowMenu((v) => !v)}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-ink text-paper flex items-center justify-center border-2 border-white"
              title="Edit photo"
            >
              <Pencil size={11} />
            </button>
            {showMenu && (
              <div className="absolute top-full mt-1 left-0 z-10 bg-white border border-line rounded-lg shadow-sm overflow-hidden whitespace-nowrap">
                <button type="button" onClick={openReposition} className="block w-full text-left px-3 py-2 text-sm hover:bg-paper-dim">
                  Reposition this photo
                </button>
                <button type="button" onClick={openReplace} className="block w-full text-left px-3 py-2 text-sm hover:bg-paper-dim">
                  Upload a different photo
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => pickerRef.current?.click()}
            className="w-16 h-16 rounded-full border-2 border-dashed border-line flex items-center justify-center text-muted hover:border-apricot hover:text-apricot-deep transition-colors"
            title="Add a photo"
          >
            <Plus size={20} />
          </button>
        )}
      </div>

      {imageSrc && (
        <div className={`fixed inset-0 flex items-center justify-center p-4 ${glass ? "z-[90] bg-ink/80 backdrop-blur-sm" : "bg-ink/80 z-50"}`}>
          <div className={glass ? "bg-[#1b1f26] border border-paper/15 rounded-[22px] p-4 max-w-sm w-full text-paper shadow-[0_30px_70px_-20px_rgba(0,0,0,.9)]" : "bg-white rounded-xl p-4 max-w-sm w-full"}>
            <p className="text-sm font-medium mb-3">Adjust your photo</p>
            {cropError ? (
              <div>
                <p className={`text-sm mb-3 ${glass ? "text-apricot" : "text-apricot-deep"}`}>
                  Couldn&apos;t reposition that photo — try uploading it again instead.
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setImageSrc(null)} className={glass ? "flex-1 px-4 py-2 rounded-full text-sm font-medium border border-paper/20 text-paper" : "flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-line"}>
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageSrc(null);
                      pickerRef.current?.click();
                    }}
                    className={glass ? "flex-1 px-4 py-2 rounded-full text-sm font-medium bg-apricot text-ink" : "flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-apricot text-ink"}
                  >
                    Upload instead
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative w-full" style={{ height: 280 }}>
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full mt-4"
                />
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setImageSrc(null)}
                    className={glass ? "flex-1 px-4 py-2 rounded-full text-sm font-medium border border-paper/20 text-paper" : "flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-line"}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmCrop}
                    className={glass ? "flex-1 px-4 py-2 rounded-full text-sm font-medium bg-apricot text-ink" : "flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-apricot text-ink"}
                  >
                    Use this photo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
