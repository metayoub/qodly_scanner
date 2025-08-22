import { useRenderer, useSources } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, type CameraDevice } from 'html5-qrcode';
import { IScannerProps } from './Scanner.config';
import { MdOutlineQrCodeScanner, MdStop } from 'react-icons/md';

const SCANNER_ELEMENT_ID = 'qr-code-scanner';

const Scanner: FC<IScannerProps> = ({
  fps = 10,
  scanOnStart = false,
  qrBoxSize = 250,
  disableFlip = false,
  style,
  className,
  classNames = [],
  disabled,
}) => {
  const { connect, emit } = useRenderer();

  // DOM & SDK refs
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Auto-start & cancel control
  const autoStartedRef = useRef(false); // ensure auto-start runs only once per mount
  const startSeq = useRef(0); // cancel token for in-flight start/resume

  // UI & devices
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [camId, setCamId] = useState<CameraDevice | null>(null);
  const [cameraValue, setCameraValue] = useState<string | null>(null);

  // Data binding
  const {
    sources: { datasource: ds },
  } = useSources();

  // Html5Qrcode config
  const constraints = useMemo(
    () => ({ fps, qrbox: qrBoxSize, disableFlip }),
    [fps, qrBoxSize, disableFlip],
  );

  const onScanSuccess = useCallback(
    async (decodedText: string) => {
      try {
        await ds.setValue(null, decodedText);
        emit('onscansuccess', { value: decodedText });
      } finally {
        // Pause so user can press "Start" to scan again
        html5QrCodeRef.current?.pause(true);
        setIsScanning(false);
      }
    },
    [ds, emit],
  );

  const onScanFailure = useCallback((_error: string) => {
    // Intentionally quiet; continuous scan errors are noisy.
  }, []);

  const ensureInstance = () => {
    let inst = html5QrCodeRef.current;
    if (!inst) {
      inst = new Html5Qrcode(SCANNER_ELEMENT_ID);
      html5QrCodeRef.current = inst;
    }
    return inst;
  };

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
        if (mySeq !== startSeq.current) return; // canceled meanwhile
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

      // If Stop was pressed while awaiting permissions, cancel & clean up
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
    // Cancel any in-flight start/resume and prevent auto-start rerun
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
        await inst.stop(); // must stop before clear
      }
      await inst.clear();
    } catch (err) {
      console.error('Failed to stop QR scanner:', err);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Load cameras once
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
          // Cancel any in-flight starts before switching
          ++startSeq.current;
          await inst.stop();
          await inst.start(nextCam.id, constraints as any, onScanSuccess, onScanFailure);
          setIsScanning(true);
        }
        // If not started, we just updated camId; user can press Start later
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
      <div className="flex p-2 gap-2 items-center">
        <select
          id="camera"
          name="camera"
          onChange={handleCameraChange}
          value={cameraValue ?? ''}
          className="p-2 w-full appearance-none rounded-md text-base text-gray-900 outline outline-gray-300"
          disabled={disabled || cameras.length === 0}
        >
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.label || camera.id}
            </option>
          ))}
        </select>

        {isScanning ? (
          <MdStop
            onClick={stopScanning}
            className="text-3xl text-red-500 cursor-pointer"
            title="Stop scanning"
          />
        ) : (
          <MdOutlineQrCodeScanner
            onClick={startScanning}
            className={cn(disabled ? 'cursor-not-allowed' : 'cursor-pointer', 'text-3xl')}
            title="Start scanning"
          />
        )}
      </div>

      {/* Give the container width so the <video> can size properly */}
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
