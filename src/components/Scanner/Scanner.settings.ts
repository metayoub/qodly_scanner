import { ESetting, TSetting } from '@ws-ui/webform-editor';
import { BASIC_SETTINGS, DEFAULT_SETTINGS, load } from '@ws-ui/webform-editor';

const commonSettings: TSetting[] = [
  {
    key: 'fps',
    label: 'FPS',
    type: ESetting.NUMBER_FIELD,
    defaultValue: 10,
  },
  {
    key: 'qrBoxSize',
    label: 'QR Box Size',
    type: ESetting.NUMBER_FIELD,
    defaultValue: 150,
  },
  {
    key: 'disableFlip',
    label: 'Disable Flip',
    type: ESetting.CHECKBOX,
  },
  {
    key: 'scanOnStart',
    label: 'Launch on Start',
    type: ESetting.CHECKBOX,
    defaultValue: false,
  },
  {
    key: 'showLabels',
    label: 'Show Labels',
    type: ESetting.CHECKBOX,
    defaultValue: true,
  },
  {
    key: 'label1',
    label: 'Label 1',
    type: ESetting.TEXT_FIELD,
  },
  {
    key: 'label2',
    label: 'Label 2',
    type: ESetting.TEXT_FIELD,
  },
  {
    key: 'label3',
    label: 'Label 3',
    type: ESetting.TEXT_FIELD,
  },
  {
    key: 'allowedCodeFormats',
    label: 'Allowed Code Formats',
    type: ESetting.DATAGRID,
    titleProperty: 'format',
    data: [
      {
        key: 'format',
        label: 'Format',
        type: ESetting.SELECT,
        options: [
          { label: 'QR_CODE', value: 'QR_CODE' },
          { label: 'AZTEC', value: 'AZTEC' },
          { label: 'CODABAR', value: 'CODABAR' },
          { label: 'CODE_39', value: 'CODE_39' },
          { label: 'CODE_93', value: 'CODE_93' },
          { label: 'CODE_128', value: 'CODE_128' },
          { label: 'DATA_MATRIX', value: 'DATA_MATRIX' },
          { label: 'MAXICODE', value: 'MAXICODE' },
          { label: 'ITF', value: 'ITF' },
          { label: 'EAN_13', value: 'EAN_13' },
          { label: 'EAN_8', value: 'EAN_8' },
          { label: 'PDF_417', value: 'PDF_417' },
          { label: 'RSS_14', value: 'RSS_14' },
          { label: 'RSS_EXPANDED', value: 'RSS_EXPANDED' },
          { label: 'UPC_A', value: 'UPC_A' },
          { label: 'UPC_E', value: 'UPC_E' },
          {
            label: 'UPC_EAN_EXTENSION',
            value: 'UPC_EAN_EXTENSION',
          },
        ],
      },
    ],
  },
];

const Settings: TSetting[] = [
  {
    key: 'properties',
    label: 'Properties',
    type: ESetting.GROUP,
    components: commonSettings,
  },
  ...load(DEFAULT_SETTINGS).filter('display'),
];

export const BasicSettings: TSetting[] = [
  ...commonSettings,
  ...load(BASIC_SETTINGS).filter('style.overflow', 'display'),
];

export default Settings;
