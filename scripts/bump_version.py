#!/usr/bin/env python3
"""
Bump the version of the application
"""

import argparse
import re
import subprocess
from logging import INFO, basicConfig, info

VERSION_FILE = "src/app/version.ts"

VERSION_TEMPLATE = 'export const VERSION = "v%s.%s.%s%s:%s"\n'
VERSION_PARSER = re.compile(r"v(\d+)\.(\d+)\.(\d+)_(.*):([a-z0-9]{7})")


def load_version() -> tuple:
    """Load the current version from the version file"""
    with open(VERSION_FILE, "r", encoding="utf-8") as f:
        raw_text = f.read()
        raw_version = raw_text.replace("export const VERSION = ", "").replace('"', "")
        info("Previous raw version: %s", raw_version)

        major, minor, patch, pre_release, commit = VERSION_PARSER.match(raw_version).groups()
        info(
            "Parsed version: Major: %s, Minor: %s, Patch: %s, Pre-release: %s, Commit: %s",
            major,
            minor,
            patch,
            pre_release,
            commit,
        )

        return int(major), int(minor), int(patch), pre_release, commit


def save_version(major: int, minor: int, patch: int, pre_release: str, commit: str):
    """Save the new version to the version file"""

    if pre_release:
        info("New version: %s.%s.%s_%s:%s", major, minor, patch, pre_release, commit)
    else:
        info("New version: %s.%s.%s:%s", major, minor, patch, commit)

    with open(VERSION_FILE, "w", encoding="utf-8") as f:
        f.write(
            VERSION_TEMPLATE
            % (major, minor, patch, f"_{pre_release}" if pre_release else "", commit)
        )


def get_git_commit() -> str:
    """Get the current git commit"""
    return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"]).strip().decode()


def bump_version(version_type: str, pre_release: str = None):
    """Bump the version based on the given version type"""
    major, minor, patch, old_pre_release, commit = load_version()

    if old_pre_release:
        info("Current version: %s.%s.%s_%s:%s", major, minor, patch, old_pre_release, commit)
    else:
        info("Current version: %s.%s.%s:%s", major, minor, patch, commit)

    if version_type == "major":
        major += 1
        minor = 0
        patch = 0
    if version_type == "minor":
        minor += 1
        patch = 0
    if version_type == "patch":
        patch += 1

    if pre_release == "":
        pre_release = old_pre_release

    commit = get_git_commit()

    save_version(major, minor, patch, pre_release, commit)

    # load build.gradle and update versionCode and versionName
    with open("android/app/build.gradle", "r", encoding="utf-8") as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            if "versionCode" in line:
                # parse the versionCode
                version_code = int(line.split()[1].strip('"'))
                version_code += 1
                lines[i] = f'{line[:line.index("versionCode")]}versionCode {version_code}\n'
            if "versionName" in line:
                lines[i] = (
                    f'{line[:line.index("versionName")]}versionName "v{major}.{minor}.{patch}{f"_{pre_release}" if pre_release else ""}"\n'
                )

    with open("android/app/build.gradle", "w", encoding="utf-8") as f:
        f.writelines(lines)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-t", "--type", required=False, choices=["major", "minor", "patch"], help="Version type"
    )
    parser.add_argument("-p", "--pre-release", help="Pre-release identifier")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    if args.verbose:
        basicConfig(level=INFO)

    info("Bumping version with type: %s and pre-release: %s", args.type, args.pre_release)

    bump_version(args.type, args.pre_release)


if __name__ == "__main__":
    main()
