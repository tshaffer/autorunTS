import {
  EventType,
  ButtonPanelName,
} from '@brightsign/bscore';

import { BSP } from '../app/bsp';

import {
  ArEventType,
} from '../types/index';

import PlatformService from '../platform';

export function addEventHandlers(bsp : any) {
  PlatformService.default.AddEventHandlers(bsp);
}



  