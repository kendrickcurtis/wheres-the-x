import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const USER_AGENT = 'WheresTheXFlagFetcher/1.0 (+https://github.com/kendrickcurtis/wheres-the-x)';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcPath = path.join(rootDir, 'src/data/enhanced-cities.json');
const publicPath = path.join(rootDir, 'public/data/enhanced-cities.json');

const rawCities = await fs.readFile(srcPath, 'utf8');
const enhancedCities = JSON.parse(rawCities);

function buildWikipediaSlug(value) {
  if (!value) {
    return null;
  }
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  const underscored = decoded.replace(/\s+/g, '_');
  return encodeURIComponent(underscored);
}

function ensureWikipediaUrl(city) {
  if (city.wikipediaUrl) {
    return city.wikipediaUrl;
  }
  const slug = buildWikipediaSlug(city.name);
  if (!slug) {
    return null;
  }
  const derived = `https://en.wikipedia.org/wiki/${slug}`;
  city.wikipediaUrl = derived;
  return derived;
}

const entityCache = new Map();

const rankPriority = (rank) => {
  if (rank === 'preferred') return 0;
  if (rank === 'normal' || !rank) return 1;
  return 2;
};

async function fetchJson(url, description) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${description}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getTitleFromWikipediaUrl(wikipediaUrl) {
  if (!wikipediaUrl) {
    return null;
  }
  const parsed = new URL(wikipediaUrl);
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (!parts.length) {
    return null;
  }
  return decodeURIComponent(parts[parts.length - 1]);
}

async function getEntityIdFromWikipedia(wikipediaUrl) {
  const title = getTitleFromWikipediaUrl(wikipediaUrl);
  if (!title) {
    return null;
  }

  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&titles=${encodeURIComponent(title)}&format=json&formatversion=2`;
  const json = await fetchJson(apiUrl, `pageprops for ${title}`);
  const pages = json.query?.pages;
  if (!Array.isArray(pages) || !pages.length) {
    return null;
  }
  const firstPage = pages[0];
  if (!firstPage || firstPage.missing) {
    return null;
  }
  return firstPage?.pageprops?.wikibase_item || null;
}

async function getEntityById(entityId) {
  if (!entityId) {
    return null;
  }
  if (entityCache.has(entityId)) {
    return entityCache.get(entityId);
  }

  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
  const json = await fetchJson(entityUrl, `entity ${entityId}`);
  const entity = json.entities?.[entityId];
  if (entity) {
    entityCache.set(entityId, entity);
  }
  return entity;
}

function getFirstEntityId(statements) {
  if (!statements) {
    return null;
  }
  for (const statement of statements) {
    const id = statement?.mainsnak?.datavalue?.value?.id;
    if (id) {
      return id;
    }
  }
  return null;
}

function getCommonsMedia(entity, properties) {
  for (const property of properties) {
    const statements = entity?.claims?.[property];
    if (!statements) continue;
    for (const statement of statements) {
      const value = statement?.mainsnak?.datavalue?.value;
      if (typeof value === 'string' && value.trim().length > 0) {
        return { fileName: value.trim(), property };
      }
    }
  }
  return null;
}

function normaliseFileName(fileName) {
  return encodeURIComponent(fileName.replace(/ /g, '_'));
}

function makeCommonsUrl(fileName) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${normaliseFileName(fileName)}`;
}

function getRegionCandidateIds(entity, countryId) {
  const statements = entity?.claims?.P131;
  if (!statements) {
    return [];
  }

  const hasEnd = (statement) => Boolean(statement?.qualifiers?.P582);

  const sorted = [...statements].sort((a, b) => {
    const rankDiff = rankPriority(a.rank) - rankPriority(b.rank);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    const endDiff = Number(hasEnd(a)) - Number(hasEnd(b));
    if (endDiff !== 0) {
      return endDiff;
    }
    return 0;
  });
  const orderedIds = [];
  const seen = new Set();

  for (const statement of sorted) {
    const id = statement?.mainsnak?.datavalue?.value?.id;
    if (!id) continue;
    if (id === entity.id) continue;
    if (countryId && id === countryId) continue;
    if (seen.has(id)) continue;

    seen.add(id);
    orderedIds.push(id);
  }

  return orderedIds;
}

async function resolveRegionMedia(city, cityEntity) {
  const countryId = getFirstEntityId(cityEntity?.claims?.P17);
  const candidateIds = getRegionCandidateIds(cityEntity, countryId);

  for (const candidateId of candidateIds) {
    const regionEntity = await getEntityById(candidateId);
    if (!regionEntity) continue;
    const media = getCommonsMedia(regionEntity, ['P41', 'P94', 'P158']);
    if (media) {
      return { ...media, regionId: candidateId, regionLabel: regionEntity?.labels?.en?.value || candidateId };
    }
  }

  // Fallback: try using region name from data if available
  const regionSlug = buildWikipediaSlug(city.region);
  if (regionSlug) {
    const regionUrl = `https://en.wikipedia.org/wiki/${regionSlug}`;
    const regionEntityId = await getEntityIdFromWikipedia(regionUrl);
    if (regionEntityId) {
      const regionEntity = await getEntityById(regionEntityId);
      if (regionEntity) {
        const media = getCommonsMedia(regionEntity, ['P41', 'P94', 'P158']);
        if (media) {
          return { ...media, regionId: regionEntityId, regionLabel: regionEntity?.labels?.en?.value || regionEntityId };
        }
      }
    }
  }

  return null;
}

function selectCityMedia(cityEntity) {
  const flag = getCommonsMedia(cityEntity, ['P41']);
  const coat = getCommonsMedia(cityEntity, ['P94']);
  const seal = getCommonsMedia(cityEntity, ['P158']);

  return {
    primary: flag || coat || seal || null,
    flag,
    coat,
    seal
  };
}

const missingCityFlags = [];
const missingRegionFlags = [];

for (const city of enhancedCities) {
  console.log(`Processing ${city.name}, ${city.country}`);

  const wikiUrl = ensureWikipediaUrl(city);
  if (!wikiUrl) {
    console.warn(`  Unable to determine Wikipedia URL for ${city.name}`);
    missingCityFlags.push(city.name);
    missingRegionFlags.push(city.name);
    continue;
  }

  let cityEntityId;
  try {
    cityEntityId = await getEntityIdFromWikipedia(wikiUrl);
  } catch (error) {
    console.error(`  Failed to resolve Wikidata ID: ${error.message}`);
    missingCityFlags.push(city.name);
    missingRegionFlags.push(city.name);
    continue;
  }

  if (!cityEntityId) {
    console.warn(`  No Wikidata ID found for ${city.name}`);
    missingCityFlags.push(city.name);
    missingRegionFlags.push(city.name);
    continue;
  }

  const cityEntity = await getEntityById(cityEntityId);
  if (!cityEntity) {
    console.warn(`  Failed to load entity ${cityEntityId} for ${city.name}`);
    missingCityFlags.push(city.name);
    missingRegionFlags.push(city.name);
    continue;
  }

  const cityMedia = selectCityMedia(cityEntity);
  if (cityMedia.primary) {
    city.cityFlag = makeCommonsUrl(cityMedia.primary.fileName);
  } else {
    console.warn(`  Missing city flag/coat for ${city.name}`);
    delete city.cityFlag;
    missingCityFlags.push(city.name);
  }

  const regionMedia = await resolveRegionMedia(city, cityEntity);
  if (regionMedia) {
    city.regionFlag = makeCommonsUrl(regionMedia.fileName);
  } else if (cityMedia.flag && cityMedia.coat && !city.regionFlag) {
    // As a last resort, use coat of arms if it exists alongside a flag to ensure two distinct visuals
    city.regionFlag = makeCommonsUrl(cityMedia.coat.fileName);
    console.warn(`  Used coat of arms fallback for region of ${city.name}`);
  } else {
    console.warn(`  Missing region flag for ${city.name}`);
    delete city.regionFlag;
    missingRegionFlags.push(city.name);
  }
}

await fs.writeFile(srcPath, `${JSON.stringify(enhancedCities, null, 2)}\n`);
await fs.writeFile(publicPath, `${JSON.stringify(enhancedCities, null, 2)}\n`);

console.log('\nFlag scraping complete.');
console.log(`Cities without dedicated city insignia: ${missingCityFlags.length ? missingCityFlags.join(', ') : 'None'}`);
console.log(`Cities without region insignia: ${missingRegionFlags.length ? missingRegionFlags.join(', ') : 'None'}`);
