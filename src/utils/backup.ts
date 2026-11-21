import JSZip from 'jszip';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FilePicker } from '@capawesome/capacitor-file-picker';

const FILES_ROOT = 'files';

function timestampName() {
  return `tinnedr-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
}

async function readDirectory(relativePath = ''): Promise<Array<{ path: string; data: string }>> {
  const files: Array<{ path: string; data: string }> = [];
  const listing = await Filesystem.readdir({
    path: relativePath,
    directory: Directory.Data,
  });

  for (const entry of listing.files) {
    const path = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (entry.type === 'directory') {
      files.push(...await readDirectory(path));
    } else {
      const file = await Filesystem.readFile({ path, directory: Directory.Data });
      if (typeof file.data === 'string') {
        files.push({ path, data: file.data });
      }
    }
  }

  return files;
}

export async function exportBackup(): Promise<void> {
  const zip = new JSZip();
  const { keys } = await Preferences.keys();
  const database: Record<string, unknown> = {};

  for (const key of keys) {
    const { value } = await Preferences.get({ key });
    database[key] = value === null ? null : JSON.parse(value ?? 'null');
  }

  zip.file('database.json', JSON.stringify(database, null, 2));

  try {
    const files = await readDirectory();
    for (const file of files) {
      zip.file(`${FILES_ROOT}/${file.path}`, file.data, { base64: true });
    }
  } catch (error: any) {
    if (!String(error?.message).toLowerCase().includes('not found')) {
      throw error;
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const filename = timestampName();

  if (Capacitor.getPlatform() === 'web') {
    const url = URL.createObjectURL(zipBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }

  const base64 = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
  const saved = await Filesystem.writeFile({
    path: filename,
    data: base64,
    directory: Directory.Cache,
  });

  await Share.share({
    title: 'Tinnedr backup',
    files: [saved.uri],
    dialogTitle: 'Save or share backup',
  });
}

export async function importBackup(archive: Blob | string): Promise<void> {
  const zip = await JSZip.loadAsync(archive, typeof archive === 'string' ? { base64: true } : undefined);
  const databaseFile = zip.file('database.json');
  if (!databaseFile) {
    throw new Error('This is not a valid Tinnedr backup: database.json is missing.');
  }

  const database = JSON.parse(await databaseFile.async('text')) as Record<string, unknown>;

  await Preferences.clear();
  for (const [key, value] of Object.entries(database)) {
    await Preferences.set({ key, value: JSON.stringify(value) });
  }

  try {
    await Filesystem.rmdir({ path: '', directory: Directory.Data, recursive: true });
  } catch (error: any) {
    if (!String(error?.message).toLowerCase().includes('not found')) {
      throw error;
    }
  }

  const fileEntries = zip.file(new RegExp(`^${FILES_ROOT}/.+`));
  for (const entry of fileEntries) {
    if (entry.dir) continue;
    const relativePath = entry.name.slice(FILES_ROOT.length + 1);
    const base64 = await entry.async('base64');
    await Filesystem.writeFile({
      path: relativePath,
      data: base64,
      directory: Directory.Data,
      recursive: true,
    });
  }
}

export async function pickAndImportBackup(): Promise<void> {
  const result = await FilePicker.pickFiles({
    types: ['application/zip', 'application/octet-stream'],
    readData: true,
    limit: 1,
  });

  const file = result.files[0];
  if (!file) return;

  if (file.data) {
    await importBackup(file.data);
  } else if (file.blob) {
    await importBackup(file.blob);
  } else if (file.webPath) {
    const response = await fetch(file.webPath);
    await importBackup(await response.blob());
  } else {
    throw new Error('The selected backup could not be read.');
  }
}
