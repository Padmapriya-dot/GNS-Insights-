import { useEffect, useRef } from "react";
import { Check, Upload, X } from "lucide-react";

const PURPLE = "#6b4eff";

/**
 * Signature pad + stamp upload for Create Invoice (screenshot match).
 */
export default function SignatureAndStampPanel({
  companyName = "My Company",
  enabled,
  signatureDataUrl,
  stampDataUrl,
  onSignatureChange,
  onStampChange,
}) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setup = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = Math.max(parent.clientWidth, 280);
      const h = 140;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#1a1a1f";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (signatureDataUrl) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, w, h);
        img.src = signatureDataUrl;
      }
    };

    setup();
    window.addEventListener("resize", setup);
    return () => window.removeEventListener("resize", setup);
  }, [enabled, signatureDataUrl]);

  if (!enabled) return null;

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return {
      x: ((src.clientX - rect.left) / rect.width) * canvas.width,
      y: ((src.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSignatureChange?.(null);
  };

  const save = () => {
    const url = canvasRef.current.toDataURL("image/png");
    onSignatureChange?.(url);
  };

  const onStampFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onStampChange?.(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="border-t border-[#ececf0] px-4 py-6 text-center">
      <p className="text-[13px] text-[#4a4a55]">
        Certified that the particular given above are true and correct,
      </p>
      <p className="mt-1 text-[13px] font-semibold text-[#1a1a1f]">For, {companyName}</p>

      <div className="relative mx-auto mt-4 max-w-sm overflow-hidden rounded-lg border border-dashed border-[#c4c4cc] bg-white">
        {stampDataUrl ? (
          <img
            src={stampDataUrl}
            alt="Stamp"
            className="pointer-events-none absolute bottom-8 right-3 h-16 w-16 object-contain opacity-80"
          />
        ) : null}
        <canvas
          ref={canvasRef}
          className="block h-[140px] w-full touch-none cursor-crosshair"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 text-[12px] font-semibold"
            style={{ color: PURPLE }}
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center gap-1 text-[12px] font-semibold"
            style={{ color: PURPLE }}
          >
            <Check className="h-3.5 w-3.5" /> Save
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onStampFile}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold"
        style={{ color: PURPLE }}
      >
        <Upload className="h-4 w-4" /> Upload Stamp
      </button>

      <p className="mt-4 text-[13px] font-medium text-[#4a4a55]">Authorised Signatory</p>
    </div>
  );
}
