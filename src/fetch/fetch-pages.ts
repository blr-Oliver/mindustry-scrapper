import * as fs from 'fs';
import {Config} from '../execution';
import {PageInfo} from '../parse/parse-root';
import {ensureExists, normalizeFileName, writeFile} from './common';
import {fetchHtmlRaw} from './fetch';
import {parallelLimit} from './FloodGate';

export async function fetchPages(config: Config): Promise<void> {
  const toc: PageInfo[] = JSON.parse(await fs.promises.readFile(`${config.out}/json/toc.json`, {encoding: 'utf8'}));
  await ensureExists(`${config.out}/html/pages`);
  const fetch = parallelLimit(fetchHtmlRaw, 4, 300);
  await Promise.all(toc.map(info => processPageInfo(info, config, fetch)));
}

async function processPageInfo(info: PageInfo, config: Config, fetch: typeof fetchHtmlRaw): Promise<void> {
  const text = await fetch(config.host + config.path + info.href);
  const fileName = normalizeFileName(info.name);
  return writeFile(`${config.out}/html/pages/${fileName}.html`, text);
}