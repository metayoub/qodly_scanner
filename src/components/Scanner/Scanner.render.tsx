import { useRenderer, useSources } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { type CameraDevice, Html5Qrcode } from 'html5-qrcode';
import { IScannerProps } from './Scanner.config';
import { MdOutlineQrCodeScanner, MdStop } from 'react-icons/md';

const Scanner: FC<IScannerProps> = ({
  fps,
  qrBoxSize,
  disableFlip,
  style,
  className,
  classNames = [],
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
    if (!scannerRef.current || isScanning) return;

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
    // laod cameras
    Html5Qrcode.getCameras().then((devices) => {
      if (devices?.length) {
        setCameras(devices);
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
    <div ref={connect} style={style} className={cn(className, classNames, 'flex flex-col')}>
      <div className="flex p-2 gap-2 items-center">
        <select
          id="camera"
          name="camera"
          onChange={handleCameraChange}
          value={cameraValue ?? ''}
          className="p-2 w-full appearance-none rounded-md text-base text-gray-900 outline outline-1 outline-gray-300"
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
          <MdOutlineQrCodeScanner onClick={startScanning} className="text-3xl cursor-pointer" />
        )}
      </div>
      <div id="qr-code-scanner" className={isScanning ? 'm-2' : ''} ref={scannerRef} />
    </div>
  );
};

export default Scanner;
