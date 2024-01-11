import * as fs from 'fs';
import {Config} from '../execution';
import {ensureExists, normalizeFileName, writeFile} from '../fetch/common';
import {loadDocument} from './common';
import {PageInfo} from './parse-root';

export interface Block {
  name: string;
  description?: string;
  properties: (PlainProperty | ListProperty)[];
}

export interface PropertyBase {
  name: string;
  section?: string;
}

export interface PlainProperty extends PropertyBase {
  value: string;
}

export interface ListProperty extends PropertyBase {
  listValue: ListPropertyItem[];
}

export interface ListPropertyItem {
  marker: string;
  value: string;
}

export async function parsePages(config: Config): Promise<void> {
  const toc: PageInfo[] = JSON.parse(await fs.promises.readFile(`${config.out}/json/toc.json`, {encoding: 'utf8'}));
  await ensureExists(`${config.out}/json/pages`);
  await Promise.all(toc.map(info => processPageInfo(info, config)));
}

async function processPageInfo(info: PageInfo, config: Config): Promise<void> {
  const fileName = normalizeFileName(info.name);
  const document = await loadDocument(`${config.out}/html/pages/${fileName}.html`);
  const item = parseItemFromDoc(info, document);
  return writeFile(`${config.out}/json/pages/${fileName}.json`, JSON.stringify(item, null, 2));
}

function parseItemFromDoc(info: PageInfo, document: Document): Block {
  const result: Block = {
    name: info.name,
    properties: []
  };
  const container = document.querySelector('.md-content>article.md-content__inner')!;
  container.normalize();
  let children = [...container.children];
  let headerBlock = children.find(el => el.matches('h1'));
  let descriptionBlock = children.find(el => el.matches('p'));
  let table = container.querySelector('table')!;
  if (headerBlock) {
    result.name = headerBlock.textContent!.trim();
  }
  if (descriptionBlock) {
    result.description = descriptionBlock.textContent!.trim();
  }
  parseProperties(table, result);
  return result;
}

function parseProperties(table: HTMLTableElement, result: Block) {
  const rows = [...table.tBodies].flatMap(body => [...body.rows]);
  let section: string = '';
  for (let i = 0; i < rows.length; ++i) {
    const cells = rows[i].cells;
    if ((cells.length === 1 || isEmpty(cells[1]))
        && cells[0].querySelector('strong') // avoid wiki bug with empty properties
    ) {
      section = cells[0].textContent!.trim();
    } else {
      const property: PropertyBase = {
        name: cells[0].textContent!.trim()
      };
      if (section)
        property.section = section;
      if (cells[1].querySelector('a')) {
        (property as ListProperty).listValue = parseList(cells[1]);
        result.properties.push(property as ListProperty);
      } else {
        (property as PlainProperty).value = cells[1].textContent?.trim() || '';
        result.properties.push(property as PlainProperty);
      }
    }
  }
}

function isEmpty(el: Element): boolean {
  return !el || !el.textContent || !el.textContent.trim();
}

function parseList(td: Element): ListPropertyItem[] {
  let parts = [...td.querySelectorAll('a')];
  let result: ListPropertyItem[] = []
  for (let part of parts) {
    const nextSibling = part.nextSibling;
    result.push({
      marker: part.href,
      value: nextSibling?.textContent!.trim() || ''
    });
  }
  return result;
}