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
  },
  {
    key: 'disableFlip',
    label: 'Disable Flip',
    type: ESetting.CHECKBOX,
  },
];

const Settings: TSetting[] = [
  {
    key: 'properties',
    label: 'Properties',
    type: ESetting.GROUP,
    components: commonSettings,
  },
  ...DEFAULT_SETTINGS,
];

export const BasicSettings: TSetting[] = [
  ...commonSettings,
  ...load(BASIC_SETTINGS).filter('style.overflow'),
];

export default Settings;
