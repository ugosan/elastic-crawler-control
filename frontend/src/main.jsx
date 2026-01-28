import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';


import { appendIconComponentCache } from '@elastic/eui/es/components/icon/icon';
import { icon as EuiIconPlay } from '@elastic/eui/es/components/icon/assets/play';
import { icon as EuiIconCheck } from '@elastic/eui/es/components/icon/assets/check';
import { icon as EuiIconLogoElastic } from '@elastic/eui/es/components/icon/assets/logo_elastic';
import { icon as EuiIconDocumentation } from '@elastic/eui/es/components/icon/assets/documentation';
import { icon as EuiIconCross } from '@elastic/eui/es/components/icon/assets/cross';
import { icon as EuiIconFullScreen } from '@elastic/eui/es/components/icon/assets/full_screen';
import { icon as EuiIconFullScreenExit } from '@elastic/eui/es/components/icon/assets/full_screen_exit';
import { icon as EuiIconLock } from '@elastic/eui/es/components/icon/assets/lock';
import { icon as EuiIconEye } from '@elastic/eui/es/components/icon/assets/eye';
import { icon as EuiIconEmpty } from '@elastic/eui/es/components/icon/assets/empty';

appendIconComponentCache({
  play: EuiIconPlay,
  check: EuiIconCheck,
  logoElastic: EuiIconLogoElastic,
  documentation: EuiIconDocumentation,
  cross: EuiIconCross,
  fullScreen: EuiIconFullScreen,
  fullScreenExit: EuiIconFullScreenExit,
  lock: EuiIconLock,
  eye: EuiIconEye,
  empty: EuiIconEmpty
});


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
