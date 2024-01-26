import * as fs from 'fs';
import {Config} from '../execution';
import {writeFile} from '../fetch/common';
import {Block, ListProperty, PlainProperty} from '../parse/parse-pages';

export async function pivotData(config: Config): Promise<void> {
  const blocks: Block[] = JSON.parse(await fs.promises.readFile(`${config.out}/json/packed.json`, {encoding: 'utf8'}));
  const data = analyzeAndPivot(blocks);
  return writeFile(`${config.out}/json/pivot.json`, JSON.stringify(data, null, 2));
}

interface PivotedBlock {
  name: string;
  description?: string;
  properties: { [name: string]: string };
  listProperties: { [name: string]: { [shortMarker: string]: string } }
}

function analyzeAndPivot(blocks: Block[]) {
  const stats = new Statistics(blocks);
  stats.collect();
  return blocks
      .map(block => pivotBlock(block, stats))
      .map(pivoted => flattenBlock(pivoted, stats));
}

function collectUniqueValues<K extends string, T extends { [P in K]: string }>(key: K, items: T[]): string[] {
  return Object.keys(
      items.reduce((hash, prop) => (hash[prop[key]] = true, hash), {} as { [key: string]: true })
  ).sort();
}

function pivotBlock(block: Block, stats: Statistics): PivotedBlock {
  let result: PivotedBlock = {
    name: block.name,
    description: block.description,
    properties: {},
    listProperties: {}
  }
  for (let property of block.properties) {
    if ('value' in property) {
      const plainProperty = property as PlainProperty;
      const value = plainProperty.value;
      result.properties[plainProperty.name] = (!value || value === '/') ? 'TRUE' : value;
    } else if ('listValue' in property) {
      const listProperty = property as ListProperty;
      const map: { [shortMarker: string]: string } = result.listProperties[listProperty.name] = {};
      for (let item of listProperty.listValue) {
        const value = item.value;
        const shortMarker = stats.markerMapping[item.marker];
        map[shortMarker] = (!value || value === '/') ? 'TRUE' : value;
      }
    }
  }
  return result;
}

function flattenBlock(block: PivotedBlock, stats: Statistics): { [key: string]: string | null } {
  const result: { [key: string]: string | null } = {
    name: block.name,
    description: block.description || null
  };
  for (let plainName of stats.plainProperties) {
    result[plainName] = plainName in block.properties ? block.properties[plainName] : null;
  }
  for (let listName of stats.listProperties) {
    const listMarkers = stats.listPropertyMarkers[listName];
    for (let marker of listMarkers) {
      const key = `${listName}:${marker}`;
      result[key] = (listName in block.listProperties) && (marker in block.listProperties[listName]) ? block.listProperties[listName][marker] : null;
    }
  }
  return result;
}

class Statistics {
  plainProperties: string[] = [];
  listProperties: string[] = [];
  markerMapping: { [name: string]: string } = {};
  listPropertyMarkers: { [property: string]: string[] } = {};
  maxLengths: { [property: string]: number } = {};

  constructor(public blocks: Block[]) {
  }

  collect() {
    let allProperties = this.blocks.flatMap(block => block.properties);
    this.plainProperties = collectUniqueValues('name', allProperties.filter(property => 'value' in property));
    let listPropertyValues = allProperties.filter(property => 'listValue' in property) as ListProperty[];
    this.listProperties = collectUniqueValues('name', listPropertyValues);
    let allListPropertyItems = listPropertyValues.flatMap(property => property.listValue);
    const allMarkers = collectUniqueValues('marker', allListPropertyItems);
    allMarkers.reduce((hash, marker) => (hash[marker] = this.getShortMarker(marker), hash), this.markerMapping);
    this.listProperties.forEach(listProperty => {
      this.listPropertyMarkers[listProperty] = this.collectShortMarkers(listProperty, listPropertyValues);
      this.maxLengths[listProperty] = this.findMaxLength(listProperty, listPropertyValues);
    });
  }

  private getShortMarker(marker: string): string {
    const lastPart = marker.slice(marker.lastIndexOf('/') + 1);
    return lastPart.slice(lastPart.indexOf('-') + 1);
  }

  private collectShortMarkers(listProperty: string, listPropertyValues: ListProperty[]) {
    let longMarkers = collectUniqueValues('marker', listPropertyValues
        .filter(value => value.name === listProperty)
        .flatMap(value => value.listValue));
    return longMarkers.map(marker => this.markerMapping[marker]).sort();
  }
  private findMaxLength(listProperty: string, listPropertyValues: ListProperty[]): number {
    return Math.max(...listPropertyValues
        .filter(value => value.name === listProperty)
        .map(value => value.listValue.length));
  }
}