import * as fs from 'fs';
import {Config} from '../execution';
import {normalizeFileName, writeFile} from '../fetch/common';
import {Block} from '../parse/parse-pages';
import {PageInfo} from '../parse/parse-root';

export async function collectPages(config: Config): Promise<void> {
  const toc: PageInfo[] = JSON.parse(await fs.promises.readFile(`${config.out}/json/toc.json`, {encoding: 'utf8'}));
  let result: Block[] = Array(toc.length);
  await Promise.all(toc.map((info, i) => loadBlock(config, info, i, result)));
  return writeFile(`${config.out}/json/packed.json`, JSON.stringify(result, null, 2));
}

async function loadBlock(config: Config, info: PageInfo, i: number, result: Block[]): Promise<void> {
  const fileName = normalizeFileName(info.name);
  const block: Block = JSON.parse(await fs.promises.readFile(`${config.out}/json/pages/${fileName}.json`, {encoding: 'utf8'}));
  result[i] = block;
}