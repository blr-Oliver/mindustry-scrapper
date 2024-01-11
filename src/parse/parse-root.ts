import {Config} from '../execution';
import {ensureExists, writeFile} from '../fetch/common';
import {loadDocument} from './common';

export interface PageInfo {
  name: string;
  href: string;
}

export async function parseRoot(config: Config): Promise<void> {
  let document = await loadDocument(`${config.out}/html/root.html`);
  let contents = parseContentsFromDoc(document);
  await ensureExists(`${config.out}/json`);
  return writeFile(`${config.out}/json/toc.json`, JSON.stringify(contents, null, 2));
}

function parseContentsFromDoc(document: Document): PageInfo[] {
  const sections = document.querySelectorAll('main.md-main .md-sidebar.md-sidebar--primary nav.md-nav--primary>ul.md-nav__list>li.md-nav__item');
  const blocksSection = [...sections].find(section => getSectionLabel(section) === 'Blocks')!;
  const list = [...blocksSection.querySelectorAll('nav.md-nav>ul.md-nav__list>li.md-nav__item')];
  return list.map(li => parseSingleItem(li));
}

function getSectionLabel(li: Element): string | undefined {
  let label = li.querySelector('label');
  return label ? label.textContent!.trim() : li.textContent!.trim();
}

function parseSingleItem(li: Element): PageInfo {
  const anchor = li.querySelector('a')!;
  return {
    name: anchor.textContent!.trim(),
    href: anchor.href
  };
}