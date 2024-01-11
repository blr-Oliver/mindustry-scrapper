import {Config} from './execution';
import {fetchPages} from './fetch/fetch-pages';
import {fetchRoot} from './fetch/fetch-root';
import {parsePages} from './parse/parse-pages';
import {parseRoot} from './parse/parse-root';
import {collectPages} from './process/collect-pages';
import {pivotData} from './process/pivot-data';

export type OperationNames =
    'fetchRoot' |
    'parseRoot' |
    'fetchPages' |
    'parsePages' |
    'collectPages' |
    'pivotData'
    ;

export const OPERATION_ORDER: OperationNames[] = [
  'fetchRoot',
  'parseRoot',
  'fetchPages',
  'parsePages',
  'collectPages',
  'pivotData'
]

export type Operation = (entry: Config) => Promise<void>;


export const OPERATIONS: { [key in OperationNames]?: Operation } = {
  fetchRoot,
  parseRoot,
  fetchPages,
  parsePages,
  collectPages,
  pivotData
}
