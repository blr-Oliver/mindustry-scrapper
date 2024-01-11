import {Config} from './execution';
import {fetchPages} from './fetch/fetch-pages';
import {fetchRoot} from './fetch/fetch-root';
import {parseRoot} from './parse/parse-root';

export type OperationNames =
    'fetchRoot' |
    'parseRoot' |
    'fetchPages' |
    'parsePages' |
    'collectPages'
    ;

export const OPERATION_ORDER: OperationNames[] = [
  'fetchRoot',
  'parseRoot',
  'fetchPages',
  'parsePages',
  'collectPages'
]

export type Operation = (entry: Config) => Promise<void>;


export const OPERATIONS: { [key in OperationNames]?: Operation } = {
  fetchRoot,
  parseRoot,
  fetchPages
}
