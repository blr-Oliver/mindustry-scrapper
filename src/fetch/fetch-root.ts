import {Config} from '../execution';
import {ensureExists, writeFile} from './common';
import {fetchHtmlRaw} from './fetch';

export async function fetchRoot(config: Config): Promise<void> {
  let text = await fetchHtmlRaw(config.host + config.path);
  await ensureExists(`${config.out}/html`);
  return writeFile(`${config.out}/html/root.html`, text);
}