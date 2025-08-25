import { EComponentKind, T4DComponentConfig } from '@ws-ui/webform-editor';
import { Settings } from '@ws-ui/webform-editor';
import { MdOutlineQrCodeScanner } from 'react-icons/md';

import ScannerSettings, { BasicSettings } from './Scanner.settings';

export default {
  craft: {
    displayName: 'Scanner',
    kind: EComponentKind.BASIC,
    props: {
      name: '',
      classNames: [],
      events: [],
    },
    related: {
      settings: Settings(ScannerSettings, BasicSettings),
    },
  },
  info: {
    settings: ScannerSettings,
    displayName: 'Scanner',
    exposed: true,
    icon: MdOutlineQrCodeScanner,
    events: [
      {
        label: 'On Scan Success',
        value: 'onscansuccess',
      },
    ],
    datasources: {
      accept: ['string'],
    },
  },
  defaultProps: {
    scanOnStart: false,
    fps: 10,
    qrBoxSize: 250,
    showLabels: true,
    label1: 'Scan with Camera',
    label2: 'Upload picture',
    label3: 'Stop',
    style: {
      borderWidth: '1px',
      borderColor: '#d1d5db',
      minHeight: '250px',
      borderRadius: '8px',
      width: '250px',
      height: 'fit-content',
      color: '#3b82f6ff',
    },
  },
} as T4DComponentConfig<IScannerProps>;

export interface IScannerProps extends webforms.ComponentProps {
  fps: number;
  qrBoxSize: number;
  disableFlip?: boolean;
  scanOnStart?: boolean;
  showLabels?: boolean;
  label1?: string;
  label2?: string;
  label3?: string;
  allowedCodeFormats?: [{ format: string }];
}
