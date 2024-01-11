import * as fs from 'fs';
import {JSDOM} from 'jsdom';

export async function loadDocument(file: string): Promise<Document> {
  const content = await fs.promises.readFile(file, {encoding: 'utf8'});
  return new JSDOM(content).window.document;
}
