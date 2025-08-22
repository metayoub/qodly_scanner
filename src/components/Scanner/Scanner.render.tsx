import { useRenderer, useSources } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { type CameraDevice, Html5Qrcode } from 'html5-qrcode';
import { IScannerProps } from './Scanner.config';
import { MdOutlineQrCodeScanner, MdStop } from 'react-icons/md';

const Scanner: FC<IScannerProps> = ({
  fps,
  scanOnStart,
  qrBoxSize,
  disableFlip,
  style,
  className,
  classNames = [],
  disabled,
}) => {
  const { connect, emit } = useRenderer();
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [camId, setCamId] = useState<CameraDevice | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [cameraValue, setCameraValue] = useState<string | null>(null);
  const {
    sources: { datasource: ds },
  } = useSources();

  const onScanSuccess = useCallback(
    async (decodedText: string) => {
      await ds.setValue(null, decodedText);
      emit('onscansuccess', {
        value: decodedText,
      });
      html5QrCodeRef.current?.pause(true);
      setIsScanning(false);
    },
    [ds, emit],
  );

  const onScanFailure = (error: string) => {
    console.error('Failed to start QR scanner:', error);
  };

  const startScanning = async () => {
    if (!scannerRef.current || isScanning || disabled) return;

    try {
      const html5QrCode = new Html5Qrcode(scannerRef.current.id);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' }, // Rear camera
        { fps, qrbox: qrBoxSize, disableFlip },
        onScanSuccess,
        onScanFailure,
      );
      setIsScanning(true); // Update state to "Stop Scanning"
    } catch (error) {
      console.error('Failed to start QR scanner:', error);
    }
  };

  const stopScanning = async () => {
    if (!html5QrCodeRef.current) return;

    try {
      await html5QrCodeRef.current.stop();
      await html5QrCodeRef.current.clear();
      setIsScanning(false); // Update state to "Start Scanning"
    } catch (error) {
      console.error('Failed to stop QR scanner:', error);
    }
  };

  useEffect(() => {
    // load cameras
    Html5Qrcode.getCameras().then((devices) => {
      if (devices?.length) {
        setCameras(devices);
        setCamId(devices[0]); // automatically set default camera
      }
    });

    // Clean up the scanner on component unmount
    return () => {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current
            .stop()
            .then(() => html5QrCodeRef.current?.clear())
            .catch((error) => {
              console.error('Failed to stop QR scanner on unmount:', error);
            });
        } else {
          html5QrCodeRef.current.clear();
        }
      }
    };
  }, []);

  // automatically start scanning
  useEffect(() => {
    if (scanOnStart && camId && !isScanning && !disabled) {
      startScanning();
    }
  }, [scanOnStart, camId]);

  // set camera value from id
  useEffect(() => {
    if (camId) {
      setCameraValue(camId.id);
    }
  }, [camId]);

  useEffect(() => {
    if (cameraValue === null) return;
    if (cameraValue === camId?.id) {
      return;
    }

    const cam = cameras.find((cam) => cam.id === cameraValue);

    if (html5QrCodeRef.current && isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        setCamId(cam);
        html5QrCodeRef.current?.start(
          cam.id,
          { fps, qrbox: { width: qrBoxSize, height: qrBoxSize }, disableFlip },
          (decodedText) => {
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            onScanFailure(errorMessage);
          },
        );
      });
    } else {
      setCamId(cam);
    }
  }, [cameraValue]);

  const handleCameraChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCameraId = event.target.value;
    setCameraValue(selectedCameraId);
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
              {camera.label}
            </option>
          ))}
        </select>
        {isScanning ? (
          <MdStop onClick={stopScanning} className="text-3xl text-red-500 cursor-pointer" />
        ) : (
          <MdOutlineQrCodeScanner
            onClick={startScanning}
            className={cn(disabled ? 'cursor-not-allowed' : 'cursor-pointer', 'text-3xl ')}
          />
        )}
      </div>
      <div id="qr-code-scanner" className={isScanning ? 'm-2' : ''} ref={scannerRef} />
    </div>
  );
};

export default Scanner;
