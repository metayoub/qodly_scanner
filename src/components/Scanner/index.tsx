import config, { IScannerProps } from './Scanner.config';
import { T4DComponent, useEnhancedEditor } from '@ws-ui/webform-editor';
import Build from './Scanner.build';
import Render from './Scanner.render';

const Scanner: T4DComponent<IScannerProps> = (props) => {
  const { enabled } = useEnhancedEditor((state) => ({
    enabled: state.options.enabled,
  }));

  return enabled ? <Build {...props} /> : <Render {...props} />;
};

Scanner.craft = config.craft;
Scanner.info = config.info;
Scanner.defaultProps = config.defaultProps;

export default Scanner;
