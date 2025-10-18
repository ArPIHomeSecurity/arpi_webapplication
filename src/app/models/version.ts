export class LocationVersion {
  version_tag: string;
  major: number;
  minor: number;
  patch: number;
  prerelease: string;
  prerelease_num: string;
  commit_id: string;
}

export function compareVersions(v1: LocationVersion, v2: LocationVersion): number {
  if (v1.major !== v2.major) {
    return v1.major - v2.major;
  }
  if (v1.minor !== v2.minor) {
    return v1.minor - v2.minor;
  }
  if (v1.patch !== v2.patch) {
    return v1.patch - v2.patch;
  }
  if (v1.prerelease === '' && v2.prerelease !== '') {
    return 1;
  }
  if (v1.prerelease !== '' && v2.prerelease === '') {
    return -1;
  }
  if (v1.prerelease !== v2.prerelease) {
    return v1.prerelease < v2.prerelease ? -1 : 1;
  }
  if (v1.prerelease_num !== v2.prerelease_num) {
    return parseInt(v1.prerelease_num) - parseInt(v2.prerelease_num);
  }
  return 0;
}

/**
 * Parses a version string into a LocationVersion object.
 *
 * Example version strings:
 * - v1.3.0:43b56cd
 * - v1.4.0_RC09:9070c6d
 *
 * @param versionString The version string to parse.
 * @returns The parsed LocationVersion object.
 */
export function parseVersion(versionString: string): LocationVersion {
  const version: LocationVersion = {
    version_tag: versionString,
    major: 0,
    minor: 0,
    patch: 0,
    prerelease: '',
    prerelease_num: '',
    commit_id: ''
  };

  const [mainPart, commitId] = versionString.split(':');
  version.commit_id = commitId || '';

  const versionMatch = mainPart.match(/^v(\d+)\.(\d+)\.(\d+)(?:_([A-Za-z]+)(\d+))?$/);
  if (versionMatch) {
    version.major = parseInt(versionMatch[1]);
    version.minor = parseInt(versionMatch[2]);
    version.patch = parseInt(versionMatch[3]);
    version.prerelease = versionMatch[4] || '';
    version.prerelease_num = versionMatch[5] || '';
  } else {
    console.error('Invalid version string format:', versionString);
  }

  return version;
}
