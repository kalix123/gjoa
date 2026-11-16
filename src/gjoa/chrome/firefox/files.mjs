// Profile-relative file helpers over IOUtils/PathUtils. Reads/writes return
// promises; exists/stat/remove never reject.

export const profile_dir = () => Services.dirsvc.get("ProfD", Ci.nsIFile).path;
export const profile_path = (subpath) => PathUtils.join(profile_dir(), subpath);
export const join_path = (a, b) => PathUtils.join(a, b);
export const parent_path = (path) => PathUtils.parent(path);
export const read_text = (path) => IOUtils.readUTF8(path);
export const write_text = (path, data) => IOUtils.writeUTF8(path, data);
export const exists_p = (path) => IOUtils.exists(path).catch(() => false);

export function stat_file(path) {
  return IOUtils.stat(path)
    .then((s) => ({ size: s.size, lastModified: s.lastModified }))
    .catch(() => null);
}

export const ensure_dir = (path) => IOUtils.makeDirectory(path, { ignoreExisting: true, createAncestors: true });
export const remove_file = (path) => IOUtils.remove(path).catch(() => null);
