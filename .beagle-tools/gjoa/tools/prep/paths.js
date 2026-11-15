import { join } from 'path';
import { homedir } from 'os';

export const REPO_ROOT = process.cwd();

export const SRC_DIR = join(REPO_ROOT, "src", "gjoa");

export const CONFIGS_DIR = join(REPO_ROOT, "configs");

export const BRANDING_SRC = join(REPO_ROOT, "configs", "branding", "gjoa");

export const PATCHES_DIR = join(REPO_ROOT, "patches");

export const ENGINE_DIR = join(REPO_ROOT, "engine");

export const ENGINE_BRANDING_DIR = join(ENGINE_DIR, "browser", "branding");

export const ENGINE_UNOFFICIAL_BRANDING = join(ENGINE_BRANDING_DIR, "unofficial");

export const CACHE_DIR = join(homedir(), ".cache", "gjoa");

export const SOURCES_CACHE = join(CACHE_DIR, "sources");
