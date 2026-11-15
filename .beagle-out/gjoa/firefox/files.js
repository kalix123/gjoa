
export function profile_dir() {
  return Services.dirsvc.get("ProfD", Ci.nsIFile).path;
}

export function profile_path(subpath) {
  return PathUtils.join(profile_dir(), subpath);
}

export function join_path(a, b) {
  return PathUtils.join(a, b);
}

export function parent_path(path) {
  return PathUtils.parent(path);
}

export function read_text(path) {
  return IOUtils.readUTF8(path);
}

export function write_text(path, data) {
  return IOUtils.writeUTF8(path, data);
}

export function exists_p(path) {
  return IOUtils.exists(path).catch((__e) => false);
}

export function stat_file(path) {
  return IOUtils.stat(path).then((s) => { const result = {size: s.size, lastModified: s.lastModified};
return result; }).catch((__e) => null);
}

export function ensure_dir(path) {
  return IOUtils.makeDirectory(path, {ignoreExisting: true, createAncestors: true});
}

export function remove_file(path) {
  return IOUtils.remove(path).catch((__e) => null);
}
