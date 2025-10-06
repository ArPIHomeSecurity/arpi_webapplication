#!/usr/bin/env python3
"""
Bump the version of the application
"""

import argparse
import json
import re
import subprocess
from logging import INFO, basicConfig, info

VERSION_FILE = "src/assets/version.json"


def load_version() -> dict:
    """Load the current version from the version file"""
    with open(VERSION_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        info("Previous version data: %s", data)
        return data


def save_version(major: int, minor: int, patch: int, pre_release: str, commit: str):
    """Save the new version to the version file"""

    if pre_release:
        version_str = f"v{major}.{minor}.{patch}_{pre_release}:{commit}"
        info("New version: %s", version_str)
    else:
        version_str = f"v{major}.{minor}.{patch}:{commit}"
        info("New version: %s", version_str)

    # parse prerelease name and number
    prerelease_name = None
    prerelease_num = None
    if pre_release:
        m = re.match(r"([a-zA-Z]+)(\d{2})", pre_release)
        if m:
            prerelease_name = m.group(1)
            prerelease_num = m.group(2)
        else:
            prerelease_name = pre_release

    with open(VERSION_FILE, "w", encoding="utf-8") as f:
        json.dump(
            {
                "version": version_str,
                "major": major,
                "minor": minor,
                "patch": patch,
                "prerelease": prerelease_name,
                "prerelease_num": prerelease_num,
                "commit_id": commit,
            },
            f,
            indent=2,
        )
        f.write("\n")


def get_git_commit() -> str:
    """Get the current git commit"""
    return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"]).strip().decode()


def bump_version(version: dict, version_type: str, pre_release: str = None) -> tuple:
    """Bump the version based on the given version type"""
    major = int(version["major"])
    minor = int(version["minor"])
    patch = int(version["patch"])
    old_pre_release_name = version.get("prerelease") or ""
    old_pre_release_num = int(version.get("prerelease_num") or "0") or None
    commit = version.get("commit_id", "")

    if old_pre_release_name and old_pre_release_num:
        info(
            "Current version: %s.%s.%s_%s%s:%s",
            major,
            minor,
            patch,
            old_pre_release_name,
            old_pre_release_num,
            commit,
        )
    else:
        info("Current version: %s.%s.%s:%s", major, minor, patch, commit)

    if version_type == "major":
        major += 1
        minor = 0
        patch = 0
    elif version_type == "minor":
        minor += 1
        patch = 0
    elif version_type == "patch":
        patch += 1
    elif pre_release is not None and pre_release != old_pre_release_name:
        pre_release = f"{pre_release}01"
    elif pre_release == old_pre_release_name and old_pre_release_num:
        pre_release_num = int(old_pre_release_num) + 1
        pre_release = f"{pre_release}{pre_release_num:02}"
    else:
        raise ValueError("Invalid version type or pre-release")

    commit = get_git_commit()

    return (major, minor, patch, pre_release, commit)


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

    if args.type is None and args.pre_release is None:
        parser.error("Either --type or --pre-release must be specified")

    if args.type is not None and args.pre_release is not None:
        parser.error("Only one of --type or --pre-release can be specified")

    info("Bumping version with type: %s and pre-release: %s", args.type, args.pre_release)

    raw_version = load_version()
    major, minor, patch, pre_release, commit = bump_version(
        raw_version, args.type, args.pre_release
    )
    save_version(major, minor, patch, pre_release, commit)

    # load build.gradle and update versionCode and versionName
    with open("android/app/build.gradle", "r", encoding="utf-8") as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            if "versionCode" in line:
                # parse the versionCode
                version_code = int(line.split()[1].strip('"'))
                version_code += 1
                lines[i] = f"{line[: line.index('versionCode')]}versionCode {version_code}\n"
            if "versionName" in line:
                lines[i] = (
                    f'{line[: line.index("versionName")]}versionName "v{major}.{minor}.{patch}{f"_{pre_release}" if pre_release else ""}"\n'
                )

    with open("android/app/build.gradle", "w", encoding="utf-8") as f:
        f.writelines(lines)


def test_bump_version():
    test_cases = [
        (
            {
                "major": 1,
                "minor": 2,
                "patch": 3,
                "prerelease": None,
                "prerelease_num": None,
                "commit_id": "abcdef0",
            },
            "patch",
            None,
            (1, 2, 4, None),
        ),
        (
            {
                "major": 1,
                "minor": 2,
                "patch": 3,
                "prerelease": None,
                "prerelease_num": None,
                "commit_id": "abcdef0",
            },
            "minor",
            None,
            (1, 3, 0, None),
        ),
        (
            {
                "major": 1,
                "minor": 2,
                "patch": 3,
                "prerelease": None,
                "prerelease_num": None,
                "commit_id": "abcdef0",
            },
            "major",
            None,
            (2, 0, 0, None),
        ),
        (
            {
                "major": 1,
                "minor": 2,
                "patch": 3,
                "prerelease": None,
                "prerelease_num": None,
                "commit_id": "abcdef0",
            },
            None,
            "beta",
            (1, 2, 3, "beta01"),
        ),
        (
            {
                "major": 1,
                "minor": 2,
                "patch": 3,
                "prerelease": "beta",
                "prerelease_num": "01",
                "commit_id": "abcdef0",
            },
            None,
            "beta",
            (1, 2, 3, "beta02"),
        ),
    ]

    # Patch get_git_commit to always return 'abcdef0'
    original_get_git_commit = globals()["get_git_commit"]
    globals()["get_git_commit"] = lambda: "abcdef0"
    try:
        for version_json, version_type, pre_release, expected in test_cases:
            result = bump_version(version_json, version_type, pre_release)
            assert result[:4] == expected, (
                f"Failed for {version_json}, {version_type}, {pre_release}: got {result[:4]}, expected {expected}"
            )
    finally:
        globals()["get_git_commit"] = original_get_git_commit


if __name__ == "__main__":
    test_bump_version()
    main()
