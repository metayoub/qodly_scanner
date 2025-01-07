import { useEnhancedNode } from '@ws-ui/webform-editor';
import cn from 'classnames';
import { FC } from 'react';

import { IScannerProps } from './Scanner.config';
import { MdOutlineQrCodeScanner } from 'react-icons/md';

const Scanner: FC<IScannerProps> = ({ style, className, classNames = [] }) => {
  const {
    connectors: { connect },
  } = useEnhancedNode();

  return (
    <div ref={connect} style={style} className={cn(className, classNames)}>
      <div className="flex p-2 gap-2 items-center">
        <select className="p-2 flex-grow border rounded-md text-sm text-gray-700 outline-none focus:ring focus:ring-indigo-300">
          <option>Virtual Camera</option>
        </select>
        <MdOutlineQrCodeScanner className="text-3xl text-blue-500 cursor-pointer" />
      </div>

      <div className="mx-2 bg-black flex items-center justify-center h-48">
        <div className="border-4 border-white w-16 h-16"></div>
      </div>
    </div>
  );
};

export default Scanner;
