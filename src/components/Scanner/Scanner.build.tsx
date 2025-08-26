import { useEnhancedNode } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC } from 'react';

import { IScannerProps } from './Scanner.config';
import { MdOutlineQrCodeScanner } from 'react-icons/md';
import { HiOutlinePhotograph } from 'react-icons/hi';

const Scanner: FC<IScannerProps> = ({
  disabled,
  showLabels = true,
  label1,
  label2,
  qrBoxSize = 150,
  style,
  className,
  classNames = [],
}) => {
  const {
    connectors: { connect },
  } = useEnhancedNode();

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
        <select
          className="p-2 flex-1 min-w-[150px] appearance-none rounded-md text-base text-gray-900 outline outline-gray-300"
          disabled={disabled}
        >
          <option>Virtual Camera</option>
        </select>
        <button
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
        <button
          className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 outline outline-sky-200"
          title="Upload an image from your device"
          disabled={disabled}
        >
          <HiOutlinePhotograph className="text-2xl" />
          {showLabels && label2}
        </button>
      </div>

      <div className="m-2 bg-black flex items-center justify-center grow">
        <div
          className="border-4 border-white"
          style={{ width: `${qrBoxSize}px`, height: `${qrBoxSize}px` }}
        ></div>
      </div>
    </div>
  );
};

export default Scanner;
