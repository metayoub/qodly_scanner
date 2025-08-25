import { useRenderer, useSources } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
  type CameraDevice,
} from 'html5-qrcode';
import { IScannerProps } from './Scanner.config';
import { MdOutlineQrCodeScanner, MdStop } from 'react-icons/md';
import { HiOutlinePhotograph } from 'react-icons/hi';

const SCANNER_ELEMENT_ID = 'qr-code-scanner';

const Scanner: FC<IScannerProps> = ({
  fps = 10,
  scanOnStart = false,
  qrBoxSize = 250,
  disableFlip = false,
  showLabels = true,
  label1,
  label2,
  label3,
  allowedCodeFormats = [],
  style,
  className,
  classNames = [],
  disabled,
}) => {
  const { connect, emit } = useRenderer();

  // DOM & SDK refs
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // File inputs (hidden)
  const uploadPhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-start & cancel control
  const autoStartedRef = useRef(false);
  const startSeq = useRef(0);

  // UI & devices
  const [isScanning, setIsScanning] = useState(false); // camera mode
  const [isProcessingFile, setIsProcessingFile] = useState(false); // file mode busy
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [camId, setCamId] = useState<CameraDevice | null>(null);
  const [cameraValue, setCameraValue] = useState<string | null>(null);

  // Data binding
  const {
    sources: { datasource: ds },
  } = useSources();

  // Html5Qrcode config
  const constraints = useMemo(
    () => ({
      fps,
      qrbox: qrBoxSize,
      disableFlip,
    }),
    [fps, qrBoxSize, disableFlip],
  );

  const ensureInstance = () => {
    let inst = html5QrCodeRef.current;
    if (!inst) {
      inst = new Html5Qrcode(SCANNER_ELEMENT_ID, {
        verbose: false,
        useBarCodeDetectorIfSupported: true,
        formatsToSupport:
          allowedCodeFormats.length > 0
            ? allowedCodeFormats.map(
                (f) =>
                  Html5QrcodeSupportedFormats[f.format as keyof typeof Html5QrcodeSupportedFormats],
              )
            : [...Array(17).keys()],
      });
      html5QrCodeRef.current = inst;
    }
    return inst;
  };

  const finalizeSuccess = useCallback(
    async (decodedText: string) => {
      await ds.setValue(null, decodedText);
      emit('onscansuccess', { value: decodedText });
    },
    [ds, emit],
  );

  const onScanSuccess = useCallback(
    async (decodedText: string) => {
      try {
        await finalizeSuccess(decodedText);
      } finally {
        // Pause so user can press "Start" to scan again
        html5QrCodeRef.current?.pause(true);
        setIsScanning(false);
      }
    },
    [finalizeSuccess],
  );

  const onScanFailure = useCallback((_error: string) => {
    // Intentionally quiet; continuous scan errors are noisy.
  }, []);

  // -------- Camera scanning controls --------
  const startScanning = useCallback(async () => {
    if (!scannerRef.current || disabled) return;

    // Invalidate previous starts and capture this call's token
    const mySeq = ++startSeq.current;

    try {
      const inst = ensureInstance();
      const state = inst.getState?.();

      // If paused, resume
      if (state === Html5QrcodeScannerState.PAUSED) {
        await inst.resume();
        if (mySeq !== startSeq.current) return;
        setIsScanning(true);
        return;
      }

      // Already scanning
      if (state === Html5QrcodeScannerState.SCANNING) {
        setIsScanning(true);
        return;
      }

      // Fresh start
      const cameraToUse: string | MediaTrackConstraints = camId?.id ?? {
        facingMode: 'environment',
      };

      await inst.start(cameraToUse, constraints as any, onScanSuccess, onScanFailure);

      if (mySeq !== startSeq.current) {
        await inst.stop().catch(() => {});
        await inst.clear();
        return;
      }

      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start QR scanner:', err);
    }
  }, [camId, constraints, disabled, onScanFailure, onScanSuccess]);

  const stopScanning = useCallback(async () => {
    ++startSeq.current;
    autoStartedRef.current = true;

    const inst = html5QrCodeRef.current;
    if (!inst) {
      setIsScanning(false);
      return;
    }

    try {
      const state = inst.getState?.();
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        await inst.stop();
      }
      await inst.clear();
    } catch (err) {
      console.error('Failed to stop QR scanner:', err);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // -------- File scanning controls --------
  const scanImageFile = useCallback(
    async (file: File) => {
      if (!file || disabled) return;

      // Ensure camera is not actively scanning while we render the file preview.
      await stopScanning();

      setIsProcessingFile(true);
      try {
        const inst = ensureInstance();
        // Html5Qrcode.scanFile(file, showImage) renders the image into the container if true.
        const text = await inst.scanFile(file, /* showImage */ true);
        await finalizeSuccess(text);
      } catch (err) {
        console.error('Failed to scan image file:', err);
        emit('onscanfailure', { error: String(err) });
      } finally {
        setIsProcessingFile(false);
      }
    },
    [disabled, emit, finalizeSuccess, stopScanning],
  );

  const handleUploadClick = () => uploadPhotoInputRef.current?.click();

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be selected again if needed
    e.currentTarget.value = '';
    if (file) await scanImageFile(file);
  };

  // -------- Cameras lifecycle --------
  useEffect(() => {
    let mounted = true;
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!mounted) return;
        if (devices?.length) {
          setCameras(devices);
          setCamId(devices[0]);
        }
      })
      .catch((e) => console.error('Failed to list cameras:', e));
    return () => {
      mounted = false;
    };
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      const inst = html5QrCodeRef.current;
      if (!inst) return;
      try {
        const state = inst.getState?.();
        if (
          state === Html5QrcodeScannerState.SCANNING ||
          state === Html5QrcodeScannerState.PAUSED
        ) {
          inst
            .stop()
            .then(() => inst.clear())
            .catch((e) => console.error('Stop on unmount failed:', e));
        } else {
          inst.clear();
        }
      } catch {
        inst
          .stop?.()
          .then(() => inst.clear())
          .catch(() => {});
      }
    };
  }, []);

  // Auto-start ONCE per mount if requested
  useEffect(() => {
    if (!scanOnStart || !camId || disabled) return;
    if (autoStartedRef.current) return;
    autoStartedRef.current = true;
    startScanning();
  }, [scanOnStart, camId, disabled, startScanning]);

  // Keep select value in sync
  useEffect(() => {
    if (camId) setCameraValue(camId.id);
  }, [camId]);

  // Handle camera switch
  useEffect(() => {
    if (cameraValue === null || cameraValue === camId?.id) return;

    const nextCam = cameras.find((c) => c.id === cameraValue) ?? null;

    const switchCamera = async () => {
      setCamId(nextCam);

      const inst = html5QrCodeRef.current;
      if (!inst || !nextCam) return;

      try {
        const state = inst.getState?.();
        if (
          state === Html5QrcodeScannerState.SCANNING ||
          state === Html5QrcodeScannerState.PAUSED
        ) {
          ++startSeq.current;
          await inst.stop();
          await inst.start(nextCam.id, constraints as any, onScanSuccess, onScanFailure);
          setIsScanning(true);
        }
      } catch (e) {
        console.error('Failed to switch camera:', e);
      }
    };

    switchCamera();
  }, [cameraValue, camId, cameras, constraints, onScanFailure, onScanSuccess]);

  const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCameraValue(event.target.value);
  };

  return (
    <div
      ref={connect}
      style={style}
      className={cn(
        disabled && 'opacity-50 cursor-not-allowed',
        className,
        classNames,
        'flex flex-col',
      )}
    >
      <div className="flex p-2 gap-2 items-center flex-wrap">
        {/* Camera select */}
        <select
          id="camera"
          name="camera"
          onChange={handleCameraChange}
          value={cameraValue ?? ''}
          className="p-2 flex-1 min-w-[200px] appearance-none rounded-md text-base text-gray-900 outline outline-gray-300"
          disabled={disabled || cameras.length === 0}
        >
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.label || camera.id}
            </option>
          ))}
        </select>

        {/* Camera scan start/stop */}
        {isScanning ? (
          <button
            onClick={stopScanning}
            title="Stop scanning"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-red-50 text-red-600 outline outline-red-200"
            disabled={disabled}
          >
            <MdStop className="text-2xl" />
            {showLabels && label3}
          </button>
        ) : (
          <button
            onClick={startScanning}
            title="Start scanning"
            className={cn(
              'inline-flex items-center gap-1 px-3 py-2 rounded-md outline',
              disabled
                ? 'cursor-not-allowed opacity-50'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-900 outline-gray-300',
            )}
            disabled={disabled}
          >
            <MdOutlineQrCodeScanner className="text-2xl" />
            {showLabels && label1}
          </button>
        )}

        {/* File-based scanning */}
        <button
          onClick={handleUploadClick}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 outline outline-sky-200"
          title="Upload an image from your device"
          disabled={disabled || isProcessingFile}
        >
          <HiOutlinePhotograph className="text-2xl" />
          {showLabels && label2}
        </button>

        {isProcessingFile && (
          <span className="text-sm text-gray-600 animate-pulse">Scanning image…</span>
        )}
      </div>

      {/* Hidden input for file capture & upload */}
      <input
        ref={uploadPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChosen}
        disabled={disabled}
      />

      {/* Scanner / Preview container.
          - In camera mode: <video> is rendered here by html5-qrcode.
          - In file mode:  selected image preview is rendered here when scanFile(..., true) is used. */}
      <div
        id={SCANNER_ELEMENT_ID}
        ref={scannerRef}
        className={cn(isScanning ? 'm-2' : '', 'w-full')}
        style={{ maxWidth: '640px' }}
      />
    </div>
  );
};

export default Scanner;
