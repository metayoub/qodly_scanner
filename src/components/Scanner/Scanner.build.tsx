import { useEnhancedNode } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC } from 'react';

import { IScannerProps } from './Scanner.config';
import { MdOutlineQrCodeScanner } from 'react-icons/md';

const Scanner: FC<IScannerProps> = ({ disabled, style, className, classNames = [] }) => {
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
      <div className="flex p-2 gap-2 items-center">
        <select
          className="p-2 w-full appearance-none rounded-md text-base text-gray-900 outline outline-gray-300"
          disabled={disabled}
        >
          <option>Virtual Camera</option>
        </select>
        <MdOutlineQrCodeScanner className="text-3xl cursor-pointer" />
      </div>

      <div className="m-2 bg-black flex items-center justify-center grow">
        <div className="border-4 border-white w-16 h-16"></div>
      </div>
    </div>
  );
};

export default Scanner;
